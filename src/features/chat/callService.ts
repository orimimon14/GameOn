import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';
import type { CallType } from '@/shared/enums';
import type { CallDocument } from '@/shared/models';

// Live voice/video calls (ADR-041 proposal, product decision 2026-07-06):
// WebRTC peer-to-peer with Firestore as the signaling channel —
// chats/{chatId}/calls/{callId} holds offer/answer, ICE candidates live in
// callerCandidates/calleeCandidates subcollections. STUN-only for MVP
// (no TURN relay), so some restrictive NATs may fail to connect.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
  iceCandidatePoolSize: 10,
};

export interface ActiveCall {
  callId: string;
  chatId: string;
  type: CallType;
  localStream: MediaStream;
  remoteStream: MediaStream;
  hangUp: () => Promise<void>;
}

const getMedia = (type: CallType): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });

const buildPeer = (
  localStream: MediaStream,
  onRemoteTrack: (stream: MediaStream) => void,
): { pc: RTCPeerConnection; remoteStream: MediaStream } => {
  const pc = new RTCPeerConnection(RTC_CONFIG);
  const remoteStream = new MediaStream();
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
    onRemoteTrack(remoteStream);
  };
  return { pc, remoteStream };
};

// Caller side: create the call doc with an offer, stream ICE, wait for answer.
export const startCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  type: CallType,
  onEnded: () => void,
): Promise<ActiveCall> => {
  const { db } = getFirebase();
  const localStream = await getMedia(type);
  const { pc, remoteStream } = buildPeer(localStream, () => undefined);

  const callRef = await addDoc(collection(db, 'chats', chatId, 'calls'), {
    chatId,
    callerUid,
    calleeUid,
    type,
    status: 'ringing',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      void addDoc(collection(callRef, 'callerCandidates'), event.candidate.toJSON());
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await updateDoc(callRef, {
    offer: { type: offer.type, sdp: offer.sdp },
    updatedAt: serverTimestamp(),
  });

  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onSnapshot(callRef, (snap) => {
      const data = snap.data() as CallDocument | undefined;
      if (!data) return;
      if (data.answer && pc.signalingState === 'have-local-offer') {
        void pc.setRemoteDescription(new RTCSessionDescription(data.answer as RTCSessionDescriptionInit));
      }
      if (data.status === 'declined' || data.status === 'ended') {
        cleanup();
        onEnded();
      }
    }),
  );

  unsubscribers.push(
    onSnapshot(collection(callRef, 'calleeCandidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          void pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    }),
  );

  const cleanup = () => {
    unsubscribers.forEach((unsub) => unsub());
    pc.close();
    localStream.getTracks().forEach((track) => track.stop());
  };

  // If the peer connection dies (remote closed the tab, network dropped),
  // end this side too — Firestore status is not the only teardown signal.
  pc.onconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
      cleanup();
      onEnded();
    }
  };

  const hangUp = async () => {
    cleanup();
    await updateDoc(callRef, { status: 'ended', updatedAt: serverTimestamp() });
  };

  return { callId: callRef.id, chatId, type, localStream, remoteStream, hangUp };
};

// Callee side: accept a ringing call — publish the answer and stream ICE.
export const answerCall = async (
  call: CallDocument,
  onEnded: () => void,
): Promise<ActiveCall> => {
  const { db } = getFirebase();
  const callRef = doc(db, 'chats', call.chatId, 'calls', call.callId);
  const localStream = await getMedia(call.type);
  const { pc, remoteStream } = buildPeer(localStream, () => undefined);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      void addDoc(collection(callRef, 'calleeCandidates'), event.candidate.toJSON());
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(call.offer as RTCSessionDescriptionInit));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await updateDoc(callRef, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onSnapshot(callRef, (snap) => {
      const data = snap.data() as CallDocument | undefined;
      if (data?.status === 'ended' || data?.status === 'declined') {
        cleanup();
        onEnded();
      }
    }),
  );

  unsubscribers.push(
    onSnapshot(collection(callRef, 'callerCandidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          void pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    }),
  );

  const cleanup = () => {
    unsubscribers.forEach((unsub) => unsub());
    pc.close();
    localStream.getTracks().forEach((track) => track.stop());
  };

  pc.onconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
      cleanup();
      onEnded();
    }
  };

  const hangUp = async () => {
    cleanup();
    await updateDoc(callRef, { status: 'ended', updatedAt: serverTimestamp() });
  };

  return { callId: call.callId, chatId: call.chatId, type: call.type, localStream, remoteStream, hangUp };
};

export const declineCall = async (call: CallDocument): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'chats', call.chatId, 'calls', call.callId), {
    status: 'declined',
    updatedAt: serverTimestamp(),
  });
};

// Incoming-call listener: collection-group query over all my chats' calls.
export const subscribeIncomingCalls = (
  uid: string,
  onIncoming: (call: CallDocument | null) => void,
): (() => void) => {
  const { db } = getFirebase();
  return onSnapshot(
    query(
      collectionGroup(db, 'calls'),
      where('calleeUid', '==', uid),
      where('status', '==', 'ringing'),
    ),
    (snap) => {
      const first = snap.docs[0];
      onIncoming(first ? ({ ...(first.data() as CallDocument), callId: first.id }) : null);
    },
    () => onIncoming(null),
  );
};
