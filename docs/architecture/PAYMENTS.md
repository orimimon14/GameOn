# Swish & Game — Payments

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Payments & Subscription Billing Contract |
| Repository Path | `docs/architecture/PAYMENTS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/API_CONTRACT.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/ARCHITECTURE.md`, `docs/product/DECISIONS.md`, `docs/architecture/SECURITY.md` |
| Billing Scope | Pro subscription billing, webhook validation, provider abstraction, entitlement sync |
| Billing Currency | `ILS` |
| Pro Price | `29.90 ILS/month` |
| Provider Status | RevenueCat abstraction (ADR-037); underlying web provider TBD via ADR-017 |
| Canonical Principle | Pro entitlement is derived only from verified provider truth. The client never writes Pro state. |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Subscription Model & Pro Tier](#2-subscription-model--pro-tier)
- [3. Provider Selection](#3-provider-selection)
- [4. Provider Abstraction Layer](#4-provider-abstraction-layer)
- [5. Checkout Flow](#5-checkout-flow)
- [6. `subscriptions/{uid}` Schema](#6-subscriptionsuid-schema)
- [7. `paymentWebhook` Detailed](#7-paymentwebhook-detailed)
- [8. Entitlement Sync](#8-entitlement-sync)
- [9. Pro Entitlements Enforcement](#9-pro-entitlements-enforcement)
- [10. Subscription Lifecycle & State Machine](#10-subscription-lifecycle--state-machine)
- [11. Edge Cases](#11-edge-cases)
- [12. Billing Events Audit](#12-billing-events-audit)
- [13. Reconciliation](#13-reconciliation)
- [14. Security & Secrets](#14-security--secrets)
- [15. Compliance](#15-compliance)
- [16. Open Items](#16-open-items)

---

## 2. Subscription Model & Pro Tier

### 2.1 Product Tiers

Swish & Game משתמש במודל freemium:

| Tier | Price | Billing | Description |
|---|---:|---|---|
| `basic` | `0 ILS` | none | משתמש חינמי עם core matching experience. |
| `pro` | `29.90 ILS/month` | recurring subscription | מנוי בתשלום עם entitlements מורחבים. |

### 2.2 Canonical Subscription Rules

- כסף אמיתי ב-MVP משמש ל-`pro` subscription בלבד.
- coins לא נרכשים בכסף אמיתי ב-MVP.
- Pro price canonical: `29.90 ILS/month`.
- `currency = "ILS"`.
- `verifiedBadge` מייצג `"Pro member"` בלבד ונגזר מ-`isPro`.
- client לעולם לא כותב:
  - `isPro`
  - `subscriptionTier`
  - `subscriptionStatus`
  - `subscriptionExpiresAt`
  - `verifiedBadge`
  - `subscriptions/{uid}`

**RevenueCat Abstraction & Store IAP (ADR-037):**

- **RevenueCat** הוא ה-billing/entitlement abstraction הקנוני.
- **Web (עכשיו):** RevenueCat Web Billing, או provider web (למשל Stripe) מאחורי RevenueCat. ה-provider הבסיסי נבחר תחת ADR-017.
- **Store (עתיד):** Apple StoreKit + Google Play Billing דרך RevenueCat. store IAP חובה ל-digital goods; ראה `STORE_COMPLIANCE.md`.
- entitlement מתעדכן **רק** דרך RevenueCat webhook מאומת → `paymentWebhook`; אין Pro מ-client/SDK state.
- `revenueCatAppUserId` ממופה ל-`uid` (ראה `subscriptions/{uid}` ב-DATA_MODEL).
- עמלות store של **15–30%** משפיעות על כלכלת Pro ב-store builds.

### 2.3 Basic Entitlements

| Capability | Basic |
|---|---:|
| Create account | Yes |
| Onboarding | Yes |
| Discovery deck | Yes |
| Daily swipes | Limited server-side |
| Matches | Unlimited basic matches |
| Text chat with matches | Yes |
| `Likes You` visibility in MVP | Yes |
| Media messages | No |
| Pro-only cosmetics | No |
| Verified badge | No |

### 2.4 Pro Entitlements

| Capability | Pro |
|---|---:|
| Unlimited swipes | Yes |
| Media transfer in chat | Yes, via `sendChatMediaMessage` backend validation |
| Premium backgrounds | Yes |
| Enhanced cosmetics | Yes |
| Verified badge | Yes, `verifiedBadge = true` |
| Pro member display | Yes |
| Future AI limits | TBD via ADR-027 |

### 2.5 Entitlement Source of Truth

Provider truth flows into Firestore as:

```text
payment provider event
  → paymentWebhook
  → subscriptions/{uid}
  → onSubscriptionUpdated
  → users/{uid}
  → publicProfiles/{uid}
```

Only backend writes entitlement state.

---

## 3. Provider Selection

### 3.1 ADR-017 Status

Payment provider is TBD via ADR-017.  
The architecture is provider-agnostic and supports:

```ts
export type BillingProvider =
  | "revenuecat"
  | "stripe"
  | "cardcom"
  | "meshulam"
  | "other";
```

### 3.2 Selection Criteria

| Criterion | Requirement |
|---|---|
| Recurring billing | Must support monthly subscription billing. |
| Webhooks | Must support signed webhooks for subscription lifecycle events. |
| ILS | Must support `ILS` charges. |
| Receipts/invoices | Must support required invoice/receipt workflow for the launch jurisdiction. |
| Israeli compliance | Must be reviewed with accountant/legal advisor before launch. |
| Test environment | Must support sandbox/test mode. |
| Fees | Must be acceptable for `29.90 ILS/month` subscription economics. |
| Developer experience | Clear API docs, SDK/API reliability, webhook testing. |
| Refunds/chargebacks | Must expose events or APIs for entitlement correction. |
| Customer portal/cancellation | Preferred, or implement product-side cancellation with provider API. |

### 3.3 Candidate Providers

| Provider | `BillingProvider` value | Notes |
|---|---|---|
| Stripe | `"stripe"` | Strong developer experience; availability/compliance must be confirmed for the operating entity. |
| Cardcom | `"cardcom"` | Israel-oriented candidate; confirm recurring billing and webhook capabilities. |
| Meshulam | `"meshulam"` | Israel-oriented candidate; confirm subscription lifecycle events and developer experience. |
| Other | `"other"` | Any provider that satisfies the abstraction contract. |

### 3.4 Provider-Agnostic Design

The app does not store provider-specific subscription state as product truth.  
Instead, provider events are normalized into:

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

---

## 4. Provider Abstraction Layer

### 4.1 Goals

The provider abstraction layer isolates provider-specific APIs from product logic.

Goals:

- Keep `subscriptions/{uid}` schema provider-agnostic.
- Normalize provider event types.
- Centralize signature verification.
- Support provider migration without frontend rewrite.
- Keep entitlement sync consistent.

### 4.2 Interface

```ts
export interface BillingProviderAdapter {
  provider: BillingProvider;

  verifyWebhookSignature(args: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
    secret: string;
  }): Promise<boolean>;

  parseWebhookEvent(args: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<NormalizedPaymentEvent>;

  createCheckoutSession(args: {
    uid: string;
    email?: string;
    priceAmount: number;
    currency: "ILS";
    tier: "pro";
    successUrl: string;
    cancelUrl: string;
  }): Promise<CreateCheckoutSessionResult>;

  fetchSubscription(args: {
    providerCustomerId?: string;
    providerSubscriptionId?: string;
  }): Promise<NormalizedSubscriptionState>;

  cancelSubscription(args: {
    providerSubscriptionId: string;
  }): Promise<NormalizedSubscriptionState>;
}
```

### 4.3 Supporting Types

```ts
export type CreateCheckoutSessionResult = {
  provider: BillingProvider;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  expiresAt?: FirebaseFirestore.Timestamp;
};

export type NormalizedSubscriptionState = {
  provider: BillingProvider;
  providerCustomerId: string;
  providerSubscriptionId?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: FirebaseFirestore.Timestamp;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;
  priceAmount: number;
  currency: "ILS";
};
```

### 4.4 Event Mapping

| Provider Event Category | Normalized Status | Meaning |
|---|---|---|
| subscription created trial | `trialing` | Pro enabled during trial if trial is offered. |
| subscription active/paid | `active` | Pro enabled. |
| renewal paid | `active` | Pro remains enabled; period dates update. |
| payment failed | `past_due` | Pro behavior depends grace period policy. |
| cancellation requested | `cancelled` | Pro may remain until `currentPeriodEnd`. |
| period ended after cancel | `expired` | Pro disabled. |
| subscription expired | `expired` | Pro disabled. |
| refund/chargeback | `expired` or `cancelled` | Depends provider facts and policy. |

### 4.5 Product State Must Not Depend on Raw Provider Payload

Raw provider payload is not product state.  
Product state is only the normalized event applied to:

```text
subscriptions/{uid}
```

---

## 5. Checkout Flow

### 5.1 MVP Flow

```text
Client clicks "Upgrade to Pro"
  ↓
Callable/HTTP endpoint creates provider checkout session
  ↓
Backend includes uid in provider metadata
  ↓
Client redirects to provider checkoutUrl
  ↓
User completes payment
  ↓
Provider redirects to success/cancel URL
  ↓
Provider sends signed webhook
  ↓
paymentWebhook verifies signature
  ↓
paymentWebhook maps provider customer → uid
  ↓
paymentWebhook writes subscriptions/{uid}
  ↓
onSubscriptionUpdated syncs users/{uid}
  ↓
onSubscriptionUpdated syncs publicProfiles/{uid}
  ↓
Client observes Firestore entitlement update
```

### 5.2 Important Rule

Redirect/callback does **not** grant Pro.  
Only verified webhook or server-side reconciliation grants/updates Pro.

### 5.3 Checkout Session Creation

The checkout session creator may be implemented as a callable function or HTTP endpoint. It must:

- require Firebase Auth.
- load `users/{uid}` and `private/account`.
- ensure user is not suspended/deleted.
- create or reuse `providerCustomerId`.
- set provider metadata:
  - `uid`
  - `tier = "pro"`
  - environment
- create subscription checkout for `29.90 ILS/month`.
- return only `checkoutUrl` and non-sensitive metadata.

Suggested response:

```ts
export type CreateCheckoutSessionOutput = {
  provider: BillingProvider;
  checkoutSessionId: string;
  checkoutUrl: string;
  expiresAt?: FirebaseFirestore.Timestamp;
};
```

### 5.4 `checkoutSessionCallback` [Scale/V1]

`checkoutSessionCallback` exists for providers that require backend redirect handling.

Contract:

```ts
export type CheckoutSessionCallbackQuery = {
  sessionId?: string;
  provider?: BillingProvider;
  status?: "success" | "cancelled" | "failed";
};
```

Behavior:

- does not grant Pro.
- validates session if possible.
- redirects to client route:
  - success pending page
  - cancelled page
  - failed page
- tells client to wait for Firestore entitlement update from webhook.
- may log lightweight callback metadata.

### 5.5 Client UX After Checkout

After redirect back to app:

- show "Payment received, activating Pro..." if status success.
- listen to `users/{uid}.isPro` or `subscriptions/{uid}`.
- if webhook delayed, show pending state.
- do not unlock Pro based only on URL query params.

---

## 6. `subscriptions/{uid}` Schema

### 6.1 Path

```text
subscriptions/{uid}
```

Document ID is deterministic:

```text
{uid}
```

### 6.2 TypeScript Schema

```ts
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

export type BillingProvider =
  | "revenuecat"
  | "stripe"
  | "cardcom"
  | "meshulam"
  | "other";

export type SubscriptionDocument = {
  uid: string;

  tier: SubscriptionTier;
  status: SubscriptionStatus;

  provider: BillingProvider;

  providerCustomerId?: string;
  providerSubscriptionId?: string;

  startedAt?: FirebaseFirestore.Timestamp;
  currentPeriodStart?: FirebaseFirestore.Timestamp;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;

  priceAmount: number;
  currency: "ILS";

  updatedAt: FirebaseFirestore.Timestamp;
};
```

### 6.3 Field Contract

| Field | Type | Ownership | Scope | Description |
|---|---|---|---|---|
| `uid` | `string` | Server-owned | MVP | User receiving entitlement. |
| `tier` | `SubscriptionTier` | Server-owned | MVP | `basic` or `pro`. |
| `status` | `SubscriptionStatus` | Server-owned | MVP | Lifecycle status. |
| `provider` | `BillingProvider` | Server-owned | MVP | Selected provider. |
| `providerCustomerId` | `string` | Server-owned | MVP | Provider customer identifier. |
| `providerSubscriptionId` | `string` | Server-owned | MVP | Provider subscription identifier. |
| `startedAt` | `Timestamp` | Server-owned | MVP | Subscription start time. |
| `currentPeriodStart` | `Timestamp` | Server-owned | MVP | Current billing period start. |
| `currentPeriodEnd` | `Timestamp` | Server-owned | MVP | Current billing period end. |
| `cancelledAt` | `Timestamp` | Server-owned | MVP | Cancellation timestamp. |
| `priceAmount` | `number` | Server-owned | MVP | Must be `29.90` for Pro monthly MVP unless plan changes via ADR. |
| `currency` | `"ILS"` | Server-owned | MVP | Billing currency. |
| `updatedAt` | `Timestamp` | Server-owned | MVP | Last server update. |

### 6.4 Security Rules

Client:

- owner can read own `subscriptions/{uid}`.
- admin can read.
- no client create/update/delete.

Backend:

- `paymentWebhook`
- `onSubscriptionUpdated`
- `reconcileSubscription`
- `scheduledSubscriptionReconciliation`

---

## 7. `paymentWebhook` Detailed

### 7.1 Contract Summary

| Field | Value |
|---|---|
| Function | `paymentWebhook` |
| Type | HTTP/Webhook Function |
| Scope | MVP |
| Firebase Auth | Not used |
| Authentication | Provider signature verification |
| Source of Truth | Provider event after signature verification |
| Primary Write | `subscriptions/{uid}` |
| Provider Status | Provider-agnostic; final provider TBD via ADR-017 |

### 7.2 Request Handling Order

```text
Receive HTTP POST
  ↓
Read raw body
  ↓
Identify provider route/config
  ↓
Load webhook secret from Secret Manager
  ↓
Verify signature
  ↓
Parse provider event
  ↓
Normalize event
  ↓
Check idempotency by providerEventId
  ↓
Map providerCustomerId/provider metadata to uid
  ↓
Validate price/currency/tier
  ↓
Write subscriptions/{uid}
  ↓
Optionally write billingEvents/{eventId}
  ↓
Return provider-compatible HTTP response
```

### 7.3 Signature Verification

Requirements:

- Use raw body, not JSON-parsed body.
- Use provider-specific signature header.
- Use secret from Secret Manager.
- Reject invalid signatures before parsing trusted fields.
- Never log full raw body or secrets.

```ts
export type PaymentWebhookHeaders = {
  signatureHeader: string;
  providerEventId?: string;
};
```

### 7.4 Supported Event Types

The provider adapter must map provider-specific events to the following categories:

| Normalized Category | Expected Result |
|---|---|
| `checkout.completed` | Create/update subscription as `active` or `trialing`. |
| `subscription.created` | Create subscription document. |
| `subscription.updated` | Update status/period fields. |
| `subscription.renewed` | Extend `currentPeriodEnd`, keep `active`. |
| `payment.succeeded` | Keep/mark `active`. |
| `payment.failed` | Mark `past_due` unless provider state says otherwise. |
| `subscription.cancelled` | Mark `cancelled`; Pro may remain until period end. |
| `subscription.expired` | Mark `expired`; disable Pro. |
| `refund.created` | Policy-dependent, usually reconcile. |
| `chargeback.created` | Policy-dependent, usually reconcile or disable. |

### 7.5 Normalized Event

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

### 7.6 Customer → UID Mapping

Mapping priority:

1. Provider event metadata contains `uid`.
2. `subscriptions/{uid}.providerCustomerId == event.providerCustomerId`.
3. `users/{uid}/private/account.paymentCustomerId == event.providerCustomerId`.
4. Lookup table, if added in V1.

If no UID can be mapped:

- log minimal event metadata.
- optionally create `billingEvents/{eventId}` with failed status in Scale/V1.
- return status according to provider retry behavior.

### 7.7 Validation Before Write

Before updating `subscriptions/{uid}`:

- `uid` exists.
- user is not deleted.
- `tier == "pro"` for paid subscription.
- `currency == "ILS"`.
- `priceAmount == 29.90` for MVP monthly Pro, unless plan migration ADR changes it.
- `provider` is one of:
  - `"stripe"`
  - `"cardcom"`
  - `"meshulam"`
  - `"other"`
- event status maps to valid `SubscriptionStatus`.

### 7.8 Writes

Primary write:

```text
subscriptions/{uid}
```

Fields:

- `uid`
- `tier`
- `status`
- `provider`
- `providerCustomerId`
- `providerSubscriptionId`
- `startedAt`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelledAt`
- `priceAmount`
- `currency`
- `updatedAt`

Derived writes are handled by `onSubscriptionUpdated`, not directly required in webhook.

### 7.9 Idempotency

Idempotency key:

```text
{provider}:{providerEventId}
```

Scale/V1 audit path:

```text
billingEvents/{eventId}
```

Rules:

- If event already processed, return `200`.
- Do not apply entitlement mutation twice.
- Use Firestore transaction when writing idempotency marker and subscription state.
- For providers that retry, always return success for already processed events.

### 7.10 Retry Safety

The webhook must be safe under:

- duplicate events.
- out-of-order events.
- provider retries.
- transient Firestore errors.
- Cloud Function cold start.
- timeout after provider event received.

Recommended strategy:

- Store processed event ID.
- Prefer provider subscription current state when event order is ambiguous.
- Use `reconcileSubscription` for suspected drift.

### 7.11 HTTP Status Codes

| HTTP Status | Use |
|---|---|
| `200` | Event processed, ignored safely, or already processed. |
| `400` | Invalid payload, unsupported event, invalid normalized fields. |
| `401` | Signature verification failed. |
| `404` | Mapping to `uid` failed only if provider should not retry. Otherwise prefer `200` with failed audit or `500` for retry. |
| `500` | Transient internal failure; provider may retry. |

### 7.12 Example Pseudocode

```ts
export async function paymentWebhook(req: Request, res: Response) {
  const provider = resolveProvider(req);
  const adapter = getBillingAdapter(provider);
  const rawBody = req.rawBody;

  const secret = await secretManager.get("PAYMENT_WEBHOOK_SECRET");

  const valid = await adapter.verifyWebhookSignature({
    rawBody,
    headers: req.headers,
    secret
  });

  if (!valid) {
    return res.status(401).send("invalid signature");
  }

  const event = await adapter.parseWebhookEvent({
    rawBody,
    headers: req.headers
  });

  await applyNormalizedPaymentEvent(event);

  return res.status(200).json({
    received: true,
    eventId: event.providerEventId,
    processed: true
  });
}
```

---

## 8. Entitlement Sync

### 8.1 Canonical Flow

```text
subscriptions/{uid}
  → onSubscriptionUpdated
  → users/{uid}
  → publicProfiles/{uid}
```

### 8.2 `onSubscriptionUpdated`

Trigger:

```text
onWrite subscriptions/{uid}
```

Purpose:

- derive Pro entitlement.
- sync private user state.
- sync public display state.

### 8.3 Derived Entitlement Logic

```ts
export function deriveIsPro(subscription: SubscriptionDocument): boolean {
  // "cancelled" keeps Pro until the paid period ends (§7.4) — the
  // currentPeriodEnd guard is what actually turns it off.
  return subscription.tier == "pro"
    && ["trialing", "active", "cancelled"].includes(subscription.status)
    && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd.toMillis() > Date.now());
}
```

### 8.4 Writes to `users/{uid}`

```ts
{
  subscriptionTier: subscription.tier,
  subscriptionStatus: subscription.status,
  subscriptionExpiresAt: subscription.currentPeriodEnd,
  isPro: deriveIsPro(subscription),
  updatedAt: serverTimestamp()
}
```

### 8.5 Writes to `publicProfiles/{uid}`

```ts
{
  isPro: deriveIsPro(subscription),
  verifiedBadge: deriveIsPro(subscription),
  updatedAt: serverTimestamp()
}
```

### 8.6 Why `verifiedBadge` Is Derived

`verifiedBadge` does not mean identity verification.  
In MVP it means:

```text
Pro member
```

Therefore:

```ts
verifiedBadge == isPro
```

unless future ADR changes badge semantics.

---

## 9. Pro Entitlements Enforcement

### 9.1 Server-Side `isProUser`

Canonical Pro check:

```ts
export function isProUser(user: UserDocument): boolean {
  return user.isPro == true
    && ["trialing", "active"].includes(user.subscriptionStatus);
}
```

When relevant, also check:

```ts
subscriptionExpiresAt == null || subscriptionExpiresAt > now
```

### 9.2 Entitlement Enforcement Matrix

| Feature | Enforcement Point | Basic | Pro |
|---|---|---:|---:|
| Daily swipes | `submitSwipe` | limited | unlimited |
| Media messages | `sendChatMediaMessage` | denied | allowed if participant and active chat |
| Premium cosmetics purchase | `purchaseShopItem` | denied if `requiresPro` | allowed |
| Premium cosmetics equip | `equipItem` | denied if `requiresPro` | allowed |
| Verified badge | `onSubscriptionUpdated` | false | true |
| Pro public display | `publicProfiles/{uid}.isPro` | false | true |
| Advanced AI limits | `sendAIProfileReview`, `sendAISquadAdvice` | TBD | TBD |

### 9.3 `submitSwipe`

Basic daily limit:

- enforced server-side.
- uses `users/{uid}/usage/{yyyy-mm-dd}.swipeCount`.
- Pro bypasses or receives much higher limit according to product policy.

### 9.4 `sendChatMediaMessage`

Media messages:

- Pro-only.
- Backend validates:
  - `isProUser`
  - chat participant
  - chat active
  - file ownership/path
  - MIME type
  - file size
  - block state

Firestore Rules still prevent client from creating `type = "image"` messages directly.

### 9.5 Premium Cosmetics

For `shopItems/{itemId}.requiresPro == true`:

- `purchaseShopItem` checks active Pro.
- `equipItem` checks active Pro.
- expiration behavior remains open via ADR-032.

### 9.6 Client UI Is Not Enforcement

UI can hide Pro features for Basic users, but backend is canonical.

---

## 10. Subscription Lifecycle & State Machine

### 10.1 States

```ts
export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";
```

### 10.2 State Machine

```text
none
  ↓ checkout completed with trial
trialing
  ↓ trial converts
active
  ↓ payment failed
past_due
  ↓ payment recovered
active
  ↓ user cancels
cancelled
  ↓ currentPeriodEnd reached
expired

none
  ↓ checkout completed without trial
active
  ↓ user cancels
cancelled
  ↓ currentPeriodEnd reached
expired

past_due
  ↓ grace period ended / provider expires subscription
expired
```

### 10.3 Entitlement by State

| Status | `isPro` | Notes |
|---|---:|---|
| `none` | false | No subscription. |
| `trialing` | true | If trial is valid and not expired. |
| `active` | true | Active paid subscription. |
| `past_due` | TBD | Depends grace period policy; default recommendation: false unless provider confirms active entitlement. |
| `cancelled` | TBD | Usually true until `currentPeriodEnd`, then false. |
| `expired` | false | No Pro entitlement. |

### 10.4 Renewal

On renewal event:

- keep `tier = "pro"`.
- set `status = "active"`.
- update `currentPeriodStart`.
- update `currentPeriodEnd`.
- update `updatedAt`.
- derived `isPro = true`.

### 10.5 Cancellation

On cancellation event:

- set `status = "cancelled"`.
- set `cancelledAt`.
- keep `currentPeriodEnd`.
- entitlement policy:
  - recommended: Pro remains until `currentPeriodEnd`.
  - final policy must align with provider contract and product terms.

### 10.6 Expiration

On expiration:

- set `status = "expired"`.
- set `isPro = false` via trigger.
- set `verifiedBadge = false`.
- Pro-only features blocked on next server-side check.

---

## 11. Edge Cases

### 11.1 Payment succeeded but no confirmation in client

Problem:

- User paid successfully.
- Redirect succeeded.
- Webhook delayed.

Handling:

- client shows pending activation state.
- client listens to `users/{uid}.isPro` and/or `subscriptions/{uid}`.
- do not unlock Pro based only on redirect query params.
- support can run `reconcileSubscription` in Scale/V1.

### 11.2 User cancels during checkout

Handling:

- no subscription state mutation.
- redirect to cancellation page.
- show Basic state.
- no Pro entitlement granted.

### 11.3 Subscription expires during active session

Handling:

- backend checks `isProUser` on every Pro action.
- next Pro-only action is denied if expired.
- Firestore listener updates UI when `isPro` becomes false.
- server-side enforcement wins over stale client state.

### 11.4 Downgrade from Pro to Basic

Handling:

- `onSubscriptionUpdated` sets:
  - `users/{uid}.isPro = false`
  - `publicProfiles/{uid}.isPro = false`
  - `publicProfiles/{uid}.verifiedBadge = false`
- Pro-only actions denied.
- behavior for already-equipped Pro cosmetics is open via ADR-032.

### 11.5 Using Pro after expiration

Handling:

- all Pro actions call `isProUser`.
- `sendChatMediaMessage` returns `pro_required`.
- `purchaseShopItem` returns `pro_required` for `requiresPro` items.
- `equipItem` returns `pro_required` for `requiresPro` items.

### 11.6 Refund / Chargeback

Handling:

- provider event is normalized.
- recommended immediate reconciliation.
- policy decision:
  - disable Pro immediately for chargeback.
  - refund may disable or allow until period end depending terms.
- write audit in `billingEvents` in Scale/V1.

### 11.7 Webhook Delay

Handling:

- client uses pending UX.
- webhook is canonical.
- reconciliation can fix drift.
- support tooling should show provider customer/subscription IDs.

### 11.8 Duplicate Subscription

Problem:

- user somehow creates two active subscriptions.

Handling:

- provider abstraction should prevent new checkout if active subscription exists.
- if detected:
  - keep one canonical `subscriptions/{uid}`.
  - alert support.
  - reconcile with provider.
  - do not double-grant benefits.

### 11.9 Pro User Suspended

Handling:

- suspension overrides access to app actions.
- do not necessarily cancel subscription automatically unless policy says.
- Pro entitlement may still exist in billing docs, but app actions blocked by `isSuspended`.
- support/admin policy required for refunds or account restoration.

### 11.10 Provider Event Out of Order

Handling:

- avoid blindly applying older events.
- compare provider period timestamps.
- fetch current provider state when order is ambiguous.
- use reconciliation job.

### 11.11 Provider Customer Mapping Missing

Handling:

- do not write entitlement to unknown user.
- log minimal metadata.
- store failed billing event in Scale/V1.
- trigger alert.
- decide HTTP status based on retry semantics.

---

## 12. Billing Events Audit

### 12.1 Scope

`billingEvents/{eventId}` is Scale/V1.

It is recommended for production even if not required for private beta because payment debugging depends on reliable event audit.

### 12.2 Path

```text
billingEvents/{eventId}
```

ID:

```text
{provider}:{providerEventId}
```

### 12.3 Schema

```ts
export type BillingEventStatus =
  | "received"
  | "processed"
  | "failed"
  | "ignored";

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

### 12.4 What to Store

Store:

- provider name.
- provider event ID.
- normalized event type.
- mapped `uid`, if available.
- provider customer/subscription IDs.
- processing status.
- received/processed timestamps.
- sanitized error code/message.

Do not store:

- full card details.
- raw provider payload with PII/payment details.
- webhook secret.
- signature header raw value.
- full invoice payload unless legally required and reviewed.

### 12.5 Idempotency Use

Before processing:

```ts
const eventId = `${event.provider}:${event.providerEventId}`;
const eventRef = db.doc(`billingEvents/${eventId}`);
```

If `status == "processed"`:

- return `200`.
- no duplicate subscription mutation.

---

## 13. Reconciliation

### 13.1 Why Reconciliation Exists

Webhooks can be delayed, duplicated, dropped, or processed out of order.  
Provider truth must be able to correct Firestore drift.

### 13.2 `reconcileSubscription` [Scale/V1]

Callable/admin-service function.

Input:

```ts
export type ReconcileSubscriptionInput = {
  uid: string;
};
```

Output:

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

Behavior:

- admin/service only.
- load `subscriptions/{uid}`.
- call provider API.
- normalize current provider state.
- update `subscriptions/{uid}`.
- trigger `onSubscriptionUpdated`.
- safe to rerun.

### 13.3 `scheduledSubscriptionReconciliation` [Scale/V1]

Scheduled job.

Behavior:

- scan subscriptions with statuses:
  - `trialing`
  - `active`
  - `past_due`
  - `cancelled`
- detect expired `currentPeriodEnd`.
- fetch provider truth.
- correct Firestore drift.
- alert on failures.

### 13.4 Drift Examples

| Drift | Correction |
|---|---|
| Firestore says active, provider says expired | update `subscriptions/{uid}.status = "expired"`. |
| Firestore says past_due, provider says active | update to `active`. |
| Firestore missing period end | fetch provider state and populate. |
| user has `isPro = true` but no active subscription | derive false via subscription correction. |
| public profile badge true after expiration | `onSubscriptionUpdated` sets false. |

---

## 14. Security & Secrets

### 14.1 Client Cannot Write Pro State

Firestore Security Rules deny client writes to:

- `subscriptions/{uid}`
- `users/{uid}.subscriptionTier`
- `users/{uid}.subscriptionStatus`
- `users/{uid}.subscriptionExpiresAt`
- `users/{uid}.isPro`
- `publicProfiles/{uid}.isPro`
- `publicProfiles/{uid}.verifiedBadge`

### 14.2 Webhook Security

Required:

- raw body signature verification.
- provider-specific webhook secret.
- Secret Manager.
- no trust in query params.
- no trust in redirect callback.
- idempotency by provider event ID.
- no raw payment payload logging.

### 14.3 Secrets

| Secret | Location |
|---|---|
| `PAYMENT_WEBHOOK_SECRET` | Secret Manager |
| `PAYMENT_API_SECRET` | Secret Manager |
| `PAYMENT_API_KEY` | Secret Manager if provider requires |
| provider signing secrets | Secret Manager |
| service account credentials | not in repo; managed by GCP/IAM |

### 14.4 Not Secrets

Firebase web config is not a billing secret.  
Provider public key may be client-safe only if provider explicitly documents it as publishable.  
Secret keys never go to client.

### 14.5 Logging Policy

Allowed logs:

- event type.
- provider.
- provider event ID.
- mapped uid.
- status.
- sanitized error code.

Forbidden logs:

- full raw webhook payload.
- card details.
- webhook signature secret.
- provider secret.
- full customer billing profile.
- invoice content with PII unless policy allows.

---

## 15. Compliance

### 15.1 Launch Requirement

Before production billing launch, Swish & Game must complete:

- provider legal/business setup.
- terms of service.
- privacy policy.
- cancellation policy.
- refund policy.
- receipt/invoice workflow.
- tax/VAT accounting review.
- support process for billing issues.
- data retention policy for billing metadata.

### 15.2 ILS

All MVP Pro subscription charges are:

```ts
priceAmount: 29.90;
currency: "ILS";
```

Any non-ILS plan requires ADR/product decision update.

### 15.3 Receipts / Invoices

Provider selection must confirm:

- automatic receipts/invoices.
- support for required customer details.
- export/reporting for accounting.
- refund/credit document handling.
- compatibility with Israeli business/accounting needs.

### 15.4 VAT / Tax

Do not hardcode tax assumptions in app logic before accounting review.

The provider integration should support:

- tax-inclusive or tax-exclusive pricing according to business decision.
- invoice metadata.
- reports for accountant.
- tax/VAT configuration per operating entity.

### 15.5 Cancellation Policy

Product must define before launch:

- self-service cancellation or support-based cancellation.
- whether Pro remains active until `currentPeriodEnd`.
- when `cancelled` becomes `expired`.
- customer notifications.

### 15.6 Refund Policy

Product must define:

- refund eligibility.
- entitlement behavior after refund.
- chargeback behavior.
- support workflow.
- audit requirements.

### 15.7 Privacy

Billing metadata is private.

- `providerCustomerId` is private.
- `providerSubscriptionId` is private.
- payment events are admin-only.
- public profile only receives:
  - `isPro`
  - `verifiedBadge`

---

## 16. Open Items

| Item | Status | Impact |
|---|---|---|
| Final payment provider | Open via ADR-017 | Determines adapter implementation, webhook signature headers, API methods, receipts/invoices. |
| Pro-required cosmetics after Pro expiration | Open via ADR-032 | Determines whether equipped Pro cosmetics are removed, hidden, or grandfathered. |
| Past-due grace period | Open | Determines whether `past_due` still maps to `isPro = true` temporarily. |
| Cancelled entitlement until period end | Product/legal decision | Determines `deriveIsPro` behavior for `cancelled`. |
| Refund behavior | Product/legal decision | Determines immediate downgrade vs period-end downgrade. |
| Chargeback behavior | Product/legal decision | Usually immediate downgrade and support review. |
| Billing event retention | Open | Determines how long to store `billingEvents`. |
| Invoice/receipt provider requirements | Open until provider selected | Determines provider configuration and compliance workflow. |
| Israeli VAT/accounting configuration | Requires accountant/legal review | Determines invoice and tax setup. |
| Customer portal | Open | Provider-hosted portal vs in-app cancellation. |
| Multiple subscriptions per user policy | Open | Usually block duplicate subscriptions at checkout. |
| Pro trial availability | Open | Determines whether `trialing` is used in MVP. |
