import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { sendPushToUser } from '../services/pushNotifications';

// P4-T01 (DATA_MODEL §4.7/§7) — denormalizes the latest message onto the
// chat doc (lastMessage preview, type, sender, timestamp) and stamps the
// message's server-owned fields (messageId, status). Merge writes — safe on
// retries; an older retry may briefly overwrite a newer preview, which is
// self-healing on the next message.
const PREVIEW_MAX_CHARS = 120;

export const onMessageCreated = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const { chatId, messageId } = event.params;
    const message = snapshot.data();
    const db = getFirestore();

    const preview =
      message.type === 'text' ? String(message.text ?? '').slice(0, PREVIEW_MAX_CHARS) : '';

    try {
      await Promise.all([
        snapshot.ref.set(
          { messageId, status: message.status ?? 'sent' },
          { merge: true },
        ),
        db.doc(`chats/${chatId}`).set(
          {
            lastMessage: preview,
            lastMessageType: message.type,
            lastMessageSenderId: message.senderId,
            lastTimestamp: message.createdAt ?? FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        db.doc(`matches/${chatId}`).set(
          { lastInteractionAt: FieldValue.serverTimestamp() },
          { merge: true },
        ),
      ]);
    } catch (error) {
      logger.error('onMessageCreated failed', { chatId, messageId, error });
      throw error;
    }

    // New-message push to the other participant (best effort).
    try {
      const chatSnap = await db.doc(`chats/${chatId}`).get();
      const participants: string[] = chatSnap.data()?.participants ?? [];
      const recipient = participants.find((p) => p !== message.senderId);
      if (recipient) {
        const senderSnap = await db.doc(`publicProfiles/${message.senderId}`).get();
        const senderName: string = senderSnap.data()?.displayName ?? '';
        await sendPushToUser(recipient, {
          kind: 'message',
          title: senderName ? `💬 הודעה חדשה מ-${senderName}` : '💬 הודעה חדשה',
          body: message.type === 'text' ? preview : 'נשלחה אליך מדיה',
          url: '/chat',
        });
      }
    } catch (error) {
      logger.error('message push failed', { chatId, error });
    }
  },
);
