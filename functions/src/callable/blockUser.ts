import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

// API_CONTRACT §3.8 — blocks a user: writes the block doc, marks every match
// between the pair as blocked and deactivates their chats. Idempotent — a
// repeated block simply re-applies the same terminal state.
const inputSchema = z.object({
  blockedUid: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const blockUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { blockedUid, reason } = parsed.data;
  if (blockedUid === uid) {
    throw new HttpsError('invalid-argument', 'self_action_forbidden');
  }

  const db = getFirestore();
  const [callerSnap, targetSnap, matchesSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${blockedUid}`).get(),
    db.collection('matches').where('users', 'array-contains', uid).get(),
  ]);

  const caller = callerSnap.data();
  if (!caller) throw new HttpsError('not-found', 'not_found');
  if (caller.isSuspended === true || caller.isDeleted === true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }
  if (!targetSnap.exists) throw new HttpsError('not-found', 'not_found');

  const pairMatches = matchesSnap.docs.filter((d) => {
    const users: string[] = d.data().users ?? [];
    return users.includes(blockedUid);
  });

  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/blocks/${blockedUid}`), {
    blockerUid: uid,
    blockedUid,
    source: 'user_action',
    ...(reason ? { reason } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  const affectedMatchIds: string[] = [];
  const affectedChatIds: string[] = [];
  for (const match of pairMatches) {
    affectedMatchIds.push(match.id);
    affectedChatIds.push(match.id); // chatId is deterministic == matchId
    batch.set(
      match.ref,
      { status: 'blocked', updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    batch.set(
      db.doc(`chats/${match.id}`),
      { isActive: false, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  await batch.commit();
  return { success: true as const, blockedUid, affectedMatchIds, affectedChatIds };
});
