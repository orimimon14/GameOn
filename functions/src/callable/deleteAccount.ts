import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

// API_CONTRACT §3.14 / ADR-038 — mandatory in-app account deletion.
// Anonymizes the profile, flags isDeleted, removes discovery presence and
// deletes the Auth user. Transactions/reports are retained (billing/safety
// retention); no PII is logged.
const inputSchema = z.object({
  confirm: z.literal(true),
  reason: z.string().trim().max(500).optional(),
});

export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }

  const db = getFirestore();
  const batch = db.batch();

  // Anonymize the user doc and flag deletion; server-owned fields stay valid.
  batch.set(
    db.doc(`users/${uid}`),
    {
      displayName: 'משתמש שנמחק',
      bio: '',
      profileImageUrl: FieldValue.delete(),
      bannerImageUrl: FieldValue.delete(),
      email: '',
      isDeleted: true,
      isDiscoverable: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Remove from discovery entirely.
  batch.delete(db.doc(`publicProfiles/${uid}`));
  batch.set(
    db.doc(`users/${uid}/private/account`),
    { email: '', deletedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  // Deactivate all chats/matches the user participates in.
  const matches = await db.collection('matches').where('users', 'array-contains', uid).get();
  for (const match of matches.docs) {
    batch.set(
      match.ref,
      { status: 'archived', updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    batch.set(
      db.doc(`chats/${match.id}`),
      { isActive: false, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  await batch.commit();
  await getAuth().deleteUser(uid);

  logger.info('account deleted', { uid });
  return { success: true as const, uid, deletionScheduledAt: Timestamp.now() };
});
