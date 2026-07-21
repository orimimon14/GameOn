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
  { gameId: 'fortnite', name: "Fortnite", slug: 'fortnite', coverUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_lettermark_logo.png", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'], isFeatured: true },
  { gameId: 'lol', name: "League of Legends", slug: 'lol', coverUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/960px-League_of_Legends_2019_vector.svg.png", supportedRanks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'], isFeatured: true },
  { gameId: 'valorant', name: "Valorant", slug: 'valorant', coverUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png", supportedRanks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'], isFeatured: true },
  { gameId: 'minecraft', name: "Minecraft", slug: 'minecraft', coverUrl: "https://upload.wikimedia.org/wikipedia/commons/0/00/Minecraft_Marketplace_logo.png", supportedRanks: ['Casual'], isFeatured: true },
  { gameId: 'warzone', name: "Call of Duty: Warzone", slug: 'warzone', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1962663/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crimson', 'Iridescent'], isFeatured: true },
  { gameId: 'eafc', name: "EA FC 26", slug: 'eafc', coverUrl: "https://upload.wikimedia.org/wikipedia/en/f/f2/EA_FC_26_Cover.jpg", supportedRanks: ['Div 10', 'Div 9', 'Div 8', 'Div 7', 'Div 6', 'Div 5', 'Div 4', 'Div 3', 'Div 2', 'Div 1', 'Elite'], isFeatured: true },
  { gameId: 'cs2', name: "Counter-Strike 2", slug: 'cs2', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg", supportedRanks: ['Silver', 'Gold Nova', 'Master Guardian', 'Legendary Eagle', 'Supreme', 'Global Elite'], isFeatured: true },
  { gameId: 'gta_online', name: "GTA Online", slug: 'gta_online', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg", supportedRanks: ['Casual'], isFeatured: true },
  { gameId: 'rocket_league', name: "Rocket League", slug: 'rocket_league', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/252950/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'Supersonic Legend'], isFeatured: true },
  { gameId: 'apex_legends', name: "Apex Legends", slug: 'apex_legends', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Apex Predator'], isFeatured: false },
  { gameId: 'overwatch_2', name: "Overwatch 2", slug: 'overwatch_2', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Champion'], isFeatured: false },
  { gameId: 'roblox', name: "Roblox", slug: 'roblox', coverUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Roblox_logo_2017.svg/960px-Roblox_logo_2017.svg.png", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'brawl_stars', name: "Brawl Stars", slug: 'brawl_stars', coverUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Brawl_Stars_logo_2025.svg/960px-Brawl_Stars_logo_2025.svg.png", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Mythic', 'Legendary', 'Masters'], isFeatured: true },
  { gameId: 'clash_royale', name: "Clash Royale", slug: 'clash_royale', coverUrl: "https://upload.wikimedia.org/wikipedia/en/b/b8/Clash_Royale_game_logo.png", supportedRanks: ['Challenger', 'Master', 'Champion', 'Grand Champion', 'Royal Champion', 'Ultimate Champion'], isFeatured: false },
  { gameId: 'clash_of_clans', name: "Clash of Clans", slug: 'clash_of_clans', coverUrl: "https://upload.wikimedia.org/wikipedia/en/5/59/Clash_of_Clans_Logo.png", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Crystal', 'Master', 'Champion', 'Titan', 'Legend'], isFeatured: false },
  { gameId: 'r6_siege', name: "Rainbow Six Siege", slug: 'r6_siege', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg", supportedRanks: ['Copper', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Champion'], isFeatured: false },
  { gameId: 'pubg', name: "PUBG: Battlegrounds", slug: 'pubg', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'], isFeatured: false },
  { gameId: 'dota_2', name: "Dota 2", slug: 'dota_2', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg", supportedRanks: ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'], isFeatured: false },
  { gameId: 'nba_2k26', name: "NBA 2K26", slug: 'nba_2k26', coverUrl: "https://upload.wikimedia.org/wikipedia/en/1/1d/NBA_2K26_Leave_No_Doubt_edition_cover.jpg", supportedRanks: ['Rookie', 'Pro', 'All-Star', 'Superstar', 'Elite', 'Legend'], isFeatured: false },
  { gameId: 'marvel_rivals', name: "Marvel Rivals", slug: 'marvel_rivals', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2767030/header.jpg", supportedRanks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster', 'Celestial', 'Eternity', 'One Above All'], isFeatured: false },
  { gameId: 'helldivers_2', name: "Helldivers 2", slug: 'helldivers_2', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/553850/header.jpg", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'among_us', name: "Among Us", slug: 'among_us', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'sea_of_thieves', name: "Sea of Thieves", slug: 'sea_of_thieves', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172620/header.jpg", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'rust', name: "Rust", slug: 'rust', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'fall_guys', name: "Fall Guys", slug: 'fall_guys', coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1097150/header.jpg", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'genshin_impact', name: "Genshin Impact", slug: 'genshin_impact', coverUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Genshin_Impact_logo.svg/1280px-Genshin_Impact_logo.svg.png", supportedRanks: ['Casual'], isFeatured: false },
  { gameId: 'fifa_mobile', name: "EA FC Mobile", slug: 'fifa_mobile', coverUrl: "https://upload.wikimedia.org/wikipedia/en/c/c4/EASportsFCMobile.jpg", supportedRanks: ['Amateur', 'Pro', 'World Class', 'Legendary', 'FC Champion'], isFeatured: false },
];

const DEMO_USERS = [
  { email: 'demo.oren@swish.test', displayName: 'אורן', age: 22, bio: 'מחפש סקוואד רגוע לערב. בעיקר Warzone.', skillLevel: 'pro', platforms: ['playstation_5', 'pc'], playTimes: ['evening', 'night'], game: { gameId: 'warzone', rank: 'Platinum', lookingFor: 'squad', voicePreference: 'preferred' } },
  { email: 'demo.yael@swish.test', displayName: 'יעל', age: 25, bio: 'גיימרית קז\'ואל שאוהבת co-op ובניית עולמות.', skillLevel: 'beginner', platforms: ['pc', 'nintendo_switch'], playTimes: ['weekends', 'afternoon'], game: { gameId: 'minecraft', rank: 'Casual', lookingFor: 'casual', voicePreference: 'flexible' } },
  { email: 'demo.tomer@swish.test', displayName: 'תומר', age: 28, bio: 'טריהארד ולורנט. עולים דיוויז\'ן?', skillLevel: 'elite', platforms: ['pc'], playTimes: ['night'], game: { gameId: 'valorant', rank: 'Immortal', lookingFor: 'ranked_climb', voicePreference: 'required' } },
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
    economy: { signupBonusCoins: 500 },
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

  // shopItems catalog (P5-T03) — static_image items for MVP; animated tiers land with Motion & FX.
  const SHOP_ITEMS = [
    { itemId: 'border_ivy_green', name: 'Neon Ivy Green', category: 'avatar_border', rarity: 'rare', priceCoins: 300, style: { cssGradient: 'linear-gradient(135deg, #16a34a, #4ade80)' } },
    { itemId: 'border_cyber_cyan', name: 'Cyber Cyan Core', category: 'avatar_border', rarity: 'rare', priceCoins: 450, style: { cssGradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' } },
    { itemId: 'border_pulse_rose', name: 'Pulse Rose', category: 'avatar_border', rarity: 'epic', priceCoins: 900, style: { cssGradient: 'linear-gradient(135deg, #be123c, #fb7185)' } },
    { itemId: 'border_gold_royal', name: 'Gold Royal Ring', category: 'avatar_border', rarity: 'legendary', priceCoins: 2000, requiresPro: true, style: { cssGradient: 'linear-gradient(135deg, #b45309, #fbbf24)' } },
    { itemId: 'bg_space', name: 'Deep Space', category: 'global_background', rarity: 'common', priceCoins: 250, themeTag: 'Space', style: { cssGradient: 'linear-gradient(180deg, #0f172a, #312e81)' } },
    { itemId: 'bg_cyber_purple', name: 'Cyber Purple', category: 'global_background', rarity: 'epic', priceCoins: 850, themeTag: 'Cyber', style: { cssGradient: 'linear-gradient(135deg, #4c1d95, #a855f7)' } },
    { itemId: 'bg_sunset_blaze', name: 'Sunset Blaze', category: 'global_background', rarity: 'legendary', priceCoins: 1800, requiresPro: true, themeTag: 'Nature', style: { cssGradient: 'linear-gradient(135deg, #7c2d12, #fb923c)' } },
    { itemId: 'banner_abstract_wave', name: 'Abstract Wave', category: 'profile_banner', rarity: 'common', priceCoins: 200, themeTag: 'Abstract', style: { cssGradient: 'linear-gradient(90deg, #1e3a8a, #38bdf8)' } },
  ];
  for (const item of SHOP_ITEMS) {
    await writeDoc(`shopItems/${item.itemId}`, {
      ...item,
      description: '',
      previewUrl: '',
      assetUrl: '',
      isAnimated: false,
      renderType: 'static_image',
      requiresPro: item.requiresPro ?? false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`shopItems: ${SHOP_ITEMS.length} items`);

  for (const u of DEMO_USERS) {
    const uid = await ensureAuthUser(u.email, 'demo123456');
    const catalogGame = GAMES.find((g) => g.gameId === u.game.gameId);

    await writeDoc(`users/${uid}`, {
      uid, displayName: u.displayName, email: u.email, age: u.age, bio: u.bio,
      skillLevel: u.skillLevel, platforms: u.platforms, playTimes: u.playTimes ?? [],
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
      skillLevel: u.skillLevel, platforms: u.platforms, playTimes: u.playTimes ?? [],
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
