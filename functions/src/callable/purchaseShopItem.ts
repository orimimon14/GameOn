import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

// API_CONTRACT §3.2 — coins are server-owned (ADR-005/006): ownership check,
// deduction, ownedItemIds update and the transactions audit doc all happen in
// one Firestore transaction, so double-clicks and races cannot double-charge
// or drive the balance negative (TC-SHOP-006/009).
const inputSchema = z.object({
  itemId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export const purchaseShopItem = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { itemId, idempotencyKey } = parsed.data;

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const itemRef = db.doc(`shopItems/${itemId}`);
  const txId = idempotencyKey ?? db.collection('_ids').doc().id;
  const txRef = db.doc(`users/${uid}/transactions/${txId}`);

  return db.runTransaction(async (tx) => {
    const [userSnap, itemSnap, txSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(itemRef),
      tx.get(txRef),
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

    // Idempotent replay of a completed purchase.
    if (txSnap.exists) {
      return {
        success: true as const,
        itemId,
        newCoinBalance: user.coins ?? 0,
        ownedItemIds: owned,
        transactionId: txId,
      };
    }

    if (owned.includes(itemId)) {
      throw new HttpsError('already-exists', 'already_exists');
    }
    if (item.requiresPro === true) {
      const isActivePro =
        user.isPro === true && ['trialing', 'active'].includes(user.subscriptionStatus);
      if (!isActivePro) throw new HttpsError('permission-denied', 'pro_required');
    }

    const price: number = item.priceCoins ?? 0;
    if (price < 0) throw new HttpsError('failed-precondition', 'failed_precondition');
    const balance: number = user.coins ?? 0;
    if (balance < price) {
      throw new HttpsError('resource-exhausted', 'insufficient_coins');
    }

    const newBalance = balance - price;
    tx.update(userRef, {
      coins: newBalance,
      ownedItemIds: FieldValue.arrayUnion(itemId),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(txRef, {
      transactionId: txId,
      uid,
      type: 'item_purchase',
      itemId,
      amountCoins: -price,
      balanceBefore: balance,
      balanceAfter: newBalance,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true as const,
      itemId,
      newCoinBalance: newBalance,
      ownedItemIds: [...owned, itemId],
      transactionId: txId,
    };
  });
});
