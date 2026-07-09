import { collection, getDocs, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { create } from 'zustand';

import { getFirebase } from '@/config/firebase';
import type { ChatDocument, MessageDocument } from '@/shared/models';

// Per-chat unread message counts, shared by the nav dot (App) and the chat
// list badges (ChatView). "Seen" marks live in localStorage per device;
// keeping them in a store means marking a chat read updates every badge
// immediately — localStorage alone can't trigger a re-render.
const seenKey = (chatId: string) => `swish_chat_seen_${chatId}`;
const getSeenMillis = (chatId: string): number =>
  Number(localStorage.getItem(seenKey(chatId)) ?? 0);

interface ChatUnreadState {
  counts: Record<string, number>;
  markSeen: (chatId: string, atLeastMillis?: number) => void;
}

let latestChats: ChatDocument[] = [];

export const useChatUnreadStore = create<ChatUnreadState>((set) => ({
  counts: {},
  markSeen: (chatId, atLeastMillis = 0) => {
    // Clock-skew safe: never leave the chat's current last message "unseen"
    // because the phone clock lags the server timestamps.
    const last = latestChats.find((c) => c.chatId === chatId)?.lastTimestamp?.toMillis() ?? 0;
    const seen = Math.max(Date.now(), last + 1, atLeastMillis + 1);
    localStorage.setItem(seenKey(chatId), String(seen));
    set((s) => ({ counts: { ...s.counts, [chatId]: 0 } }));
  },
}));

const countUnread = async (uid: string, chat: ChatDocument): Promise<number> => {
  const seen = getSeenMillis(chat.chatId);
  const last = chat.lastTimestamp?.toMillis() ?? 0;
  if (!chat.lastMessageSenderId || chat.lastMessageSenderId === uid || last <= seen) return 0;
  const { db } = getFirebase();
  // One-shot fetch of the messages after the seen mark (usually a handful).
  // Single-field inequality — no composite index needed in cloud Firestore.
  const snap = await getDocs(
    query(
      collection(db, 'chats', chat.chatId, 'messages'),
      where('createdAt', '>', Timestamp.fromMillis(seen)),
    ),
  );
  const fromPartner = snap.docs.filter(
    (d) => (d.data() as MessageDocument).senderId !== uid,
  ).length;
  // The chat header says the partner sent something new — never show 0.
  return Math.max(1, fromPartner);
};

// App-level: keeps counts in sync with the chats collection. Returns the
// unsubscribe function.
export const initChatUnread = (uid: string): (() => void) => {
  const { db } = getFirebase();
  return onSnapshot(
    query(collection(db, 'chats'), where('participants', 'array-contains', uid)),
    (snap) => {
      void (async () => {
        const chats = snap.docs
          .map((d) => d.data() as ChatDocument)
          .filter((c) => c.isActive !== false);
        latestChats = chats;
        const entries = await Promise.all(
          chats.map(
            async (c) => [c.chatId, await countUnread(uid, c).catch(() => 0)] as const,
          ),
        );
        useChatUnreadStore.setState({ counts: Object.fromEntries(entries) });
      })();
    },
    () => undefined,
  );
};
