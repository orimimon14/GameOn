# Swish & Game — API Contract

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production API Contract |
| Repository Path | `docs/architecture/API_CONTRACT.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/architecture/DATA_MODEL.md`, `docs/product/DECISIONS.md` |
| Backend Platform | Firebase Cloud Functions + Cloud Firestore + Firebase Auth + Firebase Storage |
| Contract Scope | Callable Functions, HTTP/Webhook Functions, Firestore Triggers |
| Architecture Principle | Backend-authoritative: ה-client רשאי לבקש פעולה, אך ה-server מחליט ומעדכן state רגיש |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. מוסכמות גלובליות](#2-מוסכמות-גלובליות)
  - [2.1 Auth Model](#21-auth-model)
  - [2.2 Standard Error Model](#22-standard-error-model)
  - [2.3 Idempotency Conventions](#23-idempotency-conventions)
  - [2.4 Validation](#24-validation)
  - [2.5 Response Envelope](#25-response-envelope)
  - [2.6 Rate Limiting](#26-rate-limiting)
  - [2.7 Shared Type Registry](#27-shared-type-registry)
- [3. Callable Functions](#3-callable-functions)
  - [3.1 `submitSwipe`](#31-submitswipe)
  - [3.2 `purchaseShopItem`](#32-purchaseshopitem)
  - [3.3 `equipItem`](#33-equipitem)
  - [3.4 `sendChatMediaMessage`](#34-sendchatmediamessage)
  - [3.5 `sendAIProfileReview`](#35-sendaiprofilereview)
  - [3.6 `sendAISquadAdvice`](#36-sendaisquadadvice)
  - [3.7 `createReport`](#37-createreport)
  - [3.8 `blockUser`](#38-blockuser)
  - [3.9 `syncPublicProfile`](#39-syncpublicprofile)
  - [3.10 `getDiscoveryDeck`](#310-getdiscoverydeck)
  - [3.11 `grantCoins`](#311-grantcoins)
  - [3.12 `reconcileSubscription`](#312-reconcilesubscription)
  - [3.13 `createCheckoutSession`](#313-createcheckoutsession)
  - [3.14 `deleteAccount`](#314-deleteaccount)
  - [3.15 `completeOnboarding`](#315-completeonboarding)
  - [5.9 `onUserCreated`](#59-onusercreated)
- [4. HTTP / Webhook Functions](#4-http--webhook-functions)
  - [4.1 `paymentWebhook`](#41-paymentwebhook)
  - [4.2 `checkoutSessionCallback`](#42-checkoutsessioncallback)
  - [4.3 `scheduledSubscriptionReconciliation`](#43-scheduledsubscriptionreconciliation)
  - [4.4 `scheduledUsageCleanup`](#44-scheduledusagecleanup)
- [5. Firestore Triggers](#5-firestore-triggers)
  - [5.1 `onUserProfileUpdated`](#51-onuserprofileupdated)
  - [5.2 `onUserGameUpdated`](#52-onusergameupdated)
  - [5.3 `onSubscriptionUpdated`](#53-onsubscriptionupdated)
  - [5.4 `onMessageCreated`](#54-onmessagecreated)
  - [5.5 `onBlockCreated`](#55-onblockcreated)
  - [5.6 `onShopItemUpdated`](#56-onshopitemupdated)
  - [5.7 `onUserDeleted`](#57-onuserdeleted)
  - [5.8 `onReportCreated`](#58-onreportcreated)
- [6. טבלת סיכום](#6-טבלת-סיכום)
- [7. Open Items](#7-open-items)

---

## 2. מוסכמות גלובליות

### 2.1 Auth Model

כל `callable function` מקבלת Firebase Auth context דרך `request.auth`.

כל function שמוגדרת כ-authenticated-only חייבת לבצע בתחילת ה-handler:

1. לבדוק ש-`request.auth != null`.
2. לקרוא את `uid` מתוך `request.auth.uid`.
3. לטעון `users/{uid}` כאשר נדרש domain state.
4. לדחות משתמשים עם:
   - `isSuspended = true`
   - `isDeleted = true`
   - onboarding incomplete כאשר הפעולה דורשת profile פעיל.

#### התנהגות ב-unauthenticated

אם `request.auth` חסר:

```ts
throw new HttpsError("unauthenticated", "Authentication is required.", {
  code: "unauthenticated"
});
```

#### הרשאות Admin

Admin-only functions אינן נחשפות ל-client רגיל. הן חייבות להשתמש באחד מהמודלים הבאים:

- Firebase custom claims, לדוגמה `admin: true`.
- callable פנימי מוגבל לסביבת admin.
- scheduled/backend-only execution.
- IAM / Cloud Scheduler / service account עבור scheduled jobs.

---

### 2.2 Standard Error Model

כל function תחזיר שגיאות בפורמט אחיד דרך `HttpsError` או response error envelope כאשר מדובר ב-HTTP/webhook.

#### Error Payload

```ts
export type ApiErrorCode =
  | "unauthenticated"
  | "permission_denied"
  | "invalid_argument"
  | "not_found"
  | "already_exists"
  | "failed_precondition"
  | "resource_exhausted"
  | "insufficient_coins"
  | "pro_required"
  | "blocked"
  | "self_action_forbidden"
  | "internal";

export type ApiErrorDetails = {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  retryable?: boolean;
  requestId?: string;
};
```

#### Error Catalog

| Error Code | Firebase HttpsError Code | מתי להשתמש |
|---|---|---|
| `unauthenticated` | `unauthenticated` | אין Firebase Auth context. |
| `permission_denied` | `permission-denied` | המשתמש מחובר אך אינו מורשה לבצע פעולה. |
| `invalid_argument` | `invalid-argument` | input לא תקין לפי Zod schema או business validation. |
| `not_found` | `not-found` | document נדרש לא נמצא. |
| `already_exists` | `already-exists` | resource כבר קיים ואינו idempotent-safe עבור הפעולה. |
| `failed_precondition` | `failed-precondition` | מצב המערכת אינו מאפשר פעולה, לדוגמה onboarding incomplete. |
| `resource_exhausted` | `resource-exhausted` | rate limit או quota exceeded. |
| `insufficient_coins` | `failed-precondition` | אין מספיק coins לרכישת shop item. |
| `pro_required` | `permission-denied` | הפעולה דורשת active Pro. |
| `blocked` | `permission-denied` | block קיים בין המשתמשים. |
| `self_action_forbidden` | `invalid-argument` | המשתמש מנסה לפעול על עצמו בפעולה אסורה. |
| `internal` | `internal` | שגיאה בלתי צפויה. אין לחשוף פרטי internals ל-client. |

---

### 2.3 Idempotency Conventions

כל function שכותבת state רגיש חייבת להיות idempotent ככל האפשר.

#### Deterministic IDs

| Domain | ID Format |
|---|---|
| Swipe | `users/{uid}/swipes/{targetUid}_{gameId}` |
| Match | `matches/{minUid}_{maxUid}_{gameId}` |
| Chat | `chats/{matchId}` |
| Block | `users/{uid}/blocks/{blockedUid}` |
| Subscription | `subscriptions/{uid}` |
| Discovery profile | `discoveryProfiles/{gameId}/players/{uid}` |
| Daily usage | `users/{uid}/usage/{yyyy-mm-dd}` |

#### Transactions

יש להשתמש ב-Firestore transactions עבור:

- `submitSwipe` כאשר reciprocal like יוצר match/chat.
- `purchaseShopItem` כאשר coins יורדים ו-ownership מתעדכן.
- `equipItem` כאשר cosmetic references מתעדכנים.
- `grantCoins` כאשר balance ו-transaction audit נכתבים.
- subscription reconciliation כאשר entitlement state מתעדכן.

#### Idempotency Keys

עבור פעולות payment/webhook:

- להשתמש ב-provider event ID כ-idempotency key.
- לשמור `billingEvents/{eventId}` ב-Scale/V1.
- לא לעבד אותו event פעמיים אם כבר סומן `processed`.

---

### 2.4 Validation

כל input מאומת server-side עם Zod schema. Client-side validation היא UX בלבד ואינה מקור אמון.

כל Zod schema חייב:

- לאפשר רק fields מוכרים.
- לדחות unknown sensitive fields.
- לאכוף enum values באנגלית בלבד.
- לאכוף string length limits כאשר מוגדרים ב-`system/config`.
- לאכוף ID formats בסיסיים.
- לנקות/לסנן text inputs בהתאם לצורך.

דוגמת pattern:

```ts
const SubmitSwipeInputSchema = z.object({
  targetUid: z.string().min(1),
  gameId: z.string().min(1),
  direction: z.enum(["like", "skip"])
}).strict();
```

---

### 2.5 Response Envelope

כל callable function תחזיר response envelope אחיד:

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
  serverTime: FirebaseFirestore.Timestamp;
};

export type ApiFailure = {
  ok: false;
  error: ApiErrorDetails;
  requestId: string;
  serverTime: FirebaseFirestore.Timestamp;
};
```

ב-Firebase callable functions בפועל שגיאות ייזרקו כ-`HttpsError`, אך success response חייב לעמוד במבנה `ApiSuccess<T>`.

---

### 2.6 Rate Limiting

Rate limiting נאכף server-side בלבד.

Path מומלץ:

```text
users/{uid}/usage/{yyyy-mm-dd}
```

Daily usage document:

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

#### Canonical Decisions

- Basic daily swipe limit נאכף ב-`submitSwipe`.
- ערך התחלתי מומלץ: `30/day`, לפי ADR-015, pending confirmation.
- AI limits מדויקים עדיין open לפי ADR-027.
- Timezone reset עדיין open לפי ADR-029.

---

### 2.7 Shared Type Registry

```ts
export type SkillLevel = "beginner" | "intermediate" | "pro" | "elite";

// רשימת הערכים הסופית של Platform pending לפי ADR-030.
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

export type SubscriptionTier = "basic" | "pro";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

// ספק התשלומים הסופי pending לפי ADR-017.
export type BillingProvider =
  | "stripe"
  | "cardcom"
  | "meshulam"
  | "other";

export type MatchStatus = "pending" | "matched" | "blocked" | "archived";

export type MessageType = "text" | "image" | "system";

export type MessageStatus = "sent" | "failed" | "deleted";

export type ShopItemCategory =
  | "avatar_border"
  | "profile_banner"
  | "global_background";

export type ShopItemRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

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
```

---

## 3. Callable Functions

---

### 3.1 `submitSwipe`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | יוצר swipe מסוג `like` או `skip`; במקרה של reciprocal like יוצר `matches/{matchId}` ו-`chats/{chatId}` באופן transactionally idempotent. |

#### Input Schema

```ts
export type SubmitSwipeInput = {
  targetUid: string;
  gameId: string;
  direction: "like" | "skip";
};
```

#### Output Schema

```ts
export type SubmitSwipeOutput = {
  result: "skipped" | "liked" | "matched";
  swipeId: string;
  matchId?: string;
  chatId?: string;
};
```

#### Validation Rules

- `request.auth` חייב להיות קיים.
- `targetUid` לא יכול להיות שווה ל-`request.auth.uid`.
- `gameId` חייב להתקיים ב-`gameCatalog/{gameId}` ולהיות active.
- caller חייב להיות לא suspended ולא deleted.
- caller חייב להיות עם onboarding complete.
- target חייב להתקיים ולהיות discoverable.
- target חייב להיות לא suspended ולא deleted.
- target חייב להכיל את `gameId` ב-`publicProfiles/{targetUid}.gameIds`.
- אין block בין הצדדים בשום כיוון.
- `direction` חייב להיות `like` או `skip`.
- Basic user כפוף ל-daily swipe limit.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | input לא תקין או `gameId`/`targetUid` חסרים. |
| `self_action_forbidden` | המשתמש מנסה לעשות swipe לעצמו. |
| `not_found` | target או game לא נמצא. |
| `failed_precondition` | onboarding incomplete או target לא discoverable. |
| `blocked` | block קיים באחד הכיוונים. |
| `resource_exhausted` | Basic daily swipe limit exceeded. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- Swipe ID deterministic: `{targetUid}_{gameId}`.
- Match ID deterministic: `{minUid}_{maxUid}_{gameId}`.
- Chat ID שווה ל-`matchId`.
- reciprocal match creation מתבצע ב-Firestore transaction.
- אם match/chat כבר קיימים, function מחזירה אותם במקום ליצור כפילות.

#### Side Effects

Writes:

- `users/{uid}/swipes/{targetUid_gameId}`
- `matches/{matchId}` כאשר reciprocal like קיים.
- `chats/{chatId}` כאשר reciprocal like קיים.
- `users/{uid}/usage/{yyyy-mm-dd}` עבור daily swipe count.
- analytics event פנימי, אם מופעל.

Reads:

- `users/{uid}`
- `publicProfiles/{targetUid}`
- `gameCatalog/{gameId}`
- `users/{uid}/blocks/{targetUid}`
- `users/{targetUid}/blocks/{uid}`
- reciprocal swipe document.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-015 — Basic Daily Swipe Limit
- ADR-016 — Unlimited Basic Matches
- ADR-021 — MVP Discovery Filters Limited to Game

#### Server-Owned Guarantees

- client לא יכול ליצור swipe ישירות.
- client לא יכול ליצור match ישירות.
- match נוצר רק ב-double opt-in.
- Basic limit נאכף server-side.
- blocked users לא יכולים ליצור match חדש.

---

### 3.2 `purchaseShopItem`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | רוכש cosmetic item באמצעות coins. Coins הם server-owned וכל שינוי מייצר transaction audit. |

#### Input Schema

```ts
export type PurchaseShopItemInput = {
  itemId: string;
  idempotencyKey?: string;
};
```

#### Output Schema

```ts
export type PurchaseShopItemOutput = {
  success: true;
  itemId: string;
  newCoinBalance: number;
  ownedItemIds: string[];
  transactionId: string;
};
```

#### Validation Rules

- user authenticated.
- user לא suspended/deleted.
- `itemId` קיים ב-`shopItems/{itemId}`.
- `shopItems/{itemId}.isActive = true`.
- user עדיין לא owns item.
- אם `requiresPro = true`, user חייב להיות active Pro.
- `users/{uid}.coins >= shopItems/{itemId}.priceCoins`.
- `priceCoins >= 0`.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | `itemId` חסר או לא תקין. |
| `not_found` | item או user לא נמצא. |
| `already_exists` | המשתמש כבר owns item. |
| `pro_required` | item דורש Pro והמשתמש Basic. |
| `insufficient_coins` | אין מספיק coins. |
| `failed_precondition` | item inactive או user suspended. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- הרכישה מתבצעת ב-Firestore transaction.
- ownership נבדק בתוך transaction.
- אם `idempotencyKey` מסופק, ניתן להשתמש בו ל-transaction record ID.
- double-click לא יגרום לכפל חיוב כי ownership נבדק לפני deduct.

#### Side Effects

Writes:

- `users/{uid}.coins`
- `users/{uid}.ownedItemIds`
- `users/{uid}/transactions/{transactionId}` — MVP לפי ADR-005.
- Scale/V1: `users/{uid}/ownedItems/{itemId}` אם source of truth עובר subcollection.

Reads:

- `users/{uid}`
- `shopItems/{itemId}`
- optionally `users/{uid}/ownedItems/{itemId}` ב-Scale/V1.

#### Relevant ADRs

- ADR-005 — MVP Coin Model
- ADR-006 — Backend-Authoritative Architecture
- ADR-011 — Unified Shop Taxonomy
- ADR-018 — Coins Used for Cosmetics Only in MVP
- ADR-034 — Coin Granting & Earning Mechanism

#### Server-Owned Guarantees

- client לא יכול להוריד coins ישירות.
- client לא יכול להוסיף owned item ישירות.
- כל coin mutation מייצר transaction audit.
- Pro-only item לא נרכש ללא active Pro.

---

### 3.3 `equipItem`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | מצייד cosmetic item שהמשתמש owns, ומסנכרן את reference ל-`users` ול-`publicProfiles`. |

#### Input Schema

```ts
export type EquipItemInput = {
  itemId: string;
};
```

#### Output Schema

```ts
export type EquipItemOutput = {
  success: true;
  itemId: string;
  category: ShopItemCategory;
  updatedCosmetics: {
    avatarBorderItemId?: string;
    globalBackgroundItemId?: string;
    profileBannerItemId?: string;
  };
};
```

#### Validation Rules

- user authenticated.
- user לא suspended/deleted.
- user owns `itemId`.
- `shopItems/{itemId}` קיים.
- item category חייב להיות אחד מ:
  - `avatar_border`
  - `profile_banner`
  - `global_background`
- אם `requiresPro = true`, user חייב להיות active Pro.
- item צריך להיות active, אלא אם product policy מאפשר equipped legacy items.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | `itemId` חסר או category לא תקין. |
| `not_found` | item לא נמצא. |
| `permission_denied` | המשתמש לא owns item. |
| `pro_required` | item דורש Pro. |
| `failed_precondition` | user suspended או item inactive. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- equip של item שכבר equipped מחזיר success ללא שינוי מהותי.
- update מתבצע ב-transaction או batch write.
- רק item אחד מכל category יכול להיות equipped.

#### Side Effects

Writes:

- `users/{uid}.avatarBorderItemId` עבור `avatar_border`.
- `users/{uid}.globalBackgroundItemId` עבור `global_background`.
- `publicProfiles/{uid}` fields מקבילים.
- Scale/V1: `users/{uid}/ownedItems/{itemId}.isEquipped`.
- Scale/V1: `discoveryProfiles/{gameId}/players/{uid}` cosmetic fields.

Reads:

- `users/{uid}`
- `shopItems/{itemId}`
- MVP: `users/{uid}.ownedItemIds`
- Scale/V1: `users/{uid}/ownedItems/{itemId}`

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-011 — Unified Shop Taxonomy
- ADR-012 — Avatar Border Stored as Shop Item Reference
- ADR-032 — Pro-Required Cosmetics After Pro Expiration

#### Server-Owned Guarantees

- client לא יכול לעדכן cosmetic references ישירות.
- raw CSS לא נשמר על user.
- ownership ו-Pro status נבדקים server-side.

---

### 3.4 `sendChatMediaMessage`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | מאשר ויוצר media message בצ׳אט. Media היא Pro-only ומחייבת backend validation. |

#### Input Schema

```ts
export type SendChatMediaMessageInput = {
  chatId: string;
  filePath: string;
  fileMimeType: string;
  fileSizeBytes: number;
  clientMessageId?: string;
};
```

#### Output Schema

```ts
export type SendChatMediaMessageOutput = {
  success: true;
  chatId: string;
  messageId: string;
  type: "image" | "video";
  fileUrl: string;
  createdAt: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- user authenticated.
- user active Pro.
- user participant ב-`chats/{chatId}`.
- chat `isActive = true`.
- אין block בין המשתתפים.
- file path שייך ל-user ול-chat.
- `fileMimeType` חייב להיות image או video MIME type מאושר (`image/jpeg`, `image/png`, `image/webp`, `video/webm`, `video/mp4` — ADR-041: הודעות וידאו מוקלטות הן Pro-only).
- `fileSizeBytes` <= limit מ-`system/config` או default.
- Basic user rejected.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `pro_required` | המשתמש אינו active Pro. |
| `not_found` | chat או file לא נמצא. |
| `permission_denied` | המשתמש אינו participant או file לא שייך לו. |
| `blocked` | block קיים בין המשתתפים. |
| `invalid_argument` | MIME/size/path לא תקינים. |
| `failed_precondition` | chat inactive או user suspended. |
| `resource_exhausted` | media upload rate limit. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- אם `clientMessageId` מסופק, ניתן להשתמש בו למניעת duplicate message.
- message creation צריך להיות atomic עם validation.
- retry לא צריך ליצור שתי הודעות אם אותה בקשה כבר אושרה.

#### Side Effects

Writes:

- `chats/{chatId}/messages/{messageId}`
- `chats/{chatId}` last-message fields דרך `onMessageCreated`.
- `users/{uid}/usage/{yyyy-mm-dd}.mediaUploadCount`.

Reads:

- `users/{uid}`
- `chats/{chatId}`
- participant user/block documents.
- Storage metadata for `filePath`.
- `system/config`.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-024 — Manual / Report-Based Image Moderation in MVP
- ADR-028 — Chat Abuse Threshold (open)

#### Server-Owned Guarantees

- Basic לא יכול לשלוח media גם אם UI נפרץ.
- message document נוצר רק אחרי Storage validation.
- file metadata נכתב על ידי backend, לא client.

---

### 3.5 `sendAIProfileReview`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | שולח בקשת AI ל-Gemini דרך server-side proxy לשיפור bio/profile. |

#### Input Schema

```ts
export type AIProfileReviewInput = {
  bio: string;
  games: Array<{
    gameId: string;
    name: string;
    rank: string;
    lookingFor: LookingFor;
    lookingForText?: string;
  }>;
  skillLevel: SkillLevel;
};
```

#### Output Schema

```ts
export type AIProfileReviewOutput = {
  summary: string;
  suggestedBio?: string;
  improvements: string[];
  warnings?: string[];
};
```

#### Validation Rules

- user authenticated.
- user לא suspended/deleted.
- `skillLevel` חייב להיות enum תקף.
- `bio` עומד ב-length limit.
- `games` לא ריק אם policy דורש.
- input עובר safety pre-check.
- user עומד ב-AI rate limit.
- advanced usage may require Pro בעתיד, אך MVP policy תלויה ב-ADR-027.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | input לא תקין. |
| `resource_exhausted` | AI rate limit. |
| `failed_precondition` | user suspended או feature disabled. |
| `permission_denied` | policy או tier לא מאפשרים שימוש. |
| `internal` | Gemini/API/proxy failure. |

#### Idempotency

- לא נדרשת idempotency מלאה.
- כל בקשה יוצרת `aiRequests/{requestId}` audit.
- retry יוצר בקשה חדשה אלא אם client מספק idempotency בעתיד.

#### Side Effects

Writes:

- `aiRequests/{requestId}` with `type = profile_optimization`.

Reads:

- `users/{uid}`
- `system/config`
- Secret Manager Gemini key.

External:

- Gemini API through server-side proxy only.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-007 — Gemini through server-side proxy only
- ADR-027 — AI request limits by tier open

#### Server-Owned Guarantees

- Gemini API key לא נשלח ל-client.
- system prompt לא נשלח ל-client.
- guardrails נשארים backend-only.
- אין שליחת private payment/account data ל-Gemini.

---

### 3.6 `sendAISquadAdvice`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | שולח בקשת AI לקבלת squad/gameplay coordination advice, ללא cheating/exploit content. |

#### Input Schema

```ts
export type AISquadAdviceInput = {
  gameId: string;
  gameName: string;
  rank?: string;
  playstyle?: string;
  squadContext?: string;
};
```

#### Output Schema

```ts
export type AISquadAdviceOutput = {
  strategyName: string;
  summary: string;
  roles?: Array<{
    role: string;
    description: string;
  }>;
  tips: string[];
  warnings?: string[];
};
```

#### Validation Rules

- user authenticated.
- user לא suspended/deleted.
- `gameId` חייב להיות known/active אם נדרש.
- text fields עומדים במגבלות length.
- input לא כולל cheating/exploits/harassment/doxxing.
- user עומד ב-AI rate limit.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | input לא תקין. |
| `resource_exhausted` | AI rate limit. |
| `failed_precondition` | feature disabled או user suspended. |
| `permission_denied` | policy/tier לא מאפשרים. |
| `internal` | Gemini/API/proxy failure. |

#### Idempotency

- כל בקשה יוצרת audit נפרד.
- אין mutation ל-user state מעבר ל-usage/audit.

#### Side Effects

Writes:

- `aiRequests/{requestId}` with `type = squad_advice`.
- `users/{uid}/usage/{yyyy-mm-dd}` AI counter.

Reads:

- `users/{uid}`
- `gameCatalog/{gameId}` אם validation דורש.
- Secret Manager Gemini key.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-007 — Gemini proxy only
- ADR-027 — AI limits open

#### Server-Owned Guarantees

- אין direct Gemini access מה-client.
- unsafe gameplay requests נחסמות.
- אין חשיפת prompt או moderation internals.

---

### 3.7 `createReport`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | יוצר report על profile/chat/message לצורכי moderation. |

#### Input Schema

```ts
export type CreateReportInput = {
  reportedUid: string;
  source: "profile" | "chat" | "message";
  chatId?: string;
  messageId?: string;
  reason: ReportReason;
  description?: string;
};
```

#### Output Schema

```ts
export type CreateReportOutput = {
  success: true;
  reportId: string;
  status: "open";
};
```

#### Validation Rules

- user authenticated.
- `reportedUid !== uid`.
- `reason` חייב להיות enum תקף.
- אם `source = chat`, `chatId` חובה וה-reporter חייב להיות participant.
- אם `source = message`, `chatId` ו-`messageId` חובה, וה-message חייב להיות ב-chat.
- `description` עומד ב-length limit.
- user לא suspended/deleted.
- report spam rate limit לפי policy עתידי.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | input חסר או לא עקבי. |
| `self_action_forbidden` | משתמש מדווח על עצמו. |
| `not_found` | reported user/chat/message לא נמצא. |
| `permission_denied` | אין גישה ל-chat/message. |
| `resource_exhausted` | report spam limit. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- ברירת מחדל: reports הם generated IDs.
- Scale/V1 יכול למנוע duplicates עם hash של `(reporterUid, reportedUid, source, messageId, reason, date)`.

#### Side Effects

Writes:

- `reports/{reportId}` with `status = open`.

Reads:

- `users/{uid}`
- `publicProfiles/{reportedUid}` או `users/{reportedUid}` לפי צורך.
- `chats/{chatId}`
- `chats/{chatId}/messages/{messageId}` אם source message.

#### Relevant ADRs

- ADR-024 — Manual / Report-Based Image Moderation in MVP
- ADR-006 — Backend-Authoritative Architecture

#### Server-Owned Guarantees

- `reporterUid` נלקח מ-auth, לא מה-client.
- `status` מתחיל תמיד כ-`open`.
- reports אינם readable למשתמשים רגילים.

---

### 3.8 `blockUser`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | יוצר block חד-כיווני ומעדכן/משפיע על discovery, matching ו-chat. |

#### Input Schema

```ts
export type BlockUserInput = {
  blockedUid: string;
  reason?: string;
};
```

#### Output Schema

```ts
export type BlockUserOutput = {
  success: true;
  blockedUid: string;
  affectedMatchIds: string[];
  affectedChatIds: string[];
};
```

#### Validation Rules

- user authenticated.
- `blockedUid !== uid`.
- target user exists.
- reason optional ועומד ב-length limit.
- user לא suspended/deleted.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | `blockedUid` חסר. |
| `self_action_forbidden` | משתמש מנסה לחסום את עצמו. |
| `not_found` | target user לא נמצא. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- Block ID deterministic: `users/{uid}/blocks/{blockedUid}`.
- אם block כבר קיים, function מחזירה success.
- updates ל-match/chat צריכים להיות retry-safe.

#### Side Effects

Writes:

- `users/{uid}/blocks/{blockedUid}`
- `matches/{matchId}.status = blocked` כאשר match קיים.
- `chats/{chatId}.isActive = false` כאשר chat קיים.
- Scale/V1: update discovery read models if needed.

Reads:

- `users/{uid}`
- `users/{blockedUid}`
- existing matches/chats between users.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-024 — Safety baseline

#### Server-Owned Guarantees

- block משפיע server-side, לא רק UI.
- blocked users לא יכולים להמשיך chat.
- future discovery excludes blocked users.

---

### 3.9 `syncPublicProfile`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user |
| Description | מסנכרן מחדש את `publicProfiles/{uid}` מתוך `users/{uid}` ו-`users/{uid}/games`. משמש fallback / repair. |

#### Input Schema

```ts
export type SyncPublicProfileInput = {
  uid?: string;
};
```

#### Output Schema

```ts
export type SyncPublicProfileOutput = {
  success: true;
  uid: string;
  syncedAt: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- user authenticated.
- user רגיל יכול לסנכרן רק את עצמו.
- admin יכול לסנכרן `uid` אחר.
- source user חייב להתקיים.
- אם `isDeleted = true`, public profile צריך להיות hidden/soft-deleted.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `permission_denied` | משתמש מנסה לסנכרן user אחר ללא admin. |
| `not_found` | user לא נמצא. |
| `failed_precondition` | onboarding incomplete. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- כתיבה ל-`publicProfiles/{uid}` היא upsert deterministic.
- ניתן להריץ שוב ללא נזק.

#### Side Effects

Writes:

- `publicProfiles/{uid}`

Reads:

- `users/{uid}`
- `users/{uid}/games/{gameId}`
- `subscriptions/{uid}` optionally.

#### Relevant ADRs

- ADR-003 — Canonical Data Model
- ADR-006 — Backend-Authoritative Architecture
- ADR-010 — `platforms`

#### Server-Owned Guarantees

- public profile לא נכתב ישירות על ידי client.
- private fields לא מועתקים ל-public profile.

---

### 3.10 `getDiscoveryDeck`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | Scale/V1 |
| Auth requirement | Authenticated user |
| Description | מחזיר backend-generated deck עם filtering/ranking מרכזי. מחליף client-filtered batch בסקייל. |

#### Input Schema

```ts
export type GetDiscoveryDeckInput = {
  gameId: string;
  filters?: {
    skillLevel?: SkillLevel;
    platforms?: Platform[];
    rankMinScore?: number;
    rankMaxScore?: number;
    ageMin?: number;
    ageMax?: number;
  };
  limit?: number;
  cursor?: string;
};
```

#### Output Schema

```ts
export type DiscoveryDeckCard = {
  uid: string;
  displayName: string;
  age: number;
  bio: string;
  skillLevel: SkillLevel;
  platforms: Platform[];
  profileImageUrl?: string;
  bannerImageUrl?: string;
  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;
  gameId: string;
  rank: string;
  lookingFor: LookingFor;
  lookingForText?: string;
  isPro: boolean;
  verifiedBadge: boolean;
};

export type GetDiscoveryDeckOutput = {
  cards: DiscoveryDeckCard[];
  nextCursor?: string;
};
```

#### Validation Rules

- user authenticated.
- `gameId` active.
- user onboarding complete.
- filters תקפים לפי enums.
- limit capped server-side.
- exclude:
  - self
  - already swiped
  - already matched
  - blocked either direction
  - suspended/deleted users

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | filters/limit/cursor לא תקינים. |
| `not_found` | game לא נמצא. |
| `failed_precondition` | onboarding incomplete. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- read-only; no user state mutation except optional analytics/counter.
- cursor must be stable for the query window if implemented.

#### Side Effects

Reads:

- `discoveryProfiles/{gameId}/players/{uid}`
- user swipes/matches/blocks
- `users/{uid}`

Writes:

- optional analytics/usage only.

#### Relevant ADRs

- ADR-021 — MVP filters by game only; advanced filters V1
- ADR-006 — Backend-Authoritative Architecture

#### Server-Owned Guarantees

- eligibility filtering מתבצע server-side.
- client מקבל רק cards מותרים.

---

### 3.11 `grantCoins`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | Scale/V1 |
| Auth requirement | Admin/service only |
| Description | מעניק coins ידנית למשתמש עבור support/campaign/admin operations. |

> הערה: אף ש-`grantCoins` עצמו מוגדר Scale/V1 ככלי admin רחב, `admin_grant` ו-`signup_bonus` כ-transaction types קיימים כבר ב-MVP לפי ADR-034, וכל coin mutation מחייב `transactions` כבר ב-MVP לפי ADR-005.

#### Input Schema

```ts
export type GrantCoinsInput = {
  uid: string;
  amountCoins: number;
  type: "admin_grant" | "signup_bonus" | "refund" | "system_adjustment";
  reason?: string;
  idempotencyKey?: string;
};
```

#### Output Schema

```ts
export type GrantCoinsOutput = {
  success: true;
  uid: string;
  amountCoins: number;
  newCoinBalance: number;
  transactionId: string;
};
```

#### Validation Rules

- caller admin/service only.
- `amountCoins > 0` עבור grants.
- `uid` exists.
- reason required לפי admin policy.
- idempotency key מומלץ עבור campaign/batch grants.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context/service identity. |
| `permission_denied` | caller לא admin. |
| `invalid_argument` | amount/type לא תקינים. |
| `not_found` | user לא נמצא. |
| `already_exists` | idempotency key כבר נוצל. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- `idempotencyKey` יכול לשמש כ-transaction ID.
- transaction בודקת שלא קיימת transaction עם אותו key.
- balance update ו-audit write באותה transaction.

#### Side Effects

Writes:

- `users/{uid}.coins`
- `users/{uid}/transactions/{transactionId}`

Reads:

- `users/{uid}`

#### Relevant ADRs

- ADR-005 — כל coin mutation מחייב transaction audit.
- ADR-034 — signup bonus + admin grant only in MVP.
- ADR-006 — Backend-authoritative.

#### Server-Owned Guarantees

- client רגיל לא יכול להעניק לעצמו coins.
- כל grant auditable.

---

### 3.12 `reconcileSubscription`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | Scale/V1 |
| Auth requirement | Admin/service only |
| Description | מאמת subscription state מול payment provider ומתקן entitlement drift. |

#### Input Schema

```ts
export type ReconcileSubscriptionInput = {
  uid: string;
};
```

#### Output Schema

```ts
export type ReconcileSubscriptionOutput = {
  success: true;
  uid: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isPro: boolean;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  reconciledAt: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- caller admin/service only.
- `uid` exists.
- subscription/provider mapping exists.
- provider API available.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `permission_denied` | caller לא admin/service. |
| `not_found` | user/subscription/provider customer לא נמצא. |
| `failed_precondition` | provider לא מוגדר. |
| `internal` | provider/API failure. |

#### Idempotency

- safe to rerun.
- writes canonical state from provider truth.
- does not create duplicate billing records.

#### Side Effects

Writes:

- `subscriptions/{uid}`
- `users/{uid}.subscriptionTier`
- `users/{uid}.subscriptionStatus`
- `users/{uid}.subscriptionExpiresAt`
- `users/{uid}.isPro`
- `publicProfiles/{uid}.isPro`
- `publicProfiles/{uid}.verifiedBadge`

Reads:

- payment provider API.
- `subscriptions/{uid}`
- `users/{uid}`

#### Relevant ADRs

- ADR-017 — Payment provider TBD
- ADR-006 — Backend-authoritative
- ADR-025 — verifiedBadge means Pro member

#### Server-Owned Guarantees

- client לא יכול לשנות Pro entitlement.
- provider truth גובר על client state.

---

### 3.13 `createCheckoutSession`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated user (not suspended/deleted) |
| Description | יוצר provider checkout session עבור מנוי Pro ומחזיר `checkoutUrl`. אינו מעניק Pro — Pro מוענק אך ורק דרך `paymentWebhook` מאומת signature. |

#### Input Schema

```ts
export type CreateCheckoutSessionInput = {
  successUrl?: string;
  cancelUrl?: string;
};
```

#### Output Schema

```ts
export type CreateCheckoutSessionOutput = {
  provider: BillingProvider;
  checkoutSessionId: string;
  checkoutUrl: string;
  expiresAt?: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- user authenticated.
- user לא suspended/deleted.
- user אינו כבר active Pro, אחרת `failed_precondition`.
- יצירה או שימוש חוזר ב-`providerCustomerId`.
- הזרקת `uid`, `tier = "pro"`, environment ל-provider metadata.
- `tier = "pro"`.
- `priceAmount = 29.90`.
- `currency = "ILS"`.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `failed_precondition` | user כבר Pro, suspended, או billing disabled. |
| `internal` | provider/checkout creation failure. |

#### Idempotency

- מומלץ למנוע יצירת checkout כפול אם כבר קיים active subscription.
- אם קיימת subscription פעילה או `isPro = true`, יש להחזיר `failed_precondition`.
- אם provider תומך session reuse, ניתן להחזיר checkout session קיים שעדיין לא פג במקום ליצור חדש.
- redirect/callback אינם idempotency proof ואינם מעניקים entitlement.

#### Side Effects

Reads:

- `users/{uid}`
- `users/{uid}/private/account`
- `subscriptions/{uid}`

Writes:

- אופציונלית כותב `providerCustomerId` ל-`users/{uid}/private/account` או ל-`subscriptions/{uid}` כ-server-owned field.
- אינו כותב Pro state.
- אינו כותב `isPro`, `subscriptionTier`, `subscriptionStatus`, `subscriptionExpiresAt`, או `verifiedBadge`.

External:

- יוצר checkout session אצל payment provider.

#### Relevant ADRs

- ADR-006 — Backend-Authoritative Architecture
- ADR-017 — Payment provider TBD

#### Server-Owned Guarantees

- redirect/checkout לבדם אינם מעניקים Pro.
- entitlement מתעדכן רק דרך `paymentWebhook` מאומת signature.
- client לא כותב subscription/Pro state.
- provider metadata נבנה server-side ולא נשלט על ידי client.

---

### 3.14 `deleteAccount`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated owner |
| Description | מוחק את חשבון המשתמש ואת הנתונים המשויכים (או מבצע anonymization) בצורה backend-authoritative, בכפוף ל-retention/legal. נדרש על ידי App Store ו-Google Play (ADR-038). |

#### Input Schema

```ts
export type DeleteAccountInput = {
  confirm: true;
  reason?: string;
};
```

#### Output Schema

```ts
export type DeleteAccountOutput = {
  success: true;
  uid: string;
  deletionScheduledAt: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- user authenticated; הפעולה על ה-`uid` של המבקש בלבד.
- `confirm === true`.
- reauthentication עדכני אם נדרש על ידי policy.
- מנוי Pro פעיל מטופל/מבוטל לפי כללי הספק לפני מחיקה.
- user data נמחק או עובר anonymization; נשמרים רק רשומות שנדרשות לפי billing/safety/legal retention.
- `isDeleted = true`; המשתמש מוסר מ-discovery.

#### Error Codes

| Code | מתי |
|---|---|
| `unauthenticated` | אין auth. |
| `failed_precondition` | `confirm` חסר, או חסימה אחרת (למשל reauth נדרש). |
| `internal` | כשל מחיקה. |

#### Server-Owned Guarantees

- המחיקה backend-authoritative; client לא יכול למחוק משתמש אחר.
- retention exceptions לפי `PRIVACY_AND_TERMS.md` והדין.
- audit בטוח-פרטיות (ללא PII בלוגים).

---

### 3.15 `completeOnboarding`

| Field | Value |
|---|---|
| Type | Callable Function |
| Scope | MVP |
| Auth requirement | Authenticated owner |
| Description | משלים onboarding באופן backend-authoritative: מעדכן את שדות הפרופיל, יוצר את משחק-הבסיס, מסמן `onboardingCompleted = true` ויוצר את `publicProfiles/{uid}`. נדרש כי `onboardingCompleted` ו-`publicProfiles` הם server-owned, ויצירת game doc ב-rules מותנית ב-onboarding שהושלם. |

#### Input Schema

```ts
export type CompleteOnboardingInput = {
  profile: {
    displayName: string;
    age: number;            // מינימום 16 (ADR-013)
    bio: string;
    skillLevel: SkillLevel;
    platforms: Platform[];  // לפחות אחת
  };
  game: {
    gameId: string;         // חייב להתקיים ב-gameCatalog ולהיות isActive
    rank: string;
    lookingFor: LookingFor;
    lookingForText?: string;
    voicePreference?: VoicePreference;
  };
};
```

#### Output Schema

```ts
export type CompleteOnboardingOutput = {
  success: true;
  uid: string;
  completedAt: FirebaseFirestore.Timestamp;
};
```

#### Validation Rules

- user authenticated; הפעולה על ה-`uid` של המבקש בלבד.
- `users/{uid}` קיים (bootstrap הושלם); לא suspended/deleted.
- Zod על כל הקלט: enums קנוניים בלבד, `age >= 16`, `platforms.length >= 1`, אורכי שדות לפי DATA_MODEL.
- `gameCatalog/{gameId}` קיים ו-`isActive == true`.
- קריאה חוזרת מותרת (עדכון) — idempotent.

#### Error Codes

| Error Code | מקרה |
|---|---|
| `unauthenticated` | אין Auth context. |
| `invalid_argument` | קלט לא עובר Zod. |
| `not_found` | user doc או game catalog לא נמצאו. |
| `failed_precondition` | user suspended/deleted או game לא פעיל. |
| `internal` | כשל לא צפוי. |

#### Idempotency

- batch write דטרמיניסטי; ריצה חוזרת מעדכנת לאותו state.

#### Side Effects

Writes (atomic batch):

- `users/{uid}` — שדות פרופיל client-writable + `onboardingCompleted = true` + `updatedAt`.
- `users/{uid}/games/{gameId}` — יצירה/עדכון עם `name`/`iconUrl` מהקטלוג.
- `publicProfiles/{uid}` — upsert מלא (כולל `gameIds`, `primaryGameId`, `primaryRank`).

#### Relevant ADRs

- ADR-003, ADR-004, ADR-006, ADR-010, ADR-013, ADR-019, ADR-021.

#### Server-Owned Guarantees

- `onboardingCompleted` נכתב רק כאן (ובאדמין).
- `publicProfiles` נכתב רק server-side; אין העתקת שדות פרטיים.

---

## 4. HTTP / Webhook Functions

---

### 4.1 `paymentWebhook`

| Field | Value |
|---|---|
| Type | HTTP/Webhook Function |
| Scope | MVP |
| Auth requirement | No Firebase Auth; provider signature required |
| Description | מקבל events מספק התשלומים (RevenueCat abstraction, ADR-037), מאמת signature, ומסנכרן Pro entitlement ל-Firestore. הספק הבסיסי עדיין TBD לפי ADR-017, ולכן החוזה provider-agnostic. |

#### Request

HTTP POST from payment provider.

Headers provider-specific:

```ts
export type PaymentWebhookHeaders = {
  signatureHeader: string;
  providerEventId?: string;
};
```

Body provider-specific raw payload. חובה להשתמש ב-raw body עבור signature verification.

#### Normalized Event Schema

```ts
export type NormalizedPaymentEvent = {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  providerCustomerId: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodStart?: FirebaseFirestore.Timestamp;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;
  priceAmount: number;
  currency: "ILS";
};
```

#### Response

```ts
export type PaymentWebhookResponse = {
  received: true;
  eventId: string;
  processed: boolean;
};
```

#### Signature Verification

- לא לעבד webhook ללא valid signature.
- להשתמש ב-secret מ-Secret Manager.
- לא להסתמך על fields מתוך body לפני verification.
- להחזיר HTTP 400/401 עבור invalid signature לפי provider convention.

#### Event Parsing

ה-function ממפה provider event ל-normalized event:

- customer created/updated
- subscription created
- subscription activated
- subscription renewed
- payment failed
- subscription cancelled
- subscription expired

#### Customer → UID Mapping

אפשרויות mapping:

1. `providerCustomerId` שמור ב-`users/{uid}/private/account.paymentCustomerId`.
2. `providerCustomerId` שמור ב-`subscriptions/{uid}.providerCustomerId`.
3. metadata ב-provider checkout session כולל `uid`.

החוזה מחייב שה-backend יוכל למפות event ל-`uid` לפני עדכון entitlement.

#### Writes

- `subscriptions/{uid}`
- `users/{uid}`:
  - `subscriptionTier`
  - `subscriptionStatus`
  - `subscriptionExpiresAt`
  - `isPro`
- `publicProfiles/{uid}`:
  - `isPro`
  - `verifiedBadge`
- Scale/V1:
  - `billingEvents/{eventId}`

#### Idempotency & Retry

- provider event ID משמש idempotency key.
- אם event כבר processed, להחזיר success without duplicate mutation.
- function חייבת להיות retry-safe.
- failed transient provider mapping יכול להיות logged ולהחזיר retryable status לפי provider convention.

#### Security

- לא משתמש ב-Firebase Auth.
- חובה signature verification.
- חובה Secret Manager.
- אין logging של raw sensitive payment payload.
- אין client route שמאפשר קריאה ידנית ל-webhook.

#### Error Behavior

| HTTP Status | מקרה |
|---|---|
| `200` | event התקבל ועובד או כבר עובד בעבר. |
| `400` | payload invalid או unsupported event. |
| `401` | signature invalid. |
| `404` | לא נמצא mapping ל-user, אם provider דורש retry לא להשתמש ב-404. |
| `500` | transient internal failure, provider may retry. |

#### Relevant ADRs

- ADR-017 — Payment provider TBD
- ADR-006 — Backend-authoritative
- ADR-025 — verifiedBadge means Pro member

---

### 4.2 `checkoutSessionCallback`

| Field | Value |
|---|---|
| Type | HTTP Function |
| Scope | Scale/V1 |
| Auth requirement | Provider/session validation |
| Description | מטפל ב-callback redirect אחרי checkout אם provider דורש backend callback. |

#### Contract

```ts
export type CheckoutSessionCallbackQuery = {
  sessionId?: string;
  provider?: BillingProvider;
  status?: "success" | "cancelled" | "failed";
};
```

#### Behavior

- לא מעניק Pro בעצמו.
- מציג redirect ל-client route מתאים.
- entitlement מתעדכן רק דרך `paymentWebhook`.
- יכול לשמור lightweight callback log אם נדרש.

#### Side Effects

- בדרך כלל none.
- optional analytics/callback log.

#### Idempotency

- safe to refresh.
- no entitlement mutation.

---

### 4.3 `scheduledSubscriptionReconciliation`

| Field | Value |
|---|---|
| Type | Scheduled HTTP/Cloud Scheduler Function |
| Scope | Scale/V1 |
| Auth requirement | Service account only |
| Description | job תקופתי שמוודא ש-Firestore subscription state תואם provider truth. |

#### Behavior

- fetch active/past_due subscriptions.
- compare with provider.
- update drift.
- log failures.
- rate limit provider API calls.

#### Writes

- `subscriptions/{uid}`
- `users/{uid}`
- `publicProfiles/{uid}`
- `billingEvents/{eventId}` optional

#### Idempotency

- safe to rerun.
- provider truth is canonical.

---

### 4.4 `scheduledUsageCleanup`

| Field | Value |
|---|---|
| Type | Scheduled Function |
| Scope | Scale/V1 |
| Auth requirement | Service account only |
| Description | מנקה או מגלגל usage counters ישנים. |

#### Behavior

- מוחק/מארכב `users/{uid}/usage/{yyyy-mm-dd}` ישנים לפי retention policy.
- לא מוחק audit financial-like records.
- timezone/reset policy תלוי ADR-029.

#### Writes

- `users/{uid}/usage/{date}` delete/archive.
- optional aggregate analytics.

#### Idempotency

- safe to rerun.
- deletion based on date threshold.

---

## 5. Firestore Triggers

---

### 5.1 `onUserProfileUpdated`

| Field | Value |
|---|---|
| Event | `onWrite` or `onUpdate` |
| Path | `users/{uid}` |
| Scope | MVP |
| Purpose | מסנכרן fields ציבוריים ל-`publicProfiles/{uid}` ומונע חשיפת private fields. |

#### Reads

- `users/{uid}`
- `users/{uid}/games/{gameId}` active games
- `subscriptions/{uid}` optionally

#### Writes

- `publicProfiles/{uid}`
- Scale/V1: `discoveryProfiles/{gameId}/players/{uid}`

#### Idempotency / Retry Safety

- upsert deterministic ל-`publicProfiles/{uid}`.
- אם user deleted/suspended, update visibility flags.
- no duplicate documents.

---

### 5.2 `onUserGameUpdated`

| Field | Value |
|---|---|
| Event | `onWrite` |
| Path | `users/{uid}/games/{gameId}` |
| Scope | MVP |
| Purpose | מעדכן `publicProfiles/{uid}.gameIds`, `primaryGameId`, `primaryRank`; Scale/V1 מעדכן discovery profile per game. |

#### Reads

- all active `users/{uid}/games`
- `users/{uid}`
- `gameCatalog/{gameId}`

#### Writes

- `publicProfiles/{uid}`
- Scale/V1: `discoveryProfiles/{gameId}/players/{uid}`

#### Idempotency / Retry Safety

- recompute from source of truth.
- no append-only duplicate mutation.
- safe to rerun.

---

### 5.3 `onSubscriptionUpdated`

| Field | Value |
|---|---|
| Event | `onWrite` |
| Path | `subscriptions/{uid}` |
| Scope | MVP |
| Purpose | מסנכרן subscription entitlement ל-`users` ו-`publicProfiles`. |

#### Reads

- `subscriptions/{uid}`
- `users/{uid}`

#### Writes

- `users/{uid}`:
  - `subscriptionTier`
  - `subscriptionStatus`
  - `subscriptionExpiresAt`
  - `isPro`
- `publicProfiles/{uid}`:
  - `isPro`
  - `verifiedBadge`
- Scale/V1: `discoveryProfiles/{gameId}/players/{uid}`

#### Idempotency / Retry Safety

- derived fields מחושבים מתוך `subscriptions/{uid}`.
- safe to rerun.
- no billing side effects.

---

### 5.4 `onMessageCreated`

| Field | Value |
|---|---|
| Event | `onCreate` |
| Path | `chats/{chatId}/messages/{messageId}` |
| Scope | MVP |
| Purpose | מעדכן chat metadata לאחר יצירת message. |

#### Reads

- `chats/{chatId}`
- created message

#### Writes

- `chats/{chatId}`:
  - `lastMessage`
  - `lastMessageType`
  - `lastMessageSenderId`
  - `lastTimestamp`
  - `unreadCounts`
  - `updatedAt`

#### Idempotency / Retry Safety

- event יכול לרוץ יותר מפעם אחת; update צריך להיות based on message timestamp.
- אם chat already has newer `lastTimestamp`, לא לדרוס עם message ישן.
- unread increment צריך להיזהר מכפל retry; מומלץ transaction עם processed marker ב-Scale/V1 אם נצפים duplicates.

---

### 5.5 `onBlockCreated`

| Field | Value |
|---|---|
| Event | `onCreate` |
| Path | `users/{uid}/blocks/{blockedUid}` |
| Scope | MVP |
| Purpose | מפעיל השלכות block על matches/chats/discovery. |

#### Reads

- `users/{uid}/blocks/{blockedUid}`
- existing match between users, if any
- existing chat between users, if any

#### Writes

- `matches/{matchId}.status = blocked`
- `chats/{chatId}.isActive = false`
- Scale/V1: discovery read model updates if needed.

#### Idempotency / Retry Safety

- setting status to same value is safe.
- deterministic match ID enables direct lookup.
- safe to rerun.

---

### 5.6 `onShopItemUpdated`

| Field | Value |
|---|---|
| Event | `onWrite` |
| Path | `shopItems/{itemId}` |
| Scope | Scale/V1 |
| Purpose | מעדכן caches/indexes או מטפל בפריט שהפך inactive. |

#### Reads

- `shopItems/{itemId}`
- affected users only if policy requires.

#### Writes

- optional catalog cache.
- optional unequip policy for inactive/Pro-required items.

#### Idempotency / Retry Safety

- derived cache recompute only.
- no duplicate ownership changes.

---

### 5.7 `onUserDeleted`

| Field | Value |
|---|---|
| Event | `onUpdate` or Auth delete trigger |
| Path | `users/{uid}` or Firebase Auth user delete |
| Scope | Scale/V1 |
| Purpose | soft-delete/hide public and discovery data after account deletion. |

#### Reads

- `users/{uid}`
- active games
- public profile

#### Writes

- `publicProfiles/{uid}.isDeleted = true`
- Scale/V1: `discoveryProfiles/{gameId}/players/{uid}.isDeleted = true`
- active chats/matches policy TBD.

#### Idempotency / Retry Safety

- setting deleted flags is safe.
- no hard delete until retention policy decided.

---

### 5.8 `onReportCreated`

| Field | Value |
|---|---|
| Event | `onCreate` |
| Path | `reports/{reportId}` |
| Scope | Scale/V1 |
| Purpose | מפעיל moderation workflow או notification ל-admin queue. |

#### Reads

- `reports/{reportId}`
- `users/{reportedUid}`
- source chat/message if needed.

#### Writes

- optional moderation queue.
- optional `moderationActions/{actionId}` only after admin decision.
- notification/log.

#### Idempotency / Retry Safety

- no automatic punishment on report create.
- queue item should use deterministic ID or processed marker.

---

### 5.9 `onUserCreated`

| Field | Value |
|---|---|
| Event | `onCreate` |
| Path | `users/{uid}` |
| Scope | MVP |
| Purpose | משלים bootstrap של משתמש חדש: ממלא server-owned defaults על `users/{uid}` ויוצר את `users/{uid}/private/account`. ה-client יוצר את המסמך עם client-writable keys בלבד (SECURITY §4), והטריגר משלים את היתר. |

#### Reads

- `users/{uid}` (snapshot של המסמך שנוצר).
- Firebase Auth user record (email, provider) דרך Admin SDK.

#### Writes

- `users/{uid}` — merge של server-owned defaults (MIGRATION_PLAN §2.2): `uid`, `email`, `onboardingCompleted=false`, `coins=0`, `subscriptionTier="basic"`, `subscriptionStatus="none"`, `isPro=false`, `ownedItemIds=[]`, `isSuspended=false`, `isDeleted=false`, timestamps.
- `users/{uid}/private/account` — יצירה עם `email`, `authProvider`, `moderationState="clean"`, timestamps.

#### Idempotency / Retry Safety

- כל הכתיבות ב-merge; שדות קיימים לא נדרסים (set-if-missing).
- retry של הטריגר בטוח — אין side effects כפולים.
- הענקת `signup_bonus` (ADR-034) מתווספת לטריגר זה ב-Phase 5 עם `transactions` audit.

---

## 6. טבלת סיכום

| Function | Type | Scope | Auth | Idempotent | Writes |
|---|---|---|---|---|---|
| `submitSwipe` | Callable | MVP | Authenticated | כן — deterministic swipe/match/chat IDs + transaction | `swipes`, `matches`, `chats`, `usage` |
| `purchaseShopItem` | Callable | MVP | Authenticated | כן — transaction + ownership check | `users.coins`, `ownedItemIds`, `transactions` |
| `equipItem` | Callable | MVP | Authenticated | כן — repeated equip safe | `users`, `publicProfiles`, Scale: `ownedItems`, `discoveryProfiles` |
| `sendChatMediaMessage` | Callable | MVP | Authenticated + Pro | חלקית — `clientMessageId` recommended | `messages`, `usage`; trigger updates `chats` |
| `sendAIProfileReview` | Callable | MVP | Authenticated | לא נדרש; each request audited | `aiRequests`, `usage` |
| `sendAISquadAdvice` | Callable | MVP | Authenticated | לא נדרש; each request audited | `aiRequests`, `usage` |
| `createReport` | Callable | MVP | Authenticated | חלקית; duplicate policy future | `reports` |
| `blockUser` | Callable | MVP | Authenticated | כן — deterministic block ID | `blocks`, `matches`, `chats` |
| `syncPublicProfile` | Callable | MVP | Authenticated owner/admin | כן — deterministic upsert | `publicProfiles`, Scale: `discoveryProfiles` |
| `getDiscoveryDeck` | Callable | Scale/V1 | Authenticated | Read-only | optional analytics/usage |
| `grantCoins` | Callable | Scale/V1 | Admin/service | כן — idempotency key | `users.coins`, `transactions` |
| `reconcileSubscription` | Callable | Scale/V1 | Admin/service | כן — provider truth | `subscriptions`, `users`, `publicProfiles` |
| `createCheckoutSession` | Callable | MVP | Authenticated | חלקית — block duplicate active subscription | provider session; optional providerCustomerId |
| `deleteAccount` | Callable | MVP | Authenticated owner | כן — idempotent on `isDeleted` | `users`, `publicProfiles`, cascading deletion/anonymization |
| `completeOnboarding` | Callable | MVP | Authenticated owner | כן — deterministic batch | `users` (+`onboardingCompleted`), `users/{uid}/games`, `publicProfiles` |
| `paymentWebhook` | HTTP/Webhook | MVP | Provider signature | כן — provider event ID | `subscriptions`, `users`, `publicProfiles`, Scale: `billingEvents` |
| `checkoutSessionCallback` | HTTP | Scale/V1 | Provider/session | כן — no entitlement mutation | optional logs |
| `scheduledSubscriptionReconciliation` | Scheduled | Scale/V1 | Service account | כן | `subscriptions`, `users`, `publicProfiles` |
| `scheduledUsageCleanup` | Scheduled | Scale/V1 | Service account | כן | `usage` cleanup/archive |
| `onUserCreated` | Firestore Trigger | MVP | Admin SDK trigger | כן — set-if-missing merge | `users` server-owned defaults, `users/{uid}/private/account` |
| `onUserProfileUpdated` | Firestore Trigger | MVP | Admin SDK trigger | כן | `publicProfiles`, Scale: `discoveryProfiles` |
| `onUserGameUpdated` | Firestore Trigger | MVP | Admin SDK trigger | כן | `publicProfiles`, Scale: `discoveryProfiles` |
| `onSubscriptionUpdated` | Firestore Trigger | MVP | Admin SDK trigger | כן | `users`, `publicProfiles`, Scale: `discoveryProfiles` |
| `onMessageCreated` | Firestore Trigger | MVP | Admin SDK trigger | retry-safe with timestamp guard | `chats` |
| `onBlockCreated` | Firestore Trigger | MVP | Admin SDK trigger | כן | `matches`, `chats`, Scale: `discoveryProfiles` |
| `onShopItemUpdated` | Firestore Trigger | Scale/V1 | Admin SDK trigger | כן | catalog caches / policy actions |
| `onUserDeleted` | Firestore/Auth Trigger | Scale/V1 | Admin SDK trigger | כן | `publicProfiles`, `discoveryProfiles` |
| `onReportCreated` | Firestore Trigger | Scale/V1 | Admin SDK trigger | כן | moderation queue/logs |

---

## 7. Open Items

| Item | Status | משפיע על |
|---|---|---|
| Payment provider final selection | Open / Proposed pending confirmation via ADR-017 | `paymentWebhook`, checkout flow, webhook headers, provider event mapping |
| Exact Basic daily swipe limit | Proposed pending confirmation via ADR-015 | `submitSwipe`, `system/config.limits.basicDailySwipeLimit` |
| AI request limits per tier | Open via ADR-027 | `sendAIProfileReview`, `sendAISquadAdvice`, `users/{uid}/usage` |
| Chat abuse threshold | Open via ADR-028 | `sendChatMediaMessage`, text message rules/triggers |
| Daily reset timezone | Open via ADR-029 | `users/{uid}/usage/{yyyy-mm-dd}`, scheduled cleanup |
| Final `Platform` vocabulary | Open via ADR-030 | `getDiscoveryDeck` filters, profile validation |
| Maximum `bio` length | Open via ADR-031 | profile validation, AI input validation |
| Pro-required cosmetics after Pro expiration | Open via ADR-032 | `equipItem`, `onSubscriptionUpdated`, shop UI |
| Whether `grantCoins` should be exposed as callable admin or internal-only job | Open | admin tooling, support operations |
| Whether `reports` are created only via `createReport` or allowed by Firestore Rules | Recommended: function only | Security Rules, moderation workflow |
