import type { Timestamp } from 'firebase/firestore';

// Presence display buckets — lastActiveAt is refreshed server-side on real
// activity (swipes, messages; DATA_MODEL §4.1), so "today" means it.
export type ActivityStatus = 'today' | 'week' | null;

export const activityStatus = (lastActiveAt: Timestamp | undefined): ActivityStatus => {
  const millis = lastActiveAt?.toMillis?.();
  if (!millis) return null;
  const age = Date.now() - millis;
  if (age < 24 * 60 * 60 * 1000) return 'today';
  if (age < 7 * 24 * 60 * 60 * 1000) return 'week';
  return null;
};
