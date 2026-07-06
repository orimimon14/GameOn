import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { syncPublicProfileForUser } from '../services/publicProfileSync';

// API_CONTRACT §5.2 — resyncs publicProfiles when a user's game entry
// is created, updated or deleted (gameIds / primary game may change).
export const onUserGameUpdated = onDocumentWritten('users/{uid}/games/{gameId}', async (event) => {
  const uid = event.params.uid;
  const userSnap = await getFirestore().doc(`users/${uid}`).get();
  if (userSnap.data()?.onboardingCompleted !== true) return;
  await syncPublicProfileForUser(uid);
});
