# Swish & Game — Engineering Conventions

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Engineering Conventions |
| Repository Path | `docs/engineering/CONVENTIONS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/API_CONTRACT.md`, `docs/architecture/SECURITY.md`, `docs/engineering/ENVIRONMENTS.md`, `docs/engineering/MIGRATION_PLAN.md` |
| Frontend Stack | React + Vite + TypeScript strict + Tailwind CSS + Framer Motion |
| Routing | React Router |
| State | Zustand, Firestore subscriptions, React Hook Form |
| Validation | Zod |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions |
| Architecture Principle | Backend-authoritative, type-safe, feature-based, AI-assisted-friendly |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Folder Structure & Module Boundaries](#2-folder-structure--module-boundaries)
- [3. TypeScript Conventions](#3-typescript-conventions)
- [4. Naming Conventions](#4-naming-conventions)
- [5. React Conventions](#5-react-conventions)
- [6. Styling Conventions](#6-styling-conventions)
- [7. Localization Conventions](#7-localization-conventions)
- [8. State Management Rules](#8-state-management-rules)
- [9. Firebase / Backend Conventions](#9-firebase--backend-conventions)
- [10. Data Access Layer](#10-data-access-layer)
- [11. Error Handling](#11-error-handling)
- [12. Git & PR Conventions](#12-git--pr-conventions)
- [13. Testing Conventions](#13-testing-conventions)
- [14. Code Quality](#14-code-quality)
- [15. Security Conventions](#15-security-conventions)
- [16. AI-Assisted Development Notes](#16-ai-assisted-development-notes)
- [17. Open Items](#17-open-items)

---

## 2. Folder Structure & Module Boundaries

### 2.1 Canonical `src` Structure

```text
src/
  app/
    App.tsx
    router.tsx
    providers/
    layout/
  config/
    env.ts
    firebase.ts
    routes.ts
    featureFlags.ts
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
    components/
    hooks/
    lib/
    types/
    constants/
    labels/
    validation/
    firebase/
    errors/
    ui/
```

### 2.2 Feature Folder Structure

Each feature should follow this shape when relevant:

```text
src/features/{featureName}/
  components/
  hooks/
  pages/
  repositories/
  services/
  stores/
  types/
  validation/
  labels.ts
  index.ts
```

Example:

```text
src/features/chat/
  components/
    ChatThread.tsx
    MessageBubble.tsx
    ChatComposer.tsx
  hooks/
    useChatMessages.ts
    useSendTextMessage.ts
  repositories/
    chatRepository.ts
  services/
    chatService.ts
  types/
    chat.types.ts
  validation/
    chat.schemas.ts
  index.ts
```

### 2.3 Module Boundary Rules

| From | May Import | Must Not Import |
|---|---|---|
| `src/app/**` | features, shared, config | feature internals that are not exported |
| `src/features/{feature}/**` | own feature modules, `shared`, `config` | sibling feature internals directly |
| `src/shared/**` | other shared modules, config constants | feature modules |
| `src/config/**` | env parsing, constants | feature UI/components |
| `functions/**` | backend shared code, Admin SDK, Zod | frontend code |

### 2.4 Cross-Feature Imports

Cross-feature imports must go through that feature's public API:

```ts
// Good
import { PublicProfileCard } from "@/features/profile";

// Bad
import { PublicProfileCard } from "@/features/profile/components/PublicProfileCard";
```

### 2.5 `shared` vs `features`

Use `shared` only for code that is genuinely reusable across multiple features.

Examples for `shared`:

- generic `Button`
- `LoadingState`
- `EmptyState`
- `ApiErrorAlert`
- `formatRelativeTime`
- `SkillLevel` labels
- Firebase client initialization
- generic Firestore helpers

Do not put business-specific logic in `shared` just because it is convenient. Business logic belongs inside the owning feature.

### 2.6 Backend Folder Convention

Recommended Cloud Functions structure:

```text
functions/src/
  index.ts
  config/
    secrets.ts
    runtime.ts
  shared/
    errors.ts
    auth.ts
    validation.ts
    firestore.ts
    logging.ts
  callable/
    submitSwipe.ts
    purchaseShopItem.ts
    equipItem.ts
    sendChatMediaMessage.ts
    sendAIProfileReview.ts
    sendAISquadAdvice.ts
    createReport.ts
    blockUser.ts
    syncPublicProfile.ts
    createCheckoutSession.ts
    getDiscoveryDeck.ts
    grantCoins.ts
    reconcileSubscription.ts
  http/
    paymentWebhook.ts
    checkoutSessionCallback.ts
  triggers/
    onUserProfileUpdated.ts
    onUserGameUpdated.ts
    onSubscriptionUpdated.ts
    onMessageCreated.ts
    onBlockCreated.ts
    onShopItemUpdated.ts
    onUserDeleted.ts
    onReportCreated.ts
  repositories/
  services/
  schemas/
  types/
```

---

## 3. TypeScript Conventions

### 3.1 Strict Mode

`strict` must be enabled.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 3.2 No `any`

`any` is forbidden unless there is a documented boundary with unsafe external input.

Use:

```ts
unknown
```

at boundaries, then validate with Zod.

```ts
const parsed = CreateReportInputSchema.safeParse(input);

if (!parsed.success) {
  throw toInvalidArgumentError(parsed.error);
}

const data = parsed.data;
```

### 3.3 Types vs Interfaces

Use `type` for:

- API input/output contracts
- union types
- Firestore document shapes
- derived Zod types
- React component props unless extension is needed

Use `interface` only when declaration merging or extension is intentional.

```ts
export type SubmitSwipeInput = {
  targetUid: string;
  gameId: string;
  direction: "like" | "skip";
};
```

### 3.4 Zod-Derived Types

When possible, define schema first and derive type:

```ts
export const SubmitSwipeInputSchema = z.object({
  targetUid: z.string().min(1),
  gameId: z.string().min(1),
  direction: z.enum(["like", "skip"])
}).strict();

export type SubmitSwipeInput = z.infer<typeof SubmitSwipeInputSchema>;
```

For contracts already defined in `API_CONTRACT.md`, schema and type must match exactly.

### 3.5 Enum Values

Enums and stored values are English only.

Canonical example:

```ts
export type SkillLevel = "beginner" | "intermediate" | "pro" | "elite";
```

Never store Hebrew enum values in Firestore.

```ts
// Bad
skillLevel: "מתחיל"

// Good
skillLevel: "beginner"
```

### 3.6 Nullability

Prefer `undefined` for optional UI state and optional TypeScript fields.  
Use `null` only when Firestore/API contract explicitly requires it.

```ts
type UserProfile = {
  bannerImageUrl?: string;
};
```

### 3.7 Firestore Timestamp Handling

Firestore timestamps must not be treated as strings.

Use explicit conversions:

```ts
export function toDate(value: Timestamp | undefined): Date | undefined {
  return value?.toDate();
}
```

Do not store client-generated trusted timestamps for server-owned data. Use server timestamps through backend functions.

---

## 4. Naming Conventions

### 4.1 Files

| Type | Convention | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `ProfileCard.tsx` |
| Hook | `useThing.ts` | `useDiscoveryDeck.ts` |
| Store | `thingStore.ts` | `authStore.ts` |
| Repository | `thingRepository.ts` | `profileRepository.ts` |
| Service | `thingService.ts` | `checkoutService.ts` |
| Schema | `thing.schemas.ts` | `profile.schemas.ts` |
| Types | `thing.types.ts` | `subscription.types.ts` |
| Labels | `labels.ts` | `labels.ts` |
| Test | `*.test.ts` / `*.test.tsx` | `profileRepository.test.ts` |

### 4.2 React Components

Use PascalCase:

```tsx
export function DiscoveryCard() {
  return <article />;
}
```

Avoid default exports for project code. Prefer named exports.

```tsx
// Good
export function ChatComposer() {}

// Avoid
export default ChatComposer;
```

### 4.3 Hooks

Hooks start with `use`:

```ts
export function useCurrentUser() {}
export function useChatMessages(chatId: string) {}
```

### 4.4 Zustand Stores

Store names:

```ts
useAuthStore
useUiStore
useDraftMessageStore
```

Store files:

```text
authStore.ts
uiStore.ts
draftMessageStore.ts
```

### 4.5 Firebase Functions

Function names must match `API_CONTRACT.md` exactly:

```text
submitSwipe
purchaseShopItem
equipItem
sendChatMediaMessage
sendAIProfileReview
sendAISquadAdvice
createReport
blockUser
syncPublicProfile
createCheckoutSession
getDiscoveryDeck
grantCoins
reconcileSubscription
paymentWebhook
checkoutSessionCallback
scheduledSubscriptionReconciliation
scheduledUsageCleanup
```

### 4.6 Firestore Collections and Fields

Collection and field names must match `DATA_MODEL.md`.

Examples:

```text
users/{uid}
users/{uid}/private/account
publicProfiles/{uid}
users/{uid}/games/{gameId}
users/{uid}/swipes/{targetUid_gameId}
matches/{matchId}
chats/{chatId}/messages/{messageId}
shopItems/{itemId}
subscriptions/{uid}
aiRequests/{requestId}
reports/{reportId}
system/config
```

### 4.7 Deprecated Names

Do not use legacy names:

| Deprecated | Replacement |
|---|---|
| `GameOn` | `Swish & Game` |
| `DoGame` | `Swish & Game` |
| `dogame` namespace/classes | canonical Swish & Game naming |
| Hebrew enum values | English enum values |
| direct Gemini client service | callable Cloud Function wrapper |

---

## 5. React Conventions

### 5.1 Component Shape

Use small, focused components.

```tsx
type ProfileCardProps = {
  displayName: string;
  bio: string;
  isPro: boolean;
};

export function ProfileCard({ displayName, bio, isPro }: ProfileCardProps) {
  return (
    <article>
      <h2>{displayName}</h2>
      <p>{bio}</p>
      {isPro ? <ProBadge /> : null}
    </article>
  );
}
```

### 5.2 Container vs Presentational Components

Use container components for data loading and presentational components for rendering.

```text
ProfilePage.tsx        // loads route params and data
ProfileCard.tsx        // renders UI only
usePublicProfile.ts    // subscribes to Firestore
```

### 5.3 Loading, Error, Empty States

Every async UI must explicitly handle:

- loading
- error
- empty
- success

```tsx
if (query.isLoading) return <LoadingState label="טוען..." />;
if (query.error) return <ErrorState error={query.error} />;
if (!profile) return <EmptyState title="לא נמצא פרופיל" />;
```

### 5.4 Forms

Use React Hook Form + Zod.

```ts
const form = useForm<ProfileFormValues>({
  resolver: zodResolver(ProfileFormSchema),
  defaultValues
});
```

Rules:

- form validation is UX only.
- backend still validates with Zod.
- never rely on client validation for sensitive operations.

### 5.5 Firestore Subscriptions in React

Use dedicated hooks:

```ts
export function useChatMessages(chatId: string) {
  // subscribe to chats/{chatId}/messages
}
```

Do not place raw Firestore subscription logic inside large page components.

### 5.6 Framer Motion

Use Framer Motion for UX polish, not business logic.

Rules:

- no animation that blocks core functionality.
- respect reduced motion where possible.
- keep animation variants in component-local constants or shared UI utilities.
- Framer Motion is for **UI motion** only; **cosmetic FX** (Rive/Lottie/PixiJS/alpha-video/sprite/Howler) follow `docs/design/MOTION_AND_FX.md` — lazy-load heavy runtimes, pause off-screen, quality tiers, and `prefers-reduced-motion` fallbacks (ADR-039).

---

## 6. Styling Conventions

### 6.1 Tailwind First

Use Tailwind CSS for styling.

```tsx
<button className="rounded-2xl px-4 py-2 text-sm font-medium">
  המשך
</button>
```

Avoid inline CSS:

```tsx
// Bad
<div style={{ padding: 16, color: "red" }} />
```

### 6.2 Design Tokens

Use project tokens through Tailwind config where possible.

Recommended token groups:

```text
colors.background
colors.surface
colors.primary
colors.secondary
colors.accent
colors.danger
colors.success
colors.warning
spacing
borderRadius
boxShadow
fontFamily
```

### 6.3 RTL

Hebrew UI is RTL by default.

Set document/app direction:

```tsx
<html lang="he" dir="rtl">
```

Use logical spacing where possible:

```css
padding-inline
margin-inline
border-inline-start
```

In Tailwind, prefer utilities that behave well in RTL or use RTL-aware plugins if configured.

### 6.4 Deprecated Styling Namespace

`dogame` namespace/classes are deprecated.

Do not add new:

```text
dogame-*
.doGame*
.gameon-*
```

Use neutral or Swish & Game aligned naming.

### 6.5 No Business Logic in CSS

CSS/Tailwind must not encode entitlement rules.

Do not hide Pro-only controls as the only enforcement.  
Backend must enforce Pro state.

---

## 7. Localization Conventions

### 7.1 UI Hebrew, Data English

UI is Hebrew-first and RTL; English (LTR) is also supported via i18n (ADR-035).  
Stored data enums are English.

i18n rules (ADR-035): all UI strings go through i18n message catalogs (`he`, `en`) — no hardcoded UI strings in feature code; `dir`/`lang` switch per active locale (`rtl`/`ltr`); user preference persists via `users/{uid}.preferredLocale`. Enum→label maps (below) are provided per locale. See `docs/design/LOCALIZATION.md`.

Example:

```ts
export const skillLevelLabels: Record<SkillLevel, string> = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  pro: "מקצוען",
  elite: "עילית"
};
```

### 7.2 Label Maps

Use label maps for all enums:

```ts
export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  none: "ללא מנוי",
  trialing: "בתקופת ניסיון",
  active: "פעיל",
  past_due: "תשלום נכשל",
  cancelled: "בוטל",
  expired: "פג תוקף"
};
```

### 7.3 Do Not Store Labels

Do not store Hebrew labels in Firestore for enum values.

```ts
// Bad
subscriptionStatus: "פעיל"

// Good
subscriptionStatus: "active"
```

### 7.4 Date and Number Formatting

Use locale-aware formatting:

```ts
new Intl.DateTimeFormat("he-IL").format(date);
new Intl.NumberFormat("he-IL").format(value);
```

For currency:

```ts
new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS"
}).format(29.9);
```

---

## 8. State Management Rules

### 8.1 State Categories

| State Type | Tool | Examples |
|---|---|---|
| Server state | Firestore subscriptions / callable functions | profile, matches, chats, subscription |
| Local UI state | React state | modal open, selected tab |
| Cross-route UI state | Zustand | onboarding draft, composer draft |
| Form state | React Hook Form | profile edit form |
| Sensitive state | Backend only | coins, Pro, matches, swipes, transactions |

### 8.2 Firestore Subscriptions

Use Firestore subscriptions for live server state:

- `publicProfiles/{uid}`
- `matches/{matchId}`
- `chats/{chatId}`
- `chats/{chatId}/messages`
- `subscriptions/{uid}` owner view
- `shopItems`

### 8.3 Zustand

Use Zustand for:

- UI preferences
- temporary drafts
- current non-sensitive UI state
- optimistic UI where safe

Do not use Zustand as source of truth for:

- `coins`
- `isPro`
- `subscriptionStatus`
- `matches`
- `swipes`
- `ownedItems`
- `transactions`

### 8.4 React Hook Form

Use RHF for form state only.

On submit:

1. validate locally with Zod.
2. call repository/service.
3. backend validates again.
4. show mapped error.

### 8.5 No Sensitive Client Authority

Client may display sensitive state from Firestore but cannot decide it.

Examples:

```text
client can display isPro
client cannot set isPro

client can display coins
client cannot update coins

client can request purchaseShopItem
backend decides purchase result
```

---

## 9. Firebase / Backend Conventions

### 9.1 Backend-Authoritative

All sensitive actions go through Cloud Functions.

| Sensitive Action | Function |
|---|---|
| Swipe/match creation | `submitSwipe` |
| Coin purchase | `purchaseShopItem` |
| Equip item | `equipItem` |
| Chat media | `sendChatMediaMessage` |
| AI profile review | `sendAIProfileReview` |
| AI squad advice | `sendAISquadAdvice` |
| Report | `createReport` |
| Block | `blockUser` |
| Public profile repair | `syncPublicProfile` |
| Checkout session | `createCheckoutSession` |
| Payment webhook | `paymentWebhook` |

### 9.2 Callable Function Pattern

Every callable must:

1. validate `request.auth`.
2. load current user if needed.
3. check suspended/deleted state.
4. validate input with Zod.
5. enforce authorization.
6. perform Firestore transaction if mutating sensitive state.
7. return `ApiSuccess<T>`.
8. throw standard `HttpsError` on failure.

```ts
export async function handler(request: CallableRequest<unknown>) {
  const uid = requireAuth(request);
  const input = parseWithSchema(SubmitSwipeInputSchema, request.data);

  return await submitSwipeService({ uid, input });
}
```

### 9.3 Standard Error Model

Use `ApiErrorCode` from `API_CONTRACT.md`.

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
```

### 9.4 Admin SDK Boundary

Admin SDK bypasses Security Rules.  
Therefore every Admin SDK write must be protected by service logic and tests.

Never write server-owned fields from client SDK.

### 9.5 Firestore Transactions

Use transactions for:

- `submitSwipe`
- `purchaseShopItem`
- `grantCoins`
- entitlement reconciliation
- counters/rate limits
- idempotency checks

### 9.6 Secrets

Backend secrets are read from Secret Manager only.

Never read secrets from frontend env vars.

---

## 10. Data Access Layer

### 10.1 Repository Pattern

All Firestore access should go through repositories.

```text
src/features/profile/repositories/profileRepository.ts
src/features/chat/repositories/chatRepository.ts
src/features/shop/repositories/shopRepository.ts
```

### 10.2 Repository Responsibilities

Repositories may:

- build Firestore refs
- subscribe to documents/queries
- convert snapshots to typed data
- call callable functions
- map Firebase errors to app errors

Repositories must not:

- contain React rendering logic
- contain Tailwind classes
- decide sensitive permissions
- duplicate backend business rules as authority

### 10.3 Mock vs Firestore During Migration

Per `MIGRATION_PLAN.md`, migration from prototype mocks to Firebase should be phased.

Pattern:

```ts
export interface ProfileRepository {
  watchPublicProfile(uid: string): UnsubscribeFn;
  updateOwnProfile(input: UpdateProfileInput): Promise<void>;
}
```

Implementations:

```text
mockProfileRepository.ts
firestoreProfileRepository.ts
```

Feature code consumes the interface, not raw mock data.

### 10.4 Callable Wrappers

Callable wrappers live near the owning feature.

```ts
export async function submitSwipe(input: SubmitSwipeInput) {
  const fn = httpsCallable<SubmitSwipeInput, SubmitSwipeOutput>(
    getFunctions(),
    "submitSwipe"
  );

  const result = await fn(input);
  return result.data;
}
```

### 10.5 Data Conversion

Use explicit converters or parse functions.

```ts
export function parsePublicProfile(snapshot: DocumentSnapshot): PublicProfile {
  const data = snapshot.data();
  return PublicProfileSchema.parse(data);
}
```

Never trust Firestore data blindly in client code.

---

## 11. Error Handling

### 11.1 Client Error Mapping

Map backend errors to user-facing Hebrew messages.

```ts
export const apiErrorLabels: Record<ApiErrorCode, string> = {
  unauthenticated: "צריך להתחבר כדי להמשיך.",
  permission_denied: "אין לך הרשאה לבצע את הפעולה.",
  invalid_argument: "חלק מהפרטים אינם תקינים.",
  not_found: "המידע המבוקש לא נמצא.",
  already_exists: "הפעולה כבר בוצעה.",
  failed_precondition: "אי אפשר לבצע את הפעולה במצב הנוכחי.",
  resource_exhausted: "הגעת למגבלת השימוש היומית.",
  insufficient_coins: "אין לך מספיק מטבעות.",
  pro_required: "הפעולה זמינה למשתמשי Pro בלבד.",
  blocked: "אי אפשר לבצע פעולה מול משתמש חסום.",
  self_action_forbidden: "אי אפשר לבצע את הפעולה על עצמך.",
  internal: "אירעה שגיאה. נסה שוב מאוחר יותר."
};
```

### 11.2 No Raw Error Leaks

Do not show:

- stack traces
- provider payloads
- raw Gemini errors
- payment secrets
- Firestore internal paths where not needed
- system prompt text

### 11.3 Error Boundary

Use React Error Boundaries at app/route level.

```tsx
<Route errorElement={<RouteErrorBoundary />} />
```

### 11.4 Retry

Retry only safe reads or idempotent actions.

Do not blindly retry:

- purchases
- checkout creation
- reports
- media messages without `clientMessageId`

---

## 12. Git & PR Conventions

### 12.1 Branch Naming

```text
feature/{short-description}
fix/{short-description}
docs/{short-description}
refactor/{short-description}
test/{short-description}
chore/{short-description}
```

Examples:

```text
feature/create-checkout-session
fix/chat-media-pro-check
docs/security-rules
```

### 12.2 Commit Messages

Use conventional commits:

```text
feat(subscription): add createCheckoutSession callable
fix(chat): block direct image messages
docs(engineering): add environment conventions
test(rules): deny user coin tampering
```

### 12.3 Branch to Environment

| Branch / Trigger | Environment |
|---|---|
| PR | tests/emulators only |
| `develop` | `swish-game-dev` |
| `main` | `swish-game-staging` |
| release tag/manual approval | `swish-game-prod` |

### 12.4 PR Checklist

Every PR must answer:

- [ ] Does this touch server-owned fields?
- [ ] Does this add/change Firestore collections or fields?
- [ ] Does this require `DATA_MODEL.md` update?
- [ ] Does this require `API_CONTRACT.md` update?
- [ ] Does this require Security Rules update?
- [ ] Does this add secrets or env vars?
- [ ] Does this affect billing/AI?
- [ ] Are emulator tests added/updated?
- [ ] Are TypeScript, lint, tests passing?
- [ ] Is production deploy gated?

### 12.5 PR Size

Prefer small PRs.  
Large prototype-to-production migrations should be split by feature and phase.

---

## 13. Testing Conventions

### 13.1 Test Types

| Test Type | Tooling | Purpose |
|---|---|---|
| Unit tests | Vitest | pure functions, validators, mappers |
| Component tests | Testing Library | UI behavior |
| Integration tests | Firebase Emulator Suite | repositories/functions/rules |
| Security Rules tests | Firebase rules unit testing | allow/deny matrix |
| E2E tests | Playwright recommended | critical user flows |

### 13.2 File Placement

```text
src/features/profile/__tests__/profileRepository.test.ts
src/features/chat/__tests__/ChatComposer.test.tsx
functions/src/callable/__tests__/submitSwipe.test.ts
tests/rules/firestore.rules.test.ts
tests/rules/storage.rules.test.ts
```

### 13.3 Naming

```text
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
```

### 13.4 Security Rules Tests

Must include deny tests for:

- user updating own `coins`
- user updating own `isPro`
- user creating `matches`
- user creating `swipes`
- user creating image message directly
- user reading another private account
- non-participant reading chat
- regular user writing `shopItems`
- regular user writing `subscriptions`

### 13.5 Function Tests

Must test:

- auth required
- Zod validation
- permission denied
- idempotency
- Firestore side effects
- error mapping
- suspended user handling

### 13.6 E2E Critical Flows

Minimum E2E flows:

- sign up / login
- onboarding
- profile edit
- discovery swipe
- match creation
- text chat
- shop item purchase
- Pro checkout pending flow
- AI profile review
- report/block user

---

## 14. Code Quality

### 14.1 Required Commands

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:rules": "vitest run tests/rules",
    "emulators": "firebase emulators:start --project swish-game-dev"
  }
}
```

### 14.2 ESLint

Must enforce:

- no unused variables
- no explicit `any`
- React hooks rules
- import order
- no restricted imports
- no console logs in production code unless approved logger

### 14.3 Prettier

Use Prettier for formatting.  
Do not debate formatting in PRs.

### 14.4 Pre-Commit

Recommended pre-commit checks:

- lint staged files
- format staged files
- typecheck when practical
- secret scan

### 14.5 CI Gates

CI must run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:rules
```

---

## 15. Security Conventions

### 15.1 No Secrets in Client

Forbidden in client:

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
service account JSON
process.env.API_KEY
```

Vite client env must use only `VITE_*` public variables.

### 15.2 Server-Owned Fields

Client must never write:

```text
coins
subscriptionTier
subscriptionStatus
subscriptionExpiresAt
isPro
verifiedBadge
isSuspended
matches
swipes
transactions
ownedItems
aiRequests
subscriptions
```

### 15.3 Forbidden Firestore Writes from Client

Client must not write directly to:

```text
users/{uid}/swipes
users/{uid}/transactions
users/{uid}/ownedItems
matches
chats
subscriptions
billingEvents
aiRequests
moderationActions
publicProfiles
discoveryProfiles
```

### 15.4 Media Messages

Client-created messages may only be:

```ts
type: "text"
```

Image/media messages are created only by backend via:

```text
sendChatMediaMessage
```

### 15.5 AI

Gemini is server-side only.

Forbidden frontend patterns:

```ts
import { GoogleGenAI } from "@google/genai";
process.env.API_KEY;
```

Use callable functions:

```text
sendAIProfileReview
sendAISquadAdvice
```

### 15.6 Payments

Checkout redirect does not grant Pro.  
Only `paymentWebhook` with valid signature updates subscription truth.

### 15.7 Logging

Never log:

- secrets
- full payment payload
- Gemini raw prompt
- service account credentials
- private account data
- full chat history unless explicitly approved for debugging with redaction

---

## 16. AI-Assisted Development Notes

### 16.1 Prompting AI Tools

When asking AI tools to generate code, provide:

- relevant doc path
- exact function names
- exact Firestore paths
- exact enums
- server-owned field rules
- whether code is frontend or backend

Example:

```text
Implement src/features/subscription/repositories/subscriptionRepository.ts.
Use API_CONTRACT.md for createCheckoutSession.
Do not write isPro from client.
Use Vite import.meta.env only for public Firebase config.
```

### 16.2 AI Code Review Checklist

For AI-generated code, verify:

- no `any`
- no secrets in client
- no direct Gemini calls from frontend
- no client writes to server-owned fields
- Zod validation present at boundaries
- function names match `API_CONTRACT.md`
- collections/fields match `DATA_MODEL.md`
- enum values are English
- Hebrew labels are label maps only
- tests included

### 16.3 AI Must Not Invent Contracts

AI-generated code must not invent:

- new Firestore fields
- new enum values
- new function names
- new subscription statuses
- new collections
- new secrets
- new environment names

If a change requires a new contract, update the relevant architecture document first.

### 16.4 Keep Docs and Code in Sync

When code changes any of these, update docs in the same PR:

| Code Change | Required Doc |
|---|---|
| Firestore schema | `DATA_MODEL.md` |
| Function contract | `API_CONTRACT.md` |
| Security Rules | `SECURITY.md` |
| AI behavior | `AI_INTEGRATION.md` |
| Billing behavior | `PAYMENTS.md` |
| Env/secrets | `ENVIRONMENTS.md` |
| Migration step | `MIGRATION_PLAN.md` |

---

## 17. Open Items

| Item | Status | Impact |
|---|---|---|
| Final lint configuration | Open | Need concrete ESLint rule set and restricted imports. |
| Path alias convention | Proposed `@/` | Requires `tsconfig` and Vite config alignment. |
| Test runner finalization | Proposed Vitest + Testing Library + Playwright | Need package setup. |
| CI provider | Open | GitHub Actions recommended if repository is on GitHub. |
| Exact design tokens | Open | Needs design system finalization. |
| RTL utility strategy | Open | Decide whether to add Tailwind RTL plugin. |
| Emulator seed dataset | Open | Needs deterministic fixtures. |
| Mock-to-Firebase phase boundaries | Covered by `MIGRATION_PLAN.md` | Keep migration tasks aligned. |
| Production logging provider | Open | Cloud Logging baseline; Sentry optional. |
| Release versioning | Open | Decide tags/releases before production launch. |
