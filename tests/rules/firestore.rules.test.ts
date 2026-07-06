import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Firestore Security Rules deny/allow matrix — SECURITY §9, TEST_CASES §4 (TC-SEC-*).
// Runs against the Firestore emulator via `npm run test:rules`.

let testEnv: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';

const fullUser = (uid: string, overrides: Record<string, unknown> = {}) => ({
  uid,
  displayName: `user_${uid}`,
  email: `${uid}@test.com`,
  age: 22,
  bio: 'שחקן תחרותי',
  skillLevel: 'pro',
  platforms: ['pc'],
  onboardingCompleted: true,
  isDiscoverable: true,
  coins: 100,
  subscriptionTier: 'basic',
  subscriptionStatus: 'none',
  isPro: false,
  ownedItemIds: [],
  isSuspended: false,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  ...overrides,
});

const seed = (path: string, data: Record<string, unknown>) =>
  testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });

const seedUser = (uid: string, overrides: Record<string, unknown> = {}) =>
  seed(`users/${uid}`, fullUser(uid, overrides));

const asUser = (uid: string) => testEnv.authenticatedContext(uid).firestore();
const asGuest = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  // demo-* project = fully offline emulator mode, no credentials needed (CI-safe).
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-swish-game',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('users/{uid}', () => {
  it('allows the owner to create a minimal client-writable doc', async () => {
    await assertSucceeds(setDoc(doc(asUser(ALICE), 'users', ALICE), { displayName: 'אורן' }));
  });

  it("denies creating another user's doc", async () => {
    await assertFails(setDoc(doc(asUser(BOB), 'users', ALICE), { displayName: 'תוקף' }));
  });

  it('denies unauthenticated create', async () => {
    await assertFails(setDoc(doc(asGuest(), 'users', ALICE), { displayName: 'אנונימי' }));
  });

  it('denies create that includes coins (server-owned)', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'users', ALICE), { displayName: 'x', coins: 999999 }));
  });

  it('denies create that includes isPro (server-owned)', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'users', ALICE), { displayName: 'x', isPro: true }));
  });

  it('allows the owner to read their own doc', async () => {
    await seedUser(ALICE);
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'users', ALICE)));
  });

  it("denies reading another user's doc", async () => {
    await seedUser(ALICE);
    await assertFails(getDoc(doc(asUser(BOB), 'users', ALICE)));
  });

  it('allows the owner to update client-writable fields (bio)', async () => {
    await seedUser(ALICE);
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'users', ALICE), { bio: 'ביו חדש' }));
  });

  it('TC-SEC-001: denies updating coins', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { coins: 999999 }));
  });

  it('TC-SEC-002: denies updating isPro', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { isPro: true }));
  });

  it('TC-SEC-003: denies updating subscriptionTier', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { subscriptionTier: 'pro' }));
  });

  it('TC-SEC-004: denies updating subscriptionStatus', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { subscriptionStatus: 'active' }));
  });

  it('rejects a non-canonical skillLevel ("expert")', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { skillLevel: 'expert' }));
  });

  it('rejects a Hebrew skillLevel value', async () => {
    await seedUser(ALICE);
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { skillLevel: 'מקצוען' }));
  });

  it('TC-SEC-011 (rules layer): denies updates from a suspended user', async () => {
    await seedUser(ALICE, { isSuspended: true });
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { bio: 'עוקף השעיה' }));
  });
});

