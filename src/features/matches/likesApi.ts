import { collection, collectionGroup, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';
import type { PublicProfileDocument, SwipeDocument } from '@/shared/models';

// Likes You (P3-T06, ADR-033 — open to all users in MVP): inbound likes come
// from a collection-group query the rules restrict to toUid == me &&
// direction == "like". Likes the caller already responded to (their own
// swipes subcollection) are filtered out; a like the caller liked back is a
// match and lives in the matches screen instead.
export interface InboundLike {
  profile: PublicProfileDocument;
  gameId: string;
}

export const loadLikesYou = async (uid: string): Promise<InboundLike[]> => {
  const { db } = getFirebase();

  const [inboundSnap, mySwipesSnap] = await Promise.all([
    getDocs(
      query(
        collectionGroup(db, 'swipes'),
        where('toUid', '==', uid),
        where('direction', '==', 'like'),
      ),
    ),
    getDocs(collection(db, 'users', uid, 'swipes')),
  ]);

  const respondedIds = new Set(mySwipesSnap.docs.map((d) => d.id));
  const pending = inboundSnap.docs
    .map((d) => d.data() as SwipeDocument)
    .filter((swipe) => !respondedIds.has(`${swipe.fromUid}_${swipe.gameId}`));

  // One card per liker: keep the earliest like when someone liked in several games.
  const byLiker = new Map<string, SwipeDocument>();
  for (const swipe of pending) {
    const existing = byLiker.get(swipe.fromUid);
    if (!existing || swipe.createdAt.toMillis() < existing.createdAt.toMillis()) {
      byLiker.set(swipe.fromUid, swipe);
    }
  }

  const profiles = await Promise.all(
    [...byLiker.values()].map(async (swipe) => {
      const snap = await getDoc(doc(db, 'publicProfiles', swipe.fromUid));
      const profile = snap.data() as PublicProfileDocument | undefined;
      if (!profile || profile.isSuspended === true || profile.isDeleted === true) return null;
      return { profile, gameId: swipe.gameId };
    }),
  );

  return profiles.filter((like): like is InboundLike => like !== null);
};
