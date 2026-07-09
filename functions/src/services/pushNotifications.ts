import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

// FCM sender shared by the notification triggers: reads the recipient's
// device tokens (users/{uid}/devices) and sends a data message (the service
// worker/foreground handler renders it). Dead tokens are pruned.
export const sendPushToUser = async (
  uid: string,
  data: { kind: 'call' | 'message' | 'like' | 'match'; title: string; body: string; url: string },
): Promise<void> => {
  const db = getFirestore();
  const devices = await db.collection(`users/${uid}/devices`).get();
  if (devices.empty) {
    logger.info('push skipped — no registered devices', { uid, kind: data.kind });
    return;
  }

  const tokens = devices.docs.map((d) => d.id);
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    data,
    webpush: {
      headers: { Urgency: 'high', TTL: data.kind === 'call' ? '60' : '86400' },
    },
  });

  // Prune tokens FCM reports as gone.
  await Promise.all(
    response.responses.map((res, i) => {
      const code = res.error?.code ?? '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        return devices.docs[i].ref.delete();
      }
      return Promise.resolve();
    }),
  );

  logger.info('push sent', {
    uid,
    kind: data.kind,
    success: response.successCount,
    failure: response.failureCount,
    errors: response.responses.filter((r) => r.error).map((r) => r.error?.code ?? ''),
  });
};
