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
            title: '🎮 SQUAD UP!',
            body: fromName ? `אתה ו-${fromName} רוצים לשחק ביחד — פתחו צ׳אט!` : 'יש לך שותף חדש למשחק!',
            url: `/chat?open=${matchSnap.id}`,
          }),
          sendPushToUser(swipe.fromUid, {
            kind: 'match',
            title: '🎮 SQUAD UP!',
            body: 'יש לך שותף חדש למשחק — פתחו צ׳אט!',
            url: `/chat?open=${matchSnap.id}`,
          }),
        ]);
      } else {
        await sendPushToUser(swipe.toUid, {
          kind: 'like',
          title: '🎮 מישהו רוצה לשחק איתך',
          body: 'היכנס למסך ההזמנות כדי לגלות מי',
          url: '/likes',
        });
      }
    } catch (error) {
      logger.error('like push failed', { error });
    }
  },
);
