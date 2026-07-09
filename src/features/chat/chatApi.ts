import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/config/firebase';
import type { ChatDocument, MessageDocument, PublicProfileDocument } from '@/shared/models';

// P4-T01/02/03 — chat data layer. Chats/messages are participants-only under
// rules; text messages are the only client-writable kind (API_CONTRACT §2.7,
// SECURITY isValidTextMessageCreate): exact keys, sender == auth.uid,
// createdAt == request.time.
const MESSAGES_PAGE_SIZE = 100;

export const subscribeMyChats = (
  uid: string,
  onChats: (chats: ChatDocument[]) => void,
  onError: () => void,
): (() => void) => {
  const { db } = getFirebase();
  return onSnapshot(
    query(collection(db, 'chats'), where('participants', 'array-contains', uid)),
    (snap) => {
      const chats = snap.docs
        .map((d) => d.data() as ChatDocument)
        .sort((a, b) => (b.lastTimestamp?.toMillis() ?? 0) - (a.lastTimestamp?.toMillis() ?? 0));
      onChats(chats);
    },
    onError,
  );
};

export const subscribeMessages = (
  chatId: string,
  onMessages: (messages: MessageDocument[]) => void,
  onError: () => void,
): (() => void) => {
  const { db } = getFirebase();
  return onSnapshot(
    query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limitToLast(MESSAGES_PAGE_SIZE),
    ),
    (snap) => {
      onMessages(
        snap.docs.map((d) => ({ ...(d.data() as MessageDocument), messageId: d.id })),
      );
    },
    onError,
  );
};

export const sendTextMessage = async (chatId: string, senderId: string, text: string): Promise<void> => {
  const { db } = getFirebase();
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId,
    type: 'text',
    text,
    createdAt: serverTimestamp(),
  });
};

export const loadChatPartnerProfiles = async (
  uid: string,
  chats: ChatDocument[],
): Promise<Record<string, PublicProfileDocument>> => {
  const { db } = getFirebase();
  const partnerUids = [...new Set(chats.map((c) => c.participants.find((p) => p !== uid) ?? ''))].filter(
    Boolean,
  );
  const entries = await Promise.all(
    partnerUids.map(async (partnerUid) => {
      const snap = await getDoc(doc(db, 'publicProfiles', partnerUid));
      return [partnerUid, snap.data() as PublicProfileDocument | undefined] as const;
    }),
  );
  return Object.fromEntries(entries.filter(([, profile]) => profile !== undefined)) as Record<
    string,
    PublicProfileDocument
  >;
};

// Recorded video messages (ADR-041, Pro-only): upload to the Storage path the
// rules gate (chatMedia/{chatId}/{uid}/...), then let the backend validate and
// create the message via sendChatMediaMessage (API_CONTRACT §3.4).
export const sendVideoMessage = async (
  chatId: string,
  senderId: string,
  blob: Blob,
): Promise<void> => {
  const { storage, functions } = getFirebase();
  const clientMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  // MediaRecorder reports e.g. "video/webm;codecs=vp8" — the contract and
  // Storage Rules expect the bare MIME type.
  const fileMimeType = (blob.type.split(';')[0] || 'video/webm') as 'video/webm' | 'video/mp4';
  const extension = fileMimeType === 'video/mp4' ? 'mp4' : 'webm';
  const filePath = `chatMedia/${chatId}/${senderId}/${clientMessageId}.${extension}`;

  await uploadBytes(storageRef(storage, filePath), blob, { contentType: fileMimeType });
  await httpsCallable(functions, 'sendChatMediaMessage')({
    chatId,
    filePath,
    fileMimeType,
    fileSizeBytes: blob.size,
    clientMessageId,
  });
};

// Resolve a media message URL from its Storage path — getDownloadURL follows
// the active environment (emulator vs cloud), unlike the stored fileUrl.
export const resolveMediaUrl = async (filePath: string): Promise<string> => {
  const { storage } = getFirebase();
  return getDownloadURL(storageRef(storage, filePath));
};


// One-shot chat list (notifications center) — same data as subscribeMyChats
// without holding a listener open.
export const loadMyChatsOnce = async (uid: string): Promise<ChatDocument[]> => {
  const { db } = getFirebase();
  const snap = await getDocs(
    query(collection(db, 'chats'), where('participants', 'array-contains', uid)),
  );
  return snap.docs
    .map((d) => d.data() as ChatDocument)
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (b.lastTimestamp?.toMillis() ?? 0) - (a.lastTimestamp?.toMillis() ?? 0));
};
