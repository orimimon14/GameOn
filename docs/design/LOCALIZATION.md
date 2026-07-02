# Swish & Game — Localization & RTL

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Localization & RTL Contract |
| Repository Path | `docs/design/LOCALIZATION.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/DATA_MODEL.md`, `docs/product/DECISIONS.md`, `docs/engineering/CONVENTIONS.md`, `docs/design/DESIGN_SYSTEM.md` |
| Primary Locale | `he-IL` (default); `en` (LTR) supported |
| Primary Language | Hebrew (default), English |
| Direction | Bidirectional — RTL (`he`) + LTR (`en`) |
| Canonical Rule | Data and enum values are English; UI strings via i18n message catalogs + typed label maps, per locale. |
| Relevant ADR | ADR-035 — Bidirectional UI & i18n (Hebrew + English, RTL+LTR, i18n-ready); extends ADR-026 (Israel/Hebrew default). |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Localization Strategy](#2-localization-strategy)
- [3. Core Rule: English Data, Hebrew UI](#3-core-rule-english-data-hebrew-ui)
- [4. Canonical Label Maps](#4-canonical-label-maps)
- [5. RTL Implementation](#5-rtl-implementation)
- [6. Mixed Hebrew/English Content](#6-mixed-hebrewenglish-content)
- [7. Formatting](#7-formatting)
- [8. Hebrew Language Considerations](#8-hebrew-language-considerations)
- [9. String Management](#9-string-management)
- [10. Typography & Fonts](#10-typography--fonts)
- [11. Accessibility in RTL](#11-accessibility-in-rtl)
- [12. QA Checklist for RTL/Hebrew](#12-qa-checklist-for-rtlhebrew)
- [13. Open Items](#13-open-items)

---

## 2. Localization Strategy

### 2.1 MVP Strategy

Swish & Game is Hebrew-first (RTL default) for the initial Israel launch, with English (LTR) as a supported second language via i18n (ADR-035).

MVP language rules:

- Default UI language: Hebrew (`he-IL`, RTL). Second language: English (`en`, LTR).
- Currency: `ILS`.
- Stored enum/data values: English only.
- User-facing strings: via i18n message catalogs (`he`, `en`) + canonical label maps per locale.
- Additional languages beyond he/en require a future ADR (architecture is i18n-ready).

### 2.2 Bidirectional & i18n Strategy (ADR-035)

Hebrew (RTL, default) and English (LTR) are **both supported** via an i18n layer (`react-i18next` or FormatJS). `he` is the default locale; `en` is the first LTR locale. The architecture is i18n-ready so more languages can be added later without refactor. User preference persists via `users/{uid}.preferredLocale`; `dir`/`lang` switch dynamically per locale (`rtl` for `he`, `ltr` for `en`).

i18n rules:

- Do not introduce ad-hoc English UI strings in feature code.
- Do not create separate language files unless approved.
- Do not change stored enum values for localization.
- Do not store Hebrew labels in Firestore.

### 2.3 Source of Truth

This document is the canonical source for Hebrew label maps.

Code should implement these maps in:

```text
src/shared/labels
src/features/{feature}/labels.ts
```

The canonical enum values remain in `DATA_MODEL.md`.

---

## 3. Core Rule: English Data, Hebrew UI

### 3.1 Rule

All persisted values and enum values are English. Hebrew exists only at the UI layer.

```ts
// Good — stored value
skillLevel: "beginner"

// Good — UI label
skillLevelLabels.beginner === "מתחיל"
```

### 3.2 Correct vs Incorrect

| Case | Incorrect | Correct |
|---|---|---|
| Firestore enum | `skillLevel: "מתחיל"` | `skillLevel: "beginner"` |
| Subscription status | `subscriptionStatus: "פעיל"` | `subscriptionStatus: "active"` |
| Platform | `platform: "פלייסטיישן 5"` | `platform: "playstation_5"` |
| UI label | hardcoded `"מתחיל"` everywhere | `skillLevelLabels.beginner` |
| Filter value | Hebrew string in query | English enum in query |

### 3.3 Why This Matters

English canonical data gives us:

- stable Firestore queries.
- stable Cloud Functions contracts.
- safe Zod validation.
- easy future i18n.
- no coupling between product copy and stored data.
- consistent API contracts.

---

## 4. Canonical Label Maps

### 4.1 Shared Type Imports

Recommended shared import pattern:

```ts
import type {
  SkillLevel,
  SubscriptionStatus,
  SubscriptionTier,
  LookingFor,
  VoicePreference,
  MatchStatus,
  MessageType,
  ShopItemCategory,
  ShopItemRarity,
  ReportReason,
  ReportStatus,
  Platform,
  AIRequestType,
  AIRequestStatus,
  BillingProvider,
  CoinTransactionType
} from "@/shared/types";
```

If the project keeps types per feature, import from the canonical type module that mirrors `DATA_MODEL.md`.

### 4.2 `SkillLevel`

Canonical note: `pro` label is **"מקצוען"**.

```ts
export const skillLevelLabels: Record<SkillLevel, string> = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  pro: "מקצוען",
  elite: "עילית"
};
```

### 4.3 `SubscriptionTier`

```ts
export const subscriptionTierLabels: Record<SubscriptionTier, string> = {
  basic: "Basic",
  pro: "Pro"
};
```

### 4.4 `SubscriptionStatus`

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

### 4.5 `LookingFor`

```ts
export const lookingForLabels: Record<LookingFor, string> = {
  duo: "Duo",
  squad: "Squad",
  ranked_climb: "עלייה בדירוג",
  casual: "משחק רגוע",
  voice_chat: "עם צ׳אט קולי",
  no_voice_chat: "בלי צ׳אט קולי",
  custom: "מותאם אישית"
};
```

### 4.6 `VoicePreference`

```ts
export const voicePreferenceLabels: Record<VoicePreference, string> = {
  required: "חובה מיקרופון",
  preferred: "עדיף מיקרופון",
  no_voice: "בלי צ׳אט קולי",
  flexible: "גמיש"
};
```

### 4.7 `MatchStatus`

```ts
export const matchStatusLabels: Record<MatchStatus, string> = {
  pending: "ממתין",
  matched: "התאמה",
  blocked: "חסום",
  archived: "בארכיון"
};
```

### 4.8 `MessageType`

```ts
export const messageTypeLabels: Record<MessageType, string> = {
  text: "טקסט",
  image: "תמונה",
  system: "מערכת"
};
```

### 4.9 `ShopItemCategory`

```ts
export const shopItemCategoryLabels: Record<ShopItemCategory, string> = {
  avatar_border: "מסגרת לאווטאר",
  profile_banner: "באנר לפרופיל",
  global_background: "רקע גלובלי"
};
```

### 4.10 `ShopItemRarity`

```ts
export const shopItemRarityLabels: Record<ShopItemRarity, string> = {
  common: "רגיל",
  rare: "נדיר",
  epic: "אפי",
  legendary: "אגדי"
};
```

### 4.11 `ReportReason`

```ts
export const reportReasonLabels: Record<ReportReason, string> = {
  harassment: "הטרדה",
  hate_speech: "שיח שנאה",
  sexual_content: "תוכן מיני",
  scam_spam: "הונאה או ספאם",
  underage_concern: "חשש לקטין",
  cheating_exploits: "צ׳יטים או ניצול פרצות",
  fake_profile: "פרופיל מזויף",
  other: "אחר"
};
```

### 4.12 `ReportStatus`

```ts
export const reportStatusLabels: Record<ReportStatus, string> = {
  open: "פתוח",
  reviewing: "בבדיקה",
  resolved: "טופל",
  dismissed: "נדחה"
};
```

### 4.13 `Platform`

```ts
export const platformLabels: Record<Platform, string> = {
  pc: "PC",
  playstation_5: "PlayStation 5",
  playstation_4: "PlayStation 4",
  xbox_series_x: "Xbox Series X",
  xbox_one: "Xbox One",
  nintendo_switch: "Nintendo Switch",
  mobile: "Mobile",
  vr: "VR",
  arcade: "Arcade",
  other: "אחר"
};
```

### 4.14 `AIRequestType`

```ts
export const aiRequestTypeLabels: Record<AIRequestType, string> = {
  profile_optimization: "שיפור פרופיל",
  squad_advice: "טיפים ל-Squad",
  match_insight: "תובנת התאמה"
};
```

### 4.15 `AIRequestStatus`

```ts
export const aiRequestStatusLabels: Record<AIRequestStatus, string> = {
  pending: "ממתין",
  completed: "הושלם",
  failed: "נכשל",
  blocked: "נחסם"
};
```

### 4.16 `BillingProvider`

```ts
export const billingProviderLabels: Record<BillingProvider, string> = {
  stripe: "Stripe",
  cardcom: "Cardcom",
  meshulam: "Meshulam",
  other: "אחר"
};
```

### 4.17 `CoinTransactionType`

```ts
export const coinTransactionTypeLabels: Record<CoinTransactionType, string> = {
  item_purchase: "רכישת פריט",
  admin_grant: "הענקת מנהל",
  signup_bonus: "בונוס הרשמה",
  refund: "החזר",
  system_adjustment: "תיקון מערכת"
};
```

### 4.18 Combined Export

Recommended central export:

```ts
export const labels = {
  skillLevel: skillLevelLabels,
  subscriptionTier: subscriptionTierLabels,
  subscriptionStatus: subscriptionStatusLabels,
  lookingFor: lookingForLabels,
  voicePreference: voicePreferenceLabels,
  matchStatus: matchStatusLabels,
  messageType: messageTypeLabels,
  shopItemCategory: shopItemCategoryLabels,
  shopItemRarity: shopItemRarityLabels,
  reportReason: reportReasonLabels,
  reportStatus: reportStatusLabels,
  platform: platformLabels,
  aiRequestType: aiRequestTypeLabels,
  aiRequestStatus: aiRequestStatusLabels,
  billingProvider: billingProviderLabels,
  coinTransactionType: coinTransactionTypeLabels
} as const;
```

### 4.19 Type-Safe Usage

```tsx
export function SkillLevelBadge({ skillLevel }: { skillLevel: SkillLevel }) {
  return <span>{skillLevelLabels[skillLevel]}</span>;
}
```

This guarantees compile-time coverage for every enum value.

---

## 5. RTL Implementation

### 5.1 Root HTML

The app shell must set:

```html
<html lang="he" dir="rtl">
```

React app root may also enforce:

```tsx
export function AppShell() {
  return (
    <div lang="he" dir="rtl">
      <App />
    </div>
  );
}
```

### 5.2 Logical CSS Properties

Prefer logical CSS over physical left/right.

| Avoid | Prefer |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |

### 5.3 Tailwind Strategy

Tailwind utilities like `ml-*`, `mr-*`, `left-*`, `right-*` are physical and can create RTL bugs.

Preferred options:

1. Use RTL-aware Tailwind plugin if approved.
2. Use logical CSS utility classes.
3. Encapsulate direction-sensitive UI in shared components.
4. Use `start`/`end` naming in component props, not `left`/`right`.

Example semantic prop:

```tsx
type IconPlacement = "start" | "end";
```

Not:

```tsx
type IconPlacement = "left" | "right";
```

### 5.4 Layout Rules

- Main navigation flows right-to-left.
- Primary actions should be visually consistent in RTL.
- Swipe gestures must be product-defined and tested in RTL.
- Avoid assumptions that "next" means visual right.
- Avoid hardcoded `text-left`; use `text-start` when available.

### 5.5 Direction Overrides

Use local `dir` only when needed for mixed content:

```tsx
<span dir="ltr">Diamond III</span>
<span dir="ltr">Valorant</span>
```

For unknown user-generated text:

```tsx
<p dir="auto">{userBio}</p>
```

---

## 6. Mixed Hebrew/English Content

### 6.1 Common Cases

Mixed content appears in:

- game names: `Valorant`, `Fortnite`, `League of Legends`.
- ranks: `Diamond III`, `Gold 2`, `Immortal`.
- platform names: `PlayStation 5`, `Xbox Series X`.
- usernames/gamertags.
- URLs and email-like strings.
- short English game terms: `duo`, `squad`, `ranked`.

### 6.2 Bidi Isolation

Use `<bdi>` for dynamic user/game text embedded in Hebrew sentences.

```tsx
<p>
  מחפש שחקן ל־<bdi>{gameName}</bdi> בדירוג <bdi>{rank}</bdi>
</p>
```

Rendered example:

```text
מחפש שחקן ל־Valorant בדירוג Diamond III
```

### 6.3 `dir="auto"`

Use `dir="auto"` for free user-generated text:

```tsx
<p dir="auto">{bio}</p>
```

This helps when a user writes mostly English inside a Hebrew UI.

### 6.4 Explicit LTR Tokens

Use `dir="ltr"` for known English technical tokens:

```tsx
<span dir="ltr">PlayStation 5</span>
<span dir="ltr">Xbox Series X</span>
<span dir="ltr">Diamond III</span>
```

### 6.5 Avoid Manual Punctuation Hacks

Do not add extra punctuation or spaces to “fix” bidi ordering.  
Use `bdi`, `dir="auto"`, or isolated spans instead.

---

## 7. Formatting

### 7.1 Locale Constants

```ts
export const DEFAULT_LOCALE = "he-IL";
export const DEFAULT_CURRENCY = "ILS";
```

### 7.2 Dates

```ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}
```

### 7.3 Date and Time

```ts
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
```

### 7.4 Numbers

```ts
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("he-IL").format(value);
}
```

### 7.5 Currency

Canonical currency is `ILS`.

```ts
export function formatILS(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS"
  }).format(value);
}
```

Example:

```ts
formatILS(29.9);
```

Expected display may be browser-dependent but must be Hebrew/Israel locale appropriate.

### 7.6 Relative Time

Use `Intl.RelativeTimeFormat`.

```ts
const rtf = new Intl.RelativeTimeFormat("he-IL", {
  numeric: "auto"
});

export function formatRelativeDays(days: number): string {
  return rtf.format(days, "day");
}
```

Examples:

```ts
formatRelativeDays(-1); // "אתמול"
formatRelativeDays(0);  // "היום"
formatRelativeDays(1);  // "מחר"
```

### 7.7 Percentages

```ts
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "percent",
    maximumFractionDigits: 0
  }).format(value);
}
```

---

## 8. Hebrew Language Considerations

### 8.1 Gender

Prefer neutral phrasing where possible.

Avoid unnecessary gendered copy:

| Avoid | Prefer |
|---|---|
| `ברוך הבא` | `ברוכים הבאים` or `כיף לראות אותך` |
| `הוסף חבר` | `הוספת חברים` or `להוסיף שחקנים` |
| `אתה בטוח?` | `להמשיך?` |

### 8.2 Pluralization

Hebrew pluralization can be complex. For MVP, keep copy simple and avoid highly dynamic plural sentences where possible.

Prefer:

```text
מספר התאמות: 3
```

over:

```text
יש לך 3 התאמות חדשות
```

when exact pluralization is not implemented.

### 8.3 Tone

Swish & Game copy should be:

- friendly.
- direct.
- concise.
- gaming-aware.
- non-toxic.
- not overly formal.
- not childish.

### 8.4 English Product Terms

Some gaming terms can remain English when natural:

- `Duo`
- `Squad`
- `Ranked`
- `Voice`
- `Pro`

Use Hebrew explanations when clarity matters.

### 8.5 Safety Copy

Safety and moderation copy should be clear and calm.

Example:

```text
הדיווח התקבל וייבדק על ידי הצוות.
```

Avoid threatening or overly dramatic language.

---

## 9. String Management

### 9.1 Where Labels Live

Shared enum labels:

```text
src/shared/labels/
  skillLevel.labels.ts
  subscription.labels.ts
  platform.labels.ts
  report.labels.ts
  shop.labels.ts
  ai.labels.ts
  index.ts
```

Feature-specific copy:

```text
src/features/{feature}/labels.ts
```

### 9.2 Shared vs Feature Labels

| Label Type | Location |
|---|---|
| Enum labels used across app | `src/shared/labels` |
| Feature-specific button text | `src/features/{feature}/labels.ts` |
| Error mappings | `src/shared/errors` or `src/shared/labels/errors.ts` |
| Form field labels | Feature-local unless reused |
| Navigation labels | `src/app` or `src/shared/labels/navigation.ts` |

### 9.3 Naming

Use clear names:

```ts
skillLevelLabels
subscriptionStatusLabels
platformLabels
reportReasonLabels
```

Avoid:

```ts
labels1
texts
copy
strings
```

### 9.4 Type Safety

Always use `Record<Enum, string>`.

```ts
export const platformLabels: Record<Platform, string> = {
  pc: "PC",
  playstation_5: "PlayStation 5",
  playstation_4: "PlayStation 4",
  xbox_series_x: "Xbox Series X",
  xbox_one: "Xbox One",
  nintendo_switch: "Nintendo Switch",
  mobile: "Mobile",
  vr: "VR",
  arcade: "Arcade",
  other: "אחר"
};
```

If a new enum value is added, TypeScript must fail until the label map is updated.

### 9.5 No Inline Repeated Labels

Avoid repeating labels inline across components.

```tsx
// Bad
<span>מקצוען</span>

// Good
<span>{skillLevelLabels.pro}</span>
```

---

## 10. Typography & Fonts

### 10.1 Hebrew Font

The prototype uses `Rubik`.  
`Rubik` is acceptable for Hebrew UI and should remain the default unless `DESIGN_SYSTEM.md` changes it.

Recommended stack:

```css
font-family: "Rubik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 10.2 Font Weights

Recommended weights:

| Use | Weight |
|---|---:|
| Body | `400` |
| Medium labels | `500` |
| Buttons | `600` |
| Headings | `600–700` |

### 10.3 Fallbacks

Always define fallbacks.

```css
:root {
  font-family: "Rubik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### 10.4 Text Overflow

Hebrew and mixed English text must be tested for:

- long game names.
- long usernames.
- long ranks.
- no-space strings.
- mobile cards.

Use:

```css
overflow-wrap: anywhere;
```

where needed for user-generated text.

---

## 11. Accessibility in RTL

### 11.1 Required Attributes

App root:

```html
<html lang="he" dir="rtl">
```

Dynamic mixed text:

```tsx
<bdi>{gameName}</bdi>
<p dir="auto">{bio}</p>
```

### 11.2 Screen Readers

- Use semantic HTML.
- Buttons must have clear accessible names.
- Icon-only buttons require `aria-label` in Hebrew.
- Error messages should be connected to inputs with `aria-describedby`.

Example:

```tsx
<button aria-label="פתח תפריט">
  <MenuIcon />
</button>
```

### 11.3 Keyboard Navigation

RTL affects perceived direction.

QA must verify:

- tab order is logical.
- arrow key behavior is expected in carousels/sliders.
- focus rings are visible.
- modals trap focus.
- escape closes modal.

### 11.4 Contrast

Contrast rules are defined in `DESIGN_SYSTEM.md`.  
Localization does not override accessibility contrast requirements.

### 11.5 Form Errors

Error copy must be Hebrew, clear, and field-specific.

```text
יש להזין שם תצוגה.
הביוגרפיה ארוכה מדי.
```

---

## 12. QA Checklist for RTL/Hebrew

### 12.1 Layout

- [ ] `<html lang="he" dir="rtl">` exists.
- [ ] Main navigation is RTL.
- [ ] Cards align correctly in RTL.
- [ ] Modals and drawers open from intended side.
- [ ] Buttons with icons use `start/end`, not hardcoded left/right.
- [ ] No `dogame-*` deprecated classes.
- [ ] No new layout depends on physical `left/right` unless intentionally isolated.

### 12.2 Text

- [ ] All user-facing UI strings are Hebrew unless intentionally English gaming terminology.
- [ ] Enum labels come from canonical label maps.
- [ ] No Hebrew enum values are stored in Firestore.
- [ ] Long Hebrew text wraps correctly.
- [ ] Long English game names do not break layout.
- [ ] User-generated bio uses `dir="auto"`.

### 12.3 Mixed Content

- [ ] `Valorant` inside Hebrew sentence displays correctly.
- [ ] `Diamond III` inside Hebrew sentence displays correctly.
- [ ] `PlayStation 5` inside Hebrew sentence displays correctly.
- [ ] Usernames/gamertags are isolated with `bdi` where embedded in sentences.
- [ ] Punctuation appears in the correct visual order.

### 12.4 Formatting

- [ ] Dates use `he-IL`.
- [ ] Numbers use `he-IL`.
- [ ] Currency uses `ILS`.
- [ ] Pro price displays correctly as `29.90 ILS/month` or localized equivalent.
- [ ] Relative time appears in Hebrew.

### 12.5 Accessibility

- [ ] Icon-only buttons have Hebrew `aria-label`.
- [ ] Form errors are announced or associated with fields.
- [ ] Keyboard navigation works in RTL.
- [ ] Focus states are visible.
- [ ] Color contrast passes design system rules.

### 12.6 Data Integrity

- [ ] Firestore data stores English enum values.
- [ ] Filters send English enum values.
- [ ] Cloud Functions receive English enum values.
- [ ] Label maps cover every enum value with `Record<Enum, string>`.

---

## 13. Open Items

| Item | Status | Impact |
|---|---|---|
| Additional languages beyond he/en | Open | he+en delivered under ADR-035; more locales need a future ADR + catalogs. |
| Final copy tone guide | Open | May refine button labels, empty states, and safety copy. |
| Final label wording | Open but this document is current source of truth | Product/design may revise Hebrew labels later. |
| i18n library selection | Open | `react-i18next` or FormatJS per ADR-035; final choice TBD. |
| Tailwind RTL plugin | Open | Decide whether to add plugin or rely on logical utilities. |
| Pluralization framework | Open | Needed for polished bilingual/multi-locale support. |
| Font finalization | Open / prototype uses `Rubik` | Confirm in `DESIGN_SYSTEM.md`. |
| Swipe gesture semantics in RTL | Product/design decision | Need explicit UX decision and tests. |
