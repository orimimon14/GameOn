import { onSchedule } from 'firebase-functions/v2/scheduler';

import { sendDueSessionReminders } from '../services/sessionReminders';

// ADR-046 — the reminder heartbeat. Window math lives in sessionReminders.
export const sessionReminderTick = onSchedule('every 10 minutes', async () => {
  await sendDueSessionReminders();
});
