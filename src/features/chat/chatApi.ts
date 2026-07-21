import {
  addDoc,
  deleteField,
  collection,
  doc,
  getDoc,
  getDocs,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/config/firebase';
import { compressOrOriginal } from '@/shared/api/imageCompression';
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
// Game sessions (ADR-046, API_CONTRACT §3.16-17) — proposals and answers go
// through callables; session messages are server-created only.
export const proposeGameSession = async (chatId: string, sessionAtMs: number): Promise<void> => {
  const { functions } = getFirebase();
  await httpsCallable(functions, 'proposeGameSession')({ chatId, sessionAtMs });
};

export const respondGameSession = async (
  chatId: string,
  messageId: string,
  accept: boolean,
): Promise<void> => {
  const { functions } = getFirebase();
  await httpsCallable(functions, 'respondGameSession')({ chatId, messageId, accept });
};

// create the message via sendChatMediaMessage (API_CONTRACT §3.4).
// Photo attachments (API_CONTRACT §3.4, Pro-only like all chat media):
// compress client-side, upload to the rules-gated chatMedia path, then let
// the backend create the message doc.
export const sendImageMessage = async (
  chatId: string,
  senderId: string,
  file: File,
): Promise<void> => {
  const { storage, functions } = getFirebase();
  const { blob, contentType, ext } = await compressOrOriginal(file, 25 * 1024 * 1024);
  const fileMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(contentType)
    ? contentType
    : 'image/jpeg';
  const clientMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const filePath = `chatMedia/${chatId}/${senderId}/${clientMessageId}.${ext}`;

  await uploadBytes(storageRef(storage, filePath), blob, { contentType: fileMimeType });
  await httpsCallable(functions, 'sendChatMediaMessage')({
    chatId,
    filePath,
    fileMimeType,
    fileSizeBytes: blob.size,
    clientMessageId,
  });
};

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
// Unread counters (DATA_MODEL §4.7): onMessageCreated increments the
// recipient's key; opening the chat zeroes ONLY your own key (rules-enforced).
export const unreadCountFor = (chat: ChatDocument, uid: string): number =>
  chat.unreadCounts?.[uid] ?? 0;

// Typing indicator: stamp my own typing key (rules require request.time);
// the partner shows "typing…" while the stamp is fresher than ~6s. Sending
// or clearing the draft deletes the key so the hint drops immediately.
export const signalTyping = async (chatId: string, uid: string): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'chats', chatId), { [`typing.${uid}`]: serverTimestamp() });
};

export const clearTyping = async (chatId: string, uid: string): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'chats', chatId), { [`typing.${uid}`]: deleteField() });
};

export const markChatRead = async (chatId: string, uid: string): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${uid}`]: 0,
    // Read receipt — rules require exactly request.time on your own key.
    [`lastReadAt.${uid}`]: serverTimestamp(),
  });
};

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
