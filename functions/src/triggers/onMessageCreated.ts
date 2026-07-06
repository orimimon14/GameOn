import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

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
  },
);
