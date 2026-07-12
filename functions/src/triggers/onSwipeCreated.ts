import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { sendPushToUser } from '../services/pushNotifications';

// Like/match pushes: when submitSwipe writes a like, tell the target someone
// liked them; when it turned into a match, tell both sides.
export const onSwipeCreated = onDocumentCreated(
  'users/{uid}/swipes/{swipeId}',
  async (event) => {
    const swipe = event.data?.data();
    if (!swipe || swipe.direction !== 'like') return;

    const db = getFirestore();
    const [fromSnap, matchSnap] = await Promise.all([
      db.doc(`publicProfiles/${swipe.fromUid}`).get(),
      db
        .doc(`matches/${[swipe.fromUid, swipe.toUid].sort().join('_')}_${swipe.gameId}`)
        .get(),
    ]);
    const fromName: string = fromSnap.data()?.displayName ?? '';

    try {
      if (matchSnap.exists && matchSnap.data()?.status === 'matched') {
        await Promise.all([
          sendPushToUser(swipe.toUid, {
            kind: 'match',
            title: '🎉 יש מאץ׳!',
            body: fromName ? `אתה ו-${fromName} אהבתם אחד את השני` : 'יש לך התאמה חדשה',
            url: `/chat?open=${matchSnap.id}`,
          }),
          sendPushToUser(swipe.fromUid, {
            kind: 'match',
            title: '🎉 יש מאץ׳!',
            body: 'יש לך התאמה חדשה — פתחו שיחה!',
            url: `/chat?open=${matchSnap.id}`,
          }),
        ]);
      } else {
        await sendPushToUser(swipe.toUid, {
          kind: 'like',
          title: '💜 מישהו עשה לך לייק',
          body: 'היכנס למסך הלייקים כדי לגלות מי',
          url: '/likes',
        });
      }
    } catch (error) {
      logger.error('like push failed', { error });
    }
  },
);
