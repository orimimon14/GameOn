import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Completes new-user bootstrap (API_CONTRACT §5.9, MIGRATION_PLAN §2.2):
// the client creates users/{uid} with client-writable keys only (SECURITY §4);
// this trigger fills the server-owned defaults and creates private/account.
// All writes are set-if-missing merges — retries are safe (idempotent).
// signup_bonus coins (ADR-034) are added here in Phase 5 with a transactions audit.
export const onUserCreated = onDocumentCreated('users/{uid}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const uid = event.params.uid;
  const db = getFirestore();

  const authUser = await getAuth()
    .getUser(uid)
    .catch(() => null);
  const email = authUser?.email ?? '';
  const providerId = authUser?.providerData[0]?.providerId ?? 'password';
  const authProvider = providerId === 'google.com' ? 'google' : 'password';

  const existing = snapshot.data() ?? {};
  const defaults: Record<string, unknown> = {};
  const setIfMissing = (key: string, value: unknown) => {
    if (!(key in existing)) defaults[key] = value;
  };

  setIfMissing('uid', uid);
  setIfMissing('email', email);
  setIfMissing('onboardingCompleted', false);
  setIfMissing('isDiscoverable', true);
  setIfMissing('coins', 0);
  setIfMissing('subscriptionTier', 'basic');
  setIfMissing('subscriptionStatus', 'none');
  setIfMissing('isPro', false);
  setIfMissing('ownedItemIds', []);
  setIfMissing('isSuspended', false);
  setIfMissing('isDeleted', false);
  setIfMissing('createdAt', FieldValue.serverTimestamp());
  setIfMissing('lastActiveAt', FieldValue.serverTimestamp());
  defaults.updatedAt = FieldValue.serverTimestamp();

  await snapshot.ref.set(defaults, { merge: true });

  await db.doc(`users/${uid}/private/account`).set(
    {
      email,
      authProvider,
      moderationState: 'clean',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Structured, PII-safe log (OBSERVABILITY): uid only, no email.
  logger.info('user bootstrap completed', { uid, authProvider });
});
