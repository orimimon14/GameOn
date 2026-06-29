# Swish & Game — UX Flows & Screen Specifications

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production UX Flows & Screen Specifications |
| Repository Path | `docs/design/UX_FLOWS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/engineering/MIGRATION_PLAN.md`, `docs/architecture/API_CONTRACT.md`, `docs/product/DECISIONS.md`, `docs/design/LOCALIZATION.md`, `docs/design/DESIGN_SYSTEM.md` |
| Primary Locale | `he-IL` |
| Direction | RTL |
| UX Principle | mobile-first, Hebrew-first RTL, backend-authoritative |
| Async Rule | כל מסך async חייב לטפל ב-`loading`, `empty`, `error`, `success` |
| Gating Rule | Auth/onboarding/Pro gating נאכף server-side; ה-UI רק משקף ומסביר |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Navigation Architecture](#2-navigation-architecture)
- [3. Screen Inventory](#3-screen-inventory)
- [4. Core User Journeys](#4-core-user-journeys)
- [5. Per-Screen Specs](#5-per-screen-specs)
- [6. Modals & Overlays](#6-modals--overlays)
- [7. State Patterns](#7-state-patterns)
- [8. Gating UX](#8-gating-ux)
- [9. Navigation & Deep Linking Rules](#9-navigation--deep-linking-rules)
- [10. RTL & Mobile Notes](#10-rtl--mobile-notes)
- [11. Open Items](#11-open-items)

---

## 2. Navigation Architecture

### 2.1 Primary Navigation

Swish & Game uses a mobile-first bottom nav.

Canonical bottom nav items:

| Nav Item | Route | Purpose |
|---|---|---|
| Discover | `/discover` | Swipe-based discovery deck. |
| Matches | `/matches` | Matches list and Likes You surface. |
| Chat | `/chat/:chatId` | Active chat thread. In nav, Chat may deep-link to latest chat list/state under Matches if no `chatId`. |
| Shop | `/shop` | Cosmetic shop, preview, purchase, equip. |
| AI Hub | `/ai` | AI profile review and squad advice. |
| Profile | `/profile` | Own public profile, edit entry, Pro badge visibility. |

Additional routes:

| Route | Purpose |
|---|---|
| `/login` | Authentication entry. |
| `/onboarding` | Required profile/game setup before discovery. |
| `/subscription` | Pro plan, checkout, pending activation, subscription status. |
| `/settings` | Account, safety, app settings. |

### 2.2 Route Map

```text
/
  → if unauthenticated: /login
  → if authenticated and onboarding incomplete: /onboarding
  → if authenticated and onboarding complete: /discover

/login
/onboarding
/discover
/matches
/chat/:chatId
/shop
/subscription
/profile
/settings
/ai
```

### 2.3 Route Guards

| Condition | Target | Notes |
|---|---|---|
| Unauthenticated user opens protected route | `/login` | Preserve intended route for post-login when safe. |
| Authenticated user with onboarding incomplete opens app route | `/onboarding` | Discovery, matches, chat, shop, AI and profile completion require onboarding. |
| Authenticated and onboarding complete opens `/login` | `/discover` | Login screen should not be shown unnecessarily. |
| User opens Pro-gated action as Basic | Same route + upgrade prompt | Do not redirect silently; explain upgrade path. |
| User opens `/chat/:chatId` without access | `/matches` + error toast/state | Backend/Security Rules are authoritative. |
| Suspended/deleted user | `/settings` or account state screen | Actions disabled; server denies sensitive operations. |

### 2.4 RTL Navigation

- Bottom nav order must be tested in RTL.
- Hebrew labels are shown through label maps/copy maps.
- Routes remain English.
- Back behavior follows platform expectations, not visual left/right assumptions.
- Icons with directional meaning must be mirrored or replaced where appropriate.

---

## 3. Screen Inventory

| Screen | Route | Auth | Purpose | Backing Functions / Backend |
|---|---|---|---|---|
| Login | `/login` | Public | Google/email-password sign-in/sign-up. | Firebase Auth |
| Onboarding | `/onboarding` | Authenticated | Create minimum profile + game preferences. | Firestore user writes allowed by rules, `syncPublicProfile` fallback |
| Discovery | `/discover` | Authenticated + onboarding complete | Swipe deck by game. | `submitSwipe`, `getDiscoveryDeck` Scale/V1, Firestore read models |
| Matches | `/matches` | Authenticated + onboarding complete | View matches, Likes You, entry to chats. | `matches`, `chats`, `submitSwipe` for Likes You actions |
| Likes You | within `/matches` | Authenticated + onboarding complete | Show users who liked current user. Open to all in MVP. | Firestore/read model; future function if needed |
| Chat | `/chat/:chatId` | Participant only | Text chat; media for Pro. | text message write via rules, `sendChatMediaMessage`, `blockUser`, `createReport` |
| Shop | `/shop` | Authenticated + onboarding complete | Browse, preview, purchase and equip cosmetics. | `purchaseShopItem`, `equipItem`, `shopItems` |
| Subscription | `/subscription` | Authenticated | Upgrade to Pro, checkout pending, status. | `createCheckoutSession`, `paymentWebhook`, `subscriptions/{uid}` |
| Profile | `/profile` | Authenticated + onboarding complete | Own profile display/edit entry. | Firestore profile docs, `syncPublicProfile` fallback |
| AI Hub | `/ai` | Authenticated + onboarding complete | Profile review and squad advice. | `sendAIProfileReview`, `sendAISquadAdvice` |
| Settings | `/settings` | Authenticated | Account, safety, app settings. | Firebase Auth, `blockUser`, settings writes allowed by rules |

---

## 4. Core User Journeys

### 4.1 Onboarding Journey

#### Flow

```text
Open app
  → /login
  → authenticate with Firebase Auth
  → /onboarding
  → create basic profile
  → add games/preferences
  → onboarding complete
  → /discover
```

#### Steps

| Step | Screen | User Action | Backend / Data | States |
|---|---|---|---|---|
| 1 | Login | Choose Google or email/password | Firebase Auth | loading/error/success |
| 2 | Onboarding profile | Enter display name, bio, image optional | `users/{uid}` | validation/loading/error |
| 3 | Onboarding games | Select games, ranks, `skillLevel`, platforms, `lookingFor` | `users/{uid}/games/{gameId}` | loading/empty/error/success |
| 4 | Completion | Tap continue | `onboardingCompleted = true`; `syncPublicProfile` fallback if needed | loading/success |
| 5 | Discovery entry | Redirect | `/discover` | first deck loading |

#### UX Rules

- Onboarding blocks discovery until complete.
- Use Hebrew UI labels; stored enums remain English.
- Allow users to complete minimum required fields before optional polish.
- If saving fails, keep form state and show retry.
- Do not create matches, swipes, coins, Pro state or public profiles directly from UI unless permitted by rules; public read models are backend-derived.

---

### 4.2 Returning User Journey

#### Flow

```text
Open app
  → Firebase Auth restores session
  → load users/{uid}
  → if onboarding incomplete: /onboarding
  → else: /discover
```

#### States

| State | UX |
|---|---|
| Auth loading | Splash/loading screen. |
| No session | `/login`. |
| Session exists + user loading | App shell loading. |
| User missing | Account recovery/error state. |
| Onboarding incomplete | `/onboarding`. |
| Ready | `/discover`. |
| Suspended/deleted | Account state screen or settings-limited view. |

---

### 4.3 Swipe → Match → Chat Journey

#### Flow

```text
/discover
  → view card
  → skip/like via submitSwipe
  → result = skipped | liked | matched
  → if matched: show match celebration
  → CTA: open chat
  → /chat/:chatId
```

#### Backend Actions

| User Action | Function / Data |
|---|---|
| Load deck | `getDiscoveryDeck` Scale/V1 or Firestore read model in MVP |
| Like/skip | `submitSwipe` |
| Reciprocal like | `submitSwipe` creates `matches/{matchId}` and `chats/{chatId}` |
| Open chat | read `chats/{chatId}` and messages |
| Send text | client creates `type: "text"` message if rules allow |
| Send image | `sendChatMediaMessage` only, Pro required |

#### Match Celebration

Shown only when `submitSwipe` returns:

```ts
result: "matched"
```

Celebration includes:

- matched user's image/name.
- short positive message.
- CTA: `פתח צ׳אט`.
- secondary CTA: `המשך לגלות`.
- no extra backend write.

---

### 4.4 Pro Upgrade Journey

#### Trigger Examples

- Basic user hits swipe limit.
- Basic user taps media upload.
- Basic user tries Pro-only cosmetic.
- User opens `/subscription`.

#### Flow

```text
Basic user hits Pro gate
  → upgrade modal or /subscription
  → user confirms upgrade
  → createCheckoutSession
  → redirect to provider checkoutUrl
  → provider checkout
  → callback/redirect returns to app
  → pending activation screen
  → paymentWebhook verifies signature
  → subscriptions/{uid}
  → onSubscriptionUpdated
  → users/{uid}.isPro = true
  → publicProfiles/{uid}.verifiedBadge = true
  → UI updates to Pro
```

#### UX Rules

- Checkout redirect alone never grants Pro.
- Show pending activation after checkout success until Firestore entitlement updates.
- If webhook is delayed, show patient retry/help copy.
- If checkout is cancelled, return to Basic state with no penalty.
- The UI may show Pro benefits, but backend enforces them.

---

### 4.5 Cosmetic Shop Journey

#### Flow

```text
/shop
  → browse shopItems
  → select item
  → preview
  → purchaseShopItem
  → purchase success
  → equipItem
  → profile/public profile reflects cosmetic
```

#### Backend Actions

| Action | Function / Data |
|---|---|
| Browse | read `shopItems` |
| Purchase | `purchaseShopItem` |
| Equip | `equipItem` |
| Pro-only item gate | backend checks `requiresPro` and `isProUser` |
| Public display | `publicProfiles/{uid}` and discovery read models update |

#### UX Rules

- Show current coin balance as read-only.
- Never modify `coins` client-side.
- Confirm purchase before spending coins.
- Show clear error for `insufficient_coins`.
- Show upgrade prompt for `pro_required`.
- Preview is visual only; purchase/equip is backend-authoritative.

---

### 4.6 AI Hub Journey

#### Flow

```text
/ai
  → choose Profile Review or Squad Advice
  → enter/select context
  → submit
  → loading
  → sendAIProfileReview / sendAISquadAdvice
  → success/refusal/error
  → user may copy/apply suggestions manually
```

#### Backend Actions

| AI Tool | Function |
|---|---|
| Profile Review | `sendAIProfileReview` |
| Squad Advice | `sendAISquadAdvice` |

#### UX Rules

- AI calls are authenticated.
- Rate limits are backend-enforced.
- Refusals should be shown as normal, safe UX states.
- Do not expose prompts, moderation logic, raw provider errors or model internals.
- Gemini is never called from frontend.

---

### 4.7 Safety Journey: Block / Report

#### Report Flow

```text
Profile/chat/message menu
  → report modal
  → select reason
  → optional description
  → createReport
  → success confirmation
```

#### Block Flow

```text
Profile/chat menu
  → block confirmation
  → blockUser
  → chat/match state updates
  → user removed/hidden from relevant UX
```

#### Backend Actions

| Action | Function |
|---|---|
| Report user/content | `createReport` |
| Block user | `blockUser` |

#### UX Rules

- Confirm destructive/safety actions.
- Do not show reports to regular users after submission.
- Blocking should feel immediate in UI, but backend state is authoritative.
- Report reasons come from `reportReasonLabels`.

---

## 5. Per-Screen Specs

### 5.1 Login Screen

| Field | Spec |
|---|---|
| Route | `/login` |
| Purpose | Authenticate user through Firebase Auth. |
| Auth | Public; redirect authenticated users away. |
| Entry | Direct open, expired session, protected route redirect. |
| Exit | `/onboarding` if incomplete, `/discover` if complete. |

#### Key Elements

- Product logo/name: Swish & Game.
- Short Hebrew value proposition.
- Google sign-in button.
- Email/password option.
- Error banner.
- Terms/privacy links if available.

#### States

| State | UX |
|---|---|
| loading | Disable buttons, show spinner. |
| error | Show Hebrew auth error. |
| success | Transition to guard resolution. |
| empty | Not applicable. |

#### Backend

- Firebase Auth only.
- No direct Firestore sensitive writes from login UI.

---

### 5.2 Onboarding Screen

| Field | Spec |
|---|---|
| Route | `/onboarding` |
| Purpose | Collect minimum profile and game data before discovery. |
| Auth | Required. |
| Gating | Blocks `/discover` until complete. |

#### Key Elements

- Progress indicator.
- Display name.
- Bio.
- Profile image optional.
- Primary game selection.
- Rank.
- `skillLevel`.
- Platforms.
- `lookingFor` / `voicePreference`.
- Continue/save button.

#### States

| State | UX |
|---|---|
| loading | Loading existing draft/user state. |
| empty | First-time form. |
| error | Save failure with retry. |
| success | Redirect to `/discover`. |

#### Backend

- Writes allowed client-owned profile fields only.
- `users/{uid}/games/{gameId}` for game preferences.
- `syncPublicProfile` may be used as fallback/repair.

---

### 5.3 Discovery Screen

| Field | Spec |
|---|---|
| Route | `/discover` |
| Purpose | Swipe deck for gamer discovery. |
| Auth | Required. |
| Gating | Onboarding complete required. |

#### Key Elements

- Deck card.
- Primary game context/filter.
- Swipe actions: like/skip.
- Swipe HUD:
  - left: View Profile
  - center: `skillLevel` + trophy
  - right: rank
- Pro/swipe-limit prompt when needed.
- Empty deck state.

#### Swipe HUD RTL Note

The HUD labels remain semantically:

| Position | Meaning |
|---|---|
| Left | View Profile |
| Center | `skillLevel` + trophy |
| Right | rank |

Because UI is RTL, layout must be visually tested on mobile to ensure the HUD still reads naturally without changing the product meaning.

#### States

| State | UX |
|---|---|
| loading | Skeleton card. |
| empty | “אין עוד שחקנים כרגע” + refresh/adjust game CTA. |
| error | Retry deck load. |
| success | Show active card. |

#### Backend

- `getDiscoveryDeck` for backend-generated deck in Scale/V1.
- `submitSwipe` for like/skip.
- Basic swipe limit enforced server-side.

---

### 5.4 Matches Screen

| Field | Spec |
|---|---|
| Route | `/matches` |
| Purpose | View current matches and Likes You. |
| Auth | Required. |
| Gating | Onboarding complete required. |

#### Key Elements

- Tabs/sections:
  - Matches
  - Likes You
- Match cards.
- Last message preview.
- Pro badge if relevant.
- Empty state.
- CTA to discovery.

#### Likes You in MVP

Likes You is open to all users in MVP per ADR-033.  
Do not Pro-gate it in MVP.

#### States

| State | UX |
|---|---|
| loading | List skeleton. |
| empty | No matches yet + CTA to Discover. |
| error | Retry. |
| success | List of matches / likes. |

#### Backend

- Reads `matches` and/or relevant read model.
- Opens `chats/{chatId}`.
- Potential Like-back action uses `submitSwipe`.

---

### 5.5 Chat Screen

| Field | Spec |
|---|---|
| Route | `/chat/:chatId` |
| Purpose | Conversation between matched users. |
| Auth | Required + participant only. |
| Gating | Chat access enforced by Security Rules/backend. |

#### Key Elements

- Chat header: user name, status/last active if available.
- Message list.
- Text composer.
- Media button with Pro gate.
- Safety menu: report/block.
- Image preview for media messages.

#### States

| State | UX |
|---|---|
| loading | Message skeleton. |
| empty | “עוד אין הודעות — שלחו הודעה ראשונה”. |
| error | Access denied or retry. |
| success | Messages shown. |

#### Backend

- Text messages: client may create only `type: "text"` where rules allow.
- Media messages: `sendChatMediaMessage`, Pro-only.
- Report: `createReport`.
- Block: `blockUser`.

---

### 5.6 Likes You Screen

| Field | Spec |
|---|---|
| Route | within `/matches` |
| Purpose | Show users who liked current user. |
| Auth | Required. |
| Gating | Open to all users in MVP. |

#### Key Elements

- List/grid of users who liked current user.
- Profile preview.
- Like back / skip actions.
- Empty state.

#### States

| State | UX |
|---|---|
| loading | Skeleton cards. |
| empty | “עדיין אין לייקים חדשים”. |
| error | Retry. |
| success | Likes list. |

#### Backend

- Read likes/read model according to implementation.
- Like back uses `submitSwipe`.

---

### 5.7 Shop Screen

| Field | Spec |
|---|---|
| Route | `/shop` |
| Purpose | Browse and purchase cosmetics. |
| Auth | Required. |
| Gating | Some items may require Pro. |

#### Key Elements

- Category filters.
- Item grid.
- Rarity labels.
- Price in coins.
- Owned/equipped state.
- Preview panel.
- Purchase confirmation.
- Equip action.

#### States

| State | UX |
|---|---|
| loading | Shop skeleton. |
| empty | “אין פריטים זמינים כרגע”. |
| error | Retry. |
| success | Items grid. |

#### Backend

- Read `shopItems`.
- `purchaseShopItem`.
- `equipItem`.

---

### 5.8 Subscription Screen

| Field | Spec |
|---|---|
| Route | `/subscription` |
| Purpose | Explain Pro, start checkout, show current subscription state. |
| Auth | Required. |
| Gating | Billing can be disabled via config. |

#### Key Elements

- Pro price: `29.90 ILS/month`.
- Benefits list:
  - unlimited swipes.
  - media in chat.
  - premium backgrounds.
  - verified badge.
  - enhanced cosmetics.
- Checkout CTA.
- Current status.
- Pending activation state.
- Cancel/management info if available.

#### States

| State | UX |
|---|---|
| loading | Subscription status loading. |
| empty | Basic user plan presentation. |
| error | Checkout/status error. |
| success | Current plan or checkout URL redirect. |
| pending | Waiting for webhook entitlement sync. |

#### Backend

- `createCheckoutSession`.
- `paymentWebhook` updates entitlement.
- `subscriptions/{uid}` read.
- `onSubscriptionUpdated` syncs `users/{uid}` and `publicProfiles/{uid}`.

---

### 5.9 Profile Screen

| Field | Spec |
|---|---|
| Route | `/profile` |
| Purpose | Show own profile and edit entry. |
| Auth | Required. |
| Gating | Onboarding complete preferred; incomplete redirects to onboarding. |

#### Key Elements

- Profile image/banner.
- Display name.
- Bio.
- Games/ranks/platforms.
- `skillLevel`.
- Pro badge if `verifiedBadge`.
- Equipped cosmetics.
- Edit profile CTA.
- Subscription CTA if Basic.

#### States

| State | UX |
|---|---|
| loading | Profile skeleton. |
| empty | Prompt to complete onboarding/profile. |
| error | Retry. |
| success | Profile displayed. |

#### Backend

- Reads `users/{uid}` owner data and/or `publicProfiles/{uid}`.
- Profile edits write only client-writable fields.
- Public profile sync backend-derived.

---

### 5.10 AI Hub Screen

| Field | Spec |
|---|---|
| Route | `/ai` |
| Purpose | AI profile review and squad advice. |
| Auth | Required. |
| Gating | AI feature flag and rate limits backend-enforced. |

#### Key Elements

- Two cards/tabs:
  - Profile Review
  - Squad Advice
- Input forms.
- Submit CTA.
- AI loading state.
- Result card.
- Refusal state.
- Rate-limit state.

#### States

| State | UX |
|---|---|
| loading | AI thinking indicator. |
| empty | Tool selection and empty form. |
| error | Retry/generic safe error. |
| success | Structured AI result. |
| refusal | Safe refusal message and alternative prompt suggestions. |

#### Backend

- `sendAIProfileReview`.
- `sendAISquadAdvice`.
- No direct Gemini client calls.

---

### 5.11 Settings Screen

| Field | Spec |
|---|---|
| Route | `/settings` |
| Purpose | Account, safety, app settings. |
| Auth | Required. |
| Gating | Suspended users may see limited settings only. |

#### Key Elements

- Account info.
- Subscription entry.
- Blocked users entry if implemented.
- Safety/reporting information.
- Logout.
- Delete/deactivate account entry if implemented.

#### States

| State | UX |
|---|---|
| loading | Settings skeleton. |
| empty | Minimal account state. |
| error | Retry. |
| success | Settings list. |

#### Backend

- Firebase Auth logout.
- Settings writes for allowed fields.
- Safety actions through `blockUser` / `createReport` where relevant.

---

## 6. Modals & Overlays

### 6.1 Upgrade Modal

Triggered by:

- swipe limit.
- media upload attempt.
- Pro-only cosmetic.
- subscription CTA.

Contents:

- Short Pro value proposition.
- Price: `29.90 ILS/month`.
- CTA: upgrade.
- Secondary: not now.
- Legal/cancellation link if available.

Backend:

- CTA calls `createCheckoutSession`.
- Redirect does not grant Pro.

---

### 6.2 Match Celebration

Triggered by:

```ts
submitSwipe.result === "matched"
```

Contents:

- matched profile visual.
- Hebrew success copy.
- CTA: open chat.
- CTA: continue discovery.

No additional write.

---

### 6.3 Purchase Confirm Modal

Triggered before `purchaseShopItem`.

Contents:

- item preview.
- price in coins.
- current coin balance.
- confirm/cancel.
- Pro requirement if relevant.

Backend:

- `purchaseShopItem`.
- error states:
  - `insufficient_coins`.
  - `pro_required`.
  - `already_exists`.

---

### 6.4 Swipe-Limit Modal

Triggered when `submitSwipe` returns `resource_exhausted`.

Contents:

- explain daily Basic swipe limit.
- CTA to Pro upgrade.
- secondary action to return later.

Backend remains authoritative.

---

### 6.5 Report / Block Modal

Report modal:

- reason list from `reportReasonLabels`.
- optional description.
- submit calls `createReport`.

Block modal:

- clear confirmation.
- submit calls `blockUser`.
- after success, return to safe screen.

---

### 6.6 Image Preview

Used for chat media.

Rules:

- Text chat is free.
- Image/media send is Pro-only through `sendChatMediaMessage`.
- Basic users see upgrade gate before upload/send.

---

### 6.7 AI Refusal Overlay/State

Triggered when AI returns a refusal-safe response.

Contents:

- refusal message.
- safe alternatives.
- CTA to edit prompt/context.

Do not show policy internals, raw provider error, or system prompt.

---

## 7. State Patterns

### 7.1 Standard Async States

Every async screen/component must implement:

| State | Required UX |
|---|---|
| `loading` | Skeleton/spinner with stable layout. |
| `empty` | Helpful empty message + next action. |
| `error` | Hebrew error copy + retry when safe. |
| `success` | Main content. |

### 7.2 Pending States

| Pending State | UX |
|---|---|
| Pro activation pending | Show “מפעילים את Pro...” and listen for entitlement update. |
| AI loading | Show AI-specific loading; prevent duplicate submit. |
| Checkout redirect | Disable CTA after click. |
| Media upload | Progress indicator and cancel if possible. |
| Match creation | Optimistic animation only after backend result. |

### 7.3 Offline / Retry

Offline UX:

- show connection warning.
- allow reading cached non-sensitive data if available.
- disable sensitive writes if offline.
- retry idempotent reads.
- do not retry purchase/checkout blindly.

### 7.4 Error Copy

Use `ApiErrorCode` mapping from `API_CONTRACT.md`.

Examples:

| Error | UX |
|---|---|
| `unauthenticated` | Redirect to `/login`. |
| `resource_exhausted` | Show limit modal. |
| `pro_required` | Show upgrade modal. |
| `insufficient_coins` | Show coin shortage message. |
| `blocked` | Show action unavailable. |
| `internal` | Generic retry later. |

---

## 8. Gating UX

### 8.1 Principle

Gating UX is explanatory only.  
Server-side functions and Security Rules enforce real access.

### 8.2 Pro-Gated Features for Basic Users

| Feature | Basic UX | Server Enforcement |
|---|---|---|
| Unlimited swipes | Limit modal + Pro CTA | `submitSwipe` |
| Media chat | Upgrade prompt on media button | `sendChatMediaMessage` |
| Premium cosmetics | Pro badge/lock on item | `purchaseShopItem`, `equipItem` |
| Verified badge | Explain as Pro benefit | `onSubscriptionUpdated` |
| Future AI limits | Rate/upgrade copy if configured | AI functions + usage counters |

### 8.3 Auth Gate

Unauthenticated users:

- can see `/login`.
- protected routes redirect to `/login`.
- intended route may be stored for safe post-login navigation.

### 8.4 Onboarding Gate

Authenticated but incomplete users:

- redirected to `/onboarding`.
- cannot access discovery/matches/chat/shop/AI as normal app flow.
- backend still validates where required.

### 8.5 Suspended User Gate

Suspended users:

- actions disabled.
- backend returns failure.
- UI explains limited account state without exposing moderation internals.

---

## 9. Navigation & Deep Linking Rules

### 9.1 Back Behavior

| From | Back Behavior |
|---|---|
| `/chat/:chatId` | Back to `/matches`. |
| `/subscription` from modal | Back closes modal or returns to previous route. |
| post-checkout success | Back should not re-open provider checkout. |
| onboarding | Avoid leaving incomplete user in broken route. |
| login | Browser back should not expose protected screen. |

### 9.2 `/chat/:chatId` Deep Link

When opening `/chat/:chatId` directly:

1. auth guard runs.
2. onboarding guard runs.
3. chat access is validated by Firestore Rules/backend.
4. if allowed, show chat.
5. if not allowed, show error and navigate to `/matches`.

### 9.3 Post-Checkout Redirect

Success redirect:

```text
/subscription?checkout=success
```

UX:

- show pending activation.
- listen for `subscriptions/{uid}` or `users/{uid}.isPro`.
- do not set Pro client-side.

Cancel redirect:

```text
/subscription?checkout=cancelled
```

UX:

- show cancellation message.
- keep Basic state.

### 9.4 Route Params

| Param | Rule |
|---|---|
| `chatId` | Treat as untrusted. Validate via backend/read permissions. |
| checkout query params | UX only. Not entitlement proof. |
| filter params | Validate against canonical enums. |

---

## 10. RTL & Mobile Notes

### 10.1 Mobile-First

- Design for small screens first.
- Bottom nav must remain reachable.
- Primary CTAs should be thumb-friendly.
- Avoid dense multi-column layouts.
- Minimum touch target: `44px` recommended.

### 10.2 RTL

- App root uses `lang="he"` and `dir="rtl"`.
- Prefer logical properties: `padding-inline`, `margin-inline-start`, `border-inline-start`.
- Avoid hardcoded left/right unless intentionally visual.
- Use `text-start` over `text-left`.
- Mixed content uses `bdi` or `dir="auto"`.

### 10.3 Swipe Gestures in RTL

Swipe gesture semantics in RTL require explicit product/design decision.

Until finalized:

- keep button actions explicit.
- do not rely only on gesture direction.
- test visual HUD positions.
- cross-reference `LOCALIZATION.md §5.4`.

### 10.4 Mixed Hebrew/English

Examples:

```tsx
<p>
  מחפש שחקן ל־<bdi>{gameName}</bdi> בדירוג <bdi>{rank}</bdi>
</p>
```

For user bio:

```tsx
<p dir="auto">{bio}</p>
```

---

## 11. Open Items

| Item | Status | Impact |
|---|---|---|
| Swipe gesture semantics in RTL | Open | Determines gesture direction for like/skip and animation. |
| Likes You gating in V1 | Open; MVP open to all via ADR-033 | Could become Pro-gated later. |
| Exact bottom nav visual order in RTL | Needs design QA | Must align with Hebrew mental model. |
| Chat list route | Open | Current canonical route includes `/chat/:chatId`; list may live under `/matches`. |
| Profile edit route | Open | Could be modal inside `/profile` or future `/profile/edit`. |
| Settings subsections | Open | Safety/account/subscription subroutes may be added later. |
| Post-checkout timeout UX | Open | Need support/retry timing decision. |
| AI Hub Basic vs Pro limits | Open via ADR-027 | Impacts gating copy and rate-limit states. |
| Pro cosmetics after expiration | Open via ADR-032 | Impacts Shop/Profile UX. |
| Empty deck refresh strategy | Open | Pull-to-refresh vs CTA vs auto-refresh. |
| Offline support depth | Open | Need product decision for cached reads and disabled actions. |
| Final visual styling | Covered by `DESIGN_SYSTEM.md` | This document defines flow/spec, not full visual design. |
