import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { sendPushToUser } from '../services/pushNotifications';

// API_CONTRACT §3.16 / ADR-046 — a structured "let's play at X" proposal.
// Session messages are server-created only (clients may create text messages
// only — SECURITY §messages), so the whole lifecycle is trustworthy.
const MIN_LEAD_MS = 5 * 60 * 1000; // at least 5 minutes from now
const MAX_LEAD_MS = 14 * 24 * 60 * 60 * 1000; // at most two weeks out

const inputSchema = z.object({
  chatId: z.string().trim().min(1).max(128),
  sessionAtMs: z.number().int().positive(),
});

export const proposeGameSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'auth required');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_argument');
  const { chatId, sessionAtMs } = parsed.data;

  const lead = sessionAtMs - Date.now();
  if (lead < MIN_LEAD_MS || lead > MAX_LEAD_MS) {
    throw new HttpsError('invalid-argument', 'session_time_out_of_range');
  }

  const db = getFirestore();
  const chatSnap = await db.doc(`chats/${chatId}`).get();
  const chat = chatSnap.data();
  if (!chat || chat.isActive === false) throw new HttpsError('not-found', 'chat_unavailable');
  const participants: string[] = chat.participants ?? [];
  if (!participants.includes(uid)) throw new HttpsError('permission-denied', 'not_participant');

  const messageRef = db.collection(`chats/${chatId}/messages`).doc();
  await messageRef.set({
    chatId,
    senderId: uid,
    type: 'session',
    text: '',
    sessionAt: Timestamp.fromMillis(sessionAtMs),
    sessionStatus: 'proposed',
    createdAt: FieldValue.serverTimestamp(),
  });

  const partnerUid = participants.find((p) => p !== uid);
  if (partnerUid) {
    await sendPushToUser(partnerUid, {
      kind: 'message',
      title: '🗓️ הזמנה למשחק',
      body: 'קיבלת הצעה לקבוע משחק — פתח את הצ׳אט לאשר',
      url: `/chat?open=${chatId}`,
    }).catch(() => undefined);
  }

  return { messageId: messageRef.id };
});
