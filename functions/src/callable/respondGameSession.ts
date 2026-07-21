import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { sendPushToUser } from '../services/pushNotifications';

// API_CONTRACT §3.17 / ADR-046 — accept or decline a game-session proposal.
// On accept, a top-level gameSessions doc is created for the reminder sweep
// (sessionReminderTick) — clients never write either side.
const inputSchema = z.object({
  chatId: z.string().trim().min(1).max(128),
  messageId: z.string().trim().min(1).max(128),
  accept: z.boolean(),
});

export const respondGameSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'auth required');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_argument');
  const { chatId, messageId, accept } = parsed.data;

  const db = getFirestore();
  const chatSnap = await db.doc(`chats/${chatId}`).get();
  const chat = chatSnap.data();
  if (!chat || chat.isActive === false) throw new HttpsError('not-found', 'chat_unavailable');
  const participants: string[] = chat.participants ?? [];
  if (!participants.includes(uid)) throw new HttpsError('permission-denied', 'not_participant');

  const messageRef = db.doc(`chats/${chatId}/messages/${messageId}`);
  const proposerUid = await db.runTransaction(async (tx) => {
    const messageSnap = await tx.get(messageRef);
    const message = messageSnap.data();
    if (!message || message.type !== 'session') throw new HttpsError('not-found', 'not_a_session');
    if (message.senderId === uid) throw new HttpsError('failed-precondition', 'own_proposal');
    if (message.sessionStatus !== 'proposed') {
      throw new HttpsError('failed-precondition', 'already_answered');
    }

    tx.update(messageRef, { sessionStatus: accept ? 'accepted' : 'declined' });
    if (accept) {
      tx.set(db.doc(`gameSessions/${chatId}_${messageId}`), {
        chatId,
        messageId,
        participants,
        sessionAt: message.sessionAt,
        reminderSent: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    return message.senderId as string;
  });

  await sendPushToUser(proposerUid, {
    kind: 'message',
    title: accept ? '🎮 המשחק נסגר!' : 'ההזמנה נדחתה',
    body: accept ? 'ההצעה שלך אושרה — נתראה במשחק' : 'הפעם זה לא הסתדר — נסו זמן אחר',
    url: `/chat?open=${chatId}`,
  }).catch(() => undefined);

  return { sessionStatus: accept ? 'accepted' : 'declined' };
});
