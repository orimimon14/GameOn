import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';
import type { GameCatalogDocument } from '@/shared/models';

// Active game catalog for pickers (onboarding + discovery). Catalog docs are
// admin/server-written only (ADR-019); the client only reads.
export const loadGameCatalog = async (): Promise<GameCatalogDocument[]> => {
  const { db } = getFirebase();
  const snapshot = await getDocs(
    query(collection(db, 'gameCatalog'), where('isActive', '==', true), orderBy('name')),
  );
  return snapshot.docs.map((d) => d.data() as GameCatalogDocument);
};