describe('users/{uid}/private/account', () => {
  const account = {
    email: 'alice@test.com',
    authProvider: 'password',
    moderationState: 'clean',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('denies client create (trigger-only path)', async () => {
    await seedUser(ALICE);
    await assertFails(setDoc(doc(asUser(ALICE), 'users', ALICE, 'private', 'account'), account));
  });

  it('allows the owner to read their own account doc', async () => {
    await seedUser(ALICE);
    await seed(`users/${ALICE}/private/account`, account);
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'users', ALICE, 'private', 'account')));
  });

  it("TC-SEC-012: denies reading another user's private account", async () => {
    await seedUser(ALICE);
    await seed(`users/${ALICE}/private/account`, account);
    await assertFails(getDoc(doc(asUser(BOB), 'users', ALICE, 'private', 'account')));
  });

  it('allows the owner to update locale (client-writable)', async () => {
    await seedUser(ALICE);
    await seed(`users/${ALICE}/private/account`, account);
    await assertSucceeds(
      updateDoc(doc(asUser(ALICE), 'users', ALICE, 'private', 'account'), { locale: 'he-IL' }),
    );
  });

  it('denies the owner updating moderationState (server-owned)', async () => {
    await seedUser(ALICE);
    await seed(`users/${ALICE}/private/account`, account);
    await assertFails(
      updateDoc(doc(asUser(ALICE), 'users', ALICE, 'private', 'account'), { moderationState: 'banned' }),
    );
  });
});

describe('users/{uid}/games/{gameId}', () => {
  const validGame = { rank: 'Platinum IV', lookingFor: 'ranked_climb', isActive: true };

  it('denies adding a game before onboarding is completed', async () => {
    await seedUser(ALICE, { onboardingCompleted: false });
    await seed('gameCatalog/valorant', { gameId: 'valorant', name: 'Valorant', isActive: true });
    await assertFails(setDoc(doc(asUser(ALICE), 'users', ALICE, 'games', 'valorant'), validGame));
  });

  it('allows adding a valid catalog game after onboarding', async () => {
    await seedUser(ALICE);
    await seed('gameCatalog/valorant', { gameId: 'valorant', name: 'Valorant', isActive: true });
    await assertSucceeds(setDoc(doc(asUser(ALICE), 'users', ALICE, 'games', 'valorant'), validGame));
  });

  it('denies adding a game that is not in the catalog', async () => {
    await seedUser(ALICE);
    await assertFails(setDoc(doc(asUser(ALICE), 'users', ALICE, 'games', 'not-a-game'), validGame));
  });

  it('denies an invalid lookingFor value', async () => {
    await seedUser(ALICE);
    await seed('gameCatalog/valorant', { gameId: 'valorant', name: 'Valorant', isActive: true });
    await assertFails(
      setDoc(doc(asUser(ALICE), 'users', ALICE, 'games', 'valorant'), { ...validGame, lookingFor: 'chill' }),
    );
  });
});

describe('server-only collections — client writes are denied', () => {
  it('TC-SEC-009: swipes', async () => {
    await seedUser(ALICE);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'users', ALICE, 'swipes', `${BOB}_valorant`), {
        fromUid: ALICE,
        toUid: BOB,
        gameId: 'valorant',
        direction: 'like',
      }),
    );
  });

  it('blocks', async () => {
    await seedUser(ALICE);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'users', ALICE, 'blocks', BOB), { blockerUid: ALICE, blockedUid: BOB }),
    );
  });

  it('ownedItems', async () => {
    await seedUser(ALICE);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'users', ALICE, 'ownedItems', 'item1'), { itemId: 'item1' }),
    );
  });

  it('TC-SEC-007: transactions', async () => {
    await seedUser(ALICE);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'users', ALICE, 'transactions', 't1'), { amountCoins: 1000000 }),
    );
  });

  it('TC-SEC-008: matches', async () => {
    await assertFails(
      setDoc(doc(asUser(ALICE), 'matches', `${ALICE}_${BOB}_valorant`), {
        users: [ALICE, BOB],
        status: 'matched',
      }),
    );
  });

  it('TC-SEC-006: publicProfiles (incl. verifiedBadge)', async () => {
    await assertFails(
      setDoc(doc(asUser(ALICE), 'publicProfiles', ALICE), { uid: ALICE, verifiedBadge: true }),
    );
  });

  it('TC-SEC-005 (variant): subscriptions', async () => {
    await assertFails(
      setDoc(doc(asUser(ALICE), 'subscriptions', ALICE), { tier: 'pro', status: 'active' }),
    );
  });

  it('aiRequests', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'aiRequests', 'r1'), { uid: ALICE, status: 'completed' }));
  });

  it('TC-SEC-018: shopItems', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'shopItems', 'cheap'), { priceCoins: 0 }));
  });

  it('TC-SEC-019: gameCatalog', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'gameCatalog', 'mygame'), { name: 'My Game' }));
  });

  it('TC-SEC-020: system/config', async () => {
    await seed('system/config', { maintenanceMode: false });
    await assertFails(updateDoc(doc(asUser(ALICE), 'system', 'config'), { maintenanceMode: true }));
  });
});

