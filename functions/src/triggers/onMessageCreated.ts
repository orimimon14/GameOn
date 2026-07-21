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
const ACTIVE_THROTTLE_MS = 30 * 60 * 1000; // refresh lastActiveAt at most twice an hour

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

    // Recipient's unread counter (DATA_MODEL §7) — the recipient zeroes
    // their own key when they open the chat (narrow rules exception).
    const chatBefore = await db.doc(`chats/${chatId}`).get();
    const recipientUid = (chatBefore.data()?.participants ?? []).find(
      (p: string) => p !== message.senderId,
    );

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
            ...(recipientUid
              ? { unreadCounts: { [recipientUid]: FieldValue.increment(1) } }
              : {}),
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

    // Presence: sending a message is real activity (throttled — see
    // DATA_MODEL §4.1; the users write retriggers the publicProfiles sync).
    try {
      const senderSnap = await db.doc(`users/${message.senderId}`).get();
      const lastActive = senderSnap.data()?.lastActiveAt?.toMillis?.() ?? 0;
      if (senderSnap.exists && Date.now() - lastActive > ACTIVE_THROTTLE_MS) {
        await senderSnap.ref.update({ lastActiveAt: FieldValue.serverTimestamp() });
      }
    } catch (error) {
      logger.warn('lastActiveAt refresh failed', { chatId, error });
    }

    // New-message push to the other participant (best effort).
    try {
      const recipient = recipientUid;
      if (recipient) {
        const senderSnap = await db.doc(`publicProfiles/${message.senderId}`).get();
        const senderName: string = senderSnap.data()?.displayName ?? '';
        await sendPushToUser(recipient, {
          kind: 'message',
          title: senderName ? `💬 הודעה חדשה מ-${senderName}` : '💬 הודעה חדשה',
          body:
            message.type === 'text'
              ? preview
              : message.type === 'session'
                ? 'הזמנה לקבוע משחק 🗓️'
                : 'נשלחה אליך מדיה',
          url: `/chat?open=${chatId}`,
        });
      }
    } catch (error) {
      logger.error('message push failed', { chatId, error });
    }
  },
);
