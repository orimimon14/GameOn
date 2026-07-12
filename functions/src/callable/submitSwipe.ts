import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { submitSwipeSchema } from '../schemas/swipe';

// API_CONTRACT §3.1 — the core loop. Creates a like/skip swipe; a reciprocal
// like creates matches/{matchId} + chats/{chatId} inside one Firestore
// transaction with deterministic IDs, so double-submits and races cannot
// produce duplicates (TC-DISC-010, TC-MATCH-003/004).
const DEFAULT_DAILY_SWIPE_LIMIT = 30; // ADR-015 draft; overridden by system/config
const ACTIVE_THROTTLE_MS = 30 * 60 * 1000; // refresh lastActiveAt at most twice an hour

// UTC day key — final reset timezone is an open decision (ADR-029).
const todayKey = () => new Date().toISOString().slice(0, 10);

export const submitSwipe = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'auth required');
  }

  const parsed = submitSwipeSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'invalid_argument');
  }
  const { targetUid, gameId, direction } = parsed.data;

  if (targetUid === uid) {
    throw new HttpsError('invalid-argument', 'self_action_forbidden');
  }

  const db = getFirestore();

  // Static reads outside the transaction.
  const [configSnap, catalogSnap] = await Promise.all([
    db.doc('system/config').get(),
    db.doc(`gameCatalog/${gameId}`).get(),
  ]);
  const catalog = catalogSnap.data();
  if (!catalog) {
    throw new HttpsError('not-found', 'not_found');
  }
  if (catalog.isActive !== true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }
  const dailyLimit: number =
    configSnap.data()?.limits?.basicDailySwipeLimit ?? DEFAULT_DAILY_SWIPE_LIMIT;

  const [minUid, maxUid] = [uid, targetUid].sort();
  const matchId = `${minUid}_${maxUid}_${gameId}`;
  const swipeId = `${targetUid}_${gameId}`;
  const reciprocalSwipeId = `${uid}_${gameId}`;
  const gameName: string = catalog.name ?? gameId;

  const refs = {
    caller: db.doc(`users/${uid}`),
    targetPublic: db.doc(`publicProfiles/${targetUid}`),
    myBlock: db.doc(`users/${uid}/blocks/${targetUid}`),
    theirBlock: db.doc(`users/${targetUid}/blocks/${uid}`),
    swipe: db.doc(`users/${uid}/swipes/${swipeId}`),
    reciprocal: db.doc(`users/${targetUid}/swipes/${reciprocalSwipeId}`),
    usage: db.doc(`users/${uid}/usage/${todayKey()}`),
    match: db.doc(`matches/${matchId}`),
    chat: db.doc(`chats/${matchId}`),
  };

  const outcome = await db.runTransaction(async (tx) => {
    const [callerSnap, targetSnap, myBlockSnap, theirBlockSnap, mySwipeSnap, reciprocalSnap, usageSnap, matchSnap] =
      await Promise.all([
        tx.get(refs.caller),
        tx.get(refs.targetPublic),
        tx.get(refs.myBlock),
        tx.get(refs.theirBlock),
        tx.get(refs.swipe),
        tx.get(refs.reciprocal),
        tx.get(refs.usage),
        tx.get(refs.match),
      ]);

    const caller = callerSnap.data();
    if (!caller) {
      throw new HttpsError('not-found', 'not_found');
    }
    if (caller.isSuspended === true || caller.isDeleted === true) {
      throw new HttpsError('failed-precondition', 'failed_precondition');
    }
    if (caller.onboardingCompleted !== true) {
      throw new HttpsError('failed-precondition', 'failed_precondition');
    }

    const target = targetSnap.data();
    if (!target) {
      throw new HttpsError('not-found', 'not_found');
    }
    if (target.isSuspended === true || target.isDeleted === true || target.isDiscoverable !== true) {
      throw new HttpsError('failed-precondition', 'failed_precondition');
    }
    // ADR-040 (resolved 2026-07-07): cross-game likes are allowed in MVP —
    // requiring the target to play the game made inbound likes from other
    // decks impossible to reciprocate ("dead-end likes"). Mutual like on the
    // same deck gameId always matches; revisit symmetric gating in V1.

    if (myBlockSnap.exists || theirBlockSnap.exists) {
      throw new HttpsError('permission-denied', 'blocked');
    }

    // Daily limit (ADR-015): Pro is unlimited; re-swiping the same target/game
    // is idempotent and does not consume the quota.
    const alreadySwiped = mySwipeSnap.exists;
    const currentCount: number = usageSnap.data()?.swipeCount ?? 0;
    if (caller.isPro !== true && !alreadySwiped && currentCount >= dailyLimit) {
      throw new HttpsError('resource-exhausted', 'resource_exhausted');
    }

    // Presence (DATA_MODEL §4.1): swiping is real activity — refresh the
    // server-owned lastActiveAt, throttled so the publicProfiles resync
    // trigger doesn't fire on every swipe.
    const lastActive = caller.lastActiveAt?.toMillis?.() ?? 0;
    if (Date.now() - lastActive > ACTIVE_THROTTLE_MS) {
      tx.update(refs.caller, { lastActiveAt: FieldValue.serverTimestamp() });
    }

    tx.set(
      refs.swipe,
      {
        fromUid: uid,
        toUid: targetUid,
        gameId,
        direction,
        updatedAt: FieldValue.serverTimestamp(),
        ...(alreadySwiped ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    if (!alreadySwiped) {
      tx.set(
        refs.usage,
        {
          date: todayKey(),
          swipeCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (direction === 'skip') {
      return { result: 'skipped' as const, swipeId };
    }

    // Existing match (re-like / race) — return it, never duplicate.
    if (matchSnap.exists) {
      return { result: 'matched' as const, swipeId, matchId, chatId: matchId };
    }

    if (reciprocalSnap.data()?.direction !== 'like') {
      return { result: 'liked' as const, swipeId };
    }

    // Double opt-in achieved — create match + chat atomically.
    const now = FieldValue.serverTimestamp();
    tx.set(refs.match, {
      matchId,
      users: [minUid, maxUid],
      userA: minUid,
      userB: maxUid,
      gameId,
      gameName,
      status: 'matched',
      createdAt: now,
      updatedAt: now,
      createdBySwipeIds: [`${uid}:${swipeId}`, `${targetUid}:${reciprocalSwipeId}`],
    });
    tx.set(refs.chat, {
      chatId: matchId,
      matchId,
      participants: [minUid, maxUid],
      userA: minUid,
      userB: maxUid,
      gameId,
      gameName,
      unreadCounts: { [minUid]: 0, [maxUid]: 0 },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return { result: 'matched' as const, swipeId, matchId, chatId: matchId };
  });

  logger.info('swipe processed', { uid, gameId, result: outcome.result });
  return outcome;
});
