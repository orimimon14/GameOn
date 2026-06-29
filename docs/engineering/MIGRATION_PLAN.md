# Swish & Game — Migration Plan

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Migration Plan |
| Repository Path | `docs/engineering/MIGRATION_PLAN.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/architecture/DATA_MODEL.md`, `docs/product/DECISIONS.md` |
| Current State | React/Vite prototype with mock data, no Firebase, client-side Gemini key exposure |
| Target State | Firebase-first production architecture with backend-authoritative state |
| Stack Target | React + Vite + TypeScript + Tailwind CSS + Framer Motion; Firebase Auth, Firestore, Storage, Cloud Functions; Gemini via server-side proxy |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Executive Summary](#2-executive-summary)
- [3. עקרונות המיגרציה](#3-עקרונות-המיגרציה)
- [4. טבלת מיפוי Current → Target](#4-טבלת-מיפוי-current--target)
- [5. Phased Migration Plan](#5-phased-migration-plan)
  - [Phase 0 — Security & Hygiene](#phase-0--security--hygiene)
  - [Phase 1 — Foundation](#phase-1--foundation)
  - [Phase 2 — Auth & Data Layer](#phase-2--auth--data-layer)
  - [Phase 3 — Discovery & Matching](#phase-3--discovery--matching)
  - [Phase 4 — Chat](#phase-4--chat)
  - [Phase 5 — Economy](#phase-5--economy)
  - [Phase 6 — Subscription](#phase-6--subscription)
  - [Phase 7 — AI](#phase-7--ai)
  - [Phase 8 — Safety & Hardening](#phase-8--safety--hardening)
- [6. אסטרטגיית Strangler / Coexistence](#6-אסטרטגיית-strangler--coexistence)
- [7. Data & Type Migration](#7-data--type-migration)
- [8. Dead Code Removal](#8-dead-code-removal)
- [9. Risk Register](#9-risk-register)
- [10. Definition of Done למיגרציה כולה](#10-definition-of-done-למיגרציה-כולה)

---

## 2. Executive Summary

המיגרציה של Swish & Game תתבצע באופן אינקרמנטלי לפי Strangler pattern: הכנסת Firebase ותשתיות production לצד ה-mock data, ואז החלפה הדרגתית של כל מודול. התיקון הראשון הוא security-first: הסרת Gemini API key מה-client והפסקת קריאה ישירה ל-Gemini מה-frontend. לאחר מכן נבנה foundation מודרני עם React Router, Zustand, Zod, React Hook Form, Tailwind כ-build dependency ומבנה `src/features/**`. רק אחרי יצירת Auth/Data layer יציבים נעביר state רגיש ל-Cloud Functions: swipes, matches, coins, cosmetics, subscription, AI ו-safety.

---

## 3. עקרונות המיגרציה

### 3.1 אינקרמנטלי, לא Big-Bang

האפליקציה חייבת להישאר במצב עובד לאורך כל המיגרציה. אין לבצע rewrite מלא בבת אחת. במקום זאת:

- מכניסים abstractions סביב data access.
- מאפשרים coexistence בין `mock` לבין `firestore`.
- מחליפים domain אחר domain.
- כל phase מסתיים במצב deployable.

### 3.2 Security-First

הסיכון הדחוף ביותר הוא חשיפת Gemini API key ב-client. לכן Phase 0 מטפל ב:

- הסרת Gemini key מה-bundle.
- הסרת `process.env.API_KEY` מה-client.
- ביטול קריאה ישירה ל-Gemini SDK מה-frontend.
- יצירת placeholder בטוח ל-AI עד Cloud Function מלאה.

### 3.3 Backend-Authoritative

כל state רגיש יעבור ל-backend:

- `coins`
- `subscriptionTier`
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `isPro`
- `verifiedBadge`
- `matches`
- `swipes`
- `ownedItems`
- `transactions`
- `aiRequests`
- `subscriptions`

ה-client רשאי לבקש פעולה, אך ההחלטה והכתיבה מתבצעות ב-Cloud Functions או Admin SDK.

### 3.4 Deployable Exit Criteria לכל שלב

כל phase חייב להסתיים עם:

- build שעובר.
- typecheck שעובר.
- UI core flows עדיין עובדים.
- feature flag ברור אם הפיצ׳ר עדיין חלקי.
- rollback path.
- מסמך קצר של מה הושלם ומה נשאר.

### 3.5 שמירה על עקביות עם Source of Truth

כל שינוי חייב להתאים ל:

- `PRD.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `DECISIONS.md`

אם מתגלה סתירה, לא מתקנים בקוד לפני עדכון ה-decision/schema הרלוונטיים.

---

## 4. טבלת מיפוי Current → Target

| תחום | מצב נוכחי | מצב יעד | סוג שינוי |
|---|---|---|---|
| Product name | מופיעים legacy references כמו `GameOn` / `DoGame` / `dogame` namespace | `Swish & Game` בלבד | replace |
| Styling | Tailwind CDN דרך `cdn.tailwindcss.com`; config inline; `dogame` color namespace | Tailwind כ-build dependency; design tokens קנוניים | replace/refactor |
| Colors | namespace ישן ו-cyan legacy | `#6366F1`, `#F59E0B`, `#10B981`, `#EF4444` | refactor |
| Routing | `activeView` דרך `useState` | `React Router` routes ו-protected routes | replace |
| State | local `useState`, mock arrays, `coins = 1000000` | Firestore subscriptions + Zustand local UI state + Cloud Functions | replace |
| Data source | `constants.ts` mock data | Firebase Auth + Firestore + Storage | replace |
| Auth | אין | Firebase Auth: Google OAuth + email/password | new |
| Onboarding | אין onboarding אמיתי | gated onboarding לפני discovery | new |
| IDs | `GamerProfile.id: number` | `uid: string` | replace |
| `skillLevel` | עברית, 3 ערכים: `'קז'ואל' | 'תחרותי' | 'מקצוען'` | `beginner | intermediate | pro | elite` | replace |
| `platforms` | `string[]` לא מבוקר | `Platform[]` controlled vocabulary | refactor |
| Games | inline array בפרופיל | `users/{uid}/games/{gameId}` + `gameCatalog/{gameId}` | replace |
| Swipe | append local array | `submitSwipe` Cloud Function + `users/{uid}/swipes` | replace |
| Matching | אין double opt-in אמיתי | deterministic match ID + transaction + chat creation | new |
| Chat | mock/local | `chats/{chatId}` + real-time messages | replace |
| Media chat | לא מאובטח / לא production | Pro-only via backend validation + Storage | new |
| Shop taxonomy | `itemType`, uppercase rarity, theme category | `category`, lowercase `rarity`, `requiresPro`, `themeTag?` | replace |
| Avatar border | raw CSS string on profile | `avatarBorderItemId` reference ל-`shopItems` | replace |
| Coins | `useState(1000000)` client-side | server-owned `coins`, `signup_bonus`, `admin_grant`, transaction audit | replace |
| Subscription | mock/alert/UI בלבד | provider checkout → webhook → `subscriptions/{uid}` | new |
| Gemini | client-side SDK + exposed API key + invalid model name | Cloud Function Gemini proxy + Secret Manager + guardrails | replace |
| Safety | אין block/report | `blockUser`, `createReport`, Firestore records | new |
| Security rules | אין | Firestore + Storage rules + emulator tests | new |
| Folder structure | flat `components/*.tsx` | feature-based `src/features/**` | refactor |
| Dead code | AI Studio leftovers | מחיקה מלאה | delete |
| Observability | אין | Cloud Logging, Error Reporting, Sentry, alerts | new |

---

## 5. Phased Migration Plan

---

## Phase 0 — Security & Hygiene

### מטרות

- לעצור את הסיכון המיידי של Gemini API key ב-client.
- להוציא קוד מת שמבלבל את migration surface.
- להחזיר את האפליקציה למצב prototype בטוח יותר לפני התחלת Firebase migration.

### תלויות

אין. זהו השלב הראשון וחובה לבצע אותו לפני כל deployment נוסף.

### צעדים

#### 0.1 הסרת Gemini key מה-client

- להסיר מ-`vite.config.ts` כל mapping של:
  - `process.env.API_KEY`
  - `process.env.GEMINI_API_KEY`
- להסיר שימוש ב-`@google/genai` מה-frontend.
- להסיר import ישיר של Gemini SDK מ-`services/geminiService.ts`.
- להחליף את `services/geminiService.ts` ב-safe stub זמני:

  - מחזיר הודעה: AI temporarily disabled during production migration.
  - לא קורא לשום API חיצוני.
  - לא מכיל key.
  - לא מכיל system prompt אמיתי.

#### 0.2 תיקון מזהה מודל שגוי

- להסיר reference ל-`gemini-3-flash-preview`.
- לא לבחור model חדש ב-client.
- model יוגדר בהמשך רק ב-Cloud Function, תחת Phase 7.

#### 0.3 ניקוי קוד מת

למחוק components יתומים:

- `FeatureTable`
- `GeminiFeatureIdeation`
- `Roadmap`
- `Section`
- `PersonaCard`

למחוק טיפוסים לא בשימוש:

- `Persona`
- `Feature`
- `RoadmapItem`
- `GeneratedIdea`

#### 0.4 בדיקות

- להריץ `npm run build`.
- להריץ `npm run typecheck`, אם קיים.
- לוודא שאין reference ל-`process.env.API_KEY`.
- לוודא שאין direct import של Gemini SDK ב-client.
- לוודא שה-UI עדיין עולה.

### Exit Criteria

- [ ] אין Gemini API key ב-client bundle.
- [ ] אין קריאה ישירה ל-Gemini מה-frontend.
- [ ] `vite.config.ts` לא מזריק secrets.
- [ ] קוד מת מהתבנית הוסר.
- [ ] האפליקציה עדיין נפתחת ועובדת כ-prototype.
- [ ] `npm run build` עובר.

---

## Phase 1 — Foundation

### מטרות

לבנות foundation production-ready לפני העברת data אמיתית:

- Tailwind כ-build dependency.
- design tokens קנוניים.
- React Router.
- Zustand.
- Zod.
- React Hook Form.
- feature-based folder structure.
- Firebase SDK setup, אך עדיין לא החלפה מלאה של mock data.

### תלויות

- Phase 0 הושלם.

### צעדים

#### 1.1 התקנת Tailwind כ-build dependency

להוסיף dependencies/devDependencies:

- `tailwindcss`
- `postcss`
- `autoprefixer`

ליצור:

- `tailwind.config.ts`
- `postcss.config.js`
- `src/index.css`

להסיר מ-`index.html`:

- `<script src="https://cdn.tailwindcss.com"></script>`
- inline Tailwind config.

#### 1.2 החלפת `dogame` namespace

למפות tokens ישנים לטוקנים קנוניים:

| Legacy | Target |
|---|---|
| `dogame-*` | `swish-*` או semantic tokens |
| cyan `#22D3EE` | primary indigo `#6366F1` או token מתאים |
| old premium color | premium amber `#F59E0B` |
| success custom | success emerald `#10B981` |
| danger custom | danger red `#EF4444` |

המלצה ל-Tailwind tokens:

- `swish-bg`: `#0F172A`
- `swish-surface`: `#1E293B`
- `swish-primary`: `#6366F1`
- `swish-premium`: `#F59E0B`
- `swish-success`: `#10B981`
- `swish-danger`: `#EF4444`

#### 1.3 React Router

להחליף `activeView` עם routes:

| Current View | Target Route |
|---|---|
| discovery / swipe | `/discover` |
| matches | `/matches` |
| chat | `/chat/:chatId` |
| shop | `/shop` |
| subscriptions | `/subscription` |
| profile | `/profile` |
| settings | `/settings` |
| AI hub | `/ai` |
| onboarding | `/onboarding` |
| login | `/login` |

להוסיף route guards בהמשך Phase 2:

- unauthenticated → `/login`
- authenticated but onboarding incomplete → `/onboarding`
- authenticated + onboarding complete → app routes

#### 1.4 Zustand

להקים stores ל-local UI state בלבד:

- `useUiStore`
  - modal state
  - upgrade prompt state
  - active overlays
- `useDiscoveryUiStore`
  - `selectedGameId`
  - local deck index
  - animation state
- `useUploadStore`
  - temporary upload progress

לא לשמור ב-Zustand:

- coins
- Pro status
- matches
- owned items
- subscription status
- user profile source of truth

#### 1.5 Zod + React Hook Form

להגדיר schemas:

- `authSchema`
- `onboardingProfileSchema`
- `userGameSchema`
- `profileEditSchema`
- `reportSchema`
- `aiRequestSchema`

React Hook Form ישמש:

- onboarding
- profile edit
- report form
- AI input forms
- future payment profile fields if needed

#### 1.6 Feature-Based Folder Structure

להעביר בהדרגה ל:

```text
src/
  app/
  config/
  features/
    auth/
    onboarding/
    profile/
    discovery/
    matches/
    chat/
    shop/
    subscription/
    ai/
    safety/
  shared/
```

#### 1.7 Firebase Client Config

להוסיף `src/config/firebase.ts`.

בשלב זה מותר להגדיר Firebase public config בלבד:

- `apiKey` של Firebase project הוא לא secret.
- אין Gemini key.
- אין payment secret.

### Exit Criteria

- [ ] Tailwind CDN הוסר.
- [ ] Tailwind עובד דרך build.
- [ ] `dogame` namespace לא בשימוש בקוד חדש.
- [ ] React Router מחליף `activeView`.
- [ ] Zustand מותקן ומשמש רק ל-local UI.
- [ ] Zod ו-RHF קיימים לטפסים חדשים.
- [ ] מבנה `src/features/**` קיים.
- [ ] Firebase client config קיים בלי secrets.
- [ ] האפליקציה עדיין deployable.

---

## Phase 2 — Auth & Data Layer

### מטרות

- להכניס Firebase Auth.
- ליצור `users/{uid}` ו-`publicProfiles/{uid}`.
- לבנות onboarding אמיתי.
- להמיר `id: number` ל-`uid: string`.
- להחליף mock profiles בהדרגה ב-Firestore.
- להמיר enums לערכים באנגלית.

### תלויות

- Phase 1 הושלם.
- Firebase projects קיימים: `development`, `staging`, `production`.

### צעדים

#### 2.1 Firebase Auth

להפעיל:

- Google OAuth
- Email/password

להוסיף:

- `AuthProvider`
- `useAuthUser`
- `ProtectedRoute`
- `OnboardingGuard`

#### 2.2 User Bootstrap

לאחר signup/login:

- אם אין `users/{uid}`, ליצור user document ראשוני.
- ליצור `users/{uid}/private/account`.
- לא ליצור `publicProfiles/{uid}` עד שיש onboarding מינימלי.

Default server-owned fields:

- `coins = 0` או value לאחר `signup_bonus` בהמשך Phase 5.
- `subscriptionTier = basic`
- `subscriptionStatus = none`
- `isPro = false`
- `isSuspended = false`
- `isDeleted = false`

#### 2.3 Onboarding

לבנות onboarding שמייצר:

- `displayName`
- `age`
- `bio`
- `profileImageUrl`
- `skillLevel`
- `platforms`
- לפחות משחק אחד ב-`users/{uid}/games/{gameId}`
- `rank`
- `lookingFor`
- `voicePreference`

בסיום onboarding:

- `users/{uid}.onboardingCompleted = true`
- יצירת/עדכון `publicProfiles/{uid}`
- sync של `gameIds`, `primaryGameId`, `primaryRank`

#### 2.4 המרת IDs

להחליף בכל הקוד:

| Current | Target |
|---|---|
| `GamerProfile.id: number` | `uid: string` |
| `Message.senderId: number` | `senderId: string` |
| local match IDs | deterministic `{minUid}_{maxUid}_{gameId}` |
| local chat IDs | `chatId = matchId` |

#### 2.5 המרת `skillLevel`

מיפוי prototype:

| Current Hebrew | Target |
|---|---|
| `קז'ואל` | `beginner` או `intermediate` לפי החלטת migration |
| `תחרותי` | `pro` |
| `מקצוען` | `elite` |

הערה: מומלץ לא לבצע mapping אוטומטי שקט אם אין ודאות. עבור seed/mock migration ניתן לבחור mapping זמני, אך user-generated profiles צריכים לבחור מחדש onboarding.

#### 2.6 Label Maps

להוסיף UI label maps:

```ts
const skillLevelLabelsHe = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  pro: "מקצוען",
  elite: "עילית",
};
```

Firestore שומר רק ערכי enum באנגלית.

#### 2.7 Data Source Abstraction

להקים abstraction:

- `profileRepository`
- `discoveryRepository`
- `shopRepository`
- `chatRepository`

כל repository יכול לעבוד עם:

- `mock`
- `firestore`

לפי feature flag.

### Exit Criteria

- [ ] משתמש יכול להירשם ולהתחבר.
- [ ] authenticated route guards עובדים.
- [ ] onboarding חוסם discovery עד השלמה.
- [ ] `users/{uid}` נוצר.
- [ ] `publicProfiles/{uid}` נוצר אחרי onboarding.
- [ ] `uid: string` מחליף `id: number` ב-domain types חדשים.
- [ ] `skillLevel` נשמר באנגלית בלבד.
- [ ] `platforms` נשמר כ-`Platform[]`.
- [ ] mock data עדיין יכול לפעול מאחורי feature flag.
- [ ] Firestore read/write בסיסיים עובדים בסביבת dev.

---

## Phase 3 — Discovery & Matching

### מטרות

- להחליף local likes ב-`submitSwipe`.
- ליצור double opt-in אמיתי.
- ליצור `matches/{matchId}` ו-`chats/{chatId}`.
- לבנות deck אמיתי מ-Firestore.

### תלויות

- Phase 2 הושלם.
- Auth ו-public profiles קיימים.
- לפחות seed data ב-Firestore קיים.

### צעדים

#### 3.1 MVP Deck Query

ב-MVP להשתמש ב-`publicProfiles`:

- `isDiscoverable == true`
- `isSuspended == false`
- `isDeleted == false`
- `gameIds array-contains selectedGameId`
- limit batch קטן

Client מסנן זמנית:

- current user
- already swiped
- already matched
- blocked users

#### 3.2 Cloud Function `submitSwipe`

Function input:

- `targetUid`
- `gameId`
- `direction: "like" | "skip"`

Logic:

- validate auth
- reject self-swipe
- validate current user
- validate target
- validate selected game
- check blocks both directions
- check Basic daily swipe limit
- write `users/{uid}/swipes/{targetUid_gameId}`
- if skip → return `skipped`
- if like → check reciprocal like
- if reciprocal → transaction creates match + chat

#### 3.3 Deterministic Match ID

Format:

```text
{minUid}_{maxUid}_{gameId}
```

Chat ID:

```text
chatId = matchId
```

#### 3.4 UI Integration

- replace local `likedProfiles` append.
- update swipe result handling:
  - `skipped`
  - `liked`
  - `matched`
- show match celebration only on backend-confirmed `matched`.

#### 3.5 Likes You

לפי ADR-033:

- `Likes You` פתוח לכל המשתמשים ב-MVP.
- אין Pro gating.
- ניתן להציג inbound likes דרך query/derived read model בסיסי או backend helper.
- אם זה מורכב מדי ל-MVP הראשוני, להשאיר feature flag עד שיש server implementation.

### Exit Criteria

- [ ] deck מגיע מ-Firestore או repository abstraction עם Firestore mode.
- [ ] swipe עובר דרך `submitSwipe`.
- [ ] אין local-only matching.
- [ ] reciprocal like יוצר match אחד בלבד.
- [ ] chat document נוצר עם match.
- [ ] duplicate swipes לא יוצרים duplicate matches.
- [ ] Basic swipe limit נאכף server-side.
- [ ] `Likes You` פתוח לכל המשתמשים אם מופעל.

---

## Phase 4 — Chat

### מטרות

- להחליף mock chat ב-Firestore real-time chat.
- לאפשר text chat לכל matched users.
- להוסיף media upload Pro-only באופן מאובטח.

### תלויות

- Phase 3 הושלם.
- `matches` ו-`chats` נוצרים אמיתית.

### צעדים

#### 4.1 Chat List

להציג matches/chats מתוך Firestore:

- `chats` לפי `participants array-contains uid`
- order by `lastTimestamp desc`
- fallback עבור chats ללא messages

#### 4.2 Real-Time Messages

Query:

- `chats/{chatId}/messages`
- order by `createdAt desc`
- limit 50
- reverse client-side לתצוגה ascending

#### 4.3 Text Message Write

אפשרות MVP:

- client create text message לפי Security Rules.
- `senderId` חייב להיות auth UID.
- `type = text`.
- Cloud Function trigger `onMessageCreated` מעדכן:
  - `lastMessage`
  - `lastMessageType`
  - `lastMessageSenderId`
  - `lastTimestamp`
  - `unreadCounts`

#### 4.4 Media Pro Gating

Flow:

1. Basic user לוחץ media → upgrade prompt.
2. Pro user מעלה file ל-Storage path.
3. Client קורא `sendChatMediaMessage`.
4. Backend מאמת:
   - auth
   - participant
   - active chat
   - `isPro`
   - file ownership/path
   - type/size
5. Backend יוצר message `type = image`.

#### 4.5 Block Awareness

Chat input צריך להיחסם אם:

- chat inactive
- block exists either direction
- user suspended/deleted

### Exit Criteria

- [ ] chat list אמיתי.
- [ ] text messages real-time.
- [ ] last message preview עובד.
- [ ] Basic media blocked.
- [ ] Pro media server-validated.
- [ ] user לא יכול לקרוא chat שאינו participant.
- [ ] user לא יכול לשלוח בשם משתמש אחר.
- [ ] block state מונע שליחה.

---

## Phase 5 — Economy

### מטרות

- להעביר `coins` ל-server-owned.
- להחליף `useState(1000000)`.
- ליישם `signup_bonus` ו-`admin_grant` לפי ADR-034.
- להמיר shop taxonomy.
- ליישם `purchaseShopItem` ו-`equipItem`.
- להחליף `avatarBorder` raw CSS ב-`avatarBorderItemId`.

### תלויות

- Phase 2 הושלם.
- Phase 1 styling tokens הושלמו.
- `shopItems` seed catalog מוכן.

### צעדים

#### 5.1 הסרת local coins

להסיר:

```ts
const [coins, setCoins] = useState(1000000);
```

להחליף ב:

- `users/{uid}.coins` Firestore subscription
- backend mutations בלבד

#### 5.2 Signup Bonus

לפי ADR-034:

- בעת השלמת onboarding, backend מעניק `signup_bonus`.
- הסכום נקרא מ-`system/config`.
- נוצר transaction audit:
  - `type = signup_bonus`
  - `balanceBefore`
  - `balanceAfter`

ב-MVP אם `transactions` עדיין Scale/V1, מומלץ בכל זאת להקדים אותו כי coins דורשים audit.

#### 5.3 Admin Grant

להוסיף function פנימית או admin-only:

- `grantCoins`
- `type = admin_grant`
- reason/campaign metadata בהמשך

#### 5.4 Shop Taxonomy Migration

להחליף:

| Prototype | Target |
|---|---|
| `itemType: "background"` | `category: "global_background"` או `profile_banner` לפי item |
| `itemType: "avatar-border"` | `category: "avatar_border"` |
| `rarity: "COMMON"` | `rarity: "common"` |
| `rarity: "RARE"` | `rarity: "rare"` |
| `category: "Cyber"` | `themeTag: "Cyber"` |
| `category: "Nature"` | `themeTag: "Nature"` |
| `category: "Space"` | `themeTag: "Space"` |

להוסיף לכל item:

- `priceCoins`
- `requiresPro`
- `previewUrl`
- `assetUrl`
- `isAnimated`
- `isActive`

#### 5.5 Avatar Border Migration

להחליף:

```ts
avatarBorder: "linear-gradient(...)"
```

ב:

```ts
avatarBorderItemId: "some_shop_item_id"
```

ה-gradient עצמו עובר ל:

```text
shopItems/{itemId}.style.cssGradient
```

#### 5.6 `purchaseShopItem`

Function:

- validate auth
- load user
- load item
- reject inactive
- reject already owned
- reject insufficient coins
- reject Pro-required if not Pro
- transaction:
  - deduct coins
  - add owned item
  - create transaction audit

#### 5.7 `equipItem`

Function:

- validate ownership
- validate item category
- validate `requiresPro`
- update:
  - `users/{uid}.avatarBorderItemId`
  - `users/{uid}.globalBackgroundItemId`
  - future `profileBannerItemId` if added
- sync `publicProfiles`

### Exit Criteria

- [ ] אין local `coins = 1000000`.
- [ ] coins נקראים מ-Firestore.
- [ ] coins משתנים רק דרך backend.
- [ ] `signup_bonus` מוגדר דרך `system/config`.
- [ ] `admin_grant` נתמך לפחות ידנית/backend.
- [ ] shop taxonomy תואמת `DATA_MODEL.md`.
- [ ] `avatarBorderItemId` מחליף raw CSS.
- [ ] purchase/equip עובדים מקצה לקצה.
- [ ] כל coin change יוצר audit record.

---

## Phase 6 — Subscription

### מטרות

- להוסיף Pro subscription אמיתי.
- להגדיר payment provider.
- ליישם checkout → webhook → Firestore entitlement.
- לאכוף Pro server-side.

### תלויות

- Phase 5 הושלם עבור economy gating.
- payment provider נבחר.
- legal/billing policy מוגדר.

### צעדים

#### 6.1 Provider Evaluation

להשוות ספקים לפי:

- recurring billing
- ILS
- webhooks
- invoices/receipts
- cancellation support
- developer experience
- fees
- Israeli compliance
- test environment

#### 6.2 Subscription Document

ליצור/לעדכן:

```text
subscriptions/{uid}
```

Fields:

- `tier`
- `status`
- `provider`
- `providerCustomerId`
- `providerSubscriptionId`
- `currentPeriodStart`
- `currentPeriodEnd`
- `priceAmount`
- `currency = ILS`

#### 6.3 Checkout Flow

- client מבקש checkout session.
- backend יוצר session אצל provider.
- client redirect/opens checkout.
- provider שולח webhook.

#### 6.4 Webhook

`paymentWebhook`:

- verify signature
- parse event
- map customer/subscription to `uid`
- update `subscriptions/{uid}`
- update `users/{uid}`:
  - `subscriptionTier`
  - `subscriptionStatus`
  - `subscriptionExpiresAt`
  - `isPro`
- update `publicProfiles/{uid}`:
  - `isPro`
  - `verifiedBadge`

#### 6.5 Pro Entitlements

לאכוף server-side:

- unlimited swipes
- media transfer
- Pro-only cosmetics
- verified badge
- future advanced AI

### Exit Criteria

- [ ] provider נבחר.
- [ ] checkout עובד בסביבת test.
- [ ] webhook מאומת cryptographically.
- [ ] `subscriptions/{uid}` מתעדכן.
- [ ] `users/{uid}.isPro` מתעדכן רק backend.
- [ ] Pro expiration/downgrade מטופלים.
- [ ] Basic לא יכול להשתמש ב-Pro-only backend actions.
- [ ] subscription UI מציג מצב אמיתי.

---

## Phase 7 — AI

### מטרות

- להחזיר Gemini בצורה production-safe.
- להפעיל server-side proxy.
- להוסיף guardrails.
- להוסיף audit ו-rate limits.

### תלויות

- Phase 0 הסיר key מה-client.
- Cloud Functions קיימות.
- Secret Manager מוגדר.
- AI policies מוגדרים.

### צעדים

#### 7.1 Secret Manager

לשמור:

- Gemini API key
- model config
- optional safety config

#### 7.2 Cloud Functions

ליישם:

- `sendAIProfileReview`
- `sendAISquadAdvice`

#### 7.3 Guardrails

לחסום:

- cheating
- exploits
- harassment
- hate
- doxxing
- account stealing
- ban evasion
- toxic gameplay instructions

#### 7.4 Model ID

לבחור model תקף בצד server בלבד. אין model ID ב-client.

#### 7.5 Audit

ליצור:

```text
aiRequests/{requestId}
```

עם:

- `uid`
- `type`
- `status`
- `inputSummary`
- `outputSummary`
- `model`
- `createdAt`
- `completedAt`
- `errorCode`

#### 7.6 UI Reconnection

להחליף AI stub מ-Phase 0 בקריאה ל-callable function.

### Exit Criteria

- [ ] Gemini key ב-Secret Manager בלבד.
- [ ] אין direct Gemini SDK ב-client.
- [ ] AI profile review עובד דרך Cloud Function.
- [ ] AI squad advice עובד דרך Cloud Function.
- [ ] unsafe requests נחסמות.
- [ ] audit נכתב ל-`aiRequests`.
- [ ] rate limiting בסיסי קיים.
- [ ] AI UI מציג loading/error/refusal states.

---

## Phase 8 — Safety & Hardening

### מטרות

- ליישם block/report.
- להשלים Firestore/Storage Security Rules.
- להוסיף tests.
- להוסיף observability.
- להכין private beta.

### תלויות

- Phases 2–7 הושלמו או feature flagged.
- Data model יציב.

### צעדים

#### 8.1 Block

ליישם `blockUser`:

- create `users/{uid}/blocks/{blockedUid}`
- update/affect match status
- disable chat
- remove from discovery

#### 8.2 Report

ליישם `createReport`:

- `reportedUid`
- `source`
- `chatId`
- `messageId`
- `reason`
- `description`
- `status = open`

#### 8.3 Security Rules

לכתוב rules עבור:

- users owner-only
- publicProfiles read authenticated
- matches participant-only read
- chats participant-only read
- messages participant write
- Basic no media
- no client writes to coins/subscription/matches/swipes/transactions/ownedItems/aiRequests
- reports create only through allowed path/function policy
- shop/game catalog read-only

#### 8.4 Storage Rules

לכתוב rules עבור:

- profile images
- banner images
- chat media
- shop assets read-only

#### 8.5 Emulator Tests

לבדוק:

- user cannot update coins
- user cannot self-grant Pro
- user cannot create match directly
- user cannot read private profile of another user
- user cannot read unauthorized chat
- Basic user cannot send media
- user cannot write shop catalog
- user cannot write game catalog

#### 8.6 Observability

להוסיף:

- Cloud Function logging
- Error Reporting
- Sentry frontend
- alerts ל:
  - `submitSwipe` failures
  - `paymentWebhook` failures
  - `purchaseShopItem` failures
  - AI errors
  - Storage abuse
  - Firestore quota

### Exit Criteria

- [ ] block עובד ומשפיע על discovery/chat.
- [ ] report עובד ונשמר.
- [ ] Firestore rules מוכנות.
- [ ] Storage rules מוכנות.
- [ ] Emulator tests עוברים.
- [ ] E2E flows קריטיים עוברים.
- [ ] observability פעיל.
- [ ] אין secrets ב-client.
- [ ] private beta checklist הושלם.

---

## 6. אסטרטגיית Strangler / Coexistence

### 6.1 למה צריך Coexistence

מעבר ישיר מ-`constants.ts` ל-Firestore בכל האפליקציה מסוכן מדי. במקום זאת ניצור שכבת repositories שמאפשרת לבחור data source לכל feature.

### 6.2 Feature Flags

להוסיף config:

```ts
type DataSourceMode = "mock" | "firestore";

type FeatureFlags = {
  authEnabled: boolean;
  firestoreProfilesEnabled: boolean;
  firestoreDiscoveryEnabled: boolean;
  firestoreChatEnabled: boolean;
  cloudSwipeEnabled: boolean;
  shopBackendEnabled: boolean;
  subscriptionEnabled: boolean;
  aiProxyEnabled: boolean;
  safetyEnabled: boolean;
};
```

### 6.3 Repository Pattern

דוגמה:

```text
src/features/discovery/services/discoveryRepository.ts
src/features/discovery/services/mockDiscoveryRepository.ts
src/features/discovery/services/firestoreDiscoveryRepository.ts
```

ה-UI קורא ל-interface אחד:

```ts
discoveryRepository.getDeck({ selectedGameId });
discoveryRepository.submitSwipe({ targetUid, gameId, direction });
```

### 6.4 החלפה מודול-אחר-מודול

| מודול | התחלה | מעבר | סיום |
|---|---|---|---|
| Profile | mock current user | Auth + Firestore user | Firestore only |
| Discovery | mock profiles | Firestore publicProfiles | Firestore + Cloud Function swipe |
| Matching | local liked array | submitSwipe | backend-only match |
| Chat | mock conversations | Firestore chats | Firestore only |
| Shop | constants items | Firestore shopItems | backend purchase/equip |
| AI | disabled stub | Cloud Function proxy | Gemini backend-only |
| Safety | none | UI only disabled | backend block/report |

### 6.5 כללי Coexistence

- לא לערבב mock writes עם Firestore writes באותו flow.
- כל feature מקבל flag ברור.
- כל repository מחזיר domain types חדשים, לא prototype types.
- mock data צריך לעבור normalization לאותם types של production.
- ברגע ש-feature עובר ל-Firestore, אין לחזור ל-local state רגיש.

---

## 7. Data & Type Migration

### 7.1 Profile Mapping

| Prototype Field | Target Field | Migration Rule |
|---|---|---|
| `GamerProfile.id: number` | `uid: string` | להחליף ל-Firebase Auth UID. עבור seed data להשתמש ב-stable fake UID strings. |
| `name` | `displayName` | direct mapping. |
| `age` | `age` | direct mapping, בכפוף ל-policy. |
| `bio` | `bio` | direct mapping עם max length validation. |
| `image` | `profileImageUrl` | להעביר ל-Storage URL או external URL זמני ל-seed בלבד. |
| `bannerImage` | `bannerImageUrl` | direct mapping אם קיים. |
| `skillLevel` בעברית | `skillLevel` באנגלית | mapping לפי טבלה בהמשך. |
| `platforms: string[]` | `platforms: Platform[]` | normalize לערכים מבוקרים. |
| `rank` global | `users/{uid}/games/{gameId}.rank` | rank עובר לרמת game. |
| `games[] inline` | `users/{uid}/games/{gameId}` | לפצל subcollection. |
| `avatarBorder` CSS | `avatarBorderItemId` | ליצור shop item מתאים ולהצביע אליו. |
| local `coins` | `users/{uid}.coins` | server-owned; לא client state. |

### 7.2 `skillLevel` Migration

| Prototype Value | Target Value | הערה |
|---|---|---|
| `קז'ואל` | `beginner` או `intermediate` | מומלץ לבחור `beginner` ל-seed data, אך משתמשים אמיתיים יעברו onboarding. |
| `תחרותי` | `pro` | מתאים לשחקן תחרותי. |
| `מקצוען` | `elite` | מתאים לשחקן ברמה גבוהה. |

אם אין ודאות, לא לבצע silent migration למשתמשים אמיתיים. יש לבקש בחירה מחדש ב-onboarding.

### 7.3 Platform Migration

| Prototype Value | Target `Platform` |
|---|---|
| `PC` | `pc` |
| `PS5` | `playstation_5` |
| `PS4` | `playstation_4` |
| `Xbox Series X` | `xbox_series_x` |
| `Xbox One` | `xbox_one` |
| `Switch` | `nintendo_switch` |
| `Mobile` | `mobile` |
| unknown | `other` או require user correction |

### 7.4 Games Migration

Prototype inline:

```ts
games: [
  { name: "Valorant", rank: "Diamond", lookingFor: "Duo" }
]
```

Target:

```text
users/{uid}/games/{gameId}
```

Mapping:

| Prototype | Target |
|---|---|
| `game.name` | `gameCatalog/{gameId}.name` |
| generated slug | `gameId` |
| `game.rank` | `rank` |
| `game.lookingFor` | `lookingFor` enum או `lookingForText` |
| icon | `iconUrl` from catalog |

### 7.5 Looking For Migration

| Prototype Text | Target |
|---|---|
| `Duo` / `Duo partner` | `duo` |
| `Squad` / `Full squad` | `squad` |
| `Ranked` / `Ranked climb` | `ranked_climb` |
| `Casual` | `casual` |
| `Voice chat` | `voice_chat` |
| `No voice` | `no_voice_chat` |
| custom/unknown | `custom` + `lookingForText` |

### 7.6 Shop Item Migration

| Prototype Field | Target Field | Migration Rule |
|---|---|---|
| `id` | `itemId` | stable slug. |
| `name` | `name` | direct. |
| `itemType: "avatar-border"` | `category: "avatar_border"` | replace. |
| `itemType: "background"` | `category: "global_background"` או `profile_banner` | להחליט לפי usage. |
| `rarity: "COMMON"` | `rarity: "common"` | lowercase. |
| `rarity: "RARE"` | `rarity: "rare"` | lowercase. |
| `rarity: "EPIC"` | `rarity: "epic"` | lowercase. |
| `rarity: "LEGENDARY"` | `rarity: "legendary"` | lowercase. |
| `category: "Cyber"` | `themeTag: "Cyber"` | theme בלבד. |
| `price` | `priceCoins` | rename/normalize. |
| preview image | `previewUrl` | required. |
| asset | `assetUrl` | required. |
| animated flag | `isAnimated` | default false אם חסר. |
| pro lock | `requiresPro` | default false אם חסר. |
| active | `isActive` | default true. |

### 7.7 Avatar Border Migration

Prototype:

```ts
avatarBorder: "linear-gradient(...)"
```

Target:

```ts
avatarBorderItemId: "neon_indigo_border"
```

Shop item:

```ts
{
  itemId: "neon_indigo_border",
  category: "avatar_border",
  rarity: "rare",
  style: {
    cssGradient: "linear-gradient(...)"
  }
}
```

### 7.8 Coins Migration

| Prototype | Target |
|---|---|
| `useState(1000000)` | remove |
| static huge balance | `signup_bonus` from `system/config` |
| client increment/decrement | Cloud Function transaction |
| no audit | `users/{uid}/transactions/{transactionId}` |

### 7.9 Message Migration

| Prototype | Target |
|---|---|
| numeric sender id | `senderId: string` |
| local messages array | `chats/{chatId}/messages/{messageId}` |
| no status | `status: "sent"` |
| no timestamps | server `createdAt` |
| media direct URL | backend-approved `fileUrl`, `filePath` |

---

## 8. Dead Code Removal

### 8.1 Components למחיקה

למחוק אם אינם בשימוש לאחר בדיקה:

- `components/FeatureTable.tsx`
- `components/GeminiFeatureIdeation.tsx`
- `components/Roadmap.tsx`
- `components/Section.tsx`
- `components/PersonaCard.tsx`

אם שמות הקבצים שונים אך components קיימים באותו קובץ, להסיר את ה-exports וה-imports.

### 8.2 Types למחיקה

להסיר מ-`types.ts` או להעביר ל-archive אם אינם בשימוש:

- `Persona`
- `Feature`
- `RoadmapItem`
- `GeneratedIdea`

### 8.3 Services למחיקה/החלפה

- `services/geminiService.ts`
  - Phase 0: להפוך ל-safe stub.
  - Phase 7: להחליף ב-client wrapper שקורא ל-Cloud Function.
- כל service שקורא ל-AI ישירות מה-client.

### 8.4 Constants לניקוי

`constants.ts` צריך לעבור פירוק:

| Current Use | Target |
|---|---|
| mock profiles | `src/features/discovery/mocks` זמני |
| shop items | Firestore seed script |
| current user | Auth user + Firestore |
| matched profiles | Firestore matches |
| likes you | Firestore/Cloud Function |
| backgrounds | `shopItems` |

בסוף המיגרציה:

- אין `constants.ts` כמקור data production.
- mock data נשאר רק תחת `src/mocks` או test fixtures.

---

## 9. Risk Register

| סיכון | חומרה | Mitigation |
|---|---|---|
| Gemini API key חשוף ב-client | Critical | Phase 0: להסיר key, להסיר SDK מה-client, להעביר ל-Secret Manager בהמשך. |
| שבירת UI במעבר ל-React Router | High | לבצע route migration בשלבים; לשמור redirects; לכסות navigation smoke tests. |
| אובדן state במעבר מ-local ל-Firestore | High | repository abstraction; feature flags; לא למחוק mock עד Firestore flow עובד. |
| `id: number` נשאר בקוד וגורם bugs | High | להגדיר domain types חדשים; typecheck strict; grep ל-`.id` patterns. |
| שמירת enum עברי ב-Firestore | High | Zod schemas; TypeScript enums; label maps בלבד ל-UI. |
| Coins נשארים client-side | Critical | להסיר local coins; purchase/equip/grants רק Cloud Functions. |
| Duplicate matches | High | deterministic match ID + Firestore transaction. |
| Basic user מצליח לשלוח media | High | client gating + Firestore rules + backend validation. |
| Firestore rules לא מכסות edge cases | Critical | Emulator rules tests חובה לפני beta. |
| מעבר shop taxonomy שובר UI | Medium | adapter זמני מה-prototype ל-target; seed catalog מסודר. |
| avatarBorder CSS raw נשאר בפרופיל | Medium | migration lint/check; רק `avatarBorderItemId`. |
| Cold-start deck ריק | High | seed users; open Likes You in MVP; game waitlists; empty deck UX. |
| Payment webhook לא מסנכרן Pro | Critical | webhook signature validation; logs; retry; reconciliation job בהמשך. |
| AI guardrails חלשים | High | server-side safety pre-check; refusal messages; logging. |
| Storage abuse | High | size/type rules; Pro gating; alerts. |
| RTL נשבר במבנה חדש | Medium | RTL QA בכל phase; visual review במובייל. |
| Dead code נשאר ומבלבל צוות | Low/Medium | Phase 0 cleanup; lint no-unused; remove old types. |
| Big-bang refactor מתארך | High | Strangler pattern; small PRs; exit criteria לכל phase. |
| Feature flags נשארים לנצח | Medium | להגדיר cleanup task אחרי כל feature migration. |
| Mock data דולף ל-production | High | environment guard; CI check; no production build with mock data source. |

---

## 10. Definition of Done למיגרציה כולה

המיגרציה נחשבת הושלמה כאשר כל התנאים הבאים מתקיימים:

### Security

- [ ] אין secrets ב-client.
- [ ] אין Gemini SDK ישיר ב-frontend.
- [ ] Gemini API key נמצא רק ב-Secret Manager.
- [ ] Firestore Security Rules מכסות את כל collections הרגישים.
- [ ] Storage Rules מגבילות type/size/ownership.
- [ ] Emulator security tests עוברים.
- [ ] client לא יכול לשנות `coins`, `isPro`, `subscriptionStatus`, `matches`, `swipes`, `ownedItems`, `transactions`, `aiRequests`.

### Firebase Foundation

- [ ] Firebase Auth עובד עם Google OAuth.
- [ ] Firebase Auth עובד עם email/password.
- [ ] `users/{uid}` נוצר.
- [ ] `users/{uid}/private/account` נוצר.
- [ ] `publicProfiles/{uid}` נוצר ומסונכרן.
- [ ] `gameCatalog/{gameId}` קיים.
- [ ] `users/{uid}/games/{gameId}` עובד.

### Frontend Architecture

- [ ] Tailwind CDN הוסר.
- [ ] Tailwind build dependency עובד.
- [ ] design tokens קנוניים מיושמים.
- [ ] אין שימוש ב-`dogame` namespace.
- [ ] React Router מחליף `activeView`.
- [ ] Zustand משמש רק local UI state.
- [ ] Zod + React Hook Form משמשים לטפסים.
- [ ] מבנה `src/features/**` קיים.
- [ ] TypeScript strict/typecheck עובר.

### Data Migration

- [ ] אין `GamerProfile.id: number` ב-domain production.
- [ ] `uid: string` משמש לכל user references.
- [ ] `skillLevel` נשמר רק כ-`beginner | intermediate | pro | elite`.
- [ ] Hebrew labels קיימים רק ב-UI label maps.
- [ ] `platforms` נשמר כ-`Platform[]`.
- [ ] games עברו ל-`users/{uid}/games/{gameId}`.
- [ ] shop taxonomy תואמת `DATA_MODEL.md`.
- [ ] `avatarBorderItemId` מחליף raw CSS on user.

### Discovery & Matching

- [ ] discovery deck מגיע מ-Firestore.
- [ ] game filter עובד.
- [ ] `submitSwipe` פעיל.
- [ ] double opt-in עובד.
- [ ] deterministic match ID מונע כפילויות.
- [ ] `matches/{matchId}` נוצר backend-only.
- [ ] `chats/{chatId}` נוצר עם match.
- [ ] Basic swipe limit נאכף server-side.

### Chat

- [ ] chat list אמיתי.
- [ ] messages real-time.
- [ ] last-message preview עובד.
- [ ] text chat פתוח לכל matched users.
- [ ] media chat Pro-only.
- [ ] unauthorized chat read חסום.
- [ ] block מונע chat.

### Economy

- [ ] אין `useState(1000000)` או local coin mutation.
- [ ] `coins` server-owned.
- [ ] `signup_bonus` עובד דרך backend.
- [ ] `admin_grant` נתמך.
- [ ] כל coin mutation יוצר transaction audit.
- [ ] `purchaseShopItem` עובד.
- [ ] `equipItem` עובד.
- [ ] owned cosmetics משפיעים על profile/discovery UI.

### Subscription

- [ ] payment provider נבחר.
- [ ] checkout עובד.
- [ ] webhook מאומת.
- [ ] `subscriptions/{uid}` מתעדכן.
- [ ] Pro flags מסונכרנים ל-`users` ול-`publicProfiles`.
- [ ] Basic/Pro gating נאכף backend-side.
- [ ] downgrade/expiration מטופלים.

### AI

- [ ] `sendAIProfileReview` עובד דרך Cloud Function.
- [ ] `sendAISquadAdvice` עובד דרך Cloud Function.
- [ ] guardrails קיימים.
- [ ] unsafe requests נחסמות.
- [ ] `aiRequests` audit נכתב.
- [ ] rate limits קיימים.

### Safety

- [ ] `blockUser` עובד.
- [ ] `createReport` עובד.
- [ ] blocked users לא מופיעים ב-discovery.
- [ ] blocked users לא יכולים לשלוח chat.
- [ ] reports נשמרים עם reason/source/context.
- [ ] moderation data לא חשוף למשתמשים רגילים.

### Quality & Operations

- [ ] Unit tests עוברים.
- [ ] Integration tests עוברים.
- [ ] Security rules tests עוברים.
- [ ] E2E critical flows עוברים.
- [ ] Sentry או כלי error tracking פעיל.
- [ ] Cloud Function logs קיימים.
- [ ] alerts קריטיים מוגדרים.
- [ ] production build לא משתמש ב-mock data.
- [ ] dead code הוסר.
- [ ] private beta checklist מוכן.
