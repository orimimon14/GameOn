import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { completeOnboardingSchema } from '../schemas/onboarding';
import { syncPublicProfileForUser } from '../services/publicProfileSync';

// API_CONTRACT §3.15 — backend-authoritative onboarding completion:
// onboardingCompleted and publicProfiles are server-owned, and the games
// create rule requires completed onboarding, so this callable does all three.
export const completeOnboarding = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }

  const parsed = completeOnboardingSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid onboarding payload');
  }
  const { profile, game } = parsed.data;

  const db = getFirestore();

  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  const user = userSnap.data();
  if (!user) {
    throw new HttpsError('not-found', 'user not found');
  }
  if (user.isSuspended === true || user.isDeleted === true) {
    throw new HttpsError('failed-precondition', 'account restricted');
  }

  const catalogSnap = await db.doc(`gameCatalog/${game.gameId}`).get();
  const catalog = catalogSnap.data();
  if (!catalog) {
    throw new HttpsError('not-found', 'game not found');
  }
  if (catalog.isActive !== true) {
    throw new HttpsError('failed-precondition', 'game not active');
  }

  const gameRef = db.doc(`users/${uid}/games/${game.gameId}`);
  const existingGame = await gameRef.get();

  const batch = db.batch();

  batch.set(
    userRef,
    { ...profile, onboardingCompleted: true, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  const gameDoc: Record<string, unknown> = {
    gameId: game.gameId,
    name: catalog.name ?? game.gameId,
    rank: game.rank,
    lookingFor: game.lookingFor,
    isActive: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (catalog.iconUrl) gameDoc.iconUrl = catalog.iconUrl;
  if (game.lookingForText) gameDoc.lookingForText = game.lookingForText;
  if (game.voicePreference) gameDoc.voicePreference = game.voicePreference;
  if (!existingGame.exists) gameDoc.createdAt = FieldValue.serverTimestamp();
  batch.set(gameRef, gameDoc, { merge: true });

  await batch.commit();

  // Signup bonus (ADR-034): one-time grant on onboarding completion, amount
  // from system/config.economy.signupBonusCoins. Deterministic transaction id
  // makes retries idempotent; the audit doc is written with the grant.
  const bonusTxRef = db.doc(`users/${uid}/transactions/signup_bonus`);
  await db.runTransaction(async (tx) => {
    const [bonusSnap, configSnap, freshUserSnap] = await Promise.all([
      tx.get(bonusTxRef),
      tx.get(db.doc('system/config')),
      tx.get(userRef),
    ]);
    if (bonusSnap.exists) return;
    const bonus: number = configSnap.data()?.economy?.signupBonusCoins ?? 0;
    if (bonus <= 0) return;
    const balanceBefore: number = freshUserSnap.data()?.coins ?? 0;
    tx.update(userRef, {
      coins: FieldValue.increment(bonus),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(bonusTxRef, {
      transactionId: 'signup_bonus',
      uid,
      type: 'signup_bonus',
      amountCoins: bonus,
      balanceBefore,
      balanceAfter: balanceBefore + bonus,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await syncPublicProfileForUser(uid);

  logger.info('onboarding completed', { uid, gameId: game.gameId });
  return { success: true, uid, completedAt: Timestamp.now() };
});
