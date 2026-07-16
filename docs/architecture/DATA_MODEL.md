# Swish & Game — Data Model

## 1. Document Metadata

| שדה | ערך |
|---|---|
| Version | 1.0 |
| Status | Target Production Data Model |
| Source of Truth | `docs/architecture/DATA_MODEL.md` |
| Product | Swish & Game |
| Stack | Firebase Authentication + Cloud Firestore + Firebase Storage + Cloud Functions |
| Scope | מקור האמת היחיד לכל סכמת הנתונים, collections, fields, enums, deterministic IDs, denormalization, ownership rules |

> מסמך זה הוא ה-single source of truth עבור סכמת הנתונים של Swish & Game.  
> מסמך `ARCHITECTURE.md` מפנה למסמך זה עבור schema מלאה שדה-אחר-שדה.

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. עקרונות הסכמה ומוסכמות](#2-עקרונות-הסכמה-ומוסכמות)
- [3. Enum Registry](#3-enum-registry)
- [4. פירוט ה-Collections](#4-פירוט-ה-collections)
  - [4.1 `users/{uid}`](#41-usersuid)
  - [4.2 `users/{uid}/private/account`](#42-usersuidprivateaccount)
  - [4.3 `publicProfiles/{uid}`](#43-publicprofilesuid)
  - [4.4 `users/{uid}/games/{gameId}`](#44-usersuidgamesgameid)
  - [4.5 `users/{uid}/swipes/{targetUid_gameId}`](#45-usersuidswipestargetuid_gameid)
  - [4.6 `matches/{matchId}`](#46-matchesmatchid)
  - [4.7 `chats/{chatId}`](#47-chatschatid)
  - [4.8 `chats/{chatId}/messages/{messageId}`](#48-chatschatidmessagesmessageid)
  - [4.9 `shopItems/{itemId}`](#49-shopitemsitemid)
  - [4.10 `users/{uid}.ownedItemIds`](#410-usersuidowneditemids)
  - [4.11 `users/{uid}/ownedItems/{itemId}`](#411-usersuidowneditemsitemid)
  - [4.12 `users/{uid}/transactions/{transactionId}`](#412-usersuidtransactionstransactionid)
  - [4.13 `subscriptions/{uid}`](#413-subscriptionsuid)
  - [4.14 `billingEvents/{eventId}`](#414-billingeventseventid)
  - [4.15 `aiRequests/{requestId}`](#415-airequestsrequestid)
  - [4.16 `users/{uid}/blocks/{blockedUid}`](#416-usersuidblocksblockeduid)
  - [4.17 `reports/{reportId}`](#417-reportsreportid)
  - [4.18 `moderationActions/{actionId}`](#418-moderationactionsactionid)
  - [4.19 `gameCatalog/{gameId}`](#419-gamecataloggameid)
  - [4.20 `discoveryProfiles/{gameId}/players/{uid}`](#420-discoveryprofilesgameidplayersuid)
  - [4.21 `users/{uid}/usage/{yyyy-mm-dd}`](#421-usersuidusageyyyy-mm-dd)
  - [4.22 `system/config`](#422-systemconfig)
  - [4.23 `chats/{chatId}/calls/{callId}`](#423-chatschatidcallscallid)
- [5. Deterministic ID Reference](#5-deterministic-id-reference)
- [6. מטריצת שדות בבעלות שרת מול client-writable](#6-מטריצת-שדות-בבעלות-שרת-מול-client-writable)
- [7. מפת Denormalization & Sync](#7-מפת-denormalization--sync)
- [8. כללי ולידציה ואילוצים](#8-כללי-ולידציה-ואילוצים)
- [9. החלטות פתוחות](#9-החלטות-פתוחות)

---

## 2. עקרונות הסכמה ומוסכמות

### 2.1 Naming Conventions

- שמות collections, documents, fields, types, ו-enum values יהיו באנגלית בלבד.
- UI labels יכולים להיות בעברית, אך לא יישמרו כערכי enum במסד הנתונים.
- שמות fields יהיו `camelCase`.
- שמות TypeScript types יהיו `PascalCase`.
- שמות enum aliases יהיו `PascalCase`.
- IDs יהיו stable, deterministic כאשר יש משמעות ל-idempotency.
- ערכי `gameId`, `itemId`, ו-slugs צריכים להיות lowercase URL-safe strings.

### 2.2 Timestamp Conventions

כל timestamps נשמרים כ-`FirebaseFirestore.Timestamp`.

מוסכמות:

- `createdAt` — נוצר על ידי השרת בלבד.
- `updatedAt` — מתעדכן על ידי השרת בכל שינוי משמעותי.
- `deletedAt` — soft delete בלבד, כאשר רלוונטי.
- `lastActiveAt` — מתעדכן באופן מבוקר, לא בכל render/client heartbeat.
- `lastTimestamp` — משקף את הודעת הצ׳אט האחרונה.
- `completedAt`, `reviewedAt`, `cancelledAt`, `currentPeriodEnd` — timestamps ייעודיים לפי domain.

### 2.3 English Enums

כל enum values נשמרים באנגלית בלבד. לדוגמה:

```ts
skillLevel: "beginner" | "intermediate" | "pro" | "elite";
```

עברית תופיע רק בשכבת התצוגה:

```ts
const skillLevelLabelsHe = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  pro: "מקצוען",
  elite: "עילית"
};
```

### 2.4 Deterministic IDs

משתמשים ב-deterministic IDs כאשר יש צורך למנוע כפילויות:

- Swipe: `{targetUid}_{gameId}`
- Match: `{minUid}_{maxUid}_{gameId}`
- Chat: זהה ל-`matchId`
- Block: `{blockedUid}`
- Subscription: `{uid}`
- Discovery profile: `{uid}` תחת `{gameId}`

> אין להסתמך על parsing של ה-ID כמקור אמת יחיד.  
> תמיד יש לשמור את אותם ערכים גם כשדות מפורשים במסמך.

### 2.5 Server Ownership

הכלל הקנוני:

> The client may request actions, but the server owns all trust-sensitive decisions.

ה-client לעולם לא כותב ישירות:

- `coins`
- `subscriptionTier`
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `isPro`
- `verifiedBadge`
- `isSuspended`
- `matches`
- `swipes`
- `transactions`
- `ownedItems`
- `aiRequests`
- `subscriptions`

### 2.6 MVP vs Scale/V1

כל collection ושדה מסומן כ:

- **MVP** — נדרש ל-private beta / MVP production baseline.
- **Scale/V1** — מיועד לסקייל, audit מתקדם, ביצועים, או הרחבת מוצר.

---

## 3. Enum Registry

זהו מקור האמת היחיד לכל ה-enums במסמך.

```ts
export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "pro"
  | "elite";

export type Platform =
  | "pc"
  | "playstation_5"
  | "playstation_4"
  | "xbox_series_x"
  | "xbox_one"
  | "nintendo_switch"
  | "mobile"
  | "vr"
  | "arcade"
  | "other";

export type SubscriptionTier =
  | "basic"
  | "pro";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type MatchStatus =
  | "pending"
  | "matched"
  | "blocked"
  | "archived";

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "system";

export type MessageStatus =
  | "sent"
  | "failed"
  | "deleted";

export type ShopItemCategory =
  | "avatar_border"
  | "profile_banner"
  | "global_background";

export type ShopItemRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

export type CosmeticRenderType =
  | "static_image"
  | "lottie"
  | "rive"
  | "particle"
  | "video"
  | "sprite";

export type LookingFor =
  | "duo"
  | "squad"
  | "ranked_climb"
  | "casual"
  | "voice_chat"
  | "no_voice_chat"
  | "custom";

export type VoicePreference =
  | "required"
  | "preferred"
  | "no_voice"
  | "flexible";

export type CoinTransactionType =
  | "item_purchase"
  | "admin_grant"
  | "signup_bonus"
  | "refund"
  | "system_adjustment";

export type OwnedItemAcquisitionType =
  | "coin_purchase"
  | "grant"
  | "subscription"
  | "admin";

export type ReportReason =
  | "harassment"
  | "hate_speech"
  | "sexual_content"
  | "scam_spam"
  | "underage_concern"
  | "cheating_exploits"
  | "fake_profile"
  | "other";

export type ReportStatus =
  | "open"
  | "reviewing"
  | "resolved"
  | "dismissed";

export type AIRequestType =
  | "profile_optimization"
  | "squad_advice"
  | "match_insight";

export type AIRequestStatus =
  | "pending"
  | "completed"
  | "failed"
  | "blocked";

export type ModerationState =
  | "clean"
  | "warned"
  | "restricted"
  | "suspended"
  | "banned";

export type BillingProvider =
  | "revenuecat"
  | "stripe"
  | "cardcom"
  | "meshulam"
  | "other";

export type BillingEventStatus =
  | "received"
  | "processed"
  | "failed"
  | "ignored";

export type SystemEnvironment =
  | "development"
  | "staging"
  | "production";
```

---

## 4. פירוט ה-Collections

---

### 4.1 `users/{uid}`

**Scope:** MVP  
**מטרה:** מסמך המשתמש הראשי. מכיל state פרטי/בבעלות המשתמש לצד שדות רגישים בבעלות שרת. אינו מיועד לקריאה ציבורית לצורך discovery.  
**Path:** `users/{uid}`  
**Deterministic ID:** `{uid}` מתוך Firebase Authentication.

```ts
export type UserDocument = {
  uid: string;

  displayName: string;
  email: string;

  age: number;
  bio: string;
  preferredLocale?: "he" | "en";
  skillLevel: SkillLevel;
  platforms: Platform[];

  onboardingCompleted: boolean;
  isDiscoverable: boolean;

  profileImageUrl?: string;
  bannerImageUrl?: string;
  galleryMedia?: GalleryMediaItem[];

  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  coins: number;

  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: FirebaseFirestore.Timestamp;
  isPro: boolean;

  ownedItemIds?: string[];

  isSuspended: boolean;
  isDeleted: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `uid` | `string` | כן | Server-owned | MVP | Firebase Auth UID. זהה ל-document ID. |
| `displayName` | `string` | כן | Client-writable | MVP | שם תצוגה ציבורי. מסונכרן ל-`publicProfiles`. |
| `email` | `string` | כן | Server-owned | MVP | אימייל מה-auth provider. לא ציבורי. |
| `age` | `number` | כן | Client-writable | MVP | גיל המשתמש לפי policy. מסונכרן ל-public profile אם policy מאפשר. |
| `bio` | `string` | כן | Client-writable | MVP | תיאור פרופיל. עובר validation/content checks. |
| `preferredLocale` | `"he" \| "en"` | אופציונלי | Client-writable | MVP | שפת ממשק מועדפת (RTL/LTR). ברירת מחדל `he` (ADR-035). |
| `skillLevel` | `SkillLevel` | כן | Client-writable | MVP | אחד מ-`beginner | intermediate | pro | elite`. |
| `platforms` | `Platform[]` | כן | Client-writable | MVP | רשימת פלטפורמות מבוקרת, לדוגמה `pc`, `playstation_5`, `nintendo_switch`. |
| `onboardingCompleted` | `boolean` | כן | Server-owned | MVP | נקבע לאחר השלמת כל דרישות onboarding. |
| `isDiscoverable` | `boolean` | כן | Client-writable | MVP | האם המשתמש יכול להופיע ב-discovery. כפוף ל-safety/server overrides. |
| `profileImageUrl` | `string` | אופציונלי | Client-writable | MVP | URL מאושר מ-Firebase Storage או default avatar. |
| `bannerImageUrl` | `string` | אופציונלי | Client-writable | MVP | URL מאושר לבאנר פרופיל. |
| `galleryMedia` | `GalleryMediaItem[]` | אופציונלי | Client-writable | MVP | ADR-042 — גלריית מדיה לפרופיל. Basic: עד 3 תמונות; Pro: עד 9 פריטים כולל וידאו. כל פריט: `{ id: string; type: "image" | "video"; url: string; filePath: string }`. קבצים ב-`profileMedia/{uid}` (וידאו Pro-only ב-Storage Rules). |
| `avatarBorderItemId` | `string` | אופציונלי | Server-owned | MVP | reference ל-`shopItems/{itemId}` מסוג `avatar_border`. לא CSS גולמי. |
| `globalBackgroundItemId` | `string` | אופציונלי | Server-owned | MVP | reference ל-`shopItems/{itemId}` מסוג `global_background`. |
| `coins` | `number` | כן | Server-owned | MVP | יתרת coins. כל שינוי מחייב transaction audit. |
| `subscriptionTier` | `SubscriptionTier` | כן | Server-owned | MVP | `basic` או `pro`. מתעדכן רק מ-webhook/backend. |
| `subscriptionStatus` | `SubscriptionStatus` | כן | Server-owned | MVP | סטטוס subscription. |
| `subscriptionExpiresAt` | `Timestamp` | אופציונלי | Server-owned | MVP | סוף תקופת חיוב/entitlement. |
| `isPro` | `boolean` | כן | Server-owned | MVP | flag מהיר לגייטים. נגזר מ-subscription. |
| `ownedItemIds` | `string[]` | אופציונלי | Server-owned | MVP | MVP convenience array לפריטי cosmetics בבעלות. מקור אמת זמני עד Scale/V1. |
| `isSuspended` | `boolean` | כן | Server-owned | MVP | חסימה/השעיה מערכתית. |
| `isDeleted` | `boolean` | כן | Server-owned | MVP | soft delete. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירת המשתמש. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון אחרון. |
| `lastActiveAt` | `Timestamp` | כן | Server-owned | MVP | פעילות אחרונה. מתעדכן server-side בפעולות אמיתיות — `submitSwipe` ו-`onMessageCreated` (שולח) — עם throttle של 30 דקות. |

---

### 4.2 `users/{uid}/private/account`

**Scope:** MVP  
**מטרה:** נתוני חשבון רגישים שאינם מיועדים ל-discovery או לפרופיל ציבורי.  
**Path:** `users/{uid}/private/account`  
**Deterministic ID:** `account`

```ts
export type PrivateAccountDocument = {
  email: string;
  authProvider: "google" | "password";

  paymentCustomerId?: string;

  birthDate?: string;
  country?: string;
  locale?: string;

  moderationState: ModerationState;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `email` | `string` | כן | Server-owned | MVP | אימייל מה-auth provider. |
| `authProvider` | `"google" \| "password"` | כן | Server-owned | MVP | provider ראשי ל-signup/login. |
| `paymentCustomerId` | `string` | אופציונלי | Server-owned | MVP | מזהה לקוח אצל payment provider. |
| `birthDate` | `string` | אופציונלי | Client-writable | MVP | תאריך לידה בפורמט ISO `YYYY-MM-DD` (נאסף ב-onboarding; הציבורי הוא רק הגיל הנגזר). |
| `country` | `string` | אופציונלי | Client-writable | MVP | מדינה לפי ISO או product locale. |
| `locale` | `string` | אופציונלי | Client-writable | MVP | לדוגמה `he-IL`. |
| `moderationState` | `ModerationState` | כן | Server-owned | MVP | מצב moderation פנימי. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירה. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון. |

---

### 4.3 `publicProfiles/{uid}`

**Scope:** MVP  
**מטרה:** read model ציבורי ובטוח ל-discovery. לא מכיל email, payment, moderation internals, או מידע פרטי.  
**Path:** `publicProfiles/{uid}`  
**Deterministic ID:** `{uid}`

```ts
export type PublicProfileDocument = {
  uid: string;

  displayName: string;
  age: number;
  bio: string;
  skillLevel: SkillLevel;
  platforms: Platform[];

  profileImageUrl?: string;
  bannerImageUrl?: string;
  galleryMedia?: GalleryMediaItem[];

  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  isPro: boolean;
  verifiedBadge: boolean;

  gameIds: string[];
  primaryGameId?: string;
  primaryRank?: string;

  isDiscoverable: boolean;
  isSuspended: boolean;
  isDeleted: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `uid` | `string` | כן | Server-owned | MVP | מזהה המשתמש. |
| `displayName` | `string` | כן | Server-owned | MVP | משוכפל מ-`users/{uid}`. |
| `age` | `number` | כן | Server-owned | MVP | משוכפל בהתאם למדיניות visibility. |
| `bio` | `string` | כן | Server-owned | MVP | משוכפל מפרופיל המשתמש. |
| `skillLevel` | `SkillLevel` | כן | Server-owned | MVP | משוכפל מ-`users/{uid}`. |
| `platforms` | `Platform[]` | כן | Server-owned | MVP | משוכפל מ-`users/{uid}.platforms`. |
| `profileImageUrl` | `string` | אופציונלי | Server-owned | MVP | משוכפל מ-`users/{uid}`. |
| `bannerImageUrl` | `string` | אופציונלי | Server-owned | MVP | משוכפל מ-`users/{uid}`. |
| `galleryMedia` | `GalleryMediaItem[]` | אופציונלי | Server-owned | MVP | משוכפל (sanitized) מ-`users/{uid}.galleryMedia` — ADR-042. |
| `avatarBorderItemId` | `string` | אופציונלי | Server-owned | MVP | reference ל-shop item. |
| `globalBackgroundItemId` | `string` | אופציונלי | Server-owned | MVP | reference ל-shop item. |
| `isPro` | `boolean` | כן | Server-owned | MVP | משוכפל מ-subscription entitlement. |
| `verifiedBadge` | `boolean` | כן | Server-owned | MVP | badge לתצוגה. ב-MVP נגזר מ-Pro. |
| `gameIds` | `string[]` | כן | Server-owned | MVP | רשימת games פעילים עבור discovery query. |
| `primaryGameId` | `string` | אופציונלי | Server-owned | MVP | משחק ראשי לתצוגת quick card. |
| `primaryRank` | `string` | אופציונלי | Server-owned | MVP | rank ראשי לתצוגה מהירה. |
| `isDiscoverable` | `boolean` | כן | Server-owned | MVP | נגזר מהגדרת המשתמש ו-safety state. |
| `isSuspended` | `boolean` | כן | Server-owned | MVP | משוכפל לצורך exclusion מהיר. |
| `isDeleted` | `boolean` | כן | Server-owned | MVP | soft delete visibility. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירת public profile. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון. |
| `lastActiveAt` | `Timestamp` | כן | Server-owned | MVP | משמש לדירוג MVP. |

---

### 4.4 `users/{uid}/games/{gameId}`

**Scope:** MVP  
**מטרה:** פרטי המשחקים של המשתמש: rank, intent, voice preference וסטטוס פעילות.  
**Path:** `users/{uid}/games/{gameId}`  
**Deterministic ID:** `{gameId}` מתוך `gameCatalog/{gameId}`.

```ts
export type UserGameDocument = {
  gameId: string;

  name: string;
  iconUrl?: string;

  rank: string;
  rankNormalized?: string;
  rankScore?: number;

  lookingFor: LookingFor;
  lookingForText?: string;

  preferredMode?: string;
  voicePreference?: VoicePreference;

  isActive: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `gameId` | `string` | כן | Server-owned | MVP | מזהה מה-game catalog. |
| `name` | `string` | כן | Server-owned | MVP | שם משחק משוכפל מ-`gameCatalog`. |
| `iconUrl` | `string` | אופציונלי | Server-owned | MVP | icon משוכפל מ-catalog. |
| `rank` | `string` | כן | Client-writable | MVP | rank כפי שהמשתמש מזין/בוחר. |
| `rankNormalized` | `string` | אופציונלי | Server-owned | Scale/V1 | rank מנורמל לפי רשימות rank. |
| `rankScore` | `number` | אופציונלי | Server-owned | Scale/V1 | score לדירוג/סינון לפי rank proximity. |
| `lookingFor` | `LookingFor` | כן | Client-writable | MVP | intent מובנה. |
| `lookingForText` | `string` | אופציונלי | Client-writable | MVP | טקסט מותאם כאשר `lookingFor = custom` או להרחבה. |
| `preferredMode` | `string` | אופציונלי | Client-writable | Scale/V1 | מצב משחק מועדף. |
| `voicePreference` | `VoicePreference` | אופציונלי | Client-writable | MVP | העדפת voice chat. |
| `isActive` | `boolean` | כן | Client-writable | MVP | האם המשחק פעיל ב-profile/discovery. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן הוספה. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון. |

---

### 4.5 `users/{uid}/swipes/{targetUid_gameId}`

**Scope:** MVP  
**מטרה:** היסטוריית swipe של משתמש כלפי target במסגרת משחק. נכתבת רק דרך `submitSwipe`.  
**Path:** `users/{uid}/swipes/{targetUid_gameId}`  
**Deterministic ID:** `{targetUid}_{gameId}`

```ts
export type SwipeDirection = "like" | "skip";

export type SwipeDocument = {
  fromUid: string;
  toUid: string;
  gameId: string;

  direction: SwipeDirection;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `fromUid` | `string` | כן | Server-owned | MVP | המשתמש שביצע swipe. חייב להיות `{uid}` מה-path. |
| `toUid` | `string` | כן | Server-owned | MVP | המשתמש שעליו בוצע swipe. |
| `gameId` | `string` | כן | Server-owned | MVP | context של המשחק. |
| `direction` | `"like" \| "skip"` | כן | Server-owned | MVP | תוצאת swipe. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן פעולה ראשונה. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון אם פעולה מוחלפת/מתועדת מחדש לפי policy. |

---

### 4.6 `matches/{matchId}`

**Scope:** MVP  
**מטרה:** קשר mutual בין שני משתמשים לאחר double opt-in. נוצר רק על ידי backend.  
**Path:** `matches/{matchId}`  
**Deterministic ID:** `{minUid}_{maxUid}_{gameId}`

```ts
export type MatchDocument = {
  matchId: string;

  users: [string, string];
  userA: string;
  userB: string;

  gameId: string;
  gameName: string;

  status: MatchStatus;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastInteractionAt?: FirebaseFirestore.Timestamp;

  createdBySwipeIds?: string[];
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `matchId` | `string` | כן | Server-owned | MVP | זהה ל-document ID. |
| `users` | `[string, string]` | כן | Server-owned | MVP | שני המשתמשים במאץ׳. |
| `userA` | `string` | כן | Server-owned | MVP | uid הקטן/ראשון לפי deterministic ordering. |
| `userB` | `string` | כן | Server-owned | MVP | uid השני. |
| `gameId` | `string` | כן | Server-owned | MVP | המשחק שבו נוצר ה-match. |
| `gameName` | `string` | כן | Server-owned | MVP | שם המשחק בזמן יצירת ה-match. |
| `status` | `MatchStatus` | כן | Server-owned | MVP | `pending`, `matched`, `blocked`, `archived`. בפועל document נוצר בעיקר כ-`matched`; `pending` עשוי להיות מיוצג דרך swipes. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירת match. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון. |
| `lastInteractionAt` | `Timestamp` | אופציונלי | Server-owned | MVP | פעילות אחרונה ב-match/chat. |
| `createdBySwipeIds` | `string[]` | אופציונלי | Server-owned | MVP | IDs של swipes שיצרו את ה-match לצורכי audit/debug. |

---

### 4.7 `chats/{chatId}`

**Scope:** MVP  
**מטרה:** metadata של צ׳אט בין שני משתמשים matched.  
**Path:** `chats/{chatId}`  
**Deterministic ID:** זהה ל-`matchId`.

```ts
export type ChatDocument = {
  chatId: string;
  matchId: string;

  participants: [string, string];
  userA: string;
  userB: string;

  gameId: string;
  gameName: string;

  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageSenderId?: string;
  lastTimestamp?: FirebaseFirestore.Timestamp;

  unreadCounts?: Record<string, number>;
  lastReadAt?: Record<string, FirebaseFirestore.Timestamp>;
  typing?: Record<string, FirebaseFirestore.Timestamp>;

  isActive: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `chatId` | `string` | כן | Server-owned | MVP | זהה ל-document ID ול-`matchId`. |
| `matchId` | `string` | כן | Server-owned | MVP | reference ל-`matches/{matchId}`. |
| `participants` | `[string, string]` | כן | Server-owned | MVP | שני המשתתפים. |
| `userA` | `string` | כן | Server-owned | MVP | uid ראשון לפי match ordering. |
| `userB` | `string` | כן | Server-owned | MVP | uid שני. |
| `gameId` | `string` | כן | Server-owned | MVP | context של ה-match. |
| `gameName` | `string` | כן | Server-owned | MVP | שם המשחק להצגה. |
| `lastMessage` | `string` | אופציונלי | Server-owned | MVP | preview של הודעה אחרונה. |
| `lastMessageType` | `MessageType` | אופציונלי | Server-owned | MVP | סוג הודעה אחרונה. |
| `lastMessageSenderId` | `string` | אופציונלי | Server-owned | MVP | שולח הודעה אחרונה. |
| `lastTimestamp` | `Timestamp` | אופציונלי | Server-owned | MVP | timestamp של הודעה אחרונה. |
| `unreadCounts` | `Record<string, number>` | אופציונלי | Server-owned* | MVP | מונה unread לכל uid; increment ע"י `onMessageCreated`. *חריג: משתתף רשאי לאפס (ל-0) רק את המפתח של עצמו בעת פתיחת הצ'אט (נאכף ב-Rules). |
| `lastReadAt` | `Record<string, Timestamp>` | אופציונלי | Server-owned* | MVP | Read receipts — מתי כל משתתף קרא לאחרונה. *חריג: משתתף רשאי לעדכן רק את המפתח של עצמו ל-`request.time` (נאכף ב-Rules). הודעה נחשבת "נקראה" אם `createdAt <= lastReadAt[הצד השני]`. |
| `typing` | `Record<string, Timestamp>` | אופציונלי | Server-owned* | MVP | חיווי הקלדה. *חריג: משתתף כותב/מוחק רק את המפתח של עצמו, ערך = `request.time` (Rules). הצד השני מציג "מקליד…" אם החותמת טרייה מ-6 שניות. |
| `isActive` | `boolean` | כן | Server-owned | MVP | false לאחר block/archive/delete לפי policy. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירת chat. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | זמן עדכון. |

---

### 4.8 `chats/{chatId}/messages/{messageId}`

**Scope:** MVP  
**מטרה:** הודעות real-time בצ׳אט. Text חופשי לכולם; media רק Pro ובאישור backend.  
**Path:** `chats/{chatId}/messages/{messageId}`  
**Deterministic ID:** לא חובה. מומלץ auto ID או server-generated ID.

```ts
export type MessageDocument = {
  messageId: string;
  chatId: string;

  senderId: string;

  type: MessageType;

  text?: string;

  fileUrl?: string;
  filePath?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;

  status: MessageStatus;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  deletedAt?: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `messageId` | `string` | כן | Server-owned | MVP | זהה ל-document ID. |
| `chatId` | `string` | כן | Client-writable | MVP | חייב להתאים ל-path ולעבור rules. |
| `senderId` | `string` | כן | Client-writable | MVP | חייב להיות `request.auth.uid`; מאומת ב-rules/backend. |
| `type` | `MessageType` | כן | Client-writable | MVP | `text`, `image`, `video` (הודעת וידאו מוקלטת — Pro-only, ADR-041), או `system`. |
| `text` | `string` | אופציונלי | Client-writable | MVP | חובה כאשר `type = text`. |
| `fileUrl` | `string` | אופציונלי | Server-owned | MVP | URL למדיה מאושרת. |
| `filePath` | `string` | אופציונלי | Server-owned | MVP | Storage path למדיה. |
| `fileMimeType` | `string` | אופציונלי | Server-owned | MVP | MIME type מאומת. |
| `fileSizeBytes` | `number` | אופציונלי | Server-owned | MVP | גודל קובץ מאומת. |
| `status` | `MessageStatus` | כן | Server-owned | MVP | `sent`, `failed`, `deleted`. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן שליחה. |
| `updatedAt` | `Timestamp` | אופציונלי | Server-owned | MVP | זמן עדכון status. |
| `deletedAt` | `Timestamp` | אופציונלי | Server-owned | Scale/V1 | soft delete להודעה. |

---

### 4.8.1 `gameSuggestions/{suggestionId}` (ADR-043)

**Scope:** MVP  
**מטרה:** הצעות משתמשים למשחקים חסרים — inbox לאדמין. write-only למשתמשים.  
**Path:** `gameSuggestions/{suggestionId}` (auto ID)

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `uid` | `string` | כן | Client-writable | MVP | חייב להיות `request.auth.uid`. |
| `name` | `string` | כן | Client-writable | MVP | שם המשחק המוצע, 1–60 תווים. |
| `createdAt` | `Timestamp` | כן | Client-writable | MVP | חייב להיות `request.time`. |

---

### 4.9 `shopItems/{itemId}`

**Scope:** MVP  
**מטרה:** קטלוג cosmetics. מאחד את טקסונומיית החנות ליעד production.  
**Path:** `shopItems/{itemId}`  
**Deterministic ID:** `{itemId}` stable slug או generated ID.

```ts
export type ShopItemDocument = {
  itemId: string;

  name: string;
  description?: string;

  category: ShopItemCategory;
  rarity: ShopItemRarity;

  themeTag?: string;

  priceCoins: number;

  previewUrl: string;
  assetUrl: string;

  style?: {
    cssGradient?: string;
    className?: string;
    animationClass?: string;
  };

  isAnimated: boolean;
  renderType: CosmeticRenderType;
  renderConfig?: ShopItemRenderConfig; // Rive/Lottie/particle/video/sprite/sound — schema in docs/design/MOTION_AND_FX.md §8.
  requiresPro: boolean;
  isActive: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `itemId` | `string` | כן | Server-owned | MVP | מזהה הפריט. |
| `name` | `string` | כן | Admin/server | MVP | שם פריט להצגה. |
| `description` | `string` | אופציונלי | Admin/server | MVP | תיאור קצר. |
| `category` | `ShopItemCategory` | כן | Admin/server | MVP | `avatar_border`, `profile_banner`, `global_background`. |
| `rarity` | `ShopItemRarity` | כן | Admin/server | MVP | lowercase בלבד: `common`, `rare`, `epic`, `legendary`. |
| `themeTag` | `string` | אופציונלי | Admin/server | MVP | שימור taxonomy ישן כגון `Cyber`, `Nature`, `Space` כ-tag בלבד. |
| `priceCoins` | `number` | כן | Admin/server | MVP | מחיר ב-coins. |
| `previewUrl` | `string` | כן | Admin/server | MVP | URL לתצוגה מקדימה. |
| `assetUrl` | `string` | כן | Admin/server | MVP | URL/asset סופי לשימוש. |
| `style` | `object` | אופציונלי | Admin/server | MVP | עיצוב ייעודי, כולל CSS gradient לפריטים כמו avatar border. |
| `style.cssGradient` | `string` | אופציונלי | Admin/server | MVP | gradient נשמר כאן, לא על המשתמש. |
| `style.className` | `string` | אופציונלי | Admin/server | MVP | class פנימי מאושר. |
| `style.animationClass` | `string` | אופציונלי | Admin/server | MVP | animation class מאושר. |
| `isAnimated` | `boolean` | כן | Admin/server | MVP | האם הפריט דינמי/מונפש. |
| `renderType` | `CosmeticRenderType` | כן | Admin/server | MVP | מנגנון rendering: `static_image`/`lottie`/`rive`/`particle`/`video`/`sprite` (ADR-039). |
| `renderConfig` | `ShopItemRenderConfig` | אופציונלי | Admin/server | MVP | קונפיג asset/format מפורט (Rive/Lottie/particle/video/sprite/sound). סכמה מלאה ב-`docs/design/MOTION_AND_FX.md` §8. |
| `requiresPro` | `boolean` | כן | Admin/server | MVP | האם דורש Pro פעיל לרכישה/שימוש. |
| `isActive` | `boolean` | כן | Admin/server | MVP | האם זמין בחנות. |
| `createdAt` | `Timestamp` | כן | Admin/server | MVP | זמן יצירה. |
| `updatedAt` | `Timestamp` | כן | Admin/server | MVP | זמן עדכון. |

---

### 4.10 `users/{uid}.ownedItemIds`

**Scope:** MVP  
**מטרה:** שדה array זמני ונוח ל-MVP עבור בדיקת ownership מהירה.  
**Path:** field על `users/{uid}`  
**Deterministic ID:** לא רלוונטי.

```ts
export type OwnedItemIdsField = string[];
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `ownedItemIds` | `string[]` | אופציונלי | Server-owned | MVP | רשימת item IDs בבעלות המשתמש. נכתבת רק על ידי backend בעקבות grant/purchase. |

> ב-Scale/V1 מקור האמת עובר ל-`users/{uid}/ownedItems/{itemId}`.  
> אפשר להשאיר את `ownedItemIds` כ-cache denormalized.

---

### 4.11 `users/{uid}/ownedItems/{itemId}`

**Scope:** Scale/V1  
**מטרה:** מקור אמת מלא לבעלות על cosmetics, כולל acquisition metadata ו-equip state.  
**Path:** `users/{uid}/ownedItems/{itemId}`  
**Deterministic ID:** `{itemId}`

```ts
export type OwnedItemDocument = {
  itemId: string;

  category: ShopItemCategory;

  acquiredAt: FirebaseFirestore.Timestamp;
  acquisitionType: OwnedItemAcquisitionType;

  pricePaidCoins?: number;

  isEquipped: boolean;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `itemId` | `string` | כן | Server-owned | Scale/V1 | reference ל-`shopItems/{itemId}`. |
| `category` | `ShopItemCategory` | כן | Server-owned | Scale/V1 | קטגוריית הפריט בזמן acquisition. |
| `acquiredAt` | `Timestamp` | כן | Server-owned | Scale/V1 | זמן קבלת הפריט. |
| `acquisitionType` | `OwnedItemAcquisitionType` | כן | Server-owned | Scale/V1 | `coin_purchase`, `grant`, `subscription`, `admin`. |
| `pricePaidCoins` | `number` | אופציונלי | Server-owned | Scale/V1 | מחיר ששולם אם נרכש ב-coins. |
| `isEquipped` | `boolean` | כן | Server-owned | Scale/V1 | האם הפריט מצויד כרגע בקטגוריה שלו. |

---

### 4.12 `users/{uid}/transactions/{transactionId}`

**Scope:** MVP  
**מטרה:** audit trail לכל שינוי ב-coins. לפי ADR-005, כל שינוי ב-coins חייב ליצור transaction audit record כבר ב-MVP; לכן collection זה הוא MVP.  
**Path:** `users/{uid}/transactions/{transactionId}`  
**Deterministic ID:** generated ID או idempotency key לפי פעולה.

```ts
export type CoinTransactionDocument = {
  transactionId: string;

  uid: string;

  type: CoinTransactionType;

  itemId?: string;

  amountCoins: number;

  balanceBefore: number;
  balanceAfter: number;

  status: "completed" | "failed" | "reversed";

  createdAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `transactionId` | `string` | כן | Server-owned | MVP | מזהה audit transaction. |
| `uid` | `string` | כן | Server-owned | MVP | בעל ה-balance. |
| `type` | `CoinTransactionType` | כן | Server-owned | MVP | סוג פעולה. |
| `itemId` | `string` | אופציונלי | Server-owned | MVP | קיים כאשר transaction קשור לפריט. |
| `amountCoins` | `number` | כן | Server-owned | MVP | חיובי או שלילי בהתאם לפעולה. |
| `balanceBefore` | `number` | כן | Server-owned | MVP | balance לפני הפעולה. |
| `balanceAfter` | `number` | כן | Server-owned | MVP | balance אחרי הפעולה. חייב להיות `>= 0`. |
| `status` | `"completed" \| "failed" \| "reversed"` | כן | Server-owned | MVP | סטטוס audit. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירה. |

---

### 4.13 `subscriptions/{uid}`

**Scope:** MVP  
**מטרה:** מקור אמת ל-Pro entitlement אחרי אימות payment webhook.  
**Path:** `subscriptions/{uid}`  
**Deterministic ID:** `{uid}`

```ts
export type SubscriptionDocument = {
  uid: string;

  tier: SubscriptionTier;
  status: SubscriptionStatus;

  provider: BillingProvider;

  providerCustomerId?: string;
  providerSubscriptionId?: string;
  revenueCatAppUserId?: string;

  startedAt?: FirebaseFirestore.Timestamp;
  currentPeriodStart?: FirebaseFirestore.Timestamp;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;

  priceAmount: number;
  currency: "ILS";

  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `uid` | `string` | כן | Server-owned | MVP | בעל המנוי. |
| `tier` | `SubscriptionTier` | כן | Server-owned | MVP | `basic` או `pro`. |
| `status` | `SubscriptionStatus` | כן | Server-owned | MVP | lifecycle status. |
| `provider` | `BillingProvider` | כן | Server-owned | MVP | provider בסיסי מאחורי RevenueCat abstraction (ADR-037). בחירה סופית TBD (ADR-017). |
| `providerCustomerId` | `string` | אופציונלי | Server-owned | MVP | מזהה לקוח אצל provider. |
| `providerSubscriptionId` | `string` | אופציונלי | Server-owned | MVP | מזהה subscription אצל provider. |
| `revenueCatAppUserId` | `string` | אופציונלי | Server-owned | MVP | RevenueCat App User ID, ממופה ל-`uid` (ADR-037). |
| `startedAt` | `Timestamp` | אופציונלי | Server-owned | MVP | תחילת מנוי. |
| `currentPeriodStart` | `Timestamp` | אופציונלי | Server-owned | MVP | תחילת תקופה נוכחית. |
| `currentPeriodEnd` | `Timestamp` | אופציונלי | Server-owned | MVP | סוף תקופה נוכחית. |
| `cancelledAt` | `Timestamp` | אופציונלי | Server-owned | MVP | זמן ביטול. |
| `priceAmount` | `number` | כן | Server-owned | MVP | מחיר, לדוגמה `29.90`. |
| `currency` | `"ILS"` | כן | Server-owned | MVP | מטבע חיוב. |
| `updatedAt` | `Timestamp` | כן | Server-owned | MVP | עדכון אחרון מה-webhook/backend. |

---

### 4.14 `billingEvents/{eventId}`

**Scope:** Scale/V1  
**מטרה:** audit events עבור webhooks ותהליכי billing.  
**Path:** `billingEvents/{eventId}`  
**Deterministic ID:** provider event ID אם קיים; אחרת generated ID.

```ts
export type BillingEventDocument = {
  eventId: string;

  provider: BillingProvider;
  providerEventId?: string;

  uid?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;

  eventType: string;
  status: BillingEventStatus;

  receivedAt: FirebaseFirestore.Timestamp;
  processedAt?: FirebaseFirestore.Timestamp;

  errorCode?: string;
  errorMessage?: string;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `eventId` | `string` | כן | Server-owned | Scale/V1 | מזהה event פנימי. |
| `provider` | `BillingProvider` | כן | Server-owned | Scale/V1 | מקור event. |
| `providerEventId` | `string` | אופציונלי | Server-owned | Scale/V1 | מזהה event אצל provider. |
| `uid` | `string` | אופציונלי | Server-owned | Scale/V1 | המשתמש שאליו event מופה. |
| `providerCustomerId` | `string` | אופציונלי | Server-owned | Scale/V1 | מזהה לקוח provider. |
| `providerSubscriptionId` | `string` | אופציונלי | Server-owned | Scale/V1 | מזהה subscription provider. |
| `eventType` | `string` | כן | Server-owned | Scale/V1 | סוג webhook event. |
| `status` | `BillingEventStatus` | כן | Server-owned | Scale/V1 | סטטוס עיבוד. |
| `receivedAt` | `Timestamp` | כן | Server-owned | Scale/V1 | זמן קבלת webhook. |
| `processedAt` | `Timestamp` | אופציונלי | Server-owned | Scale/V1 | זמן סיום עיבוד. |
| `errorCode` | `string` | אופציונלי | Server-owned | Scale/V1 | קוד כשל אם נכשל. |
| `errorMessage` | `string` | אופציונלי | Server-owned | Scale/V1 | הודעת כשל פנימית. |

---

### 4.15 `aiRequests/{requestId}`

**Scope:** MVP  
**מטרה:** audit metadata ל-AI Hub. נוצר רק דרך server-side Gemini proxy.  
**Path:** `aiRequests/{requestId}`  
**Deterministic ID:** generated ID.

```ts
export type AIRequestDocument = {
  requestId: string;

  uid: string;

  type: AIRequestType;
  status: AIRequestStatus;

  inputSummary: string;
  outputSummary?: string;

  model: "gemini";

  tokenEstimate?: number;

  createdAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;

  errorCode?: string;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `requestId` | `string` | כן | Server-owned | MVP | מזהה בקשה. |
| `uid` | `string` | כן | Server-owned | MVP | המשתמש שביקש AI. |
| `type` | `AIRequestType` | כן | Server-owned | MVP | `profile_optimization`, `squad_advice`, או `match_insight`. |
| `status` | `AIRequestStatus` | כן | Server-owned | MVP | `pending`, `completed`, `failed`, `blocked`. |
| `inputSummary` | `string` | כן | Server-owned | MVP | תקציר input, לא בהכרח prompt מלא. |
| `outputSummary` | `string` | אופציונלי | Server-owned | MVP | תקציר output. |
| `model` | `"gemini"` | כן | Server-owned | MVP | ספק AI. |
| `tokenEstimate` | `number` | אופציונלי | Server-owned | Scale/V1 | הערכת tokens/cost. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירה. |
| `completedAt` | `Timestamp` | אופציונלי | Server-owned | MVP | זמן סיום. |
| `errorCode` | `string` | אופציונלי | Server-owned | MVP | קוד כשל/חסימה. |

---

### 4.16 `users/{uid}/blocks/{blockedUid}`

**Scope:** MVP  
**מטרה:** קשר block חד-כיווני. משפיע על discovery, matches ו-chat.  
**Path:** `users/{uid}/blocks/{blockedUid}`  
**Deterministic ID:** `{blockedUid}`

```ts
export type BlockDocument = {
  blockerUid: string;
  blockedUid: string;

  source?: string;
  relatedChatId?: string;
  relatedMatchId?: string;

  reason?: string;

  createdAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `blockerUid` | `string` | כן | Server-owned | MVP | המשתמש שחסם. חייב להתאים ל-`{uid}`. |
| `blockedUid` | `string` | כן | Server-owned | MVP | המשתמש שנחסם. חייב להתאים ל-document ID. |
| `source` | `string` | אופציונלי | Server-owned | MVP | מקור ה-block (`profile`/`chat`/`message`/`matches`/`discovery`) אם נאסף. |
| `relatedChatId` | `string` | אופציונלי | Server-owned | MVP | reference בטוח ל-chat קשור אם רלוונטי. |
| `relatedMatchId` | `string` | אופציונלי | Server-owned | MVP | reference בטוח ל-match קשור אם רלוונטי. |
| `reason` | `string` | אופציונלי | Client-writable | MVP | סיבה חופשית/פנימית אם נאספת. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן block. |

---

### 4.17 `reports/{reportId}`

**Scope:** MVP  
**מטרה:** דיווח moderation על משתמש/פרופיל/צ׳אט/הודעה.  
**Path:** `reports/{reportId}`  
**Deterministic ID:** generated ID.

```ts
export type ReportDocument = {
  reportId: string;

  reporterUid: string;
  reportedUid: string;

  source: "profile" | "chat" | "message";

  chatId?: string;
  messageId?: string;

  reason: ReportReason;
  description?: string;

  status: ReportStatus;

  createdAt: FirebaseFirestore.Timestamp;
  reviewedAt?: FirebaseFirestore.Timestamp;
  reviewedBy?: string;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `reportId` | `string` | כן | Server-owned | MVP | מזהה report. |
| `reporterUid` | `string` | כן | Server-owned | MVP | המדווח. חייב להיות auth user. |
| `reportedUid` | `string` | כן | Client-writable | MVP | המשתמש המדווח. מאומת backend. |
| `source` | `"profile" \| "chat" \| "message"` | כן | Client-writable | MVP | מקור הדיווח. |
| `chatId` | `string` | אופציונלי | Client-writable | MVP | נדרש אם source קשור לצ׳אט. |
| `messageId` | `string` | אופציונלי | Client-writable | MVP | נדרש אם source הוא הודעה. |
| `reason` | `ReportReason` | כן | Client-writable | MVP | סיבת דיווח. |
| `description` | `string` | אופציונלי | Client-writable | MVP | טקסט נוסף. |
| `status` | `ReportStatus` | כן | Server-owned | MVP | מתחיל כ-`open`. |
| `createdAt` | `Timestamp` | כן | Server-owned | MVP | זמן יצירה. |
| `reviewedAt` | `Timestamp` | אופציונלי | Server-owned | Scale/V1 | זמן בדיקה. |
| `reviewedBy` | `string` | אופציונלי | Server-owned | Scale/V1 | מזהה moderator/admin. |

---

### 4.18 `moderationActions/{actionId}`

**Scope:** Scale/V1  
**מטרה:** audit של פעולות moderation/admin.  
**Path:** `moderationActions/{actionId}`  
**Deterministic ID:** generated ID.

```ts
export type ModerationActionDocument = {
  actionId: string;

  targetUid: string;
  actorUid: string;

  reportId?: string;

  actionType:
    | "warn"
    | "restrict"
    | "suspend"
    | "ban"
    | "restore"
    | "remove_content"
    | "dismiss_report";

  reason?: string;

  createdAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `actionId` | `string` | כן | Server-owned | Scale/V1 | מזהה פעולה. |
| `targetUid` | `string` | כן | Server-owned | Scale/V1 | המשתמש שעליו בוצעה פעולה. |
| `actorUid` | `string` | כן | Server-owned | Scale/V1 | admin/moderator שביצע פעולה. |
| `reportId` | `string` | אופציונלי | Server-owned | Scale/V1 | report קשור. |
| `actionType` | union | כן | Server-owned | Scale/V1 | סוג פעולה. |
| `reason` | `string` | אופציונלי | Server-owned | Scale/V1 | נימוק פנימי. |
| `createdAt` | `Timestamp` | כן | Server-owned | Scale/V1 | זמן פעולה. |

---

### 4.19 `gameCatalog/{gameId}`

**Scope:** MVP  
**מטרה:** קטלוג משחקים מבוקר. מונע duplicates ומשפר discovery.  
**Path:** `gameCatalog/{gameId}`  
**Deterministic ID:** `gameId`, lowercase slug.

```ts
export type GameCatalogDocument = {
  gameId: string;

  name: string;
  slug: string;

  iconUrl?: string;
  coverUrl?: string;

  supportedRanks?: string[];

  rankOrder?: Record<string, number>;

  isActive: boolean;
  isFeatured: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `gameId` | `string` | כן | Admin/server | MVP | מזהה משחק. |
| `name` | `string` | כן | Admin/server | MVP | שם תצוגה רשמי. |
| `slug` | `string` | כן | Admin/server | MVP | URL-safe slug. |
| `iconUrl` | `string` | אופציונלי | Admin/server | MVP | icon. |
| `coverUrl` | `string` | אופציונלי | Admin/server | MVP | cover image. |
| `supportedRanks` | `string[]` | אופציונלי | Admin/server | Scale/V1 | רשימת ranks סטנדרטית. |
| `rankOrder` | `Record<string, number>` | אופציונלי | Admin/server | Scale/V1 | מיפוי rank ל-score. |
| `isActive` | `boolean` | כן | Admin/server | MVP | האם ניתן לבחור את המשחק. |
| `isFeatured` | `boolean` | כן | Admin/server | MVP | האם מוצג כ-featured. |
| `createdAt` | `Timestamp` | כן | Admin/server | MVP | זמן יצירה. |
| `updatedAt` | `Timestamp` | כן | Admin/server | MVP | זמן עדכון. |

---

### 4.20 `discoveryProfiles/{gameId}/players/{uid}`

**Scope:** Scale/V1  
**מטרה:** read model ייעודי ומהיר ל-discovery לפי משחק.  
**Path:** `discoveryProfiles/{gameId}/players/{uid}`  
**Deterministic ID:** `{uid}` תחת `{gameId}`.

```ts
export type DiscoveryProfileDocument = {
  uid: string;
  gameId: string;

  displayName: string;
  age: number;
  bio: string;
  skillLevel: SkillLevel;
  platforms: Platform[];

  profileImageUrl?: string;
  bannerImageUrl?: string;
  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  rank: string;
  rankNormalized?: string;
  rankScore?: number;

  lookingFor: LookingFor;
  lookingForText?: string;
  voicePreference?: VoicePreference;

  isPro: boolean;
  verifiedBadge: boolean;

  isDiscoverable: boolean;
  isSuspended: boolean;
  isDeleted: boolean;

  lastActiveAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  randomSeed: number;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `uid` | `string` | כן | Server-owned | Scale/V1 | מזהה השחקן. |
| `gameId` | `string` | כן | Server-owned | Scale/V1 | מזהה המשחק. |
| `displayName` | `string` | כן | Server-owned | Scale/V1 | משוכפל מ-public profile. |
| `age` | `number` | כן | Server-owned | Scale/V1 | משוכפל לפי policy. |
| `bio` | `string` | כן | Server-owned | Scale/V1 | משוכפל. |
| `skillLevel` | `SkillLevel` | כן | Server-owned | Scale/V1 | משוכפל. |
| `platforms` | `Platform[]` | כן | Server-owned | Scale/V1 | משוכפל. |
| `profileImageUrl` | `string` | אופציונלי | Server-owned | Scale/V1 | משוכפל. |
| `bannerImageUrl` | `string` | אופציונלי | Server-owned | Scale/V1 | משוכפל. |
| `avatarBorderItemId` | `string` | אופציונלי | Server-owned | Scale/V1 | cosmetic reference. |
| `globalBackgroundItemId` | `string` | אופציונלי | Server-owned | Scale/V1 | cosmetic reference. |
| `rank` | `string` | כן | Server-owned | Scale/V1 | rank למשחק הזה. |
| `rankNormalized` | `string` | אופציונלי | Server-owned | Scale/V1 | normalized rank. |
| `rankScore` | `number` | אופציונלי | Server-owned | Scale/V1 | score לדירוג. |
| `lookingFor` | `LookingFor` | כן | Server-owned | Scale/V1 | intent למשחק הזה. |
| `lookingForText` | `string` | אופציונלי | Server-owned | Scale/V1 | טקסט intent. |
| `voicePreference` | `VoicePreference` | אופציונלי | Server-owned | Scale/V1 | העדפת voice. |
| `isPro` | `boolean` | כן | Server-owned | Scale/V1 | Pro state משוכפל. |
| `verifiedBadge` | `boolean` | כן | Server-owned | Scale/V1 | badge state. |
| `isDiscoverable` | `boolean` | כן | Server-owned | Scale/V1 | האם ניתן להציג ב-deck. |
| `isSuspended` | `boolean` | כן | Server-owned | Scale/V1 | exclusion מהיר. |
| `isDeleted` | `boolean` | כן | Server-owned | Scale/V1 | soft delete. |
| `lastActiveAt` | `Timestamp` | כן | Server-owned | Scale/V1 | לדירוג. |
| `updatedAt` | `Timestamp` | כן | Server-owned | Scale/V1 | עדכון read model. |
| `randomSeed` | `number` | כן | Server-owned | Scale/V1 | סיוע ל-randomized ordering. |

---

### 4.21 `users/{uid}/usage/{yyyy-mm-dd}`

**Scope:** Scale/V1  
**מטרה:** daily counters עבור rate limiting ו-usage tracking.  
**Path:** `users/{uid}/usage/{yyyy-mm-dd}`  
**Deterministic ID:** date string בפורמט `YYYY-MM-DD`.

```ts
export type DailyUsageDocument = {
  date: string;

  swipeCount: number;
  aiProfileReviewCount: number;
  aiSquadAdviceCount: number;
  mediaUploadCount: number;
  messageCount?: number;

  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `date` | `string` | כן | Server-owned | Scale/V1 | תאריך counter. |
| `swipeCount` | `number` | כן | Server-owned | Scale/V1 | מספר swipes יומי. |
| `aiProfileReviewCount` | `number` | כן | Server-owned | Scale/V1 | מספר בקשות profile AI. |
| `aiSquadAdviceCount` | `number` | כן | Server-owned | Scale/V1 | מספר בקשות squad AI. |
| `mediaUploadCount` | `number` | כן | Server-owned | Scale/V1 | מספר העלאות media. |
| `messageCount` | `number` | אופציונלי | Server-owned | Scale/V1 | מונה הודעות abuse threshold. |
| `updatedAt` | `Timestamp` | כן | Server-owned | Scale/V1 | זמן עדכון. |

---

### 4.22 `system/config`

**Scope:** MVP  
**מטרה:** קונפיגורציית מערכת לא סודית.  
**Path:** `system/config`  
**Deterministic ID:** `config`

```ts
export type SystemConfigDocument = {
  environment: SystemEnvironment;

  maintenanceMode: boolean;

  featureFlags: {
    aiHubEnabled: boolean;
    shopEnabled: boolean;
    proSubscriptionEnabled: boolean;
    mediaUploadEnabled: boolean;
    reportsEnabled: boolean;
  };

  limits?: {
    basicDailySwipeLimit?: number;
    maxBioLength?: number;
    maxLookingForTextLength?: number;
    maxProfileImageBytes?: number;
    maxBannerImageBytes?: number;
    maxChatMediaBytes?: number;
    aiProfileReviewDailyLimitBasic?: number;
    aiProfileReviewDailyLimitPro?: number;
    aiSquadAdviceDailyLimitBasic?: number;
    aiSquadAdviceDailyLimitPro?: number;
    mediaUploadDailyLimitPro?: number;
  };

  billing: {
    provider: BillingProvider;
    proMonthlyPriceAmount: number;
    currency: "ILS";
  };

  ai: {
    model: string;
    temperature: number;
    maxOutputTokens: number;
    timeoutMs: number;
  };

  // Forward-looking: store/native packaging flags. Web-first now (ADR-036); see STORE_COMPLIANCE.md.
  store?: {
    storeBuild: boolean;
    billingProvider: "webProvider" | "revenueCat";
    revenueCatEnabled: boolean;
    externalPurchaseLinksEnabled: boolean;
    deleteAccountEnabled: boolean;
    nativePushEnabled: boolean;
    nativeCameraEnabled: boolean;
  };

  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `environment` | `SystemEnvironment` | כן | Admin/server | MVP | סביבת מערכת. |
| `maintenanceMode` | `boolean` | כן | Admin/server | MVP | מצב תחזוקה. |
| `featureFlags` | `object` | כן | Admin/server | MVP | flags לא סודיים. |
| `featureFlags.aiHubEnabled` | `boolean` | כן | Admin/server | MVP | האם AI Hub פעיל. |
| `featureFlags.shopEnabled` | `boolean` | כן | Admin/server | MVP | האם Shop פעיל. |
| `featureFlags.proSubscriptionEnabled` | `boolean` | כן | Admin/server | MVP | האם subscription פעיל. |
| `featureFlags.mediaUploadEnabled` | `boolean` | כן | Admin/server | MVP | האם media upload פעיל. |
| `featureFlags.reportsEnabled` | `boolean` | כן | Admin/server | MVP | האם reports פעיל. |
| `limits` | `object` | אופציונלי | Admin/server | MVP | מגבלות מוצר לא סודיות. |
| `limits.basicDailySwipeLimit` | `number` | אופציונלי | Admin/server | MVP | מספר swipes יומי ל-Basic. TBD לפי ADR-015. |
| `limits.maxBioLength` | `number` | אופציונלי | Admin/server | MVP | מגבלת bio. TBD לפי ADR-031. |
| `limits.maxLookingForTextLength` | `number` | אופציונלי | Admin/server | MVP | מגבלת looking-for text. |
| `limits.maxProfileImageBytes` | `number` | אופציונלי | Admin/server | MVP | מגבלת תמונת פרופיל. |
| `limits.maxBannerImageBytes` | `number` | אופציונלי | Admin/server | MVP | מגבלת באנר. |
| `limits.maxChatMediaBytes` | `number` | אופציונלי | Admin/server | MVP | מגבלת chat media. |
| `limits.aiProfileReviewDailyLimitBasic` | `number` | אופציונלי | Admin/server | MVP | מגבלת AI profile review יומית ל-Basic. TBD לפי ADR-027. |
| `limits.aiProfileReviewDailyLimitPro` | `number` | אופציונלי | Admin/server | MVP | מגבלת AI profile review יומית ל-Pro. TBD לפי ADR-027. |
| `limits.aiSquadAdviceDailyLimitBasic` | `number` | אופציונלי | Admin/server | MVP | מגבלת AI squad advice יומית ל-Basic. TBD לפי ADR-027. |
| `limits.aiSquadAdviceDailyLimitPro` | `number` | אופציונלי | Admin/server | MVP | מגבלת AI squad advice יומית ל-Pro. TBD לפי ADR-027. |
| `limits.mediaUploadDailyLimitPro` | `number` | אופציונלי | Admin/server | MVP | מגבלת media upload יומית ל-Pro. |
| `billing` | `object` | כן | Admin/server | MVP | קונפיגורציית billing לא סודית. |
| `billing.provider` | `BillingProvider` | כן | Admin/server | MVP | ספק התשלומים הנבחר. TBD לפי ADR-017. |
| `billing.proMonthlyPriceAmount` | `number` | כן | Admin/server | MVP | מחיר Pro חודשי. `29.90`. |
| `billing.currency` | `"ILS"` | כן | Admin/server | MVP | מטבע billing. |
| `ai` | `object` | כן | Admin/server | MVP | קונפיגורציית AI לא סודית (ללא API key). |
| `ai.model` | `string` | כן | Admin/server | MVP | מזהה מודל Gemini server-side. חובה לאמת לפני production. |
| `ai.temperature` | `number` | כן | Admin/server | MVP | הגדרת generation. |
| `ai.maxOutputTokens` | `number` | כן | Admin/server | MVP | מגבלת output tokens. |
| `ai.timeoutMs` | `number` | כן | Admin/server | MVP | timeout ל-AI provider. |
| `store` | `object` | אופציונלי | Admin/server | MVP | flags עתידיים ל-store/native packaging (web-first עכשיו, ADR-036; ראה `STORE_COMPLIANCE.md`). |
| `updatedAt` | `Timestamp` | כן | Admin/server | MVP | זמן עדכון. |

---

### 4.23 `chats/{chatId}/calls/{callId}`

**Scope:** MVP (ADR-041 proposal — product decision 2026-07-06: live voice/video calls in MVP)
**מטרה:** מסמכי signaling לשיחות קול/וידאו חיות בין matched users. WebRTC peer-to-peer; Firestore משמש רק להעברת offer/answer/ICE — המדיה עצמה זורמת ישירות בין הדפדפנים ואינה נשמרת.
**Path:** `chats/{chatId}/calls/{callId}`
**Deterministic ID:** לא — auto ID.

```ts
export type CallType = "video" | "voice";
export type CallStatus = "ringing" | "accepted" | "declined" | "ended";

export type CallDocument = {
  callId: string;
  chatId: string;

  callerUid: string;
  calleeUid: string;

  type: CallType;
  status: CallStatus;

  offer?: { type: string; sdp: string };
  answer?: { type: string; sdp: string };

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

| Field | Type | חובה | Ownership | Scope | תיאור |
|---|---|---:|---|---|---|
| `callId` | `string` | כן | Client (auto ID) | MVP | זהה ל-document ID. |
| `chatId` | `string` | כן | Client-writable | MVP | חייב להתאים ל-path; נאכף ב-rules. |
| `callerUid` | `string` | כן | Client-writable | MVP | חייב להיות `request.auth.uid`; נאכף ב-rules. |
| `calleeUid` | `string` | כן | Client-writable | MVP | חייב להיות המשתתף השני בצ׳אט; נאכף ב-rules. |
| `type` | `CallType` | כן | Client-writable | MVP | `video` או `voice`. |
| `status` | `CallStatus` | כן | Client-writable | MVP | נוצר כ-`ringing`; המשתתפים מעדכנים ל-`accepted`/`declined`/`ended`. |
| `offer` | `{type, sdp}` | אופציונלי | Client-writable | MVP | SDP offer של המתקשר. |
| `answer` | `{type, sdp}` | אופציונלי | Client-writable | MVP | SDP answer של העונה. |
| `createdAt` | `Timestamp` | כן | Client-writable | MVP | `request.time` בעת יצירה; נאכף ב-rules. |
| `updatedAt` | `Timestamp` | כן | Client-writable | MVP | זמן עדכון אחרון. |

**Subcollections:** `callerCandidates/{id}` ו-`calleeCandidates/{id}` — ICE candidates (JSON של `RTCIceCandidate`), create-only על ידי משתתפי הצ׳אט.

**אילוצים:**

- קריאה/כתיבה למשתתפי הצ׳אט בלבד (SECURITY §4).
- שדות identity (`chatId`, `callerUid`, `calleeUid`, `type`, `createdAt`) חסינים לעדכון.
- collection-group read למשתתף בלבד (למאזין שיחות נכנסות: `calleeUid == me && status == "ringing"`), עם index ב-`firestore.indexes.json`.
- MVP הוא STUN-only (ללא TURN relay) — חיבור עלול להיכשל מאחורי NAT מגביל; TURN הוא open item.

---

## 5. Deterministic ID Reference

| Entity | Scope | Path | ID Format | הערות |
|---|---|---|---|---|
| User | MVP | `users/{uid}` | `{uid}` | Firebase Auth UID. |
| Private account | MVP | `users/{uid}/private/account` | `account` | document קבוע. |
| Public profile | MVP | `publicProfiles/{uid}` | `{uid}` | תואם user UID. |
| User game | MVP | `users/{uid}/games/{gameId}` | `{gameId}` | מתוך `gameCatalog`. |
| Swipe | MVP | `users/{uid}/swipes/{targetUid_gameId}` | `{targetUid}_{gameId}` | לא להסתמך על parsing בלבד. |
| Match | MVP | `matches/{matchId}` | `{minUid}_{maxUid}_{gameId}` | מונע duplicate matches. |
| Chat | MVP | `chats/{chatId}` | `{matchId}` | chat ID זהה ל-match ID. |
| Message | MVP | `chats/{chatId}/messages/{messageId}` | auto/server ID | אין צורך deterministic. |
| Shop item | MVP | `shopItems/{itemId}` | stable slug או generated ID | must be immutable reference. |
| Owned item | Scale/V1 | `users/{uid}/ownedItems/{itemId}` | `{itemId}` | ownership per item. |
| Coin transaction | MVP | `users/{uid}/transactions/{transactionId}` | generated/idempotency key | audit נדרש כבר ב-MVP לפי ADR-005. |
| Subscription | MVP | `subscriptions/{uid}` | `{uid}` | user entitlement. |
| Billing event | Scale/V1 | `billingEvents/{eventId}` | provider event ID או generated | webhook audit. |
| AI request | MVP | `aiRequests/{requestId}` | generated ID | server-created. |
| Block | MVP | `users/{uid}/blocks/{blockedUid}` | `{blockedUid}` | חד-כיווני. |
| Report | MVP | `reports/{reportId}` | generated ID | moderation. |
| Moderation action | Scale/V1 | `moderationActions/{actionId}` | generated ID | admin audit. |
| Game catalog | MVP | `gameCatalog/{gameId}` | lowercase slug | controlled catalog. |
| Discovery profile | Scale/V1 | `discoveryProfiles/{gameId}/players/{uid}` | `{uid}` | game-sharded read model. |
| Daily usage | Scale/V1 | `users/{uid}/usage/{yyyy-mm-dd}` | `YYYY-MM-DD` | timezone policy TBD. |
| System config | MVP | `system/config` | `config` | non-secret config. |

---

## 6. מטריצת שדות בבעלות שרת מול client-writable

### 6.1 Server-Owned Fields

| Collection / Path | Fields / Documents | Scope |
|---|---|---|
| `users/{uid}` | `uid`, `email`, `onboardingCompleted`, `coins`, `subscriptionTier`, `subscriptionStatus`, `subscriptionExpiresAt`, `isPro`, `ownedItemIds`, `avatarBorderItemId`, `globalBackgroundItemId`, `isSuspended`, `isDeleted`, `createdAt`, `updatedAt`, `lastActiveAt` | MVP |
| `users/{uid}/private/account` | `email`, `authProvider`, `paymentCustomerId`, `moderationState`, `createdAt`, `updatedAt` | MVP |
| `publicProfiles/{uid}` | כל המסמך | MVP |
| `users/{uid}/games/{gameId}` | `gameId`, `name`, `iconUrl`, `rankNormalized`, `rankScore`, `createdAt`, `updatedAt` | MVP / Scale |
| `users/{uid}/swipes/{swipeId}` | כל המסמך | MVP |
| `matches/{matchId}` | כל המסמך | MVP |
| `chats/{chatId}` | כל המסמך | MVP |
| `chats/{chatId}/messages/{messageId}` | `messageId`, `fileUrl`, `filePath`, `fileMimeType`, `fileSizeBytes`, `status`, `createdAt`, `updatedAt`, `deletedAt` | MVP |
| `shopItems/{itemId}` | כל המסמך | MVP |
| `users/{uid}/ownedItems/{itemId}` | כל המסמך | Scale/V1 |
| `users/{uid}/transactions/{transactionId}` | כל המסמך | MVP |
| `subscriptions/{uid}` | כל המסמך | MVP |
| `billingEvents/{eventId}` | כל המסמך | Scale/V1 |
| `aiRequests/{requestId}` | כל המסמך | MVP |
| `reports/{reportId}` | `reportId`, `reporterUid`, `status`, `createdAt`, `reviewedAt`, `reviewedBy` | MVP / Scale |
| `moderationActions/{actionId}` | כל המסמך | Scale/V1 |
| `gameCatalog/{gameId}` | כל המסמך | MVP |
| `discoveryProfiles/{gameId}/players/{uid}` | כל המסמך | Scale/V1 |
| `users/{uid}/usage/{date}` | כל המסמך | Scale/V1 |
| `system/config` | כל המסמך | MVP |

### 6.2 Client-Writable Fields

| Collection / Path | Fields | Scope | הערות |
|---|---|---|---|
| `users/{uid}` | `displayName`, `age`, `bio`, `skillLevel`, `platforms`, `isDiscoverable`, `profileImageUrl`, `bannerImageUrl` | MVP | בכפוף ל-validation ו-Security Rules. |
| `users/{uid}/private/account` | `birthDate`, `country`, `locale` | MVP | רק אם policy מאפשר. |
| `users/{uid}/games/{gameId}` | `rank`, `lookingFor`, `lookingForText`, `preferredMode`, `voicePreference`, `isActive` | MVP / Scale | gameId חייב להיות מאושר מה-catalog. |
| `chats/{chatId}/messages/{messageId}` | `chatId`, `senderId`, `type`, `text` | MVP | רק text message ישיר; media finalization דרך backend. |
| `reports/{reportId}` | `reportedUid`, `source`, `chatId`, `messageId`, `reason`, `description` | MVP | מומלץ דרך `createReport` Cloud Function. |
| `users/{uid}/blocks/{blockedUid}` | `reason` | MVP | מומלץ דרך `blockUser` Cloud Function. |

---

## 7. מפת Denormalization & Sync

| Source | Target | Fields | Sync Owner | Scope | סיבה |
|---|---|---|---|---|---|
| `users/{uid}` | `publicProfiles/{uid}` | `displayName`, `age`, `bio`, `skillLevel`, `platforms`, `profileImageUrl`, `bannerImageUrl`, `avatarBorderItemId`, `globalBackgroundItemId`, `isDiscoverable`, `isSuspended`, `isDeleted`, `lastActiveAt` | `onUserProfileUpdated` | MVP | discovery-safe read model. |
| `users/{uid}/games/{gameId}` | `publicProfiles/{uid}` | `gameIds`, `primaryGameId`, `primaryRank` | `onUserGameUpdated` | MVP | game-filtered discovery. |
| `subscriptions/{uid}` | `users/{uid}` | `subscriptionTier`, `subscriptionStatus`, `subscriptionExpiresAt`, `isPro` | `paymentWebhook` / `onSubscriptionUpdated` | MVP | fast entitlement read. |
| `subscriptions/{uid}` | `publicProfiles/{uid}` | `isPro`, `verifiedBadge` | `onSubscriptionUpdated` | MVP | display badge in discovery. |
| `users/{uid}` + `users/{uid}/games/{gameId}` | `discoveryProfiles/{gameId}/players/{uid}` | card fields, rank fields, intent fields, platforms, cosmetics, status fields | `onUserProfileUpdated`, `onUserGameUpdated` | Scale/V1 | optimized per-game discovery. |
| `chats/{chatId}/messages/{messageId}` | `chats/{chatId}` | `lastMessage`, `lastMessageType`, `lastMessageSenderId`, `lastTimestamp`, `unreadCounts` | `onMessageCreated` | MVP | fast chat list. |
| `shopItems/{itemId}` | `users/{uid}` | `avatarBorderItemId`, `globalBackgroundItemId` via equip action | `equipItem` | MVP | equipped item references. |
| `users/{uid}/blocks/{blockedUid}` | `matches/{matchId}` / `chats/{chatId}` | `status`, `isActive` as needed | `blockUser` / `onBlockCreated` | MVP | enforce safety. |
| `users/{uid}.coins` | `users/{uid}/transactions/{transactionId}` | `balanceBefore`, `balanceAfter`, `amountCoins`, `type` | `purchaseShopItem`, `grantCoins` | MVP | audit trail נדרש כבר ב-MVP לפי ADR-005. |
| `reports/{reportId}` | `moderationActions/{actionId}` | action metadata | moderation workflow | Scale/V1 | moderation audit. |

---

## 8. כללי ולידציה ואילוצים

### 8.1 Global Constraints

| כלל | Scope |
|---|---|
| כל enum value חייב להופיע ב-Enum Registry | MVP |
| כל timestamp server-side בלבד | MVP |
| כל document שנוצר על ידי client חייב לעבור Security Rules ו-validation | MVP |
| כל trust-sensitive write חייב לעבור Cloud Function/Admin SDK | MVP |
| אין לשמור Hebrew enum values במסד הנתונים | MVP |
| אין לשמור CSS raw על user עבור cosmetics; יש להשתמש ב-item references | MVP |

### 8.2 User Constraints

| Field | Constraint | Scope |
|---|---|---|
| `uid` | חייב להתאים ל-Firebase Auth UID | MVP |
| `displayName` | לא ריק; max length TBD | MVP |
| `age` | חייב לעמוד ב-minimum age policy; ערך סופי TBD | MVP |
| `bio` | max length TBD; content moderation policy TBD | MVP |
| `skillLevel` | רק `beginner`, `intermediate`, `pro`, `elite` | MVP |
| `platforms` | array של `Platform`; רשימה סופית פתוחה לעדכון | MVP |
| `coins` | חייב להיות `>= 0` | MVP |
| `ownedItemIds` | ללא כפילויות | MVP |
| `isSuspended` | רק backend/admin | MVP |

### 8.3 Game Constraints

| Field | Constraint | Scope |
|---|---|---|
| `gameId` | חייב להתקיים ב-`gameCatalog` ולהיות active | MVP |
| `rank` | לא ריק; standardization TBD | MVP |
| `lookingFor` | חייב להיות `LookingFor` | MVP |
| `lookingForText` | חובה כאשר `lookingFor = custom` אם policy ידרוש; max length TBD | MVP |
| `voicePreference` | חייב להיות `VoicePreference` | MVP |

### 8.4 Swipe & Match Constraints

| כלל | Scope |
|---|---|
| משתמש לא יכול לבצע swipe לעצמו | MVP |
| Swipe נכתב רק על ידי `submitSwipe` | MVP |
| Match נוצר רק אם יש reciprocal like | MVP |
| Match ID deterministic כדי למנוע duplicates | MVP |
| Block בשני הכיוונים מונע discovery/chat | MVP |
| `users` ב-match חייב להכיל בדיוק שני UIDs | MVP |

### 8.5 Chat Constraints

| כלל | Scope |
|---|---|
| רק participants יכולים לקרוא chat/messages | MVP |
| `senderId` חייב להיות auth UID | MVP |
| `text` לא יכול להיות ריק כאשר `type = text` | MVP |
| media message דורש Pro פעיל | MVP |
| `fileSizeBytes` חייב לעמוד במגבלות Storage | MVP |
| `lastMessage` נגזר מ-message, לא client-writable | MVP |

### 8.6 Economy Constraints

| כלל | Scope |
|---|---|
| Coins לא נרכשים בכסף אמיתי ב-MVP | MVP |
| Coins משתנים רק דרך backend | MVP |
| כל שינוי coins מייצר transaction audit | MVP |
| `priceCoins >= 0` | MVP |
| `balanceAfter >= 0` | MVP |
| משתמש לא יכול לרכוש item שכבר בבעלותו | MVP |
| Pro-only item דורש `isPro = true` לפי policy | MVP |

### 8.7 Subscription Constraints

| כלל | Scope |
|---|---|
| Pro price הוא `29.90 ILS/month` לפי PRD | MVP |
| Provider סופי TBD | MVP |
| Subscription status נכתב רק בעקבות verified webhook/backend | MVP |
| Client לא כותב entitlement fields | MVP |
| `isPro` נגזר מ-`subscriptions/{uid}` | MVP |

### 8.8 AI Constraints

| כלל | Scope |
|---|---|
| AI requests נוצרים רק על ידי backend proxy | MVP |
| Gemini API key לעולם לא נחשף ל-client | MVP |
| `AIRequestType` חייב להיות enum תקף | MVP |
| בקשות cheat/exploit/harassment נחסמות | MVP |
| Rate limits ייאכפו server-side | MVP / Scale |

### 8.9 Safety Constraints

| כלל | Scope |
|---|---|
| `ReportReason` חייב להיות enum תקף | MVP |
| `ReportStatus` מתחיל כ-`open` | MVP |
| Report לא נקרא על ידי משתמשים רגילים | MVP |
| Block מסיר discovery eligibility | MVP |
| Block מונע chat sending | MVP |

---

## 9. החלטות פתוחות

| החלטה | Scope | סטטוס |
|---|---|---|
| minimum allowed age | MVP | TBD |
| האם `age` מוצג ציבורית או משמש רק לסינון/safety | MVP | TBD |
| max length עבור `displayName` | MVP | TBD |
| max length עבור `bio` | MVP | TBD |
| max length עבור `lookingForText` | MVP | TBD |
| רשימת `Platform` סופית לפני launch | MVP | TBD |
| האם `arcade` ו-`other` יישארו ב-Platform registry | MVP | TBD |
| האם ranks יהיו free text או standardized per game ב-MVP | MVP | TBD |
| רשימת games ראשונית ב-`gameCatalog` | MVP | TBD |
| בחירת payment provider ל-Israel-facing subscription billing | MVP | TBD |
| מדיניות refund/cancellation | MVP | TBD |
| exact Basic daily swipe limit | MVP | TBD |
| exact AI request limits | MVP | TBD |
| timezone עבור daily usage counters | Scale/V1 | TBD |
| media file type support מעבר ל-image | MVP / Scale | TBD |
| max profile image size | MVP | TBD |
| max banner image size | MVP | TBD |
| max chat media size | MVP | TBD |
| האם Pro-only cosmetics נשארים equipped לאחר Pro expiration | MVP | TBD |
| האם `verifiedBadge` אומר Pro בלבד או identity/game verification בעתיד | MVP / Scale | TBD |
| האם `ownedItemIds` יישאר כ-cache לאחר מעבר ל-`ownedItems` subcollection | Scale/V1 | TBD |
| מדיניות מחיקת account/chat/report data | MVP | TBD |
| מדיניות retention עבור `aiRequests` | MVP | TBD |
| האם `match_insight` ייכלל ב-MVP או יישאר Scale/V1 | Scale/V1 | TBD |
| האם `publicProfiles` client-writable חלקית או server-synced בלבד | MVP | המלצה: server-synced בלבד |
| האם reports נוצרים ישירות ב-rules או רק דרך `createReport` function | MVP | המלצה: דרך function |
| האם blocks נוצרים ישירות ב-rules או רק דרך `blockUser` function | MVP | המלצה: דרך function |
