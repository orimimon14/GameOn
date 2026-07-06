import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { syncPublicProfileForUser } from '../services/publicProfileSync';

// API_CONTRACT §5.1 — keeps publicProfiles in sync with users/{uid} edits.
// No-op before onboarding completes (public profile does not exist yet).
// Writes only publicProfiles, so it cannot retrigger itself.
export const onUserProfileUpdated = onDocumentUpdated('users/{uid}', async (event) => {
  const after = event.data?.after.data();
  if (!after || after.onboardingCompleted !== true) return;
  await syncPublicProfileForUser(event.params.uid);
});
