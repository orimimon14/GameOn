import { addDoc, collection, getCountFromServer, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';
import type { GameCatalogDocument } from '@/shared/models';

// Active game catalog for pickers (onboarding + discovery). Catalog docs are
// admin/server-written only (ADR-019); the client only reads.
// ADR-043 — "can't find your game?" writes a suggestion for admin review.
export const suggestGame = async (uid: string, name: string): Promise<void> => {
  const { db } = getFirebase();
  await addDoc(collection(db, 'gameSuggestions'), {
    uid,
    name: name.trim().slice(0, 60),
    createdAt: serverTimestamp(),
  });
};

export const loadGameCatalog = async (): Promise<GameCatalogDocument[]> => {
  const { db } = getFirebase();
  const snapshot = await getDocs(
    query(collection(db, 'gameCatalog'), where('isActive', '==', true), orderBy('name')),
  );
  return snapshot.docs.map((d) => d.data() as GameCatalogDocument);
};

// How many players in the app play each game — aggregate count over
// publicProfiles.gameIds (1 cheap count query per game, no docs fetched).
export const loadGamePlayerCounts = async (
  gameIds: string[],
): Promise<Record<string, number>> => {
  const { db } = getFirebase();
  const entries = await Promise.all(
    gameIds.map(async (gameId) => {
      try {
        const snap = await getCountFromServer(
          query(collection(db, 'publicProfiles'), where('gameIds', 'array-contains', gameId)),
        );
        return [gameId, snap.data().count] as const;
      } catch {
        return [gameId, 0] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
};
