# Swish & Game — Analytics & Event Tracking Plan

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Analytics & Event Tracking Plan |
| Repository Path | `docs/quality/ANALYTICS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/architecture/DATA_MODEL.md`, `docs/product/DECISIONS.md`, `docs/design/UX_FLOWS.md` |
| Analytics Provider | TBD — provider-agnostic plan |
| Candidate Providers | Firebase Analytics / GA4, PostHog, Mixpanel |
| Primary Locale | `he-IL` |
| Event Naming | English `snake_case` |
| Data Principle | no PII, no secrets, no raw user content |
| Identifier Principle | `uid` may be used only as pseudonymous identifier when required |
| Canonical Rule | enum values are English; UI labels are Hebrew through label maps only |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Analytics Strategy](#2-analytics-strategy)
- [3. Event Naming Conventions](#3-event-naming-conventions)
- [4. Event Taxonomy / Tracking Plan](#4-event-taxonomy--tracking-plan)
- [5. Standard Event Properties](#5-standard-event-properties)
- [6. Funnels](#6-funnels)
- [7. KPIs / Success Metrics](#7-kpis--success-metrics)
- [8. Client vs Server Events](#8-client-vs-server-events)
- [9. Privacy & Compliance](#9-privacy--compliance)
- [10. Implementation Notes](#10-implementation-notes)
- [11. Open Items](#11-open-items)

---

## 2. Analytics Strategy

### 2.1 Goal

Swish & Game uses event-based analytics to understand whether users:

- complete onboarding.
- add games and build usable profiles.
- open discovery and swipe.
- create matches.
- start conversations.
- return and stay engaged.
- convert to Pro.
- buy and equip cosmetics.
- use AI Hub.
- use safety tools when needed.

Analytics must support product decisions, funnel debugging, retention analysis, monetization analysis, and quality/safety monitoring — without collecting PII or sensitive user content.

### 2.2 Provider-Agnostic Design

The analytics provider is TBD. Candidate providers include:

- Firebase Analytics / GA4.
- PostHog.
- Mixpanel.

Therefore the code must use a provider abstraction:

```ts
trackEvent(name, props)
```

rather than importing a provider SDK throughout the app.

The event taxonomy in this document is canonical regardless of provider.

### 2.3 What We Measure

| Area | What We Measure | Why |
|---|---|---|
| Acquisition | signup start/completion | להבין conversion into account creation. |
| Activation | onboarding completion, game added | להבין אם המשתמש מגיע ל-discovery עם פרופיל שימושי. |
| Discovery | deck opens, filters, swipes, profile views | להבין matching supply/demand and discovery quality. |
| Matching | `match_created` | core value moment. |
| Chat | chat opens, text/media send attempts | engagement quality after match. |
| Monetization | upgrade modal, subscription start/activation/cancellation | Pro funnel and revenue health. |
| Shop | item views, purchases, equips | cosmetics economy and engagement. |
| AI | AI Hub opens and AI request events | usage, feature value, cost awareness. |
| Safety | reports and blocks | quality/safety signals. |

### 2.4 Client vs Server Analytics

Use client events for UI interactions and screen intent.

Use server events for trusted outcomes.

Examples:

| Event Type | Client / Server | Example |
|---|---|---|
| UI intent | Client | `upgrade_modal_viewed`, `shop_opened` |
| Trusted outcome | Server | `match_created`, `item_purchased`, `subscription_activated` |
| Mixed flow | Both | `media_upload_attempted` client, `media_upload_blocked_basic` client/server depending gate source |

Server-side events should be emitted from Cloud Functions/triggers when the outcome is backend-authoritative.

### 2.5 Analytics Must Not Become Authorization

Analytics is observational only.

Never use analytics events as proof for:

- Pro entitlement.
- purchase completion.
- match creation.
- media send success.
- AI request success.
- report/block enforcement.

Those states are owned by Firestore/Cloud Functions as defined in architecture/API/data model docs.

---

## 3. Event Naming Conventions

### 3.1 Event Name Format

Event names use English `snake_case`.

Preferred structure:

```text
object_action
```

Examples:

```text
signup_started
onboarding_completed
profile_updated
match_created
item_purchased
subscription_activated
```

### 3.2 Naming Rules

| Rule | Example |
|---|---|
| Use English | `profile_updated` |
| Use `snake_case` | `media_upload_blocked_basic` |
| Prefer past tense for completed outcomes | `subscription_activated` |
| Prefer action intent for attempts | `media_upload_attempted` |
| Do not include dynamic values in event name | use `game_id` prop, not `valorant_selected` |
| Do not use Hebrew event names | no `הרשמה_הושלמה` |
| Do not use provider-specific names | no `ga_signup_event` |

### 3.3 Property Naming

Properties also use English `snake_case`.

Examples:

```ts
{
  app_env: "staging",
  locale: "he-IL",
  is_pro: false,
  game_id: "valorant",
  platform: "pc"
}
```

### 3.4 Enum Values

Enum values must match `DATA_MODEL.md` and remain English.

Examples:

```ts
skill_level: "beginner" | "intermediate" | "pro" | "elite"
subscription_tier: "basic" | "pro"
subscription_status: "active" | "cancelled" | "expired"
platform: "pc" | "playstation_5" | "xbox_series_x" | "mobile"
```

### 3.5 Property Value Rules

Allowed:

- booleans.
- numbers.
- English enum values.
- IDs that are not PII, where needed.
- pseudonymous user ID where required.
- coarse app context.

Forbidden:

- email.
- phone.
- raw chat text.
- bio text.
- display name.
- profile image URL.
- payment card/payment payload.
- Gemini prompt/response.
- service/provider secrets.
- exact IP address.
- precise location.

---

## 4. Event Taxonomy / Tracking Plan

### 4.1 Acquisition & Auth Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `signup_started` | User opens signup/auth intent from `/login` | `auth_provider?`, `entry_route`, standard props | Client | `auth` |
| `signup_completed` | Firebase Auth user successfully created / first login completed | `auth_provider?`, `is_new_user`, standard props | Client + optional Server | `auth` |

Recommended properties:

```ts
type SignupProperties = StandardEventProperties & {
  auth_provider?: "google" | "email_password";
  entry_route?: string;
  is_new_user?: boolean;
};
```

### 4.2 Onboarding Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `onboarding_started` | Authenticated user first enters `/onboarding` | `step`, standard props | Client | `onboarding` |
| `onboarding_completed` | User completes required onboarding and can enter discovery | `games_count`, `platforms_count`, `has_profile_image`, `skill_level?`, standard props | Client + optional Server | `onboarding` |
| `game_added` | User adds a game to profile/onboarding | `game_id`, `platform`, `skill_level`, `rank_present`, standard props | Client | `onboarding`, `profile` |

Recommended properties:

```ts
type OnboardingCompletedProperties = StandardEventProperties & {
  games_count: number;
  platforms_count?: number;
  has_profile_image: boolean;
  skill_level?: SkillLevel;
};
```

### 4.3 Profile Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `profile_updated` | User saves profile changes | `changed_fields`, `games_count?`, `has_profile_image?`, standard props | Client + optional Server | `profile` |
| `profile_viewed` | User opens another user's profile from discovery/matches/chat | `viewed_user_id?`, `source`, `game_id?`, standard props | Client | `profile`, `discovery`, `matches`, `chat` |

Privacy note: `viewed_user_id` is a pseudonymous user ID. Do not include display name, bio, email, image URL, or raw profile content.

Recommended properties:

```ts
type ProfileViewedProperties = StandardEventProperties & {
  viewed_user_id?: string;
  source: "discovery" | "matches" | "likes_you" | "chat" | "profile_link";
  game_id?: string;
};
```

### 4.4 Discovery & Swipe Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `discovery_opened` | User opens `/discover` | `selected_game_id?`, `deck_size?`, standard props | Client | `discovery` |
| `game_filter_selected` | User selects/changes discovery game filter | `game_id`, `source`, standard props | Client | `discovery` |
| `swipe_left` | User performs left swipe / skip action | `target_user_id?`, `game_id`, `input_method`, standard props | Client | `discovery` |
| `swipe_right` | User performs right swipe / like action | `target_user_id?`, `game_id`, `input_method`, standard props | Client | `discovery` |
| `match_created` | Backend creates a match after reciprocal like | `match_id`, `chat_id`, `game_id`, `source`, standard server props | Server | `discovery`, `matches` |

Important: `swipe_left` / `swipe_right` are UI-intent events. The trusted swipe result remains `submitSwipe`.

Recommended properties:

```ts
type SwipeProperties = StandardEventProperties & {
  target_user_id?: string;
  game_id: string;
  input_method: "gesture" | "button" | "keyboard";
};

type MatchCreatedProperties = StandardServerEventProperties & {
  match_id: string;
  chat_id: string;
  game_id: string;
  source: "submit_swipe";
};
```

### 4.5 Chat & Media Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `chat_opened` | User opens `/chat/:chatId` | `chat_id`, `match_id?`, `source`, standard props | Client | `chat` |
| `message_sent` | Text message successfully sent | `chat_id`, `message_type`, `source`, standard props | Client + optional Server | `chat` |
| `media_upload_attempted` | User taps/selects media upload | `chat_id`, `media_type`, `is_pro`, standard props | Client | `chat` |
| `media_upload_blocked_basic` | Basic user attempts Pro-only media upload and is blocked | `chat_id?`, `gate_source`, standard props | Client + optional Server | `chat`, `subscription` |

Privacy note: never track message body, image URL, storage path, or media content.

Recommended properties:

```ts
type MessageSentProperties = StandardEventProperties & {
  chat_id: string;
  message_type: "text" | "image" | "system";
  source: "chat_composer" | "media_function";
};
```

### 4.6 Shop Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `shop_opened` | User opens `/shop` | `selected_category?`, standard props | Client | `shop` |
| `item_viewed` | User opens item preview/details | `item_id`, `category`, `rarity`, `requires_pro`, `price_coins`, standard props | Client | `shop` |
| `item_purchased` | Backend successfully completes item purchase | `item_id`, `category`, `rarity`, `requires_pro`, `price_coins`, `coin_balance_after?`, standard server props | Server | `shop` |
| `item_equipped` | Backend successfully equips owned item | `item_id`, `category`, `rarity`, standard server props | Server | `shop`, `profile` |

Recommended properties:

```ts
type ShopItemProperties = StandardEventProperties & {
  item_id: string;
  category: "avatar_border" | "profile_banner" | "global_background";
  rarity: "common" | "rare" | "epic" | "legendary";
  requires_pro: boolean;
  price_coins?: number;
};
```

### 4.7 Subscription & Monetization Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `upgrade_modal_viewed` | User sees upgrade modal | `reason`, `source_route`, standard props | Client | `subscription` |
| `subscription_started` | User starts checkout via `createCheckoutSession` | `provider`, `tier`, `price_amount`, `currency`, `reason?`, standard props | Client + optional Server | `subscription` |
| `subscription_activated` | Verified webhook activates Pro entitlement | `provider`, `tier`, `status`, `price_amount`, `currency`, standard server props | Server | `subscription` |
| `subscription_cancelled` | Verified provider event cancels subscription or backend reconciliation marks cancelled | `provider`, `tier`, `status`, `cancel_reason?`, standard server props | Server | `subscription` |

Important: checkout callback/redirect is not proof of Pro. Only verified server events count as `subscription_activated`.

Recommended properties:

```ts
type SubscriptionProperties = StandardEventProperties & {
  provider: "stripe" | "cardcom" | "meshulam" | "other";
  tier: "pro";
  price_amount: 29.9;
  currency: "ILS";
  reason?: "swipe_limit" | "media" | "cosmetic" | "ai_limit" | "profile" | "general";
};
```

### 4.8 AI Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `ai_hub_opened` | User opens `/ai` | `available_tools`, standard props | Client | `ai` |
| `ai_profile_review_requested` | User requests profile review | `request_id?`, `status?`, `is_pro`, standard props | Client + optional Server | `ai` |
| `ai_squad_advice_requested` | User requests squad advice | `request_id?`, `status?`, `is_pro`, standard props | Client + optional Server | `ai` |

Privacy note: never track prompt text, profile bio, generated response, system prompt, Gemini raw error, or model secret.

Recommended properties:

```ts
type AIRequestProperties = StandardEventProperties & {
  request_id?: string;
  request_type: "profile_optimization" | "squad_advice" | "match_insight";
  status?: "pending" | "completed" | "failed" | "blocked";
  is_pro: boolean;
};
```

### 4.9 Safety Events

| Event Name | Trigger | Properties | Client / Server | Feature |
|---|---|---|---|---|
| `user_reported` | User submits report through `createReport` | `report_id?`, `reported_user_id?`, `reason`, `source`, standard props | Client + optional Server | `safety` |
| `user_blocked` | User blocks another user through `blockUser` | `blocked_user_id?`, `source`, standard props | Client + optional Server | `safety`, `chat`, `profile` |

Privacy note: report description text must not be tracked.

Recommended properties:

```ts
type UserReportedProperties = StandardEventProperties & {
  report_id?: string;
  reported_user_id?: string;
  reason:
    | "harassment"
    | "hate_speech"
    | "sexual_content"
    | "scam_spam"
    | "underage_concern"
    | "cheating_exploits"
    | "fake_profile"
    | "other";
  source: "profile" | "chat" | "message" | "matches" | "discovery";
};
```

---

## 5. Standard Event Properties

### 5.1 Standard Client Properties

Every client event should include the following when available and allowed.

| Property | Type | Example | PII? | Notes |
|---|---|---|---:|---|
| `app_env` | `"dev" \| "staging" \| "prod"` | `"prod"` | No | From environment config. |
| `app_version` | `string` | `"1.0.0"` | No | Build/version identifier. |
| `locale` | `string` | `"he-IL"` | No | Hebrew-first launch. |
| `direction` | `"rtl" \| "ltr"` | `"rtl"` | No | Mostly `"rtl"` in MVP. |
| `platform` | `string` | `"web"` | No | Analytics platform, not game platform. |
| `device_type` | `"mobile" \| "tablet" \| "desktop"` | `"mobile"` | No | Derived client-side. |
| `route` | `string` | `"/discover"` | No | Avoid query params with sensitive data. |
| `is_authenticated` | `boolean` | `true` | No | Context. |
| `user_id` | `string?` | `"uid_abc"` | Pseudonymous | Include only if provider/design requires. |
| `is_pro` | `boolean` | `false` | No | Read-only from backend-derived user state. |
| `subscription_tier` | `"basic" \| "pro"` | `"basic"` | No | English enum. |
| `session_id` | `string?` | `"session_123"` | Pseudonymous | Optional; do not use cookie if consent disallows. |
| `event_source` | `"client"` | `"client"` | No | Useful in warehouse/provider normalization. |
| `event_time` | ISO timestamp | `"2026-01-01T10:00:00.000Z"` | No | Provider may set automatically. |

### 5.2 Standard Server Properties

Server-emitted trusted events should include:

| Property | Type | Example | PII? | Notes |
|---|---|---|---:|---|
| `app_env` | `"dev" \| "staging" \| "prod"` | `"prod"` | No | Server runtime. |
| `firebase_project_id` | `string` | `"swish-game-prod"` | No | Environment separation. |
| `user_id` | `string?` | `"uid_abc"` | Pseudonymous | Subject user where applicable. |
| `event_source` | `"server"` | `"server"` | No | Distinguishes trusted outcome events. |
| `function_name` | `string?` | `"submitSwipe"` | No | Function/trigger source. |
| `request_id` | `string?` | `"req_123"` | No | Internal trace ID, not secret. |
| `event_time` | ISO timestamp | `"2026-01-01T10:00:00.000Z"` | No | Server timestamp. |

### 5.3 Standard Property Type

```ts
export type StandardEventProperties = {
  app_env: "dev" | "staging" | "prod";
  app_version?: string;
  locale: "he-IL";
  direction: "rtl";
  platform: "web";
  device_type?: "mobile" | "tablet" | "desktop";
  route?: string;
  is_authenticated: boolean;
  user_id?: string;
  is_pro?: boolean;
  subscription_tier?: "basic" | "pro";
  session_id?: string;
  event_source: "client";
  event_time?: string;
};

export type StandardServerEventProperties = {
  app_env: "dev" | "staging" | "prod";
  firebase_project_id: string;
  user_id?: string;
  event_source: "server";
  function_name?: string;
  request_id?: string;
  event_time?: string;
};
```

### 5.4 Sensitive Properties to Exclude

Never include:

```text
email
phone
display_name
bio
raw_chat_message
raw_report_description
profile_image_url
storage_path
payment_card_data
provider_raw_payload
provider_secret
webhook_secret
gemini_prompt
gemini_response
system_prompt
api_key
ip_address
precise_location
```

---

## 6. Funnels

### 6.1 Onboarding Funnel

Purpose: measure activation into a usable discovery-ready profile.

| Step | Event | Success Signal |
|---|---|---|
| 1 | `signup_started` | User begins auth/signup. |
| 2 | `signup_completed` | Account/session created. |
| 3 | `onboarding_started` | User reaches onboarding. |
| 4 | `game_added` | User adds at least one game. |
| 5 | `onboarding_completed` | User can enter discovery. |
| 6 | `discovery_opened` | Activated user reaches core loop. |

Key metrics:

- signup completion rate.
- onboarding start rate.
- game added rate.
- onboarding completion rate.
- time to complete onboarding.
- drop-off by onboarding step.

### 6.2 Match Funnel

Purpose: measure whether discovery leads to matches and chat.

| Step | Event | Success Signal |
|---|---|---|
| 1 | `discovery_opened` | User enters discovery. |
| 2 | `game_filter_selected` | User focuses deck by game. |
| 3 | `profile_viewed` | User investigates another player. |
| 4 | `swipe_right` | User expresses interest. |
| 5 | `match_created` | Backend creates reciprocal match. |
| 6 | `chat_opened` | User opens match chat. |
| 7 | `message_sent` | Conversation starts. |

Key metrics:

- swipes per active user.
- right swipe rate.
- match rate per right swipe.
- match-to-chat-open rate.
- chat-open-to-message rate.
- time from match to first message.

### 6.3 Monetization Funnel

Purpose: measure Basic → Pro conversion.

| Step | Event | Success Signal |
|---|---|---|
| 1 | `upgrade_modal_viewed` | User exposed to Pro value. |
| 2 | `subscription_started` | User starts checkout. |
| 3 | `subscription_activated` | Verified webhook activates Pro. |
| 4 | `subscription_cancelled` | Churn/cancellation event. |

Segment by `reason`:

- `swipe_limit`
- `media`
- `cosmetic`
- `ai_limit`
- `profile`
- `general`

Key metrics:

- upgrade modal view to checkout start.
- checkout start to activation.
- activation rate by gate reason.
- cancellation rate.
- Pro conversion rate.

### 6.4 Shop Funnel

Purpose: measure cosmetics economy engagement.

| Step | Event | Success Signal |
|---|---|---|
| 1 | `shop_opened` | User enters shop. |
| 2 | `item_viewed` | User previews item. |
| 3 | `item_purchased` | Backend completes purchase. |
| 4 | `item_equipped` | User uses purchased item. |

Key metrics:

- shop open rate.
- item view rate.
- purchase conversion.
- equip-after-purchase rate.
- coin spend per active user.
- purchase by `category` / `rarity`.

### 6.5 AI Funnel

Purpose: measure AI Hub engagement and value.

| Step | Event | Success Signal |
|---|---|---|
| 1 | `ai_hub_opened` | User enters AI Hub. |
| 2 | `ai_profile_review_requested` or `ai_squad_advice_requested` | User requests AI output. |
| 3 | AI request `status = completed` | AI value delivered. |
| 4 | AI request `status = failed` / `blocked` | Quality/safety/cost issue. |

Key metrics:

- AI Hub open rate.
- request rate per active user.
- completion rate.
- blocked/refusal rate.
- failure rate.
- Pro vs Basic AI engagement, if limits differ.

### 6.6 Safety Funnel

Purpose: monitor safety and community quality.

| Step | Event | Signal |
|---|---|---|
| 1 | `user_reported` | User flags harmful behavior/content. |
| 2 | `user_blocked` | User protects themselves from another user. |

Key metrics:

- reports per active user.
- blocks per active user.
- report rate by source.
- reason distribution.
- block/report overlap.

---

## 7. KPIs / Success Metrics

### 7.1 Acquisition Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| Signup conversion rate | `signup_completed / signup_started` | `signup_started`, `signup_completed` |
| New users | count of unique users completing signup | `signup_completed` |
| Auth provider distribution | share by provider | `signup_completed.auth_provider` |

### 7.2 Activation Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| Onboarding completion rate | `onboarding_completed / onboarding_started` | onboarding funnel |
| Game added rate | users with `game_added` / users who start onboarding | `game_added`, `onboarding_started` |
| Discovery activation rate | `discovery_opened / signup_completed` | `discovery_opened`, `signup_completed` |
| Time to activation | time from signup to `discovery_opened` | event timestamps |

### 7.3 Engagement Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| DAU / WAU / MAU | unique active users by day/week/month | any meaningful app event |
| Swipes per active user | total swipes / active users | `swipe_left`, `swipe_right` |
| Right swipe rate | `swipe_right / all swipes` | swipe events |
| Match rate | `match_created / swipe_right` | `match_created`, `swipe_right` |
| Chat open rate | `chat_opened / match_created` | match funnel |
| First message rate | `message_sent / chat_opened` | chat events |
| Retention | D1/D7/D30 return | active user events by cohort |

### 7.4 Monetization Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| Pro conversion rate | `subscription_activated / active users` | `subscription_activated` |
| Checkout conversion rate | `subscription_activated / subscription_started` | subscription funnel |
| Upgrade prompt CTR | `subscription_started / upgrade_modal_viewed` | monetization funnel |
| Cancellation rate | `subscription_cancelled / subscription_activated` | subscription events |
| MRR estimate | active Pro users × `29.90 ILS` | server subscription state |
| ARPU / ARPPU | revenue estimate by users/payers | subscription state + billing provider |

### 7.5 Shop / Economy Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| Shop engagement | users with `shop_opened` / active users | `shop_opened` |
| Item view rate | `item_viewed / shop_opened` | shop funnel |
| Purchase rate | `item_purchased / item_viewed` | shop funnel |
| Equip rate | `item_equipped / item_purchased` | shop funnel |
| Coin spend | sum `price_coins` | `item_purchased` server events |
| Popular categories | purchase counts by `category` | `item_purchased.category` |
| Popular rarities | purchase counts by `rarity` | `item_purchased.rarity` |

### 7.6 Quality & Safety Metrics

| KPI | Definition | Events / Data |
|---|---|---|
| Report rate | `user_reported / active users` | safety events |
| Block rate | `user_blocked / active users` | safety events |
| Reports by reason | distribution by `reason` | `user_reported.reason` |
| Media block rate | Basic media blocked attempts / media attempts | `media_upload_blocked_basic`, `media_upload_attempted` |
| AI failure rate | failed AI requests / AI requests | AI events / `aiRequests` |
| AI blocked/refusal rate | blocked AI requests / AI requests | AI events / `aiRequests` |

### 7.7 KPI Notes

- Revenue truth should come from payment provider/server subscription state, not client analytics.
- Pro entitlement truth is `subscriptions/{uid}` and backend-derived `users/{uid}.isPro`.
- Analytics helps understand behavior; it does not determine product state.

---

## 8. Client vs Server Events

### 8.1 Client Events

Client events are appropriate for:

- screen opens.
- modal views.
- button clicks.
- UI attempts.
- filter changes.
- local interaction intent.

Client events:

```text
signup_started
signup_completed
onboarding_started
onboarding_completed
game_added
profile_updated
discovery_opened
game_filter_selected
profile_viewed
swipe_left
swipe_right
chat_opened
message_sent
media_upload_attempted
media_upload_blocked_basic
shop_opened
item_viewed
upgrade_modal_viewed
subscription_started
ai_hub_opened
ai_profile_review_requested
ai_squad_advice_requested
user_reported
user_blocked
```

Note: if an event represents an attempt and the backend later rejects it, the event name should make that clear or a server outcome event should exist separately.

### 8.2 Server Events

Server events are required for trusted outcomes:

```text
match_created
item_purchased
item_equipped
subscription_activated
subscription_cancelled
```

Recommended server-side event sources:

| Event | Source |
|---|---|
| `match_created` | `submitSwipe` Cloud Function |
| `item_purchased` | `purchaseShopItem` Cloud Function |
| `item_equipped` | `equipItem` Cloud Function |
| `subscription_activated` | `paymentWebhook` / `onSubscriptionUpdated` |
| `subscription_cancelled` | `paymentWebhook` / reconciliation |
| AI audit events | AI callables and `aiRequests/{requestId}` |
| safety events | `createReport`, `blockUser` |

### 8.3 Mixed Events

Some events can be emitted client-side for intent and server-side for outcome. Avoid double counting by using either:

1. separate event names, or
2. `event_source`, `status`, and clear warehouse logic.

Example:

```ts
trackEvent("ai_profile_review_requested", {
  event_source: "client",
  status: "pending"
});
```

Server later records:

```ts
trackServerEvent("ai_profile_review_requested", {
  event_source: "server",
  status: "completed",
  request_id
});
```

Analytics queries must distinguish `event_source`.

### 8.4 Events That Must Not Be Client-Only

Never rely only on client events for:

- `match_created`
- `item_purchased`
- `item_equipped`
- `subscription_activated`
- `subscription_cancelled`

These must be backend-confirmed.

---

## 9. Privacy & Compliance

### 9.1 Privacy-First Rules

Analytics must collect minimum necessary behavioral metadata.

Allowed:

- event name.
- timestamp.
- pseudonymous user ID where needed.
- coarse app context.
- English enum values.
- non-sensitive IDs like `game_id`, `item_id`, `match_id`, `chat_id` where needed.
- feature/source/gate reason.

Forbidden:

- email.
- phone.
- display name.
- bio.
- raw chat messages.
- report descriptions.
- Gemini prompts/responses.
- profile image URLs.
- storage paths.
- payment provider raw payloads.
- card/payment data.
- secrets.
- precise location.

### 9.2 PII Policy

`uid` is treated as a pseudonymous identifier.

If possible, analytics should use a hashed or provider-specific pseudonymous ID rather than raw Firebase `uid`.

```ts
analytics_user_id = hash(uid + analyticsSalt)
```

The salt must be server-side if used and must not be exposed to client.

### 9.3 Consent and Opt-Out

Consent/opt-out flow is an open item, but implementation must allow:

- analytics disabled for user/session.
- no provider calls before consent if legally required.
- deletion/export support if required by GDPR.
- environment-specific analytics behavior.

### 9.4 GDPR / Data Subject Rights

The analytics implementation should support:

- user data deletion where provider supports it.
- user export where required.
- retention policy.
- opt-out.
- documentation of tracked events.
- no sensitive raw content in events.

### 9.5 Data Retention

Retention is TBD.

Recommended initial posture:

| Data Type | Suggested Retention |
|---|---|
| raw client analytics | 12–24 months |
| aggregated KPI dashboards | longer if anonymized |
| server audit records like billing/security | according to legal/accounting/security needs |
| AI raw provider data | do not store in analytics |

### 9.6 Payment Privacy

Do not track:

- card data.
- provider raw payload.
- provider customer email.
- receipt/invoice details.
- billing address.
- payment failure raw reason if sensitive.

Allowed high-level analytics:

```ts
{
  provider: "cardcom",
  tier: "pro",
  status: "active",
  price_amount: 29.9,
  currency: "ILS"
}
```

### 9.7 AI Privacy

Do not track:

- Gemini prompt.
- Gemini response.
- system prompt.
- safety classifier raw output.
- user bio content.
- squad prompt text.
- model API key.
- raw provider errors.

Allowed:

```ts
{
  request_type: "profile_optimization",
  status: "completed",
  is_pro: true
}
```

### 9.8 Chat Privacy

Do not track:

- message text.
- image URL.
- storage path.
- message attachment contents.

Allowed:

```ts
{
  chat_id: "chat_123",
  message_type: "text"
}
```

---

## 10. Implementation Notes

### 10.1 Provider Abstraction

Recommended client structure:

```text
src/shared/analytics/
  analytics.types.ts
  analyticsRegistry.ts
  analyticsClient.ts
  providers/
    noopAnalyticsProvider.ts
    firebaseAnalyticsProvider.ts
    posthogAnalyticsProvider.ts
    mixpanelAnalyticsProvider.ts
```

### 10.2 Type-Safe Event Registry

Define a central registry.

```ts
export type AnalyticsEventName =
  | "signup_started"
  | "signup_completed"
  | "onboarding_started"
  | "onboarding_completed"
  | "game_added"
  | "profile_updated"
  | "discovery_opened"
  | "game_filter_selected"
  | "profile_viewed"
  | "swipe_left"
  | "swipe_right"
  | "match_created"
  | "chat_opened"
  | "message_sent"
  | "media_upload_attempted"
  | "media_upload_blocked_basic"
  | "shop_opened"
  | "item_viewed"
  | "item_purchased"
  | "item_equipped"
  | "upgrade_modal_viewed"
  | "subscription_started"
  | "subscription_activated"
  | "subscription_cancelled"
  | "ai_hub_opened"
  | "ai_profile_review_requested"
  | "ai_squad_advice_requested"
  | "user_reported"
  | "user_blocked";
```

### 10.3 Typed Event Payload Map

```ts
export type AnalyticsEventPayloadMap = {
  signup_started: StandardEventProperties & {
    auth_provider?: "google" | "email_password";
    entry_route?: string;
  };

  signup_completed: StandardEventProperties & {
    auth_provider?: "google" | "email_password";
    is_new_user?: boolean;
  };

  onboarding_started: StandardEventProperties & {
    step?: string;
  };

  onboarding_completed: StandardEventProperties & {
    games_count: number;
    platforms_count?: number;
    has_profile_image: boolean;
    skill_level?: "beginner" | "intermediate" | "pro" | "elite";
  };

  game_added: StandardEventProperties & {
    game_id: string;
    platform?: string;
    skill_level?: "beginner" | "intermediate" | "pro" | "elite";
    rank_present?: boolean;
  };

  profile_updated: StandardEventProperties & {
    changed_fields: string[];
    games_count?: number;
    has_profile_image?: boolean;
  };

  discovery_opened: StandardEventProperties & {
    selected_game_id?: string;
    deck_size?: number;
  };

  game_filter_selected: StandardEventProperties & {
    game_id: string;
    source: "discover" | "onboarding" | "profile";
  };

  profile_viewed: StandardEventProperties & {
    viewed_user_id?: string;
    source: "discovery" | "matches" | "likes_you" | "chat" | "profile_link";
    game_id?: string;
  };

  swipe_left: StandardEventProperties & {
    target_user_id?: string;
    game_id: string;
    input_method: "gesture" | "button" | "keyboard";
  };

  swipe_right: StandardEventProperties & {
    target_user_id?: string;
    game_id: string;
    input_method: "gesture" | "button" | "keyboard";
  };

  chat_opened: StandardEventProperties & {
    chat_id: string;
    match_id?: string;
    source: "matches" | "match_celebration" | "deep_link" | "notification";
  };

  message_sent: StandardEventProperties & {
    chat_id: string;
    message_type: "text" | "image" | "system";
    source: "chat_composer" | "media_function";
  };

  media_upload_attempted: StandardEventProperties & {
    chat_id: string;
    media_type: "image";
    is_pro: boolean;
  };

  media_upload_blocked_basic: StandardEventProperties & {
    chat_id?: string;
    gate_source: "chat_media_button" | "sendChatMediaMessage";
  };

  shop_opened: StandardEventProperties & {
    selected_category?: "avatar_border" | "profile_banner" | "global_background";
  };

  item_viewed: StandardEventProperties & {
    item_id: string;
    category: "avatar_border" | "profile_banner" | "global_background";
    rarity: "common" | "rare" | "epic" | "legendary";
    requires_pro: boolean;
    price_coins?: number;
  };

  upgrade_modal_viewed: StandardEventProperties & {
    reason: "swipe_limit" | "media" | "cosmetic" | "ai_limit" | "profile" | "general";
    source_route?: string;
  };

  subscription_started: StandardEventProperties & {
    provider: "stripe" | "cardcom" | "meshulam" | "other";
    tier: "pro";
    price_amount: 29.9;
    currency: "ILS";
    reason?: "swipe_limit" | "media" | "cosmetic" | "ai_limit" | "profile" | "general";
  };

  ai_hub_opened: StandardEventProperties & {
    available_tools: Array<"profile_optimization" | "squad_advice" | "match_insight">;
  };

  ai_profile_review_requested: StandardEventProperties & {
    request_id?: string;
    request_type: "profile_optimization";
    status?: "pending" | "completed" | "failed" | "blocked";
    is_pro: boolean;
  };

  ai_squad_advice_requested: StandardEventProperties & {
    request_id?: string;
    request_type: "squad_advice";
    status?: "pending" | "completed" | "failed" | "blocked";
    is_pro: boolean;
  };

  user_reported: StandardEventProperties & {
    report_id?: string;
    reported_user_id?: string;
    reason:
      | "harassment"
      | "hate_speech"
      | "sexual_content"
      | "scam_spam"
      | "underage_concern"
      | "cheating_exploits"
      | "fake_profile"
      | "other";
    source: "profile" | "chat" | "message" | "matches" | "discovery";
  };

  user_blocked: StandardEventProperties & {
    blocked_user_id?: string;
    source: "profile" | "chat" | "message" | "matches" | "discovery";
  };
};
```

Server-only trusted events can use a separate server payload map:

```ts
export type ServerAnalyticsEventPayloadMap = {
  match_created: StandardServerEventProperties & {
    match_id: string;
    chat_id: string;
    game_id: string;
    source: "submit_swipe";
  };

  item_purchased: StandardServerEventProperties & {
    item_id: string;
    category: "avatar_border" | "profile_banner" | "global_background";
    rarity: "common" | "rare" | "epic" | "legendary";
    requires_pro: boolean;
    price_coins: number;
    coin_balance_after?: number;
  };

  item_equipped: StandardServerEventProperties & {
    item_id: string;
    category: "avatar_border" | "profile_banner" | "global_background";
    rarity: "common" | "rare" | "epic" | "legendary";
  };

  subscription_activated: StandardServerEventProperties & {
    provider: "stripe" | "cardcom" | "meshulam" | "other";
    tier: "pro";
    status: "active" | "trialing";
    price_amount: 29.9;
    currency: "ILS";
  };

  subscription_cancelled: StandardServerEventProperties & {
    provider: "stripe" | "cardcom" | "meshulam" | "other";
    tier: "pro";
    status: "cancelled" | "expired";
    cancel_reason?: string;
  };
};
```

### 10.4 `trackEvent` Helper

```ts
export function trackEvent<Name extends keyof AnalyticsEventPayloadMap>(
  name: Name,
  props: AnalyticsEventPayloadMap[Name]
): void {
  analyticsProvider.track(name, sanitizeAnalyticsProps(props));
}
```

### 10.5 Server `trackServerEvent` Helper

```ts
export async function trackServerEvent<
  Name extends keyof ServerAnalyticsEventPayloadMap
>(
  name: Name,
  props: ServerAnalyticsEventPayloadMap[Name]
): Promise<void> {
  await analyticsProvider.track(name, sanitizeAnalyticsProps(props));
}
```

### 10.6 Sanitization

Every provider adapter must sanitize props before sending.

```ts
const forbiddenKeys = [
  "email",
  "phone",
  "display_name",
  "bio",
  "raw_chat_message",
  "raw_report_description",
  "profile_image_url",
  "storage_path",
  "payment_card_data",
  "provider_raw_payload",
  "provider_secret",
  "webhook_secret",
  "gemini_prompt",
  "gemini_response",
  "system_prompt",
  "api_key"
];

export function sanitizeAnalyticsProps<T extends Record<string, unknown>>(props: T): T {
  for (const key of forbiddenKeys) {
    if (key in props) {
      throw new Error(`Forbidden analytics property: ${key}`);
    }
  }

  return props;
}
```

### 10.7 Provider Interface

```ts
export type AnalyticsProvider = {
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
  track: (name: string, props: Record<string, unknown>) => void | Promise<void>;
  reset?: () => void;
};
```

### 10.8 No-Op Provider

Use no-op provider when:

- analytics disabled.
- local development without provider.
- consent not granted.
- tests.

```ts
export const noopAnalyticsProvider: AnalyticsProvider = {
  track: () => undefined,
  identify: () => undefined,
  reset: () => undefined
};
```

### 10.9 Testing Analytics

Analytics tests should verify:

- event name is valid.
- required properties exist.
- forbidden properties throw.
- enum values are English.
- no PII in payload.
- server-only events are not emitted as trusted outcomes from client code.
- provider adapter receives sanitized payload.

### 10.10 Environment Behavior

| Environment | Behavior |
|---|---|
| `dev` | no-op by default; optional debug console provider. |
| `staging` | provider enabled with staging project/key only. |
| `prod` | provider enabled according to consent/privacy policy. |

---

## 11. Open Items

| Item | Status | Impact |
|---|---|---|
| Final analytics provider | Open | Determines SDK, warehouse/export, dashboarding. |
| Consent flow | Open | Determines whether tracking can start before opt-in. |
| Opt-out settings UX | Open | Needed for privacy controls. |
| Data retention policy | Open | Needed for GDPR/privacy documentation. |
| User ID hashing strategy | Open | Decide raw `uid` vs hashed pseudonymous analytics ID. |
| Event delivery from Cloud Functions | Open | Depends on provider server SDK/API. |
| Dashboard ownership | Open | Product/analytics owner needed. |
| KPI target values | Open | PRD defines KPI categories; final numeric goals TBD. |
| Revenue truth source | Open | Provider billing export vs Firestore subscription state. |
| Attribution strategy | Open | No marketing attribution plan yet. |
| Notification/deep link events | Open | Add when notifications are in scope. |
| Analytics schema validation in CI | Open | Recommended to add event registry tests. |
| Warehouse/export strategy | Open | Needed for advanced cohort analysis. |
