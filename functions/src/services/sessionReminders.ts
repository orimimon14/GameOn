import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

import { sendPushToUser } from './pushNotifications';

// ADR-046 — pushes "your game starts soon" to both players of an accepted
// session. Ran by sessionReminderTick (every 10 min); the reminder window is
// wider than the tick so no session slips between runs, and reminderSent
// makes each session fire exactly once. Extracted from the schedule wrapper
// so tests can invoke it directly against the emulator.
const LOOK_AHEAD_MS = 20 * 60 * 1000; // remind up to 20 min before start
const GRACE_MS = 10 * 60 * 1000; // still remind if the tick woke up late

export const sendDueSessionReminders = async (): Promise<number> => {
  const db = getFirestore();
  const now = Date.now();
  const due = await db
    .collection('gameSessions')
    .where('reminderSent', '==', false)
    .where('sessionAt', '<=', Timestamp.fromMillis(now + LOOK_AHEAD_MS))
    .where('sessionAt', '>=', Timestamp.fromMillis(now - GRACE_MS))
    .limit(100)
    .get();

  let sent = 0;
  for (const doc of due.docs) {
    const session = doc.data();
    // mark first — a push failure must not cause repeat reminders forever
    await doc.ref.update({ reminderSent: true, remindedAt: FieldValue.serverTimestamp() });
    for (const uid of (session.participants ?? []) as string[]) {
      await sendPushToUser(uid, {
        kind: 'message',
        title: '🎮 המשחק שלכם מתחיל בקרוב!',
        body: 'רבע שעה בערך למשחק שקבעתם — תתחברו',
        url: `/chat?open=${session.chatId}`,
      }).catch(() => undefined);
    }
    sent += 1;
  }
  if (sent > 0) logger.info('session reminders sent', { count: sent });
  return sent;
};
