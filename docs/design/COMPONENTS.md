# Swish & Game — Component Inventory & Library

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Component Inventory & Library |
| Repository Path | `docs/design/COMPONENTS.md` |
| Product | Swish & Game |
| Source of Truth | `docs/design/UX_FLOWS.md`, `docs/engineering/CONVENTIONS.md`, `docs/engineering/MIGRATION_PLAN.md`, `docs/design/LOCALIZATION.md`, `docs/architecture/ARCHITECTURE.md`, `docs/design/DESIGN_SYSTEM.md` |
| Frontend Stack | React + Vite + TypeScript strict + Tailwind CSS + Framer Motion |
| Architecture | feature-based, mobile-first, Hebrew-first RTL |
| Primary Rule | shared components are UI-only; business logic lives in feature components, hooks, repositories, or backend functions |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Component Architecture](#2-component-architecture)
- [3. Shared Component Library](#3-shared-component-library)
- [4. Per-Feature Component Inventory](#4-per-feature-component-inventory)
- [5. Prototype → Target Mapping](#5-prototype--target-mapping)
- [6. Dead Code to Remove](#6-dead-code-to-remove)
- [7. Component Conventions](#7-component-conventions)
- [8. State & Data in Components](#8-state--data-in-components)
- [9. Modal / Overlay Components](#9-modal--overlay-components)
- [10. Open Items](#10-open-items)

---

## 2. Component Architecture

### 2.1 Layer Model

Swish & Game uses a layered component model:

```text
shared/ui primitives
  ↓
shared composite components
  ↓
feature components
  ↓
feature pages / route containers
```

| Layer | Location | Purpose | Business Logic? |
|---|---|---|---:|
| UI primitives | `src/shared/ui` | Generic building blocks such as `Button`, `Card`, `Badge` | No |
| Shared composites | `src/shared/components` | Reusable app-level UI such as `BottomNav`, `ApiErrorAlert`, `ProBadge` | Minimal display logic only |
| Feature components | `src/features/{feature}/components` | Domain-specific UI for screens and flows | Yes, through props/hooks only |
| Feature hooks | `src/features/{feature}/hooks` | Data loading, subscriptions, callable wrappers | Yes |
| Feature pages | `src/features/{feature}/pages` | Route-level containers | Yes, orchestration only |
| Repositories | `src/features/{feature}/repositories` | Firestore/callable access | Yes |
| Services | `src/features/{feature}/services` | Feature business orchestration | Yes |

### 2.2 Container vs Presentational Components

Use container components for data orchestration and presentational components for rendering.

```text
DiscoveryPage            // route container
  useDiscoveryDeck       // data hook
  SwipeDeck              // feature component
    SwipeCard            // presentational card
    SwipeHud             // presentational HUD
    SwipeActions         // presentational actions
```

Rules:

- Pages may load route params and call hooks.
- Presentational components receive typed props and callbacks.
- Shared components must not import feature repositories or Firebase directly.
- Feature components may use feature hooks, but deep UI components should usually receive props.

### 2.3 Import Boundaries

| From | May Import | Must Not Import |
|---|---|---|
| `src/shared/**` | shared utilities, shared types, design tokens | `src/features/**` |
| `src/features/{feature}/components/**` | own feature hooks/types, shared UI | sibling feature internals |
| `src/features/{feature}/pages/**` | own feature components/hooks, shared UI | raw Firebase calls |
| `src/app/**` | route-level feature exports, shared layout | private feature files |
| `functions/**` | backend code only | frontend React components |

### 2.4 Public Feature Exports

Each feature exposes only its public API from `index.ts`.

```ts
export { DiscoveryPage } from "./pages/DiscoveryPage";
export { useDiscoveryDeck } from "./hooks/useDiscoveryDeck";
```

Avoid importing private internals across features:

```ts
// Bad
import { SwipeCard } from "@/features/discovery/components/SwipeCard";

// Better
import { DiscoveryPage } from "@/features/discovery";
```

### 2.5 Shared Is Not a Dumping Ground

Move a component to `shared` only when:

- it is reused by at least two features, or
- it is a design-system primitive, or
- it has no feature-specific domain behavior.

Do not put payment, AI, chat, shop, swipe, or profile business logic in `shared`.

---

## 3. Shared Component Library

### 3.1 Shared Component Locations

Recommended structure:

```text
src/shared/
  ui/
    Button.tsx
    Card.tsx
    Modal.tsx
    Badge.tsx
    Avatar.tsx
    Skeleton.tsx
    FormField.tsx
  components/
    BottomNav.tsx
    LoadingState.tsx
    EmptyState.tsx
    ErrorState.tsx
    ApiErrorAlert.tsx
    ConfirmDialog.tsx
    Toast.tsx
    ImagePreview.tsx
    ProBadge.tsx
    CoinBalance.tsx
  labels/
  errors/
```

### 3.2 Primitive Components

| Component | Purpose | Key Props | States / Notes |
|---|---|---|---|
| `Button` | Primary clickable action | `variant`, `size`, `isLoading`, `disabled`, `iconStart`, `iconEnd`, `type`, `onClick` | Use `start/end`, not `left/right`; loading disables duplicate submit. |
| `Card` | Surface container | `variant`, `padding`, `interactive`, `children` | No business logic; supports RTL layout. |
| `Modal` | Generic dialog shell | `open`, `onOpenChange`, `title`, `description`, `children`, `footer` | Handles focus trap, escape, backdrop, `aria-*`. |
| `Badge` | Small label/status display | `variant`, `size`, `children` | Used for status, rarity, Pro, tags. |
| `Avatar` | Profile image / fallback | `src`, `alt`, `size`, `fallback`, `borderItemId?` | No fetching; displays provided URLs only. |
| `Skeleton` | Loading placeholder | `shape`, `className`, `ariaLabel` | Keep layout stable. |
| `FormField` | Input wrapper | `label`, `error`, `hint`, `children`, `required` | Connects `aria-describedby`. |

### 3.3 Shared Composite Components

| Component | Purpose | Key Props | States / Notes |
|---|---|---|---|
| `BottomNav` | Main mobile navigation | `items`, `activeRoute`, `onNavigate` | Uses RTL-safe layout; labels from nav copy map. |
| `LoadingState` | Standard loading UI | `label`, `variant` | Used by every async screen. |
| `EmptyState` | Empty data UI | `title`, `description`, `action?`, `icon?` | Must include next useful action when possible. |
| `ErrorState` | Screen-level error | `title`, `description`, `onRetry?` | Safe Hebrew copy, no raw stack traces. |
| `ApiErrorAlert` | Inline API error display | `error`, `onRetry?` | Maps `ApiErrorCode` to Hebrew message. |
| `ConfirmDialog` | Confirm destructive/sensitive actions | `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm` | Used for purchase, block, delete-like flows. |
| `Toast` | Short feedback message | `type`, `title`, `description`, `durationMs` | No secrets/raw provider errors. |
| `ImagePreview` | Preview uploaded or remote image | `src`, `alt`, `onRemove?`, `isLoading?` | Used by profile/chat/shop; no upload logic. |
| `ProBadge` | Displays Pro member badge | `size`, `label?`, `showLabel?` | Display-only; `verifiedBadge` remains backend-derived. |
| `CoinBalance` | Displays read-only coin balance | `coins`, `isLoading?` | Never mutates coins. |

### 3.4 `Button` Contract

```ts
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "pro";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

Rules:

- `iconStart` and `iconEnd` are semantic and RTL-safe.
- Do not expose `leftIcon` / `rightIcon`.
- `isLoading` must prevent duplicate submit.
- Use `type="button"` by default unless inside a form submit.

### 3.5 `BottomNav` Contract

```ts
export type BottomNavItem = {
  id: "discover" | "matches" | "chat" | "shop" | "ai" | "profile";
  label: string;
  route: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badgeCount?: number;
  requiresPro?: boolean;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
};
```

Canonical nav items:

```text
Discover
Matches
Chat
Shop
AI Hub
Profile
```

Hebrew labels must come from app navigation labels, not hardcoded across components.

### 3.6 State Components

All async screens should compose the same state components:

```tsx
if (isLoading) return <LoadingState label="טוען..." />;
if (error) return <ErrorState title="משהו השתבש" onRetry={retry} />;
if (isEmpty) return <EmptyState title="אין עדיין נתונים" />;
return <SuccessView />;
```

---

## 4. Per-Feature Component Inventory

### 4.1 `auth`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `LoginPage` | Route container for `/login` | Login |
| Component | `LoginHero` | Product intro / value proposition | Login |
| Component | `GoogleSignInButton` | Firebase Google auth CTA | Login |
| Component | `EmailPasswordForm` | Email/password login/signup | Login |
| Hook | `useAuthState` | Observe Firebase Auth state | App guards |
| Hook | `useSignInWithGoogle` | Trigger Google sign-in | Login |
| Hook | `useEmailPasswordAuth` | Email/password auth flow | Login |
| Repository | `authRepository` | Firebase Auth wrapper | Auth |

### 4.2 `onboarding`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `OnboardingPage` | Multi-step onboarding container | Onboarding |
| Component | `OnboardingProgress` | Step progress indicator | Onboarding |
| Component | `ProfileBasicsStep` | Display name, bio, image | Onboarding |
| Component | `GamePreferencesStep` | Games, rank, platforms, `lookingFor` | Onboarding |
| Component | `SkillLevelSelector` | Select `SkillLevel` with labels | Onboarding/Profile |
| Component | `PlatformSelector` | Select `Platform[]` | Onboarding/Profile |
| Component | `LookingForSelector` | Select `LookingFor` | Onboarding/Profile |
| Hook | `useOnboardingForm` | RHF + Zod form state | Onboarding |
| Hook | `useCompleteOnboarding` | Save and complete flow | Onboarding |
| Repository | `onboardingRepository` | User/game writes | Onboarding |

### 4.3 `profile`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `ProfilePage` | Own profile route container | Profile |
| Component | `ProfileHeader` | Avatar, banner, display name, Pro badge | Profile |
| Component | `ProfileStats` | Games, skill, platforms summary | Profile |
| Component | `ProfileGameList` | User games and ranks | Profile |
| Component | `ProfileEditForm` | Edit allowed profile fields | Profile |
| Component | `PublicProfileCard` | Reusable profile display card | Discovery/Matches/Profile |
| Component | `ProfileCosmeticsPreview` | Equipped cosmetics display | Profile/Shop |
| Hook | `useOwnProfile` | Watch own user/profile state | Profile |
| Hook | `usePublicProfile` | Watch public profile | Discovery/Matches |
| Hook | `useUpdateProfile` | Save client-writable profile fields | Profile |
| Hook | `useSyncPublicProfile` | Calls `syncPublicProfile` fallback | Profile/Admin repair |
| Repository | `profileRepository` | Profile Firestore access | Profile |

### 4.4 `discovery`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `DiscoveryPage` | `/discover` route container | Discovery |
| Component | `SwipeDeck` | Deck orchestration UI | Discovery |
| Component | `SwipeCard` | Profile card in deck | Discovery |
| Component | `SwipeHud` | left View Profile, center skill+trophy, right rank | Discovery |
| Component | `SwipeActions` | Like/skip/profile actions | Discovery |
| Component | `EmptyDeck` | Empty discovery state | Discovery |
| Component | `MatchCelebration` | Match overlay after reciprocal like | Discovery |
| Component | `SwipeLimitModal` | Basic limit upgrade prompt | Discovery |
| Hook | `useDiscoveryDeck` | Load deck/read model | Discovery |
| Hook | `useSubmitSwipe` | Calls `submitSwipe` | Discovery/Matches |
| Hook | `useSwipeLimitState` | Interprets `resource_exhausted` | Discovery |
| Repository | `discoveryRepository` | `submitSwipe`, deck reads | Discovery |

### 4.5 `matches`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `MatchesPage` | `/matches` route container | Matches |
| Component | `MatchesTabs` | Switch Matches / Likes You | Matches |
| Component | `MatchList` | List of matched users/chats | Matches |
| Component | `MatchListItem` | Single match row/card | Matches |
| Component | `LikesYouGrid` | Users who liked current user | Likes You |
| Component | `LikesYouCard` | Single Likes You user card | Likes You |
| Component | `NoMatchesEmptyState` | Empty matches CTA | Matches |
| Hook | `useMatches` | Watch matches/chats | Matches |
| Hook | `useLikesYou` | Load Likes You read model | Likes You |
| Hook | `useLikeBack` | Calls `submitSwipe` for reciprocal action | Likes You |
| Repository | `matchesRepository` | Matches/read model access | Matches |

### 4.6 `chat`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `ChatPage` | `/chat/:chatId` route container | Chat |
| Component | `ChatHeader` | Participant info, safety menu | Chat |
| Component | `MessageList` | Messages viewport | Chat |
| Component | `MessageBubble` | Text/image/system message display | Chat |
| Component | `ChatComposer` | Text input and send button | Chat |
| Component | `MediaUploadButton` | Pro-gated media entry | Chat |
| Component | `ChatImagePreview` | Preview selected image | Chat |
| Component | `ChatEmptyState` | First message state | Chat |
| Hook | `useChat` | Watch chat doc/access state | Chat |
| Hook | `useChatMessages` | Watch messages | Chat |
| Hook | `useSendTextMessage` | Create `type: "text"` message if allowed | Chat |
| Hook | `useSendChatMediaMessage` | Calls `sendChatMediaMessage` | Chat |
| Repository | `chatRepository` | Chat/message data access | Chat |

### 4.7 `shop`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `ShopPage` | `/shop` route container | Shop |
| Component | `ShopCategoryTabs` | Filter by `ShopItemCategory` | Shop |
| Component | `ShopItemGrid` | Items grid | Shop |
| Component | `ShopItemCard` | Single item card | Shop |
| Component | `ShopItemPreview` | Cosmetic preview | Shop |
| Component | `PurchaseConfirmModal` | Confirm coin spend | Shop |
| Component | `EquipItemButton` | Equip owned item | Shop |
| Component | `RarityBadge` | `ShopItemRarity` display | Shop |
| Hook | `useShopItems` | Load active shop items | Shop |
| Hook | `usePurchaseShopItem` | Calls `purchaseShopItem` | Shop |
| Hook | `useEquipItem` | Calls `equipItem` | Shop/Profile |
| Repository | `shopRepository` | Shop reads/callables | Shop |

### 4.8 `subscription`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `SubscriptionPage` | `/subscription` route container | Subscription |
| Component | `ProPlanCard` | Price and benefits | Subscription |
| Component | `ProBenefitsList` | Unlimited swipes, media, cosmetics, badge | Subscription/Upgrade |
| Component | `CheckoutButton` | Calls `createCheckoutSession` | Subscription |
| Component | `SubscriptionStatusCard` | Current status display | Subscription |
| Component | `ProActivationPending` | Wait for webhook entitlement sync | Subscription |
| Component | `UpgradeModal` | Reusable Pro upgrade prompt | Multiple |
| Hook | `useSubscription` | Watch `subscriptions/{uid}` / user Pro state | Subscription/App |
| Hook | `useCreateCheckoutSession` | Calls `createCheckoutSession` | Subscription |
| Hook | `useProGate` | UI helper for Pro gates | Shared/Features |
| Repository | `subscriptionRepository` | Subscription reads/callables | Subscription |

### 4.9 `ai`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `AIHubPage` | `/ai` route container | AI Hub |
| Component | `AIToolTabs` | Profile Review / Squad Advice | AI Hub |
| Component | `AIProfileReviewForm` | Input for `sendAIProfileReview` | AI Hub |
| Component | `AISquadAdviceForm` | Input for `sendAISquadAdvice` | AI Hub |
| Component | `AIResultCard` | Structured AI response | AI Hub |
| Component | `AIRefusalState` | Safe refusal display | AI Hub |
| Component | `AIRateLimitState` | Rate limit UX | AI Hub |
| Hook | `useAIProfileReview` | Calls `sendAIProfileReview` | AI Hub |
| Hook | `useAISquadAdvice` | Calls `sendAISquadAdvice` | AI Hub |
| Repository | `aiRepository` | AI callable wrappers only | AI Hub |

### 4.10 `safety`

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Component | `SafetyMenu` | Entry for report/block actions | Profile/Chat |
| Component | `ReportModal` | Select reason + description | Profile/Chat |
| Component | `BlockConfirmModal` | Confirm block action | Profile/Chat |
| Component | `ReportSuccessState` | Report submitted feedback | Profile/Chat |
| Hook | `useCreateReport` | Calls `createReport` | Safety |
| Hook | `useBlockUser` | Calls `blockUser` | Safety |
| Repository | `safetyRepository` | Report/block callables | Safety |

### 4.11 `settings`

Settings is route-level but may share account/safety/subscription components.

| Type | Name | Purpose | Screen |
|---|---|---|---|
| Page | `SettingsPage` | `/settings` route container | Settings |
| Component | `SettingsList` | Main settings menu | Settings |
| Component | `AccountSettingsSection` | Account actions | Settings |
| Component | `SafetySettingsSection` | Safety links/blocked users entry | Settings |
| Component | `LogoutButton` | Firebase Auth sign out | Settings |
| Hook | `useLogout` | Sign out action | Settings |

---

## 5. Prototype → Target Mapping

### 5.1 Existing Prototype Components

| Prototype Component | Target Location / Component | Action | Notes |
|---|---|---|---|
| `Header` | `src/shared/components/BottomNav.tsx` + `src/app/layout/AppShell.tsx` | Refactor / split | Header should not own app state. Bottom nav is canonical primary nav. |
| `ProfileView` | `src/features/profile/pages/ProfilePage.tsx` + profile components | Split | Extract `ProfileHeader`, `ProfileGameList`, `ProfileEditForm`, `ProfileCosmeticsPreview`. |
| `ChatView` | `src/features/chat/pages/ChatPage.tsx` + chat components | Split | Extract `ChatHeader`, `MessageList`, `MessageBubble`, `ChatComposer`. |
| `ShopView` | `src/features/shop/pages/ShopPage.tsx` + shop components | Split | Replace mock purchase/equip with `purchaseShopItem` and `equipItem` hooks. |
| `SettingsView` | `src/features/settings/pages/SettingsPage.tsx` | Refactor | Keep only settings UX; move safety/subscription/account logic to feature hooks. |
| `SubscriptionsView` | `src/features/subscription/pages/SubscriptionPage.tsx` | Rename / refactor | Use canonical route `/subscription`; add `createCheckoutSession` flow. |
| `GamesView` | `src/features/onboarding/components/GamePreferencesStep.tsx` and `src/features/profile/components/ProfileGameList.tsx` | Split | Game selection/edit belongs onboarding/profile; display belongs profile. |
| inline `SwipeView` in `App.tsx` | `src/features/discovery/pages/DiscoveryPage.tsx` + `SwipeDeck` | Extract / replace | Must call `submitSwipe`; no inline route screen. |
| inline `LikesGrid` in `App.tsx` | `src/features/matches/components/LikesYouGrid.tsx` | Extract / refactor | Likes You is open to all in MVP. |

### 5.2 Prototype State Migration

| Prototype Pattern | Target Pattern |
|---|---|
| mock arrays in `App.tsx` | repositories + Firestore emulator data |
| inline route switching | React Router routes |
| direct state mutation | Cloud Functions / Firestore allowed writes |
| hardcoded labels | `labels.ts` maps |
| direct Gemini service | callable functions only |
| local Pro state | `subscriptions/{uid}` → `users/{uid}` → `publicProfiles/{uid}` |

---

## 6. Dead Code to Remove

Per `MIGRATION_PLAN.md` Phase 0, remove AI Studio template leftovers that are not part of Swish & Game.

### 6.1 Orphan Components

Delete:

```text
FeatureTable
GeminiFeatureIdeation
Roadmap
Section
PersonaCard
```

### 6.2 Orphan Types

Delete:

```text
Persona
Feature
RoadmapItem
GeneratedIdea
```

### 6.3 Removal Rules

- Remove imports from `App.tsx`.
- Remove unused files.
- Remove unused mock data.
- Remove unused CSS/classes tied to these components.
- Ensure `npm run typecheck` passes.
- Ensure no replacement component imports these old types.

---

## 7. Component Conventions

### 7.1 Exports

Use named exports.

```tsx
export function SwipeCard(props: SwipeCardProps) {
  return <article />;
}
```

Avoid default exports for project components.

### 7.2 Props Naming

Use clear, semantic names.

| Use | Avoid |
|---|---|
| `iconStart`, `iconEnd` | `leftIcon`, `rightIcon` |
| `onOpenChange` | ambiguous modal toggles |
| `isLoading` | `loading` if mixed with data |
| `isDisabled` or `disabled` | `inactive` |
| `variant` | hardcoded CSS mode names |
| `size` | arbitrary class names |

### 7.3 RTL-Safe Props

Use `start` / `end`, not `left` / `right`.

```ts
type Placement = "start" | "end" | "top" | "bottom";
```

### 7.4 Label Maps

All enum labels must come from `LOCALIZATION.md` label maps.

```tsx
<span>{skillLevelLabels[skillLevel]}</span>
<span>{platformLabels[platform]}</span>
<span>{shopItemRarityLabels[rarity]}</span>
```

Never hardcode repeated enum labels in components.

### 7.5 Async State Requirement

Every screen/page using async data must render:

- loading
- empty
- error
- success

Feature components should accept enough props to support those states without duplicating business logic.

### 7.6 No Business Logic in `shared`

Shared components may know how to render:

- style variants.
- accessibility states.
- layout.
- generic loading/error display.

Shared components must not know:

- how to buy an item.
- how to grant Pro.
- how to call Gemini.
- how to mutate coins.
- how to submit swipe.
- how to send media.

### 7.7 Accessibility

Components must support:

- keyboard navigation.
- `aria-label` for icon-only buttons.
- `aria-describedby` for form errors.
- semantic HTML.
- focus states.
- RTL direction.

### 7.8 Visual Styling

- Use Tailwind.
- No inline CSS except rare dynamic style variables.
- Use design tokens from `DESIGN_SYSTEM.md`.
- Do not use deprecated `dogame-*` classes or namespace.

---

## 8. State & Data in Components

### 8.1 Data Loading

Pages and feature hooks load data. Presentational components receive props.

```tsx
export function DiscoveryPage() {
  const deck = useDiscoveryDeck();

  if (deck.isLoading) return <LoadingState label="טוען שחקנים..." />;
  if (deck.error) return <ErrorState title="לא הצלחנו לטעון שחקנים" />;
  if (deck.cards.length === 0) return <EmptyDeck />;

  return <SwipeDeck cards={deck.cards} />;
}
```

### 8.2 Firestore Subscriptions

Raw Firestore subscriptions should live in hooks/repositories:

```text
useChatMessages
useMatches
useOwnProfile
useSubscription
```

Do not create raw `onSnapshot` calls inside page JSX unless it is a temporary migration step documented in `MIGRATION_PLAN.md`.

### 8.3 Repository Pattern

Component → hook → repository → Firebase/callable.

```text
PurchaseConfirmModal
  → usePurchaseShopItem
  → shopRepository.purchaseShopItem
  → callable purchaseShopItem
```

### 8.4 Server-Owned Fields

Components may display these fields but never mutate them directly:

```text
coins
isPro
subscriptionTier
subscriptionStatus
subscriptionExpiresAt
verifiedBadge
matches
swipes
transactions
ownedItems
aiRequests
subscriptions
```

### 8.5 Coins

`CoinBalance` is read-only.

Allowed:

```tsx
<CoinBalance coins={user.coins} />
```

Forbidden:

```tsx
setCoins(user.coins - item.priceCoins)
```

Coin changes happen only through backend functions.

### 8.6 Pro State

`isPro` and `verifiedBadge` are read-only UI inputs.

Allowed:

```tsx
{user.isPro ? <ProBadge /> : <UpgradeButton />}
```

Forbidden:

```tsx
updateDoc(userRef, { isPro: true })
```

### 8.7 AI

AI components call feature hooks only:

```text
useAIProfileReview
useAISquadAdvice
```

Forbidden in frontend components:

```text
@google/genai
process.env.API_KEY
GEMINI_API_KEY
direct Gemini HTTP calls
```

---

## 9. Modal / Overlay Components

### 9.1 Canonical Modal Inventory

| Modal / Overlay | Location | Trigger | Backend Action |
|---|---|---|---|
| `UpgradeModal` | `src/features/subscription/components/UpgradeModal.tsx` | Pro-gated action | `createCheckoutSession` |
| `MatchCelebration` | `src/features/discovery/components/MatchCelebration.tsx` | `submitSwipe.result === "matched"` | none beyond `submitSwipe` result |
| `PurchaseConfirmModal` | `src/features/shop/components/PurchaseConfirmModal.tsx` | User confirms shop item | `purchaseShopItem` |
| `SwipeLimitModal` | `src/features/discovery/components/SwipeLimitModal.tsx` | `resource_exhausted` from `submitSwipe` | optional `createCheckoutSession` CTA |
| `ReportModal` | `src/features/safety/components/ReportModal.tsx` | Report action | `createReport` |
| `BlockConfirmModal` | `src/features/safety/components/BlockConfirmModal.tsx` | Block action | `blockUser` |
| `ImagePreview` | `src/shared/components/ImagePreview.tsx` or feature wrapper | Image preview | none by itself |
| `AIRefusalState` | `src/features/ai/components/AIRefusalState.tsx` | AI refusal response | none |

### 9.2 Modal Conventions

All modals must:

- use shared `Modal` or `ConfirmDialog`.
- trap focus.
- close on `Escape` unless destructive action is in progress.
- have Hebrew `title` and accessible labels.
- disable confirm action while loading.
- avoid exposing raw backend/provider errors.
- support mobile viewport.

### 9.3 Upgrade Modal

Props:

```ts
export type UpgradeModalProps = {
  open: boolean;
  reason: "swipe_limit" | "media" | "cosmetic" | "general";
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => Promise<void>;
};
```

Rules:

- Shows Pro benefits.
- Shows price: `29.90 ILS/month`.
- Does not grant Pro.
- Calls `createCheckoutSession` through `useCreateCheckoutSession`.

### 9.4 Match Celebration

Props:

```ts
export type MatchCelebrationProps = {
  open: boolean;
  matchDisplayName: string;
  matchImageUrl?: string;
  onOpenChat: () => void;
  onContinueDiscovery: () => void;
};
```

Rules:

- Triggered only after backend returns `matched`.
- No fake local match creation.
- Can animate with Framer Motion.

### 9.5 Purchase Confirm Modal

Props:

```ts
export type PurchaseConfirmModalProps = {
  open: boolean;
  item: ShopItemViewModel;
  coinBalance: number;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};
```

Rules:

- Confirms coin spend.
- Shows `insufficient_coins` error if backend rejects.
- Does not modify coins locally.

### 9.6 Report / Block Modals

Report reason labels come from:

```ts
reportReasonLabels
```

Block modal must make the consequence clear:

- chat may be closed.
- user may disappear from discovery/matches.
- action is enforced by backend.

---

## 10. Open Items

| Item | Status | Impact |
|---|---|---|
| Final `DESIGN_SYSTEM.md` tokens | Open | May change variants, spacing, colors, typography. |
| Tailwind RTL plugin decision | Open | May affect component implementation for `start/end`. |
| Swipe gesture semantics in RTL | Open | Impacts `SwipeDeck`, `SwipeActions`, animations. |
| Chat list route | Open | May add `ChatListPage` or move chat list under `/matches`. |
| Profile edit route/modal | Open | Impacts `ProfileEditForm` placement. |
| Likes You V1 gating | Open; MVP open to all | Could change `LikesYouGrid` gating later. |
| Pro cosmetics after expiration | Open via ADR-032 | Impacts `ProfileCosmeticsPreview`, `EquipItemButton`. |
| AI limits by tier | Open via ADR-027 | Impacts `AIHubPage`, `AIRateLimitState`, `UpgradeModal` reason. |
| Offline component states | Open | May add `OfflineBanner` / retry queue UX. |
| Toast system implementation | Open | Decide provider/store for `Toast`. |
| Storybook adoption | Open | Recommended for shared component library. |
| Final prototype component file names | Migration dependent | Update mapping if current prototype filenames change. |
