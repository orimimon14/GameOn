import { getStorage } from 'firebase-admin/storage';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  APPROVED_VIDEO_MIME_TYPES,
  DEFAULT_MEDIA_MAX_BYTES,
  sendChatMediaMessageSchema,
} from '../schemas/chatMedia';

// API_CONTRACT §3.4 — approves and creates a media message (image or recorded
// video, ADR-041). Media is Pro-only; the client uploads to
// chatMedia/{chatId}/{uid}/{fileId} under Storage Rules, then calls this to
// validate ownership/limits and create the message doc. clientMessageId is
// the deterministic doc id when provided, so retries cannot duplicate.
export const sendChatMediaMessage = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }

  const parsed = sendChatMediaMessageSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { chatId, filePath, fileMimeType, fileSizeBytes, clientMessageId } = parsed.data;

  // File path must belong to this user and this chat (API_CONTRACT §3.4).
  if (!filePath.startsWith(`chatMedia/${chatId}/${uid}/`)) {
    throw new HttpsError('permission-denied', 'permission_denied');
  }

  const db = getFirestore();
  const [callerSnap, chatSnap, configSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`chats/${chatId}`).get(),
    db.doc('system/config').get(),
  ]);

  const caller = callerSnap.data();
  if (!caller) {
    throw new HttpsError('not-found', 'not_found');
  }
  if (caller.isSuspended === true || caller.isDeleted === true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }
  const isActivePro =
    caller.isPro === true && ['trialing', 'active'].includes(caller.subscriptionStatus);
  if (!isActivePro) {
    throw new HttpsError('permission-denied', 'pro_required');
  }

  const chat = chatSnap.data();
  if (!chat) {
    throw new HttpsError('not-found', 'not_found');
  }
  if (!Array.isArray(chat.participants) || !chat.participants.includes(uid)) {
    throw new HttpsError('permission-denied', 'permission_denied');
  }
  if (chat.isActive !== true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }

  const otherUid = chat.participants.find((p: string) => p !== uid);
  const [myBlock, theirBlock] = await Promise.all([
    db.doc(`users/${uid}/blocks/${otherUid}`).get(),
    db.doc(`users/${otherUid}/blocks/${uid}`).get(),
  ]);
  if (myBlock.exists || theirBlock.exists) {
    throw new HttpsError('permission-denied', 'blocked');
  }

  const maxBytes: number = configSnap.data()?.limits?.chatMediaMaxBytes ?? DEFAULT_MEDIA_MAX_BYTES;
  if (fileSizeBytes > maxBytes) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }

  // The uploaded object must actually exist (and match the declared size).
  const file = getStorage().bucket().file(filePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw new HttpsError('not-found', 'not_found');
  }

  const type = (APPROVED_VIDEO_MIME_TYPES as readonly string[]).includes(fileMimeType)
    ? 'video'
    : 'image';

  const messageRef = clientMessageId
    ? db.doc(`chats/${chatId}/messages/${uid}_${clientMessageId}`)
    : db.collection(`chats/${chatId}/messages`).doc();

  const existing = await messageRef.get();
  if (!existing.exists) {
    await messageRef.set({
      messageId: messageRef.id,
      chatId,
      senderId: uid,
      type,
      filePath,
      fileUrl: `https://firebasestorage.googleapis.com/v0/b/${getStorage().bucket().name}/o/${encodeURIComponent(filePath)}?alt=media`,
      fileMimeType,
      fileSizeBytes,
      status: 'sent',
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${uid}/usage/${new Date().toISOString().slice(0, 10)}`).set(
      {
        mediaUploadCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const created = await messageRef.get();
  return {
    success: true as const,
    chatId,
    messageId: messageRef.id,
    type,
    fileUrl: created.data()?.fileUrl ?? '',
    createdAt: created.data()?.createdAt ?? null,
  };
});
