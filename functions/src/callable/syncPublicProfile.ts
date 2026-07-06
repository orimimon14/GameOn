import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { syncPublicProfileForUser } from '../services/publicProfileSync';

// API_CONTRACT §3.9 — fallback/repair resync of publicProfiles/{uid}.
export const syncPublicProfile = onCall(async (request) => {
  const authUid = request.auth?.uid;
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }

  const requestedUid = typeof request.data?.uid === 'string' ? request.data.uid : undefined;
  const targetUid = requestedUid ?? authUid;
  const isAdmin = request.auth?.token?.admin === true;
  if (targetUid !== authUid && !isAdmin) {
    throw new HttpsError('permission-denied', 'cannot sync another user');
  }

  const userSnap = await getFirestore().doc(`users/${targetUid}`).get();
  const user = userSnap.data();
  if (!user) {
    throw new HttpsError('not-found', 'user not found');
  }
  if (user.onboardingCompleted !== true) {
    throw new HttpsError('failed-precondition', 'onboarding incomplete');
  }

  await syncPublicProfileForUser(targetUid);
  return { success: true, uid: targetUid, syncedAt: Timestamp.now() };
});
