import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { syncPublicProfileForUser } from '../services/publicProfileSync';

// API_CONTRACT §3.3 — equips an owned cosmetic: ownership check, category →
// users/{uid} cosmetic field update, then publicProfiles resync.
const inputSchema = z.object({
  itemId: z.string().trim().min(1),
});

const CATEGORY_FIELD: Record<string, string> = {
  avatar_border: 'avatarBorderItemId',
  profile_banner: 'profileBannerItemId',
  global_background: 'globalBackgroundItemId',
};

export const equipItem = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { itemId } = parsed.data;

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const [userSnap, itemSnap] = await Promise.all([
    userRef.get(),
    db.doc(`shopItems/${itemId}`).get(),
  ]);

  const user = userSnap.data();
  if (!user) throw new HttpsError('not-found', 'not_found');
  if (user.isSuspended === true || user.isDeleted === true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }

  const item = itemSnap.data();
  if (!item) throw new HttpsError('not-found', 'not_found');
  if (item.isActive !== true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }

  const owned: string[] = Array.isArray(user.ownedItemIds) ? user.ownedItemIds : [];
  if (!owned.includes(itemId)) {
    throw new HttpsError('permission-denied', 'permission_denied');
  }
  if (item.requiresPro === true) {
    const isActivePro =
      user.isPro === true && ['trialing', 'active'].includes(user.subscriptionStatus);
    if (!isActivePro) throw new HttpsError('permission-denied', 'pro_required');
  }

  const field = CATEGORY_FIELD[item.category];
  if (!field) throw new HttpsError('invalid-argument', 'invalid_argument');

  await userRef.update({ [field]: itemId, updatedAt: FieldValue.serverTimestamp() });
  await syncPublicProfileForUser(uid);

  return {
    success: true as const,
    itemId,
    category: item.category,
    updatedCosmetics: { [field]: itemId },
  };
});
