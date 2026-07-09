import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { sendPushToUser } from '../services/pushNotifications';

// Incoming-call push (ADR-041): when a call doc is created (status ringing),
// notify the callee's devices so the phone rings even outside the app.
export const onCallCreated = onDocumentCreated(
  'chats/{chatId}/calls/{callId}',
  async (event) => {
    const call = event.data?.data();
    if (!call || call.status !== 'ringing') return;

    const db = getFirestore();
    const callerSnap = await db.doc(`publicProfiles/${call.callerUid}`).get();
    const callerName: string = callerSnap.data()?.displayName ?? '';

    try {
      await sendPushToUser(call.calleeUid, {
        kind: 'call',
        title: callerName ? `📞 ${callerName} מתקשר אליך` : '📞 שיחה נכנסת',
        body: call.type === 'video' ? 'שיחת וידאו נכנסת — היכנס לענות' : 'שיחה קולית נכנסת — היכנס לענות',
        url: '/chat',
      });
    } catch (error) {
      logger.error('call push failed', { error });
    }
  },
);
