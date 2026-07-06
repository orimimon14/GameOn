// Emulator seed (P2-T09) — populates the LOCAL emulators with demo data:
// gameCatalog, demo auth users, their users/{uid} docs + games + publicProfiles.
// Usage: start emulators, then `npm run seed`. Idempotent — safe to re-run.
// Emulator-only: uses the Auth emulator REST API and Firestore's owner bypass.

const PROJECT_ID = process.env.SEED_PROJECT_ID ?? 'swish-game-dev';
const AUTH = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1`;
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// --- tiny JS → Firestore REST value converter ---
const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  throw new Error(`unsupported value: ${v}`);
};
const toFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));

const writeDoc = async (path, data) => {
  const res = await fetch(`${FS}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`write ${path} failed: ${res.status} ${await res.text()}`);
};

const ensureAuthUser = async (email, password) => {
  const signUp = await fetch(`${AUTH}/accounts:signUp?key=fake-emulator-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (signUp.ok) return (await signUp.json()).localId;
  const signIn = await fetch(`${AUTH}/accounts:signInWithPassword?key=fake-emulator-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!signIn.ok) throw new Error(`auth for ${email} failed: ${await signIn.text()}`);
  return (await signIn.json()).localId;
};

// --- seed data (canonical enums only — DATA_MODEL §3) ---
const GAMES = [
  { gameId: 'valorant', name: 'Valorant', slug: 'valorant', supportedRanks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'], isFeatured: true },
  { gameId: 'warzone', name: 'Call of Duty: Warzone', slug: 'warzone', supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crimson', 'Iridescent'], isFeatured: true },
  { gameId: 'eafc', name: 'EA FC 26', slug: 'eafc', supportedRanks: ['Div 10', 'Div 9', 'Div 8', 'Div 7', 'Div 6', 'Div 5', 'Div 4', 'Div 3', 'Div 2', 'Div 1', 'Elite'], isFeatured: true },
  { gameId: 'fortnite', name: 'Fortnite', slug: 'fortnite', supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'], isFeatured: false },
  { gameId: 'lol', name: 'League of Legends', slug: 'lol', supportedRanks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'], isFeatured: false },
  { gameId: 'minecraft', name: 'Minecraft', slug: 'minecraft', supportedRanks: ['Casual'], isFeatured: false },
];

const DEMO_USERS = [
  { email: 'demo.oren@swish.test', displayName: 'אורן', age: 22, bio: 'מחפש סקוואד רגוע לערב. בעיקר Warzone.', skillLevel: 'pro', platforms: ['playstation_5', 'pc'], game: { gameId: 'warzone', rank: 'Platinum', lookingFor: 'squad', voicePreference: 'preferred' } },
  { email: 'demo.yael@swish.test', displayName: 'יעל', age: 25, bio: 'גיימרית קז\'ואל שאוהבת co-op ובניית עולמות.', skillLevel: 'beginner', platforms: ['pc', 'nintendo_switch'], game: { gameId: 'minecraft', rank: 'Casual', lookingFor: 'casual', voicePreference: 'flexible' } },
  { email: 'demo.tomer@swish.test', displayName: 'תומר', age: 28, bio: 'טריהארד ולורנט. עולים דיוויז\'ן?', skillLevel: 'elite', platforms: ['pc'], game: { gameId: 'valorant', rank: 'Immortal', lookingFor: 'ranked_climb', voicePreference: 'required' } },
];

const now = () => new Date();

const main = async () => {
  console.log(`seeding project "${PROJECT_ID}"…`);

  for (const g of GAMES) {
    await writeDoc(`gameCatalog/${g.gameId}`, { ...g, isActive: true, createdAt: now(), updatedAt: now() });
  }
  console.log(`gameCatalog: ${GAMES.length} games`);

  await writeDoc('system/config', {
    environment: 'development',
    maintenanceMode: false,
    featureFlags: { aiHubEnabled: true, shopEnabled: true, proSubscriptionEnabled: true, mediaUploadEnabled: true, reportsEnabled: true },
    limits: {
      basicDailySwipeLimit: 30,
      maxBioLength: 300,
      aiProfileReviewDailyLimitBasic: 3,
      aiProfileReviewDailyLimitPro: 20,
      aiSquadAdviceDailyLimitBasic: 3,
      aiSquadAdviceDailyLimitPro: 20,
    },
    billing: { provider: 'other', proMonthlyPriceAmount: 29.9, currency: 'ILS' },
    ai: { model: 'gemini-2.5-flash', temperature: 0.7, maxOutputTokens: 1024, timeoutMs: 20000 },
    updatedAt: now(),
  });
  console.log('system/config seeded');

  for (const u of DEMO_USERS) {
    const uid = await ensureAuthUser(u.email, 'demo123456');
    const catalogGame = GAMES.find((g) => g.gameId === u.game.gameId);

    await writeDoc(`users/${uid}`, {
      uid, displayName: u.displayName, email: u.email, age: u.age, bio: u.bio,
      skillLevel: u.skillLevel, platforms: u.platforms,
      onboardingCompleted: true, isDiscoverable: true,
      coins: 250, subscriptionTier: 'basic', subscriptionStatus: 'none', isPro: false,
      ownedItemIds: [], isSuspended: false, isDeleted: false,
      createdAt: now(), updatedAt: now(), lastActiveAt: now(),
    });
    await writeDoc(`users/${uid}/private/account`, {
      email: u.email, authProvider: 'password', moderationState: 'clean', createdAt: now(), updatedAt: now(),
    });
    await writeDoc(`users/${uid}/games/${u.game.gameId}`, {
      gameId: u.game.gameId, name: catalogGame.name, rank: u.game.rank,
      lookingFor: u.game.lookingFor, voicePreference: u.game.voicePreference,
      isActive: true, createdAt: now(), updatedAt: now(),
    });
    await writeDoc(`publicProfiles/${uid}`, {
      uid, displayName: u.displayName, age: u.age, bio: u.bio,
      skillLevel: u.skillLevel, platforms: u.platforms,
      isPro: false, verifiedBadge: false,
      gameIds: [u.game.gameId], primaryGameId: u.game.gameId, primaryRank: u.game.rank,
      isDiscoverable: true, isSuspended: false, isDeleted: false,
      createdAt: now(), updatedAt: now(), lastActiveAt: now(),
    });
    console.log(`demo user: ${u.displayName} (${uid})`);
  }

  console.log('seed — DONE');
};

main().catch((err) => {
  console.error('seed failed:', err.message);
  process.exit(1);
});
