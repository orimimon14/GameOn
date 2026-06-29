# Swish & Game System Architecture & Technical Design Document

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Target Production Architecture Draft |
| Author | Principal Software Architect |
| Target Platform | Mobile-first responsive web application |
| Stack | React + Vite + TypeScript + Tailwind CSS + Framer Motion; bidirectional i18n he/en (ADR-035); Firebase Auth, Firestore, Storage, Cloud Functions; Gemini via server-side proxy; RevenueCat billing abstraction (ADR-037); web now, Capacitor for future App Store / Google Play (ADR-036); cosmetic FX via Rive/Lottie/PixiJS/alpha-video (ADR-039) |
| Architecture Style | Firebase-first, serverless, event-driven, real-time, mobile-first web |
| Repository Path | `docs/architecture/ARCHITECTURE.md` |

> **Guiding Principle:**  
> **The client may request actions, but the server owns all trust-sensitive decisions.**  
> The frontend may trigger flows such as swipe, cosmetic purchase, media upload, subscription checkout, and AI usage, but it must never directly mutate sensitive state including coins, subscription/Pro status, match creation, AI access, owned items, or entitlement state.

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Executive Technical Summary](#2-executive-technical-summary)
- [3. Architecture Goals & Non-Goals](#3-architecture-goals--non-goals)
- [4. High-Level System Architecture](#4-high-level-system-architecture)
- [5. Technology Decisions](#5-technology-decisions)
- [6. Core Domain Model](#6-core-domain-model)
- [7. Firestore Collection Design](#7-firestore-collection-design)
- [8. Key Data Models](#8-key-data-models)
- [9. Security Model](#9-security-model)
- [10. Cloud Functions API](#10-cloud-functions-api)
- [11. Key Function Designs](#11-key-function-designs)
- [12. AI Integration](#12-ai-integration)
- [13. Payments & Subscription Sync](#13-payments--subscription-sync)
- [14. Firebase Storage Structure](#14-firebase-storage-structure)
- [15. Firestore Index Strategy](#15-firestore-index-strategy)
- [16. Frontend Architecture](#16-frontend-architecture)
- [17. Real-Time Strategy](#17-real-time-strategy)
- [18. Discovery Performance Strategy](#18-discovery-performance-strategy)
- [19. Data Consistency & Denormalization Sync](#19-data-consistency--denormalization-sync)
- [20. Rate Limiting](#20-rate-limiting)
- [21. Security Threat Model](#21-security-threat-model)
- [22. Environment Configuration & Secrets](#22-environment-configuration--secrets)
- [23. CI/CD Strategy](#23-cicd-strategy)
- [24. Testing Strategy](#24-testing-strategy)
- [25. Observability & Monitoring](#25-observability--monitoring)
- [26. Migration & Future Scaling](#26-migration--future-scaling)
- [27. Production Readiness Checklist](#27-production-readiness-checklist)
- [28. Recommended Implementation Order](#28-recommended-implementation-order)

---

## 2. Executive Technical Summary

Swish & Game is a real-time, mobile-first gamer matchmaking platform built around three primary product loops.

### 2.1 Discovery Loop

**Create profile → select game → swipe players → mutual match**

Users create a gamer profile, add games with rank and looking-for intent, select a game, and browse eligible players through a swipe-based discovery interface. A match is created only through double opt-in logic when both users like each other.

### 2.2 Communication Loop

**Mutual match → real-time chat → coordination → play together**

Matched users can coordinate gameplay through real-time chat. Text chat is available to all users. Media/image sharing is Pro-only and must be validated server-side.

### 2.3 Progression & Monetization Loop

**Customize identity → spend earned/granted coins → upgrade to Pro → improve with AI**

Users customize their identity through cosmetic items purchased with earned/granted coins. Pro subscription unlocks unlimited swipes, unlimited matches, media transfer, premium dynamic backgrounds, verified badge, and enhanced cosmetics. AI Hub provides Gemini-powered profile and squad advice through a server-side proxy.

### 2.4 Architectural Summary

The target architecture is:

- **Firebase-first**
- **Serverless**
- **Event-driven**
- **Real-time**
- **Mobile-first**
- **Security-first**
- **Backend-authoritative for sensitive state**

The frontend delivers a premium, animated gaming experience. The backend owns sensitive decisions: match creation, coin changes, Pro entitlements, owned items, media authorization, AI access, and moderation-critical writes.

---

## 3. Architecture Goals & Non-Goals

### 3.1 Architecture Goals

| Goal | Scope | Description |
|---|---|---|
| Secure authentication | MVP | Support Google OAuth and email/password through Firebase Authentication |
| Public/private profile split | MVP | Separate sensitive account data from discovery-visible public profile data |
| Game-specific discovery | MVP | Support filtered discovery by selected game |
| Backend-controlled swipe and match logic | MVP | Enforce double opt-in matching through Cloud Functions |
| Real-time chat | MVP | Provide Firestore-backed text chat for matched users |
| Pro media gating | MVP | Ensure only active Pro users can send media |
| Cosmetic coin shop | MVP | Support earned/granted coins, purchases, and equipped cosmetics |
| Backend-owned economy | MVP | Coins and owned items are modified only by trusted backend logic |
| Gemini server-side proxy | MVP | Prevent API key exposure and enforce AI safety guardrails |
| Block/report safety flows | MVP | Enforce block in discovery and chat; store report records |
| Observability | MVP | Monitor critical Cloud Functions, Firestore, Storage, AI, and billing flows |
| Future discovery scaling | Scale/V1 | Add game-sharded discovery profiles and backend-generated decks |
| Future analytics depth | Scale/V1 | Add BigQuery or product analytics warehouse when needed |
| Future heavy AI/recommendations | Scale/V1 | Use Cloud Run when Cloud Functions are insufficient |

### 3.2 MVP Non-Goals

The MVP architecture does not need to support:

| Non-Goal | Scope |
|---|---|
| Native iOS/Android apps | Future |
| Public global chat rooms | Future / Out of scope for MVP |
| Live voice/video | Future / Out of scope for MVP |
| Game API rank verification | Future / Out of scope for MVP |
| Real-money coin packs | Scale/V1 |
| Real-money coin trading or cash-out | Out of scope |
| Full admin dashboard | Scale/V1 |
| Complex ML recommendation engine | Scale/V1 |
| PostgreSQL/Drizzle transactional backend | Future |
| Distributed event streaming platform | Future |
| Full data warehouse | Future |
| Advanced fraud engine | Future |

---

## 4. High-Level System Architecture

### 4.1 Logical Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│                         Client Web App                             │
│  React + Vite + TypeScript + Tailwind CSS + Framer Motion           │
│  React Router + Zustand + Zod + React Hook Form                     │
│  Hebrew-first RTL mobile-first UI                                   │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               │ Firebase Web SDK
                               │ Callable Functions / HTTPS
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                            Firebase                                │
│                                                                    │
│  ┌────────────────────┐   ┌────────────────────┐   ┌────────────┐ │
│  │ Firebase Auth      │   │ Cloud Firestore    │   │ Storage    │ │
│  │ Google + Email     │   │ Real-time app data │   │ Media      │ │
│  └─────────┬──────────┘   └─────────┬──────────┘   └─────┬──────┘ │
│            │                        │                    │        │
│            └──────────────┬─────────┴────────────┬───────┘        │
│                           ▼                      ▼                │
│               ┌────────────────────┐   ┌────────────────────┐     │
│               │ Cloud Functions    │   │ Firestore Triggers │     │
│               │ Trusted backend    │   │ Denormalization    │     │
│               └─────────┬──────────┘   └────────────────────┘     │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
          ┌───────────────┼─────────────────┐
          │               │                 │
          ▼               ▼                 ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ Secret Manager │ │ Gemini API     │ │ Payment Provider   │
│ API keys       │ │ Server proxy   │ │ Checkout/Webhooks  │
└────────────────┘ └────────────────┘ └────────────────────┘

Future Scale/V1:
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ Cloud Run      │ │ BigQuery       │ │ PostgreSQL/Drizzle │
│ Heavy AI/recs  │ │ Analytics      │ │ Admin/reporting    │
└────────────────┘ └────────────────┘ └────────────────────┘
```

### 4.2 Runtime Boundaries

| Boundary | Owner | Description |
|---|---|---|
| Presentation and client UX | Frontend | UI, animations, local state, optimistic loading where safe |
| Authentication identity | Firebase Auth | OAuth/password session and user identity |
| Application data | Firestore | Profiles, matches, chats, shop, safety, subscriptions |
| Media assets | Firebase Storage | Profile images, banners, chat media, shop assets |
| Trust-sensitive decisions | Cloud Functions | Swipes, matches, coins, ownership, Pro checks, AI proxy, reports |
| AI execution | Cloud Functions + Gemini | Backend-mediated Gemini requests only |
| Billing truth | Payment provider + webhook + backend | Pro status derived from verified provider events |
| Secrets | Secret Manager | Gemini key, webhook secret, payment credentials |

---

## 5. Technology Decisions

### 5.1 Frontend

| Decision | Scope | Choice | Rationale |
|---|---|---|---|
| Runtime | MVP | React + Vite | Fast local development, mature ecosystem, strong Firebase compatibility |
| Language | MVP | TypeScript | Required for safe domain modeling and production refactors |
| Styling | MVP | Tailwind CSS | Fast iteration, design-token-friendly, good for responsive UI |
| Animation | MVP | Framer Motion | High-quality swipe and micro-interaction support |
| Routing | MVP | React Router | Standard client-side routing for web app flows |
| Local UI state | MVP | Zustand | Lightweight store for selected game, modals, deck state, UI flags |
| Form state | MVP | React Hook Form | Efficient form management for onboarding/profile |
| Validation | MVP | Zod | Shared runtime validation schemas and typed parsing |
| Firebase access | MVP | Firebase Web SDK | Auth, Firestore listeners, Storage uploads, callable functions |
| Product analytics | Scale/V1 | Firebase Analytics / GA4 / PostHog / Mixpanel | Final destination TBD based on product analytics needs |

### 5.2 Backend

| Decision | Scope | Choice | Rationale |
|---|---|---|---|
| Authentication | MVP | Firebase Authentication | Fast secure auth, Google OAuth, email/password |
| Database | MVP | Cloud Firestore | Real-time data, flexible document model, fast MVP delivery |
| Backend compute | MVP | Cloud Functions for Firebase | Serverless trusted actions and triggers |
| Storage | MVP | Firebase Storage | Secure media storage with rules and auth integration |
| Secrets | MVP | Secret Manager | Prevent client exposure of API keys and webhook secrets |
| Recurring jobs | Scale/V1 | Cloud Scheduler | Usage cleanup, reconciliation, maintenance jobs if needed |
| Heavy compute | Scale/V1 | Cloud Run | Future AI/recommendation workloads beyond Cloud Functions |
| SQL/reporting | Future | PostgreSQL + Drizzle | Only when analytics/admin/recommendation complexity requires it |

### 5.3 AI

| Decision | Scope | Choice | Rationale |
|---|---|---|---|
| Model provider | MVP | Google Gemini | Product requirement |
| Access pattern | MVP | Cloud Function server-side proxy | Prevents API key exposure and centralizes safety controls |
| Prompt ownership | MVP | Backend only | Client must not receive system prompts or moderation logic |
| Request logging | MVP | Compact audit metadata | Cost/safety/debug without over-storing sensitive prompts |
| Advanced AI service | Scale/V1 | Cloud Run | For long-running, higher-cost, or recommendation workloads |

### 5.4 Payments

| Decision | Scope | Choice | Rationale |
|---|---|---|---|
| Provider | Open/MVP | TBD Israel-facing provider | Must support subscription billing and reliable webhooks |
| Price | MVP | 29.90 ILS/month | Product requirement |
| Payment flow | MVP | Checkout → webhook → Cloud Function → Firestore | Prevents client from self-granting Pro |
| Entitlement source | MVP | Backend-verified subscription document | Client reads status but cannot write it |
| Coin purchases | Scale/V1 | Deferred | MVP coins are earned/granted, not bought with real money |

---

## 6. Core Domain Model

| Domain | Scope | Description | Primary Data |
|---|---|---|---|
| Identity | MVP | Authenticated account and account-private state | Firebase Auth, `users/{uid}`, `users/{uid}/private/account` |
| Gaming Profile | MVP | Gamer identity, games, ranks, looking-for intent | `users/{uid}`, `users/{uid}/games/{gameId}`, `publicProfiles/{uid}` |
| Discovery | MVP / Scale | Game-filtered deck, swipes, skips, eligibility | `publicProfiles/{uid}`, `users/{uid}/swipes/{swipeId}`, Scale: `discoveryProfiles/{gameId}/players/{uid}` |
| Matching | MVP | Double opt-in connection between two users | `matches/{matchId}` |
| Communication | MVP | Real-time chat and messages after match | `chats/{chatId}`, `chats/{chatId}/messages/{messageId}` |
| Economy | MVP / Scale | Coins, shop items, owned cosmetics, transaction audit | `shopItems/{itemId}`, `users/{uid}.coins`, `users/{uid}/transactions`, Scale: `users/{uid}/ownedItems` |
| Subscription | MVP | Basic/Pro entitlement state | `subscriptions/{uid}`, denormalized user/public profile flags |
| AI | MVP | Profile optimization and squad advice | `aiRequests/{requestId}`, Cloud Function proxy |
| Safety | MVP | Blocking, reporting, moderation records | `users/{uid}/blocks/{blockedUid}`, `reports/{reportId}` |

---

## 7. Firestore Collection Design

### 7.1 Design Principles

1. **Design for query patterns.** Firestore schema should optimize the reads and writes the product actually performs.
2. **Separate private and public data.** Sensitive account state must not live in discovery-readable documents.
3. **Denormalize deliberately.** Duplicate fields into read models where needed for fast mobile UX.
4. **Keep server-owned fields protected.** Coins, Pro state, match state, owned items, and subscription entitlements are backend-controlled.
5. **Use deterministic IDs where idempotency matters.** Matches, swipes, blocks, and certain transaction records should avoid duplicates.
6. **Avoid unbounded arrays for high-growth state.** Arrays may be acceptable for MVP UI convenience but should migrate to subcollections at scale.
7. **Use subcollections for high-volume data.** Messages, swipes, owned items, transactions, usage counters.
8. **Use backend triggers for sync.** Public and discovery read models should be maintained by trusted backend logic.

### 7.2 Collections Overview

```text
# Identity & Profiles
/users/{uid}                                      [MVP]
/users/{uid}/private/account                     [MVP]
/publicProfiles/{uid}                            [MVP]
/users/{uid}/games/{gameId}                      [MVP]

# Discovery & Matching
/users/{uid}/swipes/{targetUid_gameId}           [MVP]
/matches/{matchId}                               [MVP]
/discoveryProfiles/{gameId}/players/{uid}        [Scale/V1]

# Communication
/chats/{chatId}                                  [MVP]
/chats/{chatId}/messages/{messageId}             [MVP]

# Economy & Cosmetics
/shopItems/{itemId}                              [MVP]
/users/{uid}.ownedItemIds                        [MVP]
/users/{uid}/ownedItems/{itemId}                 [Scale/V1]
/users/{uid}/transactions/{transactionId}         [MVP]

# Subscription
/subscriptions/{uid}                             [MVP]
/billingEvents/{eventId}                         [Scale/V1]

# AI
/aiRequests/{requestId}                          [MVP]

# Safety
/users/{uid}/blocks/{blockedUid}                 [MVP]
/reports/{reportId}                              [MVP]
/moderationActions/{actionId}                    [Scale/V1]

# Catalog & Config
/gameCatalog/{gameId}                            [MVP]
/system/config                                   [MVP]
/users/{uid}/usage/{yyyy-mm-dd}                  [Scale/V1]
```

### 7.3 MVP vs Scale Collection Notes

| Collection | Scope | Notes |
|---|---|---|
| `users/{uid}` | MVP | Main user-owned profile and app state; contains server-owned fields that client cannot mutate |
| `publicProfiles/{uid}` | MVP | Discovery-safe read model; no email/payment/private data |
| `users/{uid}/games/{gameId}` | MVP | Per-game rank and looking-for intent |
| `users/{uid}/swipes/{targetUid_gameId}` | MVP | Swipe history; written by Cloud Function |
| `matches/{matchId}` | MVP | Backend-created mutual match records |
| `chats/{chatId}` | MVP | Chat metadata, last message, participant list |
| `chats/{chatId}/messages/{messageId}` | MVP | Real-time messages |
| `shopItems/{itemId}` | MVP | Read-only client catalog |
| `subscriptions/{uid}` | MVP | Backend-owned Pro state |
| `reports/{reportId}` | MVP | User-created report records, not readable by regular users |
| `discoveryProfiles/{gameId}/players/{uid}` | Scale/V1 | Game-sharded discovery read model for better deck loading |
| `users/{uid}/ownedItems/{itemId}` | Scale/V1 | Source of truth for ownership as catalog grows |
| `users/{uid}/transactions/{transactionId}` | MVP | Audit record for all coin changes; required in MVP per ADR-005 |
| `users/{uid}/usage/{yyyy-mm-dd}` | Scale/V1 | Daily counters for rate limits |
| `billingEvents/{eventId}` | Scale/V1 | Auditable payment webhook event records |

---

## 8. Key Data Models

The canonical, field-by-field schema lives in `docs/architecture/DATA_MODEL.md`. This section provides representative TypeScript types for the four most important collections only.

### 8.1 `users/{uid}` — Main User Document `[MVP]`

```ts
type SkillLevel = "beginner" | "intermediate" | "pro" | "elite";

type SubscriptionTier = "basic" | "pro";

type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

type UserDocument = {
  uid: string;

  displayName: string;
  email: string;

  age: number;
  bio: string;
  skillLevel: SkillLevel;

  onboardingCompleted: boolean;
  isDiscoverable: boolean;

  profileImageUrl?: string;
  bannerImageUrl?: string;
  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  coins: number;

  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: FirebaseFirestore.Timestamp;
  isPro: boolean;

  // MVP convenience field. Scale/V1 source of truth moves to /ownedItems.
  ownedItemIds?: string[];

  isSuspended: boolean;
  isDeleted: boolean;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
};
```

### 8.2 `publicProfiles/{uid}` — Discovery-Safe Public Profile `[MVP]`

```ts
type PublicProfileDocument = {
  uid: string;

  displayName: string;
  age: number;
  bio: string;

  profileImageUrl?: string;
  bannerImageUrl?: string;
  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  skillLevel: "beginner" | "intermediate" | "pro" | "elite";

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

### 8.3 `matches/{matchId}` — Match Document `[MVP]`

```ts
type MatchStatus = "pending" | "matched" | "blocked" | "archived";

type MatchDocument = {
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

### 8.4 `chats/{chatId}/messages/{messageId}` — Message Document `[MVP]`

```ts
type MessageType = "text" | "image" | "system";
type MessageStatus = "sent" | "failed" | "deleted";

type MessageDocument = {
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

---

## 9. Security Model

Detailed security rules and the rules-test plan live in `docs/architecture/SECURITY.md`. This section summarizes the target security model and includes representative rule excerpts only.

### 9.1 Auth Model `[MVP]`

- Firebase Authentication is the source of user identity.
- Supported providers:
  - Google OAuth `[MVP]`
  - Email/password `[MVP]`
- Every protected read/write requires `request.auth != null`.
- User-owned private documents are only readable by the owning `uid`.
- Admin SDK writes from Cloud Functions bypass Firestore Security Rules and are used for server-owned state.

### 9.2 Public/Private Data Split `[MVP]`

| Data | Collection | Read Access |
|---|---|---|
| Private account data | `users/{uid}`, `users/{uid}/private/account` | Owner only |
| Public discovery data | `publicProfiles/{uid}` | Authenticated users |
| Game-specific discovery data | `discoveryProfiles/{gameId}/players/{uid}` | Authenticated users, Scale/V1 |
| Chat messages | `chats/{chatId}/messages/{messageId}` | Chat participants only |
| Shop catalog | `shopItems/{itemId}` | Authenticated users |
| Subscriptions | `subscriptions/{uid}` | Owner only |
| Reports | `reports/{reportId}` | Backend/admin only after creation |

### 9.3 Server-Owned Fields `[MVP]`

The client must not write:

- `coins`
- `ownedItemIds` after initial server-controlled changes
- `subscriptionTier`
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `isPro`
- `verifiedBadge`
- `isSuspended`
- `matches`
- `chats` metadata
- `swipes`
- `transactions`
- `aiRequests`
- `billingEvents`

### 9.4 Representative Firestore Rules Excerpt `[MVP]`

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function userDoc(uid) {
      return get(/databases/$(database)/documents/users/$(uid));
    }

    function isNotSuspended() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && userDoc(request.auth.uid).data.isSuspended == false
        && userDoc(request.auth.uid).data.isDeleted == false;
    }

    function isProUser() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && userDoc(request.auth.uid).data.isPro == true;
    }

    function isChatParticipant(chatId) {
      return isSignedIn()
        && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
    }

    match /users/{uid} {
      allow read: if isOwner(uid);

      allow create: if isOwner(uid)
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.coins == 0
        && request.resource.data.subscriptionTier == "basic"
        && request.resource.data.isPro == false;

      allow update: if isOwner(uid)
        && !("coins" in request.resource.data.diff(resource.data).changedKeys())
        && !("subscriptionTier" in request.resource.data.diff(resource.data).changedKeys())
        && !("subscriptionStatus" in request.resource.data.diff(resource.data).changedKeys())
        && !("subscriptionExpiresAt" in request.resource.data.diff(resource.data).changedKeys())
        && !("isPro" in request.resource.data.diff(resource.data).changedKeys())
        && !("isSuspended" in request.resource.data.diff(resource.data).changedKeys());

      allow delete: if false;

      match /private/{docId} {
        allow read, write: if isOwner(uid);
      }

      match /swipes/{swipeId} {
        allow read: if isOwner(uid);
        allow write: if false;
      }

      match /ownedItems/{itemId} {
        allow read: if isOwner(uid);
        allow write: if false;
      }

      match /transactions/{transactionId} {
        allow read: if isOwner(uid);
        allow write: if false;
      }
    }

    match /publicProfiles/{uid} {
      allow read: if isSignedIn();

      allow create, update: if isOwner(uid)
        && !("isPro" in request.resource.data.diff(resource.data).changedKeys())
        && !("verifiedBadge" in request.resource.data.diff(resource.data).changedKeys())
        && !("isSuspended" in request.resource.data.diff(resource.data).changedKeys());

      allow delete: if false;
    }

    match /matches/{matchId} {
      allow read: if isSignedIn() && request.auth.uid in resource.data.users;
      allow write: if false;
    }

    match /chats/{chatId} {
      allow read: if isChatParticipant(chatId);
      allow create, update, delete: if false;

      match /messages/{messageId} {
        allow read: if isChatParticipant(chatId);

        allow create: if isChatParticipant(chatId)
          && isNotSuspended()
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.chatId == chatId
          && request.resource.data.type in ["text", "image"]
          && (
            request.resource.data.type == "text"
            || isProUser()
          );

        allow update, delete: if false;
      }
    }

    match /shopItems/{itemId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /subscriptions/{uid} {
      allow read: if isOwner(uid);
      allow write: if false;
    }

    match /aiRequests/{requestId} {
      allow read: if isSignedIn() && resource.data.uid == request.auth.uid;
      allow create, update, delete: if false;
    }
  }
}
```

### 9.5 Representative Storage Rules Excerpt `[MVP]`

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    match /profileImages/{uid}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isOwner(uid)
        && isImage()
        && request.resource.size < 5 * 1024 * 1024;
    }

    match /bannerImages/{uid}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isOwner(uid)
        && isImage()
        && request.resource.size < 5 * 1024 * 1024;
    }

    match /chatMedia/{chatId}/{uid}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isOwner(uid)
        && isImage()
        && request.resource.size < 10 * 1024 * 1024;
      // Final participant and Pro checks are enforced by backend
      // before creating the message document.
    }

    match /shopAssets/{itemId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if false;
    }
  }
}
```

---

## 10. Cloud Functions API

Per-endpoint request/response/error contracts live in `docs/architecture/API_CONTRACT.md`. This section lists function inventory and sketches the key designs.

### 10.1 Callable Functions

| Function | Scope | Purpose | Server-Owned Decisions |
|---|---|---|---|
| `submitSwipe` | MVP | Create like/skip and create match/chat on reciprocal like | Swipe limit, block checks, match creation |
| `purchaseShopItem` | MVP | Purchase cosmetic with coins | Coin balance, ownership, transaction audit |
| `equipItem` | MVP | Equip owned cosmetic | Ownership, Pro requirements, denormalized updates |
| `sendAIProfileReview` | MVP | Gemini profile-bio optimization | AI access, rate limit, safety guardrails |
| `sendAISquadAdvice` | MVP | Gemini squad/strategy advice | AI access, rate limit, refusal policy |
| `createReport` | MVP | Create moderation report | Report validation, source validation |
| `blockUser` | MVP | Block another user | Block persistence, match/chat effects |
| `syncPublicProfile` | MVP | Explicit sync fallback for public profile | Server-safe read model update |
| `sendChatMediaMessage` | MVP | Finalize Pro media message after upload | Pro check, chat participant check, file validation |
| `getDiscoveryDeck` | Scale/V1 | Backend-generated discovery deck | Eligibility, ranking, anti-abuse filtering |
| `grantCoins` | Scale/V1 | Server/admin coin grant | Balance mutation and transaction audit |
| `reconcileSubscription` | Scale/V1 | Subscription status repair | Provider truth reconciliation |

### 10.2 HTTP / Webhook Functions

| Function | Scope | Purpose |
|---|---|---|
| `paymentWebhook` | MVP | Verify provider webhook and sync subscription entitlement |
| `checkoutSessionCallback` | Scale/V1 | Optional callback if payment provider requires redirect handling |
| `scheduledSubscriptionReconciliation` | Scale/V1 | Periodic verification of active subscriptions |
| `scheduledUsageCleanup` | Scale/V1 | Cleanup or rollup of usage counters |

### 10.3 Firestore Triggers

| Trigger | Scope | Purpose |
|---|---|---|
| `onUserProfileUpdated` | MVP | Sync `publicProfiles` after profile-relevant changes |
| `onUserGameUpdated` | MVP | Sync game IDs and discovery fields |
| `onSubscriptionUpdated` | MVP | Sync Pro flags to `users` and `publicProfiles` |
| `onMessageCreated` | MVP | Update chat last message and unread counters |
| `onBlockCreated` | MVP | Update match/chat visibility or status |
| `onShopItemUpdated` | Scale/V1 | Validate or refresh item catalog caches |
| `onUserDeleted` | Scale/V1 | Soft-delete public profile and discovery entries |
| `onReportCreated` | Scale/V1 | Notify moderation workflow or queue |

---

## 11. Key Function Designs

### 11.1 `submitSwipe` `[MVP]`

#### Input Sketch

```ts
type SubmitSwipeInput = {
  targetUid: string;
  gameId: string;
  direction: "like" | "skip";
};
```

#### Output Sketch

```ts
type SubmitSwipeOutput = {
  result: "skipped" | "liked" | "matched";
  matchId?: string;
  chatId?: string;
};
```

#### Logic Sketch

1. Validate authenticated caller.
2. Validate input shape with server-side schema.
3. Reject self-swipe.
4. Load current user.
5. Reject if caller is suspended or deleted.
6. Verify caller completed onboarding.
7. Verify caller has selected/active `gameId`.
8. Verify target user exists and is discoverable.
9. Verify target shares `gameId`.
10. Check block state in both directions.
11. Enforce Basic daily swipe limit if applicable.
12. Compute deterministic swipe ID: `{targetUid}_{gameId}`.
13. Write swipe record idempotently.
14. If `direction === "skip"`, return `skipped`.
15. Check reciprocal like at `users/{targetUid}/swipes/{callerUid}_{gameId}`.
16. If no reciprocal like exists, return `liked`.
17. If reciprocal like exists:
    - Compute deterministic match ID: `{minUid}_{maxUid}_{gameId}`.
    - Run Firestore transaction.
    - Create or reuse match document.
    - Create or reuse chat document.
    - Update relevant timestamps.
18. Return `matched` with `matchId` and `chatId`.

#### Idempotency Requirements

- Repeated same swipe must not create duplicate matches.
- Simultaneous reciprocal likes must create exactly one match.
- Match ID must be deterministic.
- Transaction must check existing match before create.

---

### 11.2 `purchaseShopItem` `[MVP]`

#### Input Sketch

```ts
type PurchaseShopItemInput = {
  itemId: string;
};
```

#### Output Sketch

```ts
type PurchaseShopItemOutput = {
  success: true;
  itemId: string;
  newCoinBalance: number;
};
```

#### Logic Sketch

1. Validate authenticated caller.
2. Validate input.
3. Load user.
4. Reject if suspended or deleted.
5. Load shop item.
6. Reject inactive item.
7. Reject if already owned.
8. Reject if item requires Pro and user is not active Pro.
9. Check coin balance.
10. Run Firestore transaction:
    - Re-read user and item.
    - Validate balance and ownership again.
    - Deduct coins.
    - For MVP, update `ownedItemIds`.
    - For Scale/V1, create `users/{uid}/ownedItems/{itemId}`.
    - Create transaction audit record.
11. Return new coin balance.

#### Idempotency Requirements

- Double-tap purchase must not double-charge.
- Transaction record must uniquely identify the purchase attempt.
- Item ownership check must happen inside transaction.

---

### 11.3 `equipItem` `[MVP]`

#### Input Sketch

```ts
type EquipItemInput = {
  itemId: string;
};
```

#### Output Sketch

```ts
type EquipItemOutput = {
  success: true;
  equippedItemId: string;
  category: "avatar_border" | "profile_banner" | "global_background";
};
```

#### Logic Sketch

1. Validate authenticated caller.
2. Validate input.
3. Load user.
4. Load shop item.
5. Verify ownership:
   - MVP: `itemId` exists in `ownedItemIds`.
   - Scale/V1: owned item document exists.
6. Reject inactive or unavailable item if policy requires.
7. Verify Pro requirement if item requires active Pro.
8. Determine cosmetic category.
9. Run transaction:
   - Update relevant user cosmetic field.
   - Scale/V1: mark previous equipped item in same category as not equipped.
   - Scale/V1: mark selected item as equipped.
10. Update/sync `publicProfiles/{uid}`.
11. Scale/V1: update `discoveryProfiles/{gameId}/players/{uid}` for active games.
12. Return success.

#### Consistency Requirements

- Public profile must reflect equipped cosmetics.
- Discovery card must eventually reflect equipped cosmetics.
- Pro-only cosmetics after Pro expiration follow policy defined in PRD/open decisions.

---

### 11.4 AI Proxy Functions `[MVP]`

Functions:

- `sendAIProfileReview`
- `sendAISquadAdvice`

#### Input Sketch

```ts
type AIProfileReviewInput = {
  bio: string;
  games: Array<{
    gameId: string;
    name: string;
    rank: string;
    lookingFor: string;
  }>;
  skillLevel: "beginner" | "intermediate" | "pro" | "elite";
};

type AISquadAdviceInput = {
  gameId: string;
  gameName: string;
  rank?: string;
  playstyle?: string;
  squadContext?: string;
};
```

#### Output Sketch

```ts
type AIProfileReviewOutput = {
  summary: string;
  suggestedBio?: string;
  improvements: string[];
  warnings?: string[];
};

type AISquadAdviceOutput = {
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

#### Logic Sketch

1. Validate authenticated caller.
2. Reject suspended/deleted users.
3. Validate input with server-side schema.
4. Check rate limits.
5. Apply safety pre-checks:
   - cheating
   - exploits
   - harassment
   - doxxing
   - account theft
   - ban evasion
   - hate/sexual abuse
6. Build backend-owned prompt.
7. Load Gemini API key from Secret Manager.
8. Call Gemini.
9. Validate/parse response.
10. Apply output safety check if needed.
11. Store compact `aiRequests/{requestId}` audit metadata.
12. Return structured response or safe refusal.

#### Security Requirements

- Gemini API key never appears in frontend bundle.
- System prompts are not returned to the client.
- Moderation policy logic is backend-owned.
- AI request metadata is minimized to reduce privacy risk.

---

## 12. AI Integration

Deep Gemini prompt design and guardrails live in `docs/architecture/AI_INTEGRATION.md`.

### 12.1 AI Flow `[MVP]`

```text
Client AI Hub
  → Callable Cloud Function
    → Auth validation
    → Input validation
    → Rate-limit check
    → Safety pre-check
    → Backend-owned prompt assembly
    → Gemini API call using Secret Manager key
    → Response parsing and output safety check
    → aiRequests audit write
  → Structured response to client
```

### 12.2 Supported AI Capabilities

| Capability | Scope | Function |
|---|---|---|
| Profile-bio optimization | MVP | `sendAIProfileReview` |
| Squad/strategy advice | MVP | `sendAISquadAdvice` |
| Match compatibility insights | Scale/V1 | TBD |
| AI-powered deck ranking | Scale/V1 | Cloud Run recommendation service |

### 12.3 Guardrail Summary `[MVP]`

AI must refuse or safely redirect requests involving:

- Cheating
- Exploits
- Harassment
- Hate
- Doxxing
- Account theft
- Ban evasion
- Toxic gameplay instructions
- Sexual content involving minors
- Circumventing moderation
- Requests to manipulate the platform

### 12.4 Data Minimization `[MVP]`

The AI proxy should send only the minimum relevant fields:

- Bio text
- Game names/IDs
- Rank
- Looking-for intent
- Skill level
- User-provided playstyle or squad context

The AI proxy should not send:

- Email
- Payment state
- Private account metadata
- Full chat history unless a future feature explicitly requires it and policy approves it

---

## 13. Payments & Subscription Sync

Deep billing, webhook validation, and provider-specific contracts live in `docs/architecture/PAYMENTS.md`.

### 13.1 Payment Flow `[MVP]`

```text
Client subscription screen
  → Create checkout session / provider checkout URL
  → User completes payment
  → Payment provider sends signed webhook
  → paymentWebhook Cloud Function verifies signature
  → Function maps provider customer/subscription to uid
  → Function updates subscriptions/{uid}
  → Function updates users/{uid} entitlement fields
  → Function updates publicProfiles/{uid} Pro/verified flags
  → Client observes entitlement change via Firestore listener
```

### 13.2 Subscription Source of Truth `[MVP]`

| State | Source |
|---|---|
| Payment authorization | Payment provider |
| Subscription lifecycle | Verified payment webhook |
| App entitlement | `subscriptions/{uid}` + denormalized user flags |
| Client display | Firestore listener |

### 13.3 Pro Entitlements `[MVP]`

Pro costs **29.90 ILS/month** and unlocks:

- Unlimited swipes
- Unlimited matches
- Media/image chat transfer
- Premium dynamic backgrounds
- Verified badge
- Enhanced cosmetics

### 13.4 Client Restrictions `[MVP]`

The client must never directly write:

- `subscriptionTier`
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `isPro`
- `verifiedBadge`
- payment customer IDs
- provider subscription IDs

### 13.5 Open Payment Decision

The specific Israel-facing payment provider is TBD. The architecture must abstract provider integration behind:

```text
Checkout creation → Provider checkout → Signed webhook → Entitlement sync
```

---

## 14. Firebase Storage Structure

### 14.1 Paths

```text
/profileImages/{uid}/{fileId}              [MVP]
/bannerImages/{uid}/{fileId}               [MVP]
/chatMedia/{chatId}/{uid}/{fileId}         [MVP]
/shopAssets/{itemId}/{assetFile}           [MVP]
/tempUploads/{uid}/{fileId}                [Scale/V1]
/moderationEvidence/{reportId}/{fileId}    [Scale/V1]
```

### 14.2 Constraints

| Path | Scope | Read | Write | Constraints |
|---|---|---|---|---|
| `/profileImages/{uid}/{fileId}` | MVP | Authenticated users | Owner | Image only, max 5MB |
| `/bannerImages/{uid}/{fileId}` | MVP | Authenticated users | Owner | Image only, max 5MB |
| `/chatMedia/{chatId}/{uid}/{fileId}` | MVP | Authenticated users initially; participant validation at message layer | Owner upload; message creation backend-gated | Image only for MVP, max 10MB, Pro-only finalization |
| `/shopAssets/{itemId}/{assetFile}` | MVP | Authenticated users | Server/admin only | Catalog asset |
| `/tempUploads/{uid}/{fileId}` | Scale/V1 | Owner/server | Owner | Used for moderation/validation pipeline |
| `/moderationEvidence/{reportId}/{fileId}` | Scale/V1 | Server/admin only | Server/admin only | Evidence storage |

### 14.3 Chat Media Security Pattern `[MVP]`

Storage rules alone are not enough to authorize chat media.

Recommended flow:

1. Client uploads media to allowed path.
2. Client calls `sendChatMediaMessage`.
3. Backend validates:
   - Authenticated user
   - User is chat participant
   - Chat is active
   - User is active Pro
   - File path belongs to user
   - File size/type is allowed
4. Backend creates message document.
5. Optional Scale/V1: backend moves file from temp path to final approved path.

---

## 15. Firestore Index Strategy

Exact `firestore.indexes.json` lives with infrastructure config. This section identifies the key composite indexes.

### 15.1 Public Profile Discovery `[MVP]`

For MVP client-filtered batches from `publicProfiles`:

```text
Collection: publicProfiles
Fields:
- isDiscoverable ASC
- isSuspended ASC
- lastActiveAt DESC
```

If querying with `array-contains` on `gameIds`:

```text
Collection: publicProfiles
Fields:
- gameIds ARRAY_CONTAINS
- isDiscoverable ASC
- isSuspended ASC
- lastActiveAt DESC
```

### 15.2 Game-Sharded Discovery `[Scale/V1]`

For `discoveryProfiles/{gameId}/players/{uid}`:

```json
{
  "collectionGroup": "players",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "isDiscoverable", "order": "ASCENDING" },
    { "fieldPath": "isSuspended", "order": "ASCENDING" },
    { "fieldPath": "lastActiveAt", "order": "DESCENDING" }
  ]
}
```

### 15.3 Discovery by Skill `[Scale/V1]`

```json
{
  "collectionGroup": "players",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "skillLevel", "order": "ASCENDING" },
    { "fieldPath": "isDiscoverable", "order": "ASCENDING" },
    { "fieldPath": "isSuspended", "order": "ASCENDING" },
    { "fieldPath": "lastActiveAt", "order": "DESCENDING" }
  ]
}
```

### 15.4 Discovery by Rank Score `[Scale/V1]`

```json
{
  "collectionGroup": "players",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "rankScore", "order": "ASCENDING" },
    { "fieldPath": "isDiscoverable", "order": "ASCENDING" },
    { "fieldPath": "lastActiveAt", "order": "DESCENDING" }
  ]
}
```

### 15.5 Matches by User `[MVP]`

```json
{
  "collectionGroup": "matches",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "users", "arrayConfig": "CONTAINS" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "lastInteractionAt", "order": "DESCENDING" }
  ]
}
```

### 15.6 Chats by Participant `[MVP]`

```json
{
  "collectionGroup": "chats",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
    { "fieldPath": "lastTimestamp", "order": "DESCENDING" }
  ]
}
```

### 15.7 Chat Messages `[MVP]`

```json
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 15.8 Shop Items `[MVP]`

```json
{
  "collectionGroup": "shopItems",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "isActive", "order": "ASCENDING" },
    { "fieldPath": "priceCoins", "order": "ASCENDING" }
  ]
}
```

---

## 16. Frontend Architecture

### 16.1 Feature-Based Folder Structure `[MVP]`

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  config/
    firebase.ts
    env.ts

  features/
    auth/
      components/
      hooks/
      services/
      types.ts

    onboarding/
      components/
      hooks/
      services/
      schemas.ts

    profile/
      components/
      hooks/
      services/
      schemas.ts
      types.ts

    discovery/
      components/
      hooks/
      services/
      swipeMachine.ts
      types.ts

    matches/
      components/
      hooks/
      services/
      types.ts

    chat/
      components/
      hooks/
      services/
      types.ts

    shop/
      components/
      hooks/
      services/
      types.ts

    subscription/
      components/
      hooks/
      services/
      types.ts

    ai/
      components/
      hooks/
      services/
      types.ts

    safety/
      components/
      hooks/
      services/
      types.ts

  shared/
    components/
      Button.tsx
      Card.tsx
      Modal.tsx
      Badge.tsx
      Avatar.tsx
      BottomNav.tsx
      LoadingState.tsx
      EmptyState.tsx

    hooks/
    lib/
    utils/
    validation/
    constants/
    styles/
```

### 16.2 State Strategy

| State Type | Scope | Tool | Examples |
|---|---|---|---|
| Auth state | MVP | Firebase Auth listener | Current user |
| Real-time server state | MVP | Firestore subscriptions | Current user profile, matches, active chat, subscription |
| One-time server actions | MVP | Callable Functions | Swipe, purchase, equip, AI, block/report |
| Local UI state | MVP | Zustand | Selected game, modals, active deck index, upgrade prompt |
| Form state | MVP | React Hook Form | Onboarding, profile edit, report form |
| Validation | MVP | Zod | Input schemas, form validation, client-side pre-validation |
| Animation state | MVP | React state / Zustand | Swipe animation status, match celebration |
| Server cache/query abstraction | Scale/V1 | Optional TanStack Query | Non-realtime catalog/config reads |

### 16.3 Frontend Rules

- Client may optimistically animate safe UI transitions.
- Client must reconcile with backend result for swipe/match/purchase.
- Client must not assume Pro status is valid for backend-gated actions.
- Client must not construct trusted documents directly for matches, transactions, subscriptions, AI requests, or owned item grants.
- Client must display Hebrew-first RTL UI.
- Stored enum values remain English.

---

## 17. Real-Time Strategy

### 17.1 Use Firestore Listeners For `[MVP]`

| Listener | Purpose |
|---|---|
| Current user document | Profile, coins, Pro flags, onboarding |
| Current public profile | Displayable profile updates |
| Matches list | Active matches and last interaction |
| Active chat document | Last message, active status, unread counters |
| Active chat messages | Real-time conversation |
| Subscription document | Pro entitlement changes |
| Shop catalog | Optional listener; can also be simple fetch if catalog changes rarely |

### 17.2 Do Not Over-Subscribe To

| Anti-Pattern | Reason |
|---|---|
| Entire user base | Privacy, cost, performance |
| All public profiles | Expensive and unnecessary |
| All chats | Privacy and cost |
| All messages across chats | Privacy and cost |
| All shop transactions | Sensitive and unnecessary |
| All reports | Admin-only data |

### 17.3 Chat Pagination `[MVP]`

MVP should load the latest page of messages, then paginate older messages on demand.

Recommended query pattern:

```ts
query(
  collection(db, "chats", chatId, "messages"),
  orderBy("createdAt", "desc"),
  limit(50)
);
```

Client displays messages in ascending order after reversing the result.

### 17.4 Real-Time Failure Handling `[MVP]`

- Show reconnecting state when offline.
- Queue text input only if intentionally supported.
- Never fake successful send if backend rejects.
- Display retry or failed status for message send failures.
- Reconcile optimistic swipe animations with backend result.

---

## 18. Discovery Performance Strategy

### 18.1 MVP Approach: Client-Filtered Batch `[MVP]`

MVP may use a simple discovery batch:

1. Query `publicProfiles` by:
   - `isDiscoverable == true`
   - `isSuspended == false`
   - `gameIds array-contains selectedGame`
   - order by `lastActiveAt desc`
   - limit to a small batch
2. Client filters out:
   - Current user
   - Already swiped users
   - Already matched users
   - Blocked users
3. Swipe submissions still go through `submitSwipe`.

This is acceptable for early beta because it is simpler and faster to implement.

### 18.2 Limitations of MVP Approach

- More client-side filtering.
- Potential over-read of public profile documents.
- Less control over ranking.
- Harder to add advanced filters.
- Less robust anti-abuse.
- Not ideal for large user base or high-card velocity.

### 18.3 Scale Approach: Game-Sharded Discovery Profiles `[Scale/V1]`

Use:

```text
/discoveryProfiles/{gameId}/players/{uid}
```

Benefits:

- Better query isolation by game.
- Smaller documents optimized for cards.
- Easier rank/skill filtering.
- Better support for randomized ranking.
- Lower over-read.
- Better denormalized cosmetic display.
- Better mobile performance.

### 18.4 Backend-Generated Deck `[Scale/V1]`

Introduce:

```text
getDiscoveryDeck({ gameId, filters })
```

Backend returns a curated list of profile IDs or lightweight cards.

Benefits:

- Centralized eligibility enforcement.
- Better ranking.
- Better experimentation.
- Better anti-abuse.
- Less client leakage.
- Easier future AI recommendation integration.

---

## 19. Data Consistency & Denormalization Sync

### 19.1 Denormalized Read Models

| Source | Read Model | Scope | Reason |
|---|---|---|---|
| `users/{uid}` | `publicProfiles/{uid}` | MVP | Safe public profile and discovery read model |
| `users/{uid}/games/{gameId}` | `publicProfiles/{uid}.gameIds` | MVP | Discovery filtering |
| `users/{uid}` + games | `discoveryProfiles/{gameId}/players/{uid}` | Scale/V1 | Game-sharded discovery |
| `matches/{matchId}` + messages | `chats/{chatId}` | MVP | Fast chat list |
| `subscriptions/{uid}` | `users/{uid}.isPro`, `publicProfiles/{uid}.verifiedBadge` | MVP | Fast UI display and security checks |

### 19.2 Sync Events

#### User Profile Updated `[MVP]`

```text
users/{uid} updated
  → publicProfiles/{uid} updated
  → discoveryProfiles/{gameId}/players/{uid} updated [Scale/V1]
```

#### User Game Updated `[MVP]`

```text
users/{uid}/games/{gameId} updated
  → publicProfiles/{uid}.gameIds updated
  → discoveryProfiles/{gameId}/players/{uid} updated [Scale/V1]
```

#### Subscription Updated `[MVP]`

```text
subscriptions/{uid} updated
  → users/{uid}.subscriptionTier/status/isPro updated
  → publicProfiles/{uid}.isPro/verifiedBadge updated
  → discoveryProfiles updated [Scale/V1]
```

#### Message Created `[MVP]`

```text
chats/{chatId}/messages/{messageId} created
  → chats/{chatId}.lastMessage updated
  → chats/{chatId}.lastTimestamp updated
  → chats/{chatId}.unreadCounts updated
```

#### Block Created `[MVP]`

```text
users/{uid}/blocks/{blockedUid} created
  → active match visibility/status affected
  → chat sending blocked
  → discovery eligibility updated by query/filter logic
```

### 19.3 Consistency Model

- Most denormalized state is eventually consistent.
- Trust-sensitive transactions must be strongly consistent inside Firestore transactions.
- UI should tolerate short sync delays.
- Backend functions should be idempotent and retry-safe.

---

## 20. Rate Limiting

### 20.1 MVP Rate Limits

| Capability | Tier | Scope | Enforcement |
|---|---|---|---|
| Daily swipes | Basic | MVP | Backend in `submitSwipe` |
| Daily swipes | Pro | MVP | Unlimited for product limit, still abuse-limited |
| Text messages | Basic/Pro | MVP | Abuse threshold, not product paywall |
| Media upload | Basic | MVP | Not allowed |
| Media upload | Pro | MVP | Allowed with file size/type limits |
| AI profile review | Basic/Pro | MVP | Backend rate limit; exact limits TBD |
| AI squad advice | Basic/Pro | MVP | Backend rate limit; exact limits TBD |
| Shop purchases | Basic/Pro | MVP | Transaction-protected; abuse checks if needed |

### 20.2 Daily Counter Approach `[Scale/V1]`

Firestore alone is not ideal for precise rate limiting, but daily counters are sufficient for product limits.

Path:

```text
/users/{uid}/usage/{yyyy-mm-dd}
```

Representative document:

```ts
type DailyUsageDocument = {
  date: string;
  swipeCount: number;
  aiProfileReviewCount: number;
  aiSquadAdviceCount: number;
  mediaUploadCount: number;
  messageCount?: number;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

### 20.3 Open Rate-Limit Decisions

- Exact Basic daily swipe limit.
- Exact AI request limits by tier.
- Message abuse threshold.
- Whether Pro gets higher AI limits in MVP.
- Whether rate limits reset by user timezone, UTC, or product locale.

---

## 21. Security Threat Model

| Threat | Scope | Risk | Mitigation |
|---|---|---|---|
| User self-grants Pro | MVP | Revenue loss, entitlement abuse | Client cannot write subscription fields; Pro state updated only by verified webhook/backend |
| User modifies coins | MVP | Economy abuse | Client cannot write coins; all coin changes through backend transaction and audit record |
| User grants owned items | MVP | Shop abuse | Client cannot write ownership directly; backend validates purchase/equip |
| User creates fake matches | MVP | Trust and data integrity failure | Client cannot write matches; `submitSwipe` owns match creation; deterministic match IDs |
| Duplicate matches | MVP | Bad UX, data corruption | Firestore transaction and deterministic match ID |
| User reads private profile | MVP | Privacy breach | Public/private split; private docs owner-only |
| User reads unauthorized chat | MVP | Privacy breach | Chat participant rules; backend checks for media |
| Basic user sends media | MVP | Pro bypass | Client gating plus server-side Pro validation and rules |
| Gemini API key leak | MVP | Cost and abuse exposure | Gemini key in Secret Manager only; client calls backend proxy |
| Prompt injection | MVP | Unsafe AI outputs | Backend prompt ownership, input validation, refusal rules |
| Storage abuse | MVP | Cost/security risk | Size/type limits, path ownership, backend finalization for chat media |
| User bypasses block | MVP | Safety failure | Block checked in discovery, chat write path, and relevant backend functions |
| User spams reports | Scale/V1 | Moderation abuse | Rate limits, duplicate report handling, moderation heuristics |
| Payment webhook spoofing | MVP | Fraudulent Pro access | Signature verification, provider event validation |
| Client tampers with enums | MVP | Data integrity risk | Zod validation client-side and server-side; security rules constrain writes |
| Suspended user continues actions | MVP | Safety risk | Backend checks `isSuspended` for sensitive actions |

---

## 22. Environment Configuration & Secrets

### 22.1 Environments `[MVP]`

| Environment | Firebase Project | Purpose |
|---|---|---|
| Development | `swish-game-dev` | Local development and emulator-backed testing |
| Staging | `swish-game-staging` | Pre-production QA and integration testing |
| Production | `swish-game-prod` | Live user traffic |

Production Firebase project must never be used for local development.

### 22.2 Environment Variables `[MVP]`

Frontend environment variables may include only public configuration:

- Firebase public config
- Public app environment name
- Public analytics configuration
- Public feature flags

Frontend environment variables must not include:

- Gemini API key
- Payment provider secret
- Webhook secret
- Admin credentials
- Service account credentials

### 22.3 Secret Manager `[MVP]`

Store the following in Secret Manager:

| Secret | Scope |
|---|---|
| Gemini API key | MVP |
| Payment provider API secret | MVP |
| Payment webhook signing secret | MVP |
| Admin/service credentials if needed | MVP |
| Third-party analytics write keys if sensitive | Scale/V1 |
| Image moderation provider key if added | Scale/V1 |

### 22.4 Config Documents `[MVP]`

Use `system/config` for non-secret runtime config:

- Basic swipe limit value, if backend-read and safe
- Feature flags
- Maintenance mode
- Supported app version metadata
- AI feature availability
- Shop feature availability

---

## 23. CI/CD Strategy

### 23.1 Pipeline Overview `[MVP]`

```text
Pull Request
  → Install dependencies
  → Typecheck
  → Lint
  → Unit tests
  → Build
  → Firebase Emulator tests
  → Security rules tests
  → Deploy preview/staging
  → Manual approval
  → Deploy production
```

### 23.2 Required Checks `[MVP]`

| Check | Command Example |
|---|---|
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Build | `npm run build` |
| Rules tests | `firebase emulators:exec "npm run test:rules"` |
| E2E tests | `npm run test:e2e` |
| Function tests | `npm run test:functions` |

### 23.3 Deployment Targets `[MVP]`

| Target | Tooling |
|---|---|
| Frontend hosting | Firebase Hosting or equivalent |
| Cloud Functions | Firebase CLI |
| Firestore rules | Firebase CLI |
| Storage rules | Firebase CLI |
| Indexes | Firebase CLI |

### 23.4 Production Deployment Requirements `[MVP]`

- Production deploy requires passing CI.
- Production deploy requires manual approval.
- Rules and indexes deploy with backend changes.
- Secrets are configured before function deployment.
- Rollback procedure is documented.
- Staging must be verified before production.

---

## 24. Testing Strategy

### 24.1 Unit Tests `[MVP]`

Required areas:

- Zod validation schemas
- Skill level enum validation
- Match ID generation
- Swipe input validation
- Swipe state machine
- Chat utility formatting
- Shop price/ownership validation helpers
- Pro gating helpers
- AI input sanitizer
- Block/report input validation
- Date/usage counter helpers

### 24.2 Integration Tests `[MVP]`

Required flows:

- Signup → onboarding → user/public profile creation
- Add game → public profile `gameIds` sync
- Swipe like → pending state
- Reciprocal swipe → match + chat creation
- Duplicate reciprocal swipe → no duplicate match
- Basic user reaches swipe limit
- Basic user blocked from media send
- Pro user allowed media send
- Purchase shop item → coins deducted + item owned
- Equip item → profile and public profile updated
- Block user → chat blocked and discovery excluded
- Report user → report record created
- Subscription webhook → Pro entitlement synced
- AI request → backend proxy called and audit written

### 24.3 Security Rules Tests `[MVP]`

Must verify:

- User cannot read another user’s private account data.
- User cannot update own coins.
- User cannot update own subscription status.
- User cannot set `isPro`.
- User cannot create matches directly.
- User cannot create swipes directly.
- User cannot write shop catalog.
- User cannot write game catalog.
- User cannot read chat they do not participate in.
- User cannot send message as another user.
- Basic user cannot send image message.
- User cannot create AI request directly.
- User can create a report for themselves only as reporter.
- Block write is constrained to authenticated owner.

### 24.4 E2E Tests `[MVP]`

Recommended with Playwright:

- New user onboarding
- Profile edit
- Game selection
- Discovery swipe left/right
- Mutual match
- Chat text message
- Basic media blocked
- Pro upgrade UI path
- Shop purchase and equip
- AI profile review
- Block user
- Report user
- RTL mobile navigation
- Empty discovery deck
- Offline/retry states where feasible

### 24.5 Scale/V1 Tests

Additional tests when Scale/V1 capabilities are added:

- Backend-generated discovery deck
- `discoveryProfiles` sync
- Usage counter limits
- Payment reconciliation jobs
- BigQuery export validation
- Cloud Run AI recommendation service
- Moderation queue workflows

---

## 25. Observability & Monitoring

### 25.1 Monitoring Targets `[MVP]`

| Area | Signals |
|---|---|
| Auth | Signup/login errors, auth provider failures |
| Firestore | Rule denials, quota usage, read/write spikes |
| Cloud Functions | Error rate, latency, cold starts, retries |
| Swipe/matching | `submitSwipe` failures, match transaction failures |
| Chat | Message send failures, listener errors |
| Storage | Upload failures, upload size spikes, abuse patterns |
| Shop/economy | Purchase failures, transaction failures, negative balance attempts |
| Subscription | Webhook failures, entitlement sync failures |
| AI | Gemini errors, refusal rate, latency, cost spikes |
| Safety | Report volume spikes, block spikes |
| Frontend | Runtime errors, route errors, performance issues |

### 25.2 Recommended Tools `[MVP]`

- Google Cloud Logging
- Google Cloud Error Reporting
- Firebase console monitoring
- Sentry for frontend exceptions
- Firebase Performance Monitoring if adopted
- Log-based alerts for critical backend functions

### 25.3 Critical Alerts `[MVP]`

Create alerts for:

- `paymentWebhook` failure spike
- `submitSwipe` error spike
- Match transaction failure spike
- `purchaseShopItem` transaction failure spike
- Negative coin balance detection
- AI proxy error spike
- Gemini latency/cost spike
- Storage upload abuse spike
- Firestore quota near limit
- Security rule denial spike on sensitive paths
- Unexpected write attempts to server-owned collections
- Chat message write failure spike

### 25.4 Audit Logs `[MVP / Scale]`

| Audit | Scope |
|---|---|
| Coin transaction audit | MVP |
| Subscription webhook event audit | MVP / Scale/V1 |
| AI request audit metadata | MVP |
| Report record audit | MVP |
| Moderation action audit | Scale/V1 |
| Admin grant audit | Scale/V1 |

---

## 26. Migration & Future Scaling

This document describes the target production architecture. The current codebase is an early prototype with mock data. A separate migration plan will cover transition steps.

### 26.1 Firestore First `[MVP]`

Firestore remains the primary database for MVP because the product needs:

- Real-time chat
- Fast iteration
- Firebase Auth integration
- Serverless operations
- Flexible profile/discovery data
- Low backend overhead

### 26.2 When to Add PostgreSQL + Drizzle `[Future]`

Introduce PostgreSQL + Drizzle only when the product needs:

- Complex relational reporting
- Advanced admin workflows
- Billing/accounting ledger beyond Firestore needs
- Advanced recommendation queries
- Team/clan structures
- Large-scale moderation tooling
- Strong consistency across complex relational domains

Do not adopt PostgreSQL before product-market validation unless required by a hard business or compliance need.

### 26.3 When to Add BigQuery `[Scale/V1]`

Add BigQuery when:

- Event volume exceeds product analytics tooling needs.
- Cohort analysis becomes strategic.
- Monetization analytics require warehouse-level joins.
- Safety and moderation analytics require long-term trend analysis.

### 26.4 When to Add Cloud Run `[Scale/V1]`

Add Cloud Run for:

- Heavy AI workflows
- Recommendation models
- Long-running deck generation
- Batch processing
- Advanced moderation processing
- Image analysis pipelines

### 26.5 Future Hybrid Architecture `[Future]`

```text
Firestore
  → Real-time app state, chat, profile, matches

PostgreSQL + Drizzle
  → Admin workflows, reporting, relational business data

BigQuery
  → Product analytics, growth analytics, safety analytics

Cloud Run
  → Heavy AI, recommendations, batch jobs

Cloud Functions
  → Event-driven glue, transactional app actions, webhooks
```

---

## 27. Production Readiness Checklist

### 27.1 Authentication `[MVP]`

- [ ] Google OAuth works.
- [ ] Email/password works.
- [ ] Session persistence works.
- [ ] Secure logout works.
- [ ] Auth guards protect app routes.
- [ ] Incomplete onboarding routes correctly.

### 27.2 Profile & Onboarding `[MVP]`

- [ ] Required onboarding fields implemented.
- [ ] `skillLevel` stored as `beginner | intermediate | pro | elite`.
- [ ] Public/private profile split implemented.
- [ ] Profile image upload secured.
- [ ] Game catalog available.
- [ ] At least one game required.
- [ ] Public profile sync works.

### 27.3 Discovery & Matching `[MVP]`

- [ ] Game filter works.
- [ ] Eligible deck loads.
- [ ] Swipe left/skip works.
- [ ] Swipe right/like works.
- [ ] Swipes are backend-controlled.
- [ ] Basic swipe limit enforced server-side.
- [ ] Reciprocal likes create exactly one match.
- [ ] Chat document created with match.
- [ ] Blocked users excluded.

### 27.4 Chat `[MVP]`

- [ ] Matches list loads.
- [ ] Real-time messages work.
- [ ] Participant-only access enforced.
- [ ] Last-message preview updates.
- [ ] Text chat is free for all matched users.
- [ ] Basic media is blocked.
- [ ] Pro media is allowed and validated.
- [ ] Chat is blocked after user block.

### 27.5 Shop & Cosmetics `[MVP]`

- [ ] Shop catalog is read-only to clients.
- [ ] Coin balance displays.
- [ ] Purchase is backend-controlled.
- [ ] Coin deduction is atomic.
- [ ] Transaction audit is created.
- [ ] Owned item is recorded.
- [ ] Equip flow validates ownership.
- [ ] Equipped cosmetics update public profile.

### 27.6 Subscription `[MVP]`

- [ ] Subscription screen implemented.
- [ ] Payment provider selected.
- [ ] Checkout flow integrated.
- [ ] Webhook signature verified.
- [ ] `subscriptions/{uid}` updated by backend.
- [ ] User Pro flags synced.
- [ ] Public profile Pro/verified flags synced.
- [ ] Expiration/downgrade handled.
- [ ] Client cannot write Pro state.

### 27.7 AI `[MVP]`

- [ ] Gemini accessed only via backend proxy.
- [ ] Gemini key stored in Secret Manager.
- [ ] AI requests authenticated.
- [ ] AI requests rate-limited.
- [ ] Unsafe requests refused.
- [ ] AI audit metadata written.
- [ ] Client never receives system prompts or API key.

### 27.8 Safety `[MVP]`

- [ ] Block user implemented.
- [ ] Report user implemented.
- [ ] Block affects discovery.
- [ ] Block prevents chat.
- [ ] Reports store reason and source.
- [ ] Reports are not readable by regular users.

### 27.9 Security `[MVP]`

- [ ] Firestore rules implemented.
- [ ] Storage rules implemented.
- [ ] Rules tests passing.
- [ ] No sensitive keys in frontend.
- [ ] Server-owned fields protected.
- [ ] Match creation protected.
- [ ] Coin mutation protected.
- [ ] Subscription mutation protected.

### 27.10 Observability `[MVP]`

- [ ] Frontend error tracking enabled.
- [ ] Cloud Function error logging enabled.
- [ ] Payment webhook alerts enabled.
- [ ] AI error alerts enabled.
- [ ] Storage upload alerts enabled.
- [ ] Function latency monitored.
- [ ] Firestore quota monitored.

### 27.11 QA `[MVP]`

- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Security rules tests pass.
- [ ] E2E critical paths pass.
- [ ] Mobile responsiveness verified.
- [ ] Hebrew RTL verified.
- [ ] Accessibility smoke test complete.

---

## 28. Recommended Implementation Order

### Phase 1 — Foundation `[MVP]`

1. Set up Firebase projects: development, staging, production.
2. Configure React + Vite + TypeScript app.
3. Configure Tailwind CSS and RTL foundation.
4. Add React Router.
5. Add Zustand.
6. Add Zod and React Hook Form.
7. Configure Firebase Auth.
8. Configure Firestore and Storage.
9. Implement auth guards.
10. Implement base app shell.
11. Implement user document creation.
12. Implement `publicProfiles/{uid}` sync.
13. Implement controlled `gameCatalog`.
14. Implement onboarding flow.

### Phase 2 — Discovery & Matching `[MVP]`

1. Implement game inventory.
2. Implement selected game state.
3. Implement discovery deck query.
4. Implement swipe card UI.
5. Implement top HUD bar.
6. Implement swipe gestures and buttons.
7. Implement `submitSwipe`.
8. Implement deterministic match ID.
9. Implement match creation transaction.
10. Implement chat document creation.
11. Implement empty deck and loading states.
12. Enforce Basic swipe limit server-side.

### Phase 3 — Chat `[MVP]`

1. Implement matches list.
2. Implement chat page.
3. Implement message listener.
4. Implement text message send.
5. Implement last-message sync.
6. Implement chat security rules.
7. Implement media upload UI.
8. Implement Basic upgrade prompt for media.
9. Implement Pro media backend validation.
10. Implement chat blocked-state behavior.

### Phase 4 — Shop & Cosmetics `[MVP]`

1. Implement shop catalog.
2. Implement coin balance display.
3. Implement item preview.
4. Implement `purchaseShopItem`.
5. Implement transaction audit.
6. Implement ownership state.
7. Implement `equipItem`.
8. Apply avatar borders.
9. Apply profile banners.
10. Apply global backgrounds.
11. Sync equipped cosmetics to public profile.

### Phase 5 — Pro Subscription `[MVP]`

1. Select payment provider.
2. Implement subscription screen.
3. Implement checkout creation.
4. Implement `paymentWebhook`.
5. Verify webhook signature.
6. Sync `subscriptions/{uid}`.
7. Sync user Pro flags.
8. Sync public profile verified badge.
9. Enforce Pro entitlements server-side.
10. Handle expiration and downgrade.

### Phase 6 — AI Hub `[MVP]`

1. Store Gemini key in Secret Manager.
2. Implement AI Cloud Functions.
3. Implement input validation.
4. Implement guardrails.
5. Implement rate limiting.
6. Implement AI profile review UI.
7. Implement AI squad advice UI.
8. Write AI request audit metadata.
9. Add AI analytics events.
10. Add safe refusal UI.

### Phase 7 — Safety & Hardening `[MVP]`

1. Implement `blockUser`.
2. Implement `createReport`.
3. Enforce block in discovery.
4. Enforce block in chat.
5. Add report source context.
6. Add moderation records.
7. Complete Firestore rules.
8. Complete Storage rules.
9. Add emulator rules tests.
10. Add E2E tests.
11. Add observability.
12. Add alerts.
13. Run performance pass.
14. Run mobile RTL QA.
15. Prepare private beta.

### Phase 8 — Scale Enhancements `[Scale/V1]`

1. Add `discoveryProfiles/{gameId}/players/{uid}`.
2. Add backend-generated `getDiscoveryDeck`.
3. Add `users/{uid}/ownedItems/{itemId}` as ownership source of truth.
4. Add `users/{uid}/usage/{yyyy-mm-dd}` counters.
5. Add subscription reconciliation job.
6. Add moderation queue tooling.
7. Add analytics warehouse integration if needed.
8. Evaluate Cloud Run for AI/recommendations.
9. Evaluate PostgreSQL + Drizzle only after product-market validation.
