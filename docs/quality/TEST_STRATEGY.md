# Swish & Game — Test Strategy

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 2.0 |
| Status | Production Test Strategy |
| Repository Path | `docs/quality/TEST_STRATEGY.md` |
| Product | Swish & Game |
| Supersedes | `docs/TEST_PLAN.md` הקצר |
| Source of Truth | `docs/architecture/ARCHITECTURE.md`, `docs/engineering/CONVENTIONS.md`, `docs/architecture/SECURITY.md`, `docs/architecture/API_CONTRACT.md`, `docs/design/UX_FLOWS.md`, `docs/engineering/ENVIRONMENTS.md`, `docs/TEST_PLAN.md` |
| Testing Principle | test pyramid: הרבה unit, פחות integration, מעט E2E |
| Security Principle | backend-authoritative: בודקים שה-client לא יכול לעקוף server-owned state |
| Required Tooling | Vitest, Testing Library, Firebase Emulator Suite, Playwright |
| Required CI Commands | `npm run test`, `npm run test:rules`, `npm run typecheck`, `npm run lint`, `npm run build` |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Testing Philosophy & Pyramid](#2-testing-philosophy--pyramid)
- [3. Test Types & Tooling](#3-test-types--tooling)
- [4. Unit Tests](#4-unit-tests)
- [5. Component Tests](#5-component-tests)
- [6. Integration Tests — Firebase Emulator](#6-integration-tests--firebase-emulator)
- [7. Security Rules Tests](#7-security-rules-tests)
- [8. Cloud Function Tests](#8-cloud-function-tests)
- [9. E2E Tests — Playwright](#9-e2e-tests--playwright)
- [10. Test Data & Fixtures](#10-test-data--fixtures)
- [11. RTL & Accessibility Testing](#11-rtl--accessibility-testing)
- [12. Coverage Targets](#12-coverage-targets)
- [13. CI Integration](#13-ci-integration)
- [14. Test Conventions](#14-test-conventions)
- [15. Open Items](#15-open-items)

---

## 2. Testing Philosophy & Pyramid

### 2.1 Goal

מטרת הבדיקות היא להבטיח ש-Swish & Game עובד באופן יציב, מאובטח, type-safe, ו-backend-authoritative בזמן המעבר מ-prototype ל-Firebase production.

הבדיקות חייבות להוכיח:

- ה-client לא יכול לשנות state רגיש.
- Cloud Functions אוכפות auth, validation, permissions, idempotency ו-side effects.
- Firestore Security Rules ו-Storage Rules מגנות על data.
- ה-UX מטפל ב-`loading`, `empty`, `error`, `success`.
- Hebrew-first RTL לא נשבר במסכים מרכזיים.
- flows קריטיים עובדים על emulator וב-E2E.

### 2.2 Test Pyramid

```text
              E2E Tests
          Playwright critical flows
        -----------------------------
          Integration / Emulator
      Firebase Functions + Rules + Data
    -------------------------------------
        Component Tests / UI Behavior
       Testing Library + accessibility
  -----------------------------------------
                Unit Tests
       pure logic, schemas, mappers, helpers
```

### 2.3 Layer Responsibilities

| Layer | Volume | Purpose | Should Catch |
|---|---:|---|---|
| Unit | High | בדיקת logic נקי, schemas, helpers, mappers | enum drift, invalid validation, formatter bugs, gating helper bugs |
| Component | Medium | בדיקת UI behavior ו-states | missing loading/error/empty, accessibility regressions, RTL rendering issues |
| Integration / Emulator | Medium | בדיקת Firebase flows עם Auth/Firestore/Storage/Functions | broken side effects, transaction bugs, rule mismatches |
| Security Rules | Mandatory / High | בדיקת allow/deny matrix | privilege escalation, client writes ל-server-owned fields |
| E2E | Low but critical | בדיקת journeys שלמים | route guards, navigation, real UX regressions |

### 2.4 Backend-Authoritative Testing Rule

כל בדיקה סביב economy, matching, subscription, media, AI או safety חייבת לבדוק שה-client לא יכול לעקוף את השרת.

Examples:

- UI מסתיר media upload ל-Basic, אבל הבדיקה האמיתית היא ש-`sendChatMediaMessage` מחזיר `pro_required`.
- UI מציג coins, אבל Security Rules חייבות לדחות direct write ל-`users/{uid}.coins`.
- checkout redirect חוזר בהצלחה, אבל Pro לא ניתן עד `paymentWebhook` מאומת.

---

## 3. Test Types & Tooling

| Test Type | Tool | Scope | Location |
|---|---|---|---|
| Unit | Vitest | schemas, pure functions, helpers, mappers, state machines | `src/**/__tests__/*.test.ts`, `functions/src/**/__tests__/*.test.ts` |
| Component | Vitest + Testing Library | React components, states, forms, a11y basics | `src/features/**/__tests__/*.test.tsx`, `src/shared/**/__tests__/*.test.tsx` |
| Integration | Firebase Emulator Suite + Vitest | Auth, Firestore, Storage, Functions side effects | `tests/integration/**/*.test.ts` |
| Security Rules | Firebase Emulator Suite | Firestore/Storage allow/deny matrix | `tests/rules/**/*.test.ts` |
| Cloud Function | Vitest + emulator/Admin SDK test harness | callable/http function contracts | `functions/src/**/__tests__/*.test.ts` |
| E2E | Playwright | critical browser journeys | `tests/e2e/**/*.spec.ts` |
| Accessibility | Testing Library + Playwright + manual QA | RTL, keyboard, aria, focus, contrast | component tests + E2E + QA checklist |
| Type checks | TypeScript | compile-time contract safety | `npm run typecheck` |
| Lint/format | ESLint/Prettier | code quality | `npm run lint` / format checks |
| Build | Vite + TypeScript | production build safety | `npm run build` |

### 3.1 Required Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
```

Local emulator command:

```bash
firebase emulators:start --project swish-game-dev
```

Optional E2E command:

```bash
npm run test:e2e
```

---

## 4. Unit Tests

### 4.1 Required Unit Test Areas

| Area | Examples | Why |
|---|---|---|
| Zod schemas | `SubmitSwipeInputSchema`, `PurchaseShopItemInputSchema`, `CreateCheckoutSessionInputSchema` | Trust boundary validation. |
| ID generation | `matchId`, `chatId`, `swipeId` deterministic generation | Prevent duplicate matches/chats/swipes. |
| Swipe state machine | `skipped`, `liked`, `matched` outcomes | Matching correctness. |
| Pro gating helpers | `isProUser`, `deriveIsPro` | Subscription entitlement safety. |
| Label maps coverage | `Record<Enum, string>` for localization | Prevent missing Hebrew labels. |
| Error mapping | `ApiErrorCode` → Hebrew messages | Consistent UX. |
| Formatters | `formatILS`, `formatDate`, `formatRelativeTime` | `he-IL` correctness. |
| Firestore converters | parse/serialize documents | Data model safety. |
| Payment normalization | provider event → normalized event | Billing correctness. |
| AI output validation | AI JSON parse/guardrails helpers | Safe AI UX. |

### 4.2 Zod Schema Tests

Every callable input schema must test:

- valid minimal input.
- valid full input.
- missing required fields.
- invalid enum.
- unknown fields rejected via `.strict()`.
- length/size limits.
- self-action fields where applicable.

Example:

```ts
describe("SubmitSwipeInputSchema", () => {
  it("accepts a valid like", () => {
    expect(SubmitSwipeInputSchema.parse({
      targetUid: "target-uid",
      gameId: "valorant",
      direction: "like"
    })).toEqual({
      targetUid: "target-uid",
      gameId: "valorant",
      direction: "like"
    });
  });

  it("rejects invalid direction", () => {
    expect(() => SubmitSwipeInputSchema.parse({
      targetUid: "target-uid",
      gameId: "valorant",
      direction: "super_like"
    })).toThrow();
  });
});
```

### 4.3 Deterministic ID Tests

Required cases:

| Helper | Required Tests |
|---|---|
| `createMatchId(uidA, uidB, gameId)` | same output regardless of user order |
| `createChatId(matchId)` | equals match ID if canonical |
| `createSwipeId(targetUid, gameId)` | stable `{targetUid}_{gameId}` format |
| `createBillingEventId(provider, providerEventId)` | stable `{provider}:{providerEventId}` format |

### 4.4 Pro Entitlement Helper Tests

`deriveIsPro(subscription)` must test:

| `tier` | `status` | `currentPeriodEnd` | Expected |
|---|---|---|---:|
| `pro` | `active` | future | true |
| `pro` | `trialing` | future | true |
| `pro` | `expired` | past | false |
| `basic` | `active` | future | false |
| `pro` | `past_due` | future | policy-dependent; must match `PAYMENTS.md` |
| `pro` | `cancelled` | future | policy-dependent; must match `PAYMENTS.md` |

### 4.5 Label Map Coverage

Because label maps use `Record<Enum, string>`, TypeScript catches missing keys. Add runtime smoke tests for exported maps:

```ts
it("has Hebrew labels for every SkillLevel", () => {
  const values: SkillLevel[] = ["beginner", "intermediate", "pro", "elite"];

  for (const value of values) {
    expect(skillLevelLabels[value]).toBeTruthy();
  }

  expect(skillLevelLabels.pro).toBe("מקצוען");
});
```

### 4.6 Error Mapping Tests

Every `ApiErrorCode` from `API_CONTRACT.md` must map to safe Hebrew copy:

```ts
const apiErrorCodes: ApiErrorCode[] = [
  "unauthenticated",
  "permission_denied",
  "invalid_argument",
  "not_found",
  "already_exists",
  "failed_precondition",
  "resource_exhausted",
  "insufficient_coins",
  "pro_required",
  "blocked",
  "self_action_forbidden",
  "internal"
];
```

Test:

- no missing code.
- no raw internal/provider message shown.
- `internal` maps to generic retry-later copy.

---

## 5. Component Tests

### 5.1 Tooling

Use:

- Vitest
- Testing Library
- `@testing-library/user-event`
- `@testing-library/jest-dom`

### 5.2 Required Component State Tests

Every async screen/page component must test:

| State | Required Assertion |
|---|---|
| `loading` | loading text/skeleton appears, primary action disabled if relevant |
| `empty` | helpful Hebrew empty copy appears |
| `error` | safe error copy appears and retry exists when safe |
| `success` | main content appears |
| `pending` | for checkout/AI/upload flows where relevant |

Examples:

- `DiscoveryPage`:
  - loading deck skeleton.
  - empty deck state.
  - error retry.
  - success `SwipeCard`.
- `SubscriptionPage`:
  - Basic plan view.
  - pending activation.
  - Pro status.
  - checkout error.
- `AIHubPage`:
  - empty form.
  - loading response.
  - refusal state.
  - success result.

### 5.3 RTL Component Tests

Components must render inside RTL wrapper:

```tsx
function renderRtl(ui: React.ReactElement) {
  return render(
    <div lang="he" dir="rtl">
      {ui}
    </div>
  );
}
```

Test:

- Hebrew text appears.
- icon-only buttons have Hebrew `aria-label`.
- start/end props render correctly.
- mixed content does not reorder in obvious cases.

### 5.4 Accessibility Component Tests

Required:

- buttons have accessible names.
- modals set focus and have accessible titles.
- form errors are connected to fields.
- no critical action relies only on color.
- `aria-disabled` / `disabled` states are correct.

Recommended smoke check:

```ts
expect(screen.getByRole("button", { name: /שדרוג/i })).toBeEnabled();
```

### 5.5 Form Tests

For React Hook Form + Zod forms:

- required fields show Hebrew errors.
- invalid enum values cannot be selected/submitted.
- submit disabled while saving.
- server error maps to `ApiErrorAlert`.
- form preserves data after failure.

### 5.6 Component Tests Must Not

- call real Gemini.
- call real payment provider.
- connect to production Firebase.
- rely on live network.
- assert on implementation details when user-observable behavior is enough.

---

## 6. Integration Tests — Firebase Emulator

### 6.1 Tooling

Use Firebase Emulator Suite for:

- Auth
- Firestore
- Storage
- Functions

Run only against:

```text
swish-game-dev
```

or emulator project IDs.

Never run integration tests against:

```text
swish-game-prod
```

### 6.2 Required Integration Flows

| Flow | Required Assertions |
|---|---|
| signup → onboarding → profile sync | Auth user created; `users/{uid}` saved; `users/{uid}/games/{gameId}` saved; `publicProfiles/{uid}` created/synced. |
| swipe → match → chat | first like returns `liked`; reciprocal like returns `matched`; deterministic `matches/{matchId}` and `chats/{chatId}` exist. |
| purchase → coins + ownership + transaction | coins decrease; item ownership updates; `transactions/{transactionId}` written; duplicate purchase prevented. |
| equip → public profile | owned item equipped; `users/{uid}` and `publicProfiles/{uid}` reflect cosmetic reference. |
| block → chat blocked | `blockUser` writes block; affected match/chat status updates; blocked chat no longer active. |
| subscription webhook → entitlement | verified normalized webhook updates `subscriptions/{uid}`; `onSubscriptionUpdated` syncs `users/{uid}.isPro` and `publicProfiles/{uid}.verifiedBadge`. |
| AI request → audit | `sendAIProfileReview` / `sendAISquadAdvice` creates `aiRequests/{requestId}` and usage counter; no raw secret exposure. |
| media message Pro gate | Basic user denied; Pro user creates image message through `sendChatMediaMessage`. |

### 6.3 Integration Test Pattern

```ts
describe("swipe → match → chat", () => {
  beforeEach(async () => {
    await seedEmulator();
  });

  it("creates a deterministic match and chat on reciprocal like", async () => {
    const first = await callSubmitSwipe(userA, {
      targetUid: userB.uid,
      gameId: "valorant",
      direction: "like"
    });

    expect(first.result).toBe("liked");

    const second = await callSubmitSwipe(userB, {
      targetUid: userA.uid,
      gameId: "valorant",
      direction: "like"
    });

    expect(second.result).toBe("matched");
    expect(second.matchId).toBeDefined();
    expect(second.chatId).toBe(second.matchId);
  });
});
```

### 6.4 Integration Cleanup

Each test must start from deterministic clean state.

Allowed approaches:

- emulator reset endpoint.
- deterministic seed before each test file.
- isolated project namespace.
- generated test users with cleanup.

Do not depend on test order.

---

## 7. Security Rules Tests

### 7.1 Requirement

Security Rules tests are mandatory.  
They must run in Firebase Emulator Suite in CI.

Security tests must prove deny-by-default for sensitive data and direct client writes.

### 7.2 Firestore Deny Matrix

| Attempt | Expected |
|---|---|
| unauthenticated read `users/{uid}` | deny |
| user read own `users/{uid}` allowed fields | allow according to rules |
| user read another `users/{otherUid}/private/account` | deny |
| user write own `users/{uid}.coins` | deny |
| user write own `users/{uid}.isPro` | deny |
| user write own `users/{uid}.subscriptionTier` | deny |
| user write own `users/{uid}.subscriptionStatus` | deny |
| user write own `users/{uid}.subscriptionExpiresAt` | deny |
| user write `publicProfiles/{uid}.verifiedBadge` | deny |
| user write `publicProfiles/{uid}.isPro` | deny |
| user create `subscriptions/{uid}` | deny |
| user update `subscriptions/{uid}` | deny |
| user create `billingEvents/{eventId}` | deny |
| user create `users/{uid}/transactions/{transactionId}` | deny |
| user create `matches/{matchId}` directly | deny |
| user update `matches/{matchId}` directly | deny |
| user create `users/{uid}/swipes/{swipeId}` directly | deny |
| user create `chats/{chatId}` directly | deny |
| user create chat message `type: "image"` directly | deny |
| user create chat message `type: "text"` as participant | allow if rules permit |
| non-participant read `chats/{chatId}` | deny |
| non-participant read `chats/{chatId}/messages` | deny |
| blocked participant continue writing chat | deny |
| user write `shopItems/{itemId}` | deny |
| user write `gameCatalog/{gameId}` | deny |
| user write `system/config` | deny |
| user read allowed public `shopItems` | allow |
| user read allowed public `gameCatalog` | allow |
| user create `reports/{reportId}` directly if policy is function-only | deny |
| user read `reports/{reportId}` | deny |

### 7.3 Storage Rules Deny Matrix

| Attempt | Expected |
|---|---|
| unauthenticated upload profile image | deny |
| user upload profile image to another user path | deny |
| user upload non-image file as profile image | deny |
| user upload image above size limit | deny |
| Basic user upload chat media if rules require Pro | deny |
| user upload chat media to chat where not participant | deny |
| user write `shopAssets` | deny |
| admin/service write `shopAssets` | allow |
| user delete another user's media | deny |
| owner delete own allowed temp upload | allow if policy permits |

### 7.4 Allow Tests

Deny tests are not enough. Add allow tests for intended access:

| Allowed Behavior | Expected |
|---|---|
| authenticated user reads own user doc | allow |
| authenticated user updates client-writable profile fields | allow |
| authenticated user reads public profile | allow |
| participant reads chat | allow |
| participant creates text message with valid schema | allow |
| owner uploads valid profile image | allow |
| owner reads own subscription doc | allow |
| authenticated user reads active shop items | allow |
| authenticated user reads active game catalog | allow |

### 7.5 Rules Test Conventions

Use descriptive test names:

```ts
it("denies user from updating own coins", async () => {});
it("denies non-participant from reading chat messages", async () => {});
it("allows participant to create text message", async () => {});
```

Every server-owned field must have an explicit deny test.

---

## 8. Cloud Function Tests

### 8.1 Required Function Test Dimensions

Every callable function must test:

- `unauthenticated`.
- valid input.
- invalid Zod input.
- missing required docs.
- permission denied.
- suspended/deleted user.
- idempotency where relevant.
- side effects.
- no unauthorized side effects on failure.
- standard `ApiErrorCode`.

### 8.2 Callable Function Matrix

| Function | Required Tests |
|---|---|
| `submitSwipe` | auth required; invalid target/game; self swipe denied; blocked denied; Basic limit; skip; like; reciprocal match; idempotent match/chat IDs; suspended denied. |
| `purchaseShopItem` | auth required; item missing; inactive item; already owned; insufficient coins; Pro-required denied for Basic; coins deducted; ownership set; transaction audit written; duplicate safe. |
| `equipItem` | auth required; item missing; not owned denied; Pro-required denied; category valid; user/public profile updated; repeated equip safe. |
| `sendChatMediaMessage` | auth required; Basic denied `pro_required`; non-participant denied; blocked denied; invalid MIME/size/path denied; Pro participant creates image message; usage counter updated. |
| `sendAIProfileReview` | auth required; invalid input; safety pre-check; rate limit; feature disabled; success creates `aiRequests`; provider failure maps to safe error. |
| `sendAISquadAdvice` | auth required; invalid input; unsafe prompt denied/refused; rate limit; success audit; provider failure safe. |
| `createReport` | auth required; self-report denied; missing source docs; non-participant message report denied; valid report creates `reports/{reportId}` with `status = open`. |
| `blockUser` | auth required; self-block denied; target missing; deterministic block; affected chat/match closed; repeated block safe. |
| `syncPublicProfile` | auth required; owner can sync self; non-admin cannot sync other user; admin can; private fields excluded. |
| `createCheckoutSession` | auth required; suspended/deleted denied; already active Pro returns `failed_precondition`; creates/reuses `providerCustomerId`; returns `checkoutUrl`; does not write Pro state. |
| `getDiscoveryDeck` | auth required; invalid filters; excludes self/swiped/matched/blocked/suspended; cursor/limit safe. |
| `grantCoins` | admin/service only; invalid amount; user missing; idempotency key; balance + transaction audit. |
| `reconcileSubscription` | admin/service only; user/subscription missing; provider unavailable; provider truth updates subscription; derived entitlement synced. |

### 8.3 HTTP/Webhook Function Tests

| Function | Required Tests |
|---|---|
| `paymentWebhook` | rejects invalid signature; uses raw body; ignores duplicate provider event ID; maps customer to uid; validates `priceAmount = 29.90`, `currency = "ILS"`, `tier = "pro"`; writes `subscriptions/{uid}`; no Pro without valid event. |
| `checkoutSessionCallback` | does not grant Pro; redirects success/cancel/failed; validates session when possible; safe to refresh. |
| `scheduledSubscriptionReconciliation` | service account only; updates drift; safe to rerun; handles provider errors. |
| `scheduledUsageCleanup` | service account only; deletes/archives old usage; never deletes billing audit. |

### 8.4 Idempotency Tests

Required for:

- `submitSwipe`
- `purchaseShopItem`
- `equipItem`
- `blockUser`
- `grantCoins`
- `paymentWebhook`
- `reconcileSubscription`
- `scheduledSubscriptionReconciliation`

Example assertions:

- duplicate request does not double-spend coins.
- duplicate webhook does not double-process event.
- repeated block does not duplicate side effects.
- repeated reciprocal swipe returns existing match/chat.

### 8.5 Suspended/Deleted User Tests

For user-facing callables, test:

```text
isSuspended = true → failed_precondition or permission_denied
isDeleted = true → failed_precondition or not_found depending contract
```

Affected functions:

- `submitSwipe`
- `purchaseShopItem`
- `equipItem`
- `sendChatMediaMessage`
- `sendAIProfileReview`
- `sendAISquadAdvice`
- `createReport`
- `blockUser`
- `createCheckoutSession`

---

## 9. E2E Tests — Playwright

### 9.1 E2E Scope

E2E tests validate critical user journeys from `UX_FLOWS.md`.  
Keep E2E count small and high-signal.

Run against:

- local emulator for PR smoke if fast enough.
- staging for pre-release.
- never against production with destructive data.

### 9.2 Critical E2E Flows

| Flow | Required Assertions |
|---|---|
| Onboarding | user logs in; completes profile/game setup; reaches `/discover`. |
| Returning user | existing user opens app; route guard sends to `/discover`. |
| Discovery swipe | deck loads; user likes/skips; UI updates. |
| Match | reciprocal like shows match celebration; CTA opens `/chat/:chatId`. |
| Text chat | participant sends `type: "text"` message; message appears. |
| Basic media blocked | Basic user taps media; sees upgrade prompt; no image message created. |
| Pro upgrade pending | user starts checkout; redirect/callback shows pending; no Pro until webhook seed/simulated event. |
| Shop purchase + equip | user buys item with coins; coin balance updates from backend; item equipped; profile reflects item. |
| AI profile review | user submits profile review; loading appears; result/refusal appears; no direct Gemini client call. |
| Block/report | user reports content; success state; blocks user; chat/match becomes inaccessible or inactive. |
| RTL mobile nav | bottom nav works on mobile viewport; Hebrew labels display; route changes work. |

### 9.3 Recommended Viewports

| Name | Size |
|---|---|
| small mobile | `360x740` |
| default mobile | `390x844` |
| large mobile | `430x932` |
| tablet | `768x1024` |
| desktop smoke | `1280x800` |

### 9.4 E2E Rules

- Use deterministic emulator seed.
- Use stable selectors with `data-testid` only where accessible selectors are not enough.
- Prefer role/name selectors.
- Avoid testing visual implementation details.
- Do not hit real payment provider in PR E2E.
- Do not call real Gemini in PR E2E unless explicitly enabled for staging and safe.

Example:

```ts
await page.getByRole("button", { name: /המשך/i }).click();
await expect(page).toHaveURL(/\/discover/);
```

---

## 10. Test Data & Fixtures

### 10.1 Seed Scope

Emulator seed must include:

| Data | Examples |
|---|---|
| `system/config` | feature flags, limits, billing price/currency, AI config |
| `gameCatalog` | `valorant`, `fortnite`, `league_of_legends` |
| `shopItems` | common/rare/epic/legendary cosmetics; Pro-required item |
| Basic users | onboarding complete/incomplete |
| Pro users | `isPro = true`, active subscription |
| Suspended users | `isSuspended = true` |
| Deleted users | `isDeleted = true` |
| Public profiles | discoverable and non-discoverable |
| Swipes | already swiped targets |
| Matches/chats | active/inactive/blocked |
| Subscriptions | `active`, `trialing`, `past_due`, `cancelled`, `expired` |
| AI requests | historical audit examples |
| Reports | open/reviewing examples if needed |

### 10.2 Deterministic IDs

Use stable IDs:

```text
user_basic_a
user_basic_b
user_pro_a
user_suspended_a
game_valorant
item_avatar_border_common
item_profile_banner_pro
match_basic_a_basic_b_valorant
chat_basic_a_basic_b_valorant
```

### 10.3 Seed Commands

Recommended commands:

```bash
npm run seed:emulator
npm run seed:config
npm run seed:test-users
```

All seed scripts must refuse production:

```ts
if (process.env.APP_ENV === "prod") {
  throw new Error("Refusing to seed production.");
}
```

Also refuse if project ID is:

```text
swish-game-prod
```

### 10.4 Fixture Design

Fixtures should be:

- deterministic.
- minimal.
- readable.
- isolated per test where possible.
- resettable.
- aligned with `DATA_MODEL.md`.
- English enum/data values only.

### 10.5 No Production Data in Tests

Never copy production data into local fixtures.

Forbidden:

- real user profiles.
- real chats.
- real payment events.
- real provider customer IDs.
- real Gemini prompts/responses containing user data.

---

## 11. RTL & Accessibility Testing

### 11.1 RTL Testing

Required checks:

- app root has `lang="he"` and `dir="rtl"`.
- bottom nav renders correctly in RTL.
- modals and drawers align correctly.
- `start/end` icon placement works.
- no physical `left/right` bugs in major components.
- Hebrew copy does not overflow.
- mixed Hebrew/English content displays correctly.

Test examples:

```text
מחפש שחקן ל־Valorant בדירוג Diamond III
PlayStation 5
Xbox Series X
```

### 11.2 Accessibility Testing

Required:

- keyboard navigation.
- visible focus states.
- icon-only buttons with Hebrew `aria-label`.
- form errors connected to fields.
- modals trap focus.
- escape closes modal when safe.
- no color-only status.
- contrast meets WCAG AA.

### 11.3 Manual QA Checklist

Before staging release:

- test core flows on mobile width.
- test long Hebrew names.
- test long English game names.
- test mixed rank strings.
- test reduced motion.
- test screen reader basics for login/onboarding/chat.
- test focus order in modals.

### 11.4 Contrast

Automated checks may catch some issues, but neon-on-dark must also be manually reviewed.

Rules:

- glow does not count as contrast.
- body text must remain readable without glow.
- disabled controls must still be understandable.

---

## 12. Coverage Targets

### 12.1 Realistic Targets

Coverage targets are guidance, not a substitute for high-value tests.

| Area | Target |
|---|---:|
| Pure utility logic | `85%+` |
| Zod schemas / validators | `90%+` |
| Error mapping / label maps | `95%+` |
| Security Rules critical paths | `100% of deny/allow matrix` |
| Cloud Functions critical paths | `85%+ branch coverage for sensitive functions` |
| UI components | `70%+` for core components |
| E2E | critical journeys only |

### 12.2 Critical High-Coverage Areas

These areas require especially strong tests:

| Area | Why |
|---|---|
| coins/economy | prevents fraud and inconsistent balances |
| purchase/equip | impacts ownership and cosmetics |
| matching/swipes | core product mechanic |
| chat access | privacy/safety |
| media messages | Pro + storage/security |
| subscriptions/Pro entitlement | billing trust |
| payment webhook | provider truth and idempotency |
| Security Rules | client bypass prevention |
| AI requests | safety, cost, audit |

### 12.3 What Coverage Must Not Encourage

Do not write low-value tests just to increase percentage:

- snapshot tests for large pages.
- tests that mirror implementation.
- tests that assert Tailwind class strings everywhere.
- brittle animation timing tests.
- tests dependent on order/time without deterministic control.

---

## 13. CI Integration

### 13.1 PR CI

On every PR:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
```

Recommended additional PR checks:

```bash
npm run test:integration
npm run secret-scan
```

PR CI should use:

- emulator project.
- no production secrets.
- no live payment provider.
- AI stubs by default.

### 13.2 Staging CI

On merge to staging branch or `main` per environment mapping:

- run all PR checks.
- deploy to `swish-game-staging`.
- run staging smoke E2E.
- run payment sandbox webhook smoke if payments enabled.
- run AI smoke with staging-safe key if enabled.
- verify no forbidden bundle strings.

Forbidden bundle strings:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
process.env.API_KEY
gemini-3-flash-preview
```

### 13.3 Production Deploy Gate

Before production deploy:

- PR checks passed.
- staging checks passed.
- manual approval complete.
- Security Rules tests green.
- Storage Rules tests green.
- payment webhook tests green if billing enabled.
- no prod deploy from local machine unless emergency policy allows.
- no seed scripts run against production.

### 13.4 Branch → Environment Mapping

| Branch / Trigger | Environment | Tests |
|---|---|---|
| Pull request | emulator/test only | typecheck, lint, unit, component, rules, build |
| `develop` | `swish-game-dev` | PR checks + optional integration |
| `main` | `swish-game-staging` | full checks + staging smoke E2E |
| release tag / manual approval | `swish-game-prod` | full checks + manual gate + production smoke |

### 13.5 Production Smoke Tests

Production smoke tests must be non-destructive:

- app loads.
- login page loads.
- Firebase project ID is `swish-game-prod`.
- no emulators enabled.
- Cloud Functions health endpoints if available.
- invalid payment webhook signature is rejected.
- no secrets in logs.

Do not create fake users or fake payments in production unless a dedicated approved test account/process exists.

---

## 14. Test Conventions

### 14.1 File Placement

```text
src/features/profile/__tests__/profileRepository.test.ts
src/features/chat/__tests__/ChatComposer.test.tsx
src/shared/ui/__tests__/Button.test.tsx
functions/src/callable/__tests__/submitSwipe.test.ts
functions/src/http/__tests__/paymentWebhook.test.ts
tests/rules/firestore.rules.test.ts
tests/rules/storage.rules.test.ts
tests/integration/swipe-match-chat.test.ts
tests/e2e/onboarding.spec.ts
```

### 14.2 Naming

Use:

```text
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
```

Rules:

- unit/component: `*.test.ts(x)`.
- E2E: `*.spec.ts`.
- security rules: `*.rules.test.ts`.

### 14.3 Test Descriptions

Use behavior-focused names:

```ts
it("denies Basic user from sending chat media", async () => {});
it("creates match and chat on reciprocal like", async () => {});
it("does not grant Pro after checkout callback without webhook", async () => {});
```

Avoid:

```ts
it("works", async () => {});
```

### 14.4 Mock vs Real

| Area | Unit/Component | Integration/E2E |
|---|---|---|
| Firebase Auth | mock | emulator |
| Firestore | mock/repository fake | emulator |
| Storage | mock | emulator |
| Cloud Functions | mock callable wrapper | emulator/function harness |
| Gemini | stub | stub by default; staging optional |
| Payment provider | adapter fake | sandbox/stub; production never |
| Time | fake timers | controlled deterministic clock where possible |

### 14.5 Test Isolation

Each test must:

- create its own data or use deterministic seed.
- not depend on previous test.
- clean up or reset emulator.
- avoid production services.
- avoid real secrets.

### 14.6 Assertions

Prefer user-observable assertions for UI:

```ts
expect(screen.getByRole("button", { name: /שליחה/i })).toBeEnabled();
```

Prefer state assertions for backend/integration:

```ts
expect(userDoc.data()?.coins).toBe(70);
expect(transactionDoc.exists()).toBe(true);
```

### 14.7 Time

Use fake timers for:

- daily limits.
- subscription expiry.
- relative time formatters.
- debounce/throttle.
- pending states.

### 14.8 Flake Prevention

Avoid:

- arbitrary waits.
- relying on network.
- relying on animation timing.
- shared mutable fixtures.
- real external providers in PR.

Use:

```ts
await expect(locator).toBeVisible();
```

instead of:

```ts
await page.waitForTimeout(1000);
```

---

## 15. Open Items

| Item | Status | Impact |
|---|---|---|
| Final coverage thresholds | Open | Current targets are recommended; enforce later in CI. |
| E2E execution environment | Open | Decide local emulator vs staging for full Playwright suite. |
| Visual regression testing | Open | Storybook/Chromatic/Playwright screenshots not yet decided. |
| Accessibility automation tooling | Open | Consider `axe-core` integration. |
| Payment provider sandbox strategy | Open via ADR-017 | Determines webhook integration tests. |
| AI provider test strategy | Open | Stub by default; staging smoke optional. |
| Test user account strategy for staging | Open | Needed for stable staging E2E. |
| Emulator seed ownership | Open | Need owner for fixture upkeep. |
| Performance testing | Open | Add later for discovery deck/chat scale. |
| Load testing Cloud Functions | Open | Needed before significant launch. |
| Device/browser matrix | Open | Define supported browsers and mobile devices. |
| Manual QA release checklist | Open | Needs product/design approval. |
| Screenshot diff threshold | Open | Only relevant if visual regression is adopted. |
