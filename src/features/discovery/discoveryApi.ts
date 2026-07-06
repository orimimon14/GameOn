import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';
import type { PublicProfileDocument, UserGameDocument } from '@/shared/models';

// Client wrapper for the discovery backend (API_CONTRACT §3.1).
export interface SubmitSwipePayload {
  targetUid: string;
  gameId: string;
  direction: 'like' | 'skip';
}

export interface SubmitSwipeResult {
  result: 'skipped' | 'liked' | 'matched';
  swipeId: string;
  matchId?: string;
  chatId?: string;
}

export const submitSwipe = async (payload: SubmitSwipePayload): Promise<SubmitSwipeResult> => {
  const { functions } = getFirebase();
  const response = await httpsCallable<SubmitSwipePayload, SubmitSwipeResult>(
    functions,
    'submitSwipe',
  )(payload);
  return response.data;
};

const DECK_SIZE = 50;

// Deck query (P3-T01, ADR-021 MVP): shared conditions go in the Firestore
// query; personal exclusions (self / already swiped / my blocks) are filtered
// client-side from the caller's own subcollections. Reverse blocks stay
// invisible to the client by design — the server rejects those swipes.
export const loadDeck = async (uid: string, gameId: string): Promise<PublicProfileDocument[]> => {
  const { db } = getFirebase();
  const [profilesSnap, swipesSnap, blocksSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'publicProfiles'),
        where('isDiscoverable', '==', true),
        where('gameIds', 'array-contains', gameId),
        limit(DECK_SIZE),
      ),
    ),
    getDocs(collection(db, 'users', uid, 'swipes')),
    getDocs(collection(db, 'users', uid, 'blocks')),
  ]);

  const swipedIds = new Set(swipesSnap.docs.map((d) => d.id));
  const blockedUids = new Set(blocksSnap.docs.map((d) => d.id));

  return profilesSnap.docs
    .map((d) => d.data() as PublicProfileDocument)
    .filter(
      (p) =>
        p.uid !== uid &&
        p.isSuspended !== true &&
        p.isDeleted !== true &&
        !swipedIds.has(`${p.uid}_${gameId}`) &&
        !blockedUids.has(p.uid),
    );
};

// Default deck game when none is selected: the caller's first active game.
export const loadMyActiveGameIds = async (uid: string): Promise<string[]> => {
  const { db } = getFirebase();
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'games'), where('isActive', '==', true)),
  );
  return snapshot.docs.map((d) => (d.data() as UserGameDocument).gameId);
};