describe('read visibility', () => {
  it('allows a signed-in user to read a public profile', async () => {
    await seed(`publicProfiles/${BOB}`, { uid: BOB, displayName: 'בוב' });
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'publicProfiles', BOB)));
  });

  it('denies unauthenticated reads of public profiles', async () => {
    await seed(`publicProfiles/${BOB}`, { uid: BOB, displayName: 'בוב' });
    await assertFails(getDoc(doc(asGuest(), 'publicProfiles', BOB)));
  });

  it('denies regular users reading reports', async () => {
    await seed('reports/r1', { reporterUid: BOB, reportedUid: ALICE, status: 'open' });
    await assertFails(getDoc(doc(asUser(ALICE), 'reports', 'r1')));
  });

  it('denies regular users reading billingEvents and moderationActions', async () => {
    await seed('billingEvents/e1', { provider: 'stripe' });
    await seed('moderationActions/a1', { actionType: 'warning' });
    await assertFails(getDoc(doc(asUser(ALICE), 'billingEvents', 'e1')));
    await assertFails(getDoc(doc(asUser(ALICE), 'moderationActions', 'a1')));
  });

  it('allows signed-in users to read system/config', async () => {
    await seed('system/config', { maintenanceMode: false });
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'system', 'config')));
  });
});

describe('chats & messages', () => {
  const seedChat = (participants: string[], isActive = true) =>
    seed('chats/chat1', { chatId: 'chat1', participants, isActive });

  it('TC-SEC-013: denies a non-participant reading a chat', async () => {
    await seedChat([ALICE, BOB]);
    await assertFails(getDoc(doc(asUser('carol'), 'chats', 'chat1')));
  });

  it('allows a participant to read the chat', async () => {
    await seedChat([ALICE, BOB]);
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'chats', 'chat1')));
  });

  it('TC-SEC-015: allows a participant to create a valid text message', async () => {
    await seedUser(ALICE);
    await seedChat([ALICE, BOB]);
    await assertSucceeds(
      setDoc(doc(asUser(ALICE), 'chats', 'chat1', 'messages', 'm1'), {
        chatId: 'chat1',
        senderId: ALICE,
        type: 'text',
        text: 'היי! רוצה לשחק?',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('TC-SEC-016: denies creating an image message directly', async () => {
    await seedUser(ALICE);
    await seedChat([ALICE, BOB]);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'chats', 'chat1', 'messages', 'm2'), {
        chatId: 'chat1',
        senderId: ALICE,
        type: 'image',
        text: 'https://evil.example/img.png',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('denies a non-participant creating a message', async () => {
    await seedUser('carol');
    await seedChat([ALICE, BOB]);
    await assertFails(
      setDoc(doc(asUser('carol'), 'chats', 'chat1', 'messages', 'm3'), {
        chatId: 'chat1',
        senderId: 'carol',
        type: 'text',
        text: 'מתפרץ לשיחה',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('reports', () => {
  it('allows a valid report create', async () => {
    await seedUser(ALICE);
    await assertSucceeds(
      setDoc(doc(asUser(ALICE), 'reports', 'r1'), {
        reporterUid: ALICE,
        reportedUid: BOB,
        source: 'profile',
        reason: 'harassment',
        status: 'open',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('TC-SAFE-005 (rules layer): denies self-report', async () => {
    await seedUser(ALICE);
    await assertFails(
      setDoc(doc(asUser(ALICE), 'reports', 'r2'), {
        reporterUid: ALICE,
        reportedUid: ALICE,
        source: 'profile',
        reason: 'other',
        status: 'open',
        createdAt: serverTimestamp(),
      }),
    );
  });
});
