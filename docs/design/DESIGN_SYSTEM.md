# Swish & Game — Design System

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 2.0 |
| Status | Production Design System — Refresh |
| Repository Path | `docs/design/DESIGN_SYSTEM.md` |
| Product | Swish & Game |
| Theme Name | `Dark Matter` |
| Source of Truth | `docs/product/PRD.md`, `docs/design/LOCALIZATION.md`, `docs/design/COMPONENTS.md`, `docs/product/DECISIONS.md` |
| Supersedes | הגרסה הקצרה הקודמת של `DESIGN_SYSTEM.md` |
| Primary Locale | `he-IL` |
| Direction | RTL |
| Primary Font | `Rubik` |
| Frontend Stack | React + Vite + TypeScript + Tailwind CSS + Framer Motion |
| Canonical Rule | visual tokens are centralized; enum labels come from `LOCALIZATION.md`; no hardcoded enum labels in components |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Visual Philosophy](#2-visual-philosophy)
- [3. Color Tokens](#3-color-tokens)
- [4. Typography](#4-typography)
- [5. Spacing & Layout](#5-spacing--layout)
- [6. Border Radius](#6-border-radius)
- [7. Shadows & Elevation](#7-shadows--elevation)
- [8. Motion & Animation](#8-motion--animation)
- [9. Component Style Tokens](#9-component-style-tokens)
- [10. Iconography](#10-iconography)
- [11. Dark / Light Mode](#11-dark--light-mode)
- [12. Accessibility & Contrast](#12-accessibility--contrast)
- [13. Tailwind Config Mapping](#13-tailwind-config-mapping)
- [14. Deprecated](#14-deprecated)
- [15. Open Items](#15-open-items)

---

## 2. Visual Philosophy

### 2.1 Theme: `Dark Matter`

`Dark Matter` הוא theme פרימיום לגיימרים: כהה, עמוק, מבריק, חד, עם תחושת אנרגיה של neon ו-glassmorphism. הממשק צריך להרגיש כמו gaming hub מודרני, לא כמו dashboard גנרי.

עקרונות:

- רקע כהה מאוד (`deep slate`) שמייצר עומק.
- כרטיסים מזכוכית (`glassmorphism`) עם גבולות עדינים.
- פעולות ראשיות עם `primary indigo`.
- אלמנטים פרימיום עם `premium amber`.
- הצלחות עם `success emerald`.
- סכנות עם `danger red`.
- glow מבוקר, לא מוגזם.
- טיפוגרפיה עוצמתית וחדה.
- mobile-first, Hebrew-first RTL.

### 2.2 Product Feel

| Attribute | Direction |
|---|---|
| Premium | נקי, מלוטש, spacing נדיב, לא עמוס. |
| Gaming | טיפוגרפיה חזקה, cards חדים, glow, motion. |
| Social | avatar-forward, chat-friendly, approachable. |
| Safe | states ברורים, error/refusal רגועים, danger רק כשצריך. |
| Fast | transitions קצרים, feedback מיידי, skeletons במקום קפיצות layout. |

### 2.3 Glassmorphism Rule

Glassmorphism ב-Swish & Game הוא accent, לא תירוץ לחוסר קריאות.

Recommended glass surface:

```css
background: rgba(30, 41, 59, 0.72);
border: 1px solid rgba(255, 255, 255, 0.10);
backdrop-filter: blur(18px);
box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
```

אסור להשתמש ב-glass אם הוא פוגע ב-contrast או ב-readability.

---

## 3. Color Tokens

### 3.1 Canonical Core Tokens

ADR-009 מגדיר את צבעי הליבה הקנוניים. הצבע הישן `#22D3EE` ו-namespace `dogame` מבוטלים.

| Token | Hex / Value | Usage |
|---|---|---|
| `background` | `#0F172A` | App background, main dark canvas. |
| `surface` | `#1E293B` | Cards, panels, modals, bottom nav. |
| `primary` | `#6366F1` | Primary CTAs, selected states, active nav, primary glow. |
| `premium` | `#F59E0B` | Pro, coins, premium cosmetics, upgrade CTAs. |
| `success` | `#10B981` | Success state, match success, completed actions. |
| `danger` | `#EF4444` | Delete/block/report/destructive states. |
| `border` | `rgba(255,255,255,0.10)` | Glass borders, subtle separators. |

### 3.2 Text Tokens

| Token | Value | Usage |
|---|---|---|
| `text.default` | `#F8FAFC` | Primary text on dark background. |
| `text.muted` | `#94A3B8` | Secondary text, captions, metadata. |
| `text.subtle` | `#64748B` | Less important hints and disabled copy. |
| `text.inverse` | `#0F172A` | Text on bright/premium backgrounds. |
| `text.danger` | `#FCA5A5` | Error copy on dark surfaces. |
| `text.success` | `#6EE7B7` | Success copy on dark surfaces. |
| `text.premium` | `#FCD34D` | Premium labels on dark surfaces. |

### 3.3 Surface Tokens

| Token | Value | Usage |
|---|---|---|
| `surface.default` | `#1E293B` | Standard card/panel. |
| `surface.elevated` | `#273449` | Elevated card or selected panel. |
| `surface.glass` | `rgba(30,41,59,0.72)` | Glass panels. |
| `surface.overlay` | `rgba(15,23,42,0.82)` | Modal backdrop/overlay. |
| `surface.input` | `rgba(15,23,42,0.72)` | Inputs inside dark cards. |
| `surface.disabled` | `rgba(148,163,184,0.12)` | Disabled surfaces. |

### 3.4 Semantic Tokens

| Token | Value | Usage |
|---|---|---|
| `semantic.info` | `#6366F1` | Informational states; uses primary indigo. |
| `semantic.success` | `#10B981` | Success. |
| `semantic.warning` | `#F59E0B` | Warning / premium emphasis. |
| `semantic.danger` | `#EF4444` | Destructive / error. |
| `semantic.blocked` | `#EF4444` | Block/report restrictions. |
| `semantic.pro` | `#F59E0B` | Pro status, verified badge. |
| `semantic.ai` | `#6366F1` | AI Hub states; pair with primary glow. |

### 3.5 Glow Tokens

| Token | Value | Usage |
|---|---|---|
| `glow.primary` | `0 0 32px rgba(99,102,241,0.42)` | Primary CTA/card focus glow. |
| `glow.premium` | `0 0 36px rgba(245,158,11,0.38)` | Pro/coin/premium glow. |
| `glow.success` | `0 0 32px rgba(16,185,129,0.34)` | Match/success glow. |
| `glow.danger` | `0 0 32px rgba(239,68,68,0.32)` | Danger focus/destructive confirmation. |
| `glow.soft` | `0 0 80px rgba(99,102,241,0.18)` | Large ambient background glow. |

### 3.6 Dark Mode Palette

Dark mode is the default canonical product theme.

| Token | Value |
|---|---|
| `background` | `#0F172A` |
| `surface` | `#1E293B` |
| `surface.elevated` | `#273449` |
| `text.default` | `#F8FAFC` |
| `text.muted` | `#94A3B8` |
| `border` | `rgba(255,255,255,0.10)` |
| `primary` | `#6366F1` |
| `premium` | `#F59E0B` |
| `success` | `#10B981` |
| `danger` | `#EF4444` |

### 3.7 Light Mode Palette

Light mode is secondary and may be used later. It must preserve semantic colors.

| Token | Value | Usage |
|---|---|---|
| `background` | `#F8FAFC` | Light app background. |
| `surface` | `#FFFFFF` | Cards/panels. |
| `surface.elevated` | `#F1F5F9` | Elevated panels. |
| `text.default` | `#0F172A` | Main text. |
| `text.muted` | `#475569` | Secondary text. |
| `border` | `rgba(15,23,42,0.12)` | Borders. |
| `primary` | `#4F46E5` | Primary actions. |
| `premium` | `#D97706` | Premium. |
| `success` | `#059669` | Success. |
| `danger` | `#DC2626` | Danger. |

### 3.8 Deprecated Cyan

The old cyan:

```text
#22D3EE
```

is deprecated.

Rules:

- Do not add new usage of `#22D3EE`.
- Do not use cyan as primary action.
- Existing cyan references must migrate to `primary` or another approved semantic token.
- If a cool accent is needed later, add a new ADR/token; do not revive legacy cyan ad hoc.

---

## 4. Typography

### 4.1 Primary Font

Canonical primary font:

```text
Rubik
```

Rubik is used because Swish & Game is Hebrew-first and Rubik supports Hebrew well.

Recommended font stack:

```css
font-family: "Rubik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 4.2 Font Reconciliation

PRD §15.4 previously recommended:

- `Space Grotesk` for display.
- `Inter` for body.
- `JetBrains Mono` for data/stats.

This Design System v2.0 updates and supersedes that typography guidance for Hebrew-first production UI.

Reason:

- `Space Grotesk` and `Inter` are not suitable as primary Hebrew UI fonts for Swish & Game.
- Hebrew-first UI needs consistent Hebrew support, spacing, glyph quality and readability.
- `Rubik` is already used by the prototype and is aligned with `LOCALIZATION.md §10`.

Canonical decision:

| Use | Font |
|---|---|
| Primary UI | `Rubik` |
| Display/heading | `Rubik` |
| Body | `Rubik` |
| Buttons | `Rubik` |
| Technical/rank/stat accents | Optional `JetBrains Mono` in isolated LTR contexts only |

`JetBrains Mono` may be used sparingly for technical/numeric content such as ranks, stats, IDs, or short game-related metrics, but it must not replace Rubik for Hebrew UI.

### 4.3 Weights

| Token | Weight | Usage |
|---|---:|---|
| `font-normal` | `400` | Body, paragraphs. |
| `font-medium` | `500` | Labels, tabs, metadata. |
| `font-semibold` | `600` | Buttons, cards, section headers. |
| `font-bold` | `700` | Headings, emphasis. |
| `font-black` | `900` | Display gaming headers, hero text. |

### 4.4 Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---:|---:|---:|---|
| `display` | `48px` | `56px` | `900` | Hero/marketing display on large screens. |
| `h1` | `36px` | `44px` | `900` | Main screen heading. |
| `h2` | `28px` | `36px` | `800/900` | Section heading. |
| `h3` | `22px` | `30px` | `700` | Card heading. |
| `body-lg` | `18px` | `28px` | `400/500` | Prominent body text. |
| `body` | `16px` | `24px` | `400` | Default text. |
| `body-sm` | `14px` | `20px` | `400/500` | Secondary text. |
| `caption` | `12px` | `16px` | `500` | Metadata, helper text. |
| `micro` | `11px` | `14px` | `600` | Badges, chips. |

### 4.5 Mobile Type Scale

On mobile, use tighter but readable sizes:

| Token | Mobile Size | Line Height |
|---|---:|---:|
| `display` | `40px` | `46px` |
| `h1` | `30px` | `38px` |
| `h2` | `24px` | `32px` |
| `h3` | `20px` | `28px` |
| `body` | `16px` | `24px` |
| `caption` | `12px` | `16px` |

### 4.6 Heading Style

Prototype-inspired heading style:

```css
font-family: "Rubik", system-ui, sans-serif;
font-weight: 900;
font-style: italic;
text-transform: uppercase;
letter-spacing: -0.04em;
```

Usage:

- hero headings.
- game-card headline moments.
- match celebration.
- Pro upgrade emphasis.

For Hebrew, uppercase has limited impact, but the class may remain for mixed Latin/gaming tokens. Do not rely on uppercase to communicate hierarchy in Hebrew.

### 4.7 RTL Typography

Rules:

- App root: `lang="he"` and `dir="rtl"`.
- Use `text-align: start`, not `left`.
- Use `bdi`/`dir="auto"` for mixed Hebrew/English content.
- Game names/ranks may remain Latin and should be isolated when embedded in Hebrew text.

Example:

```tsx
<p>
  מחפש שחקן ל־<bdi>{gameName}</bdi> בדירוג <bdi>{rank}</bdi>
</p>
```

---

## 5. Spacing & Layout

### 5.1 Spacing Scale

Use Tailwind-compatible spacing.

| Token | Value | Usage |
|---|---:|---|
| `space-0` | `0px` | Reset. |
| `space-1` | `4px` | Tight internal spacing. |
| `space-2` | `8px` | Small gaps. |
| `space-3` | `12px` | Form helper spacing. |
| `space-4` | `16px` | Default gap/padding. |
| `space-5` | `20px` | Mobile card padding. |
| `space-6` | `24px` | Section padding. |
| `space-8` | `32px` | Major blocks. |
| `space-10` | `40px` | Hero sections. |
| `space-12` | `48px` | Large section separation. |
| `space-16` | `64px` | Desktop large spacing. |
| `space-20` | `80px` | Marketing/hero only. |

### 5.2 Layout Containers

| Token | Width | Usage |
|---|---:|---|
| `container.mobile` | `100%` | Mobile full width with padding. |
| `container.sm` | `640px` | Forms/settings. |
| `container.md` | `768px` | Tablet content. |
| `container.lg` | `1024px` | Desktop app shell. |
| `container.xl` | `1280px` | Marketing/large dashboard. |

Recommended app content wrapper:

```css
width: min(100%, 480px);
margin-inline: auto;
padding-inline: 16px;
```

For desktop app views:

```css
width: min(100%, 1120px);
margin-inline: auto;
padding-inline: 24px;
```

### 5.3 Breakpoints

| Breakpoint | Value | Usage |
|---|---:|---|
| `xs` | `360px` | Small mobile sanity checks. |
| `sm` | `640px` | Large phones/small tablets. |
| `md` | `768px` | Tablet layout. |
| `lg` | `1024px` | Desktop shell. |
| `xl` | `1280px` | Wide desktop. |
| `2xl` | `1536px` | Large screens. |

### 5.4 Mobile-First Rules

- Design first for `360px–430px` width.
- Bottom nav is primary.
- Touch target minimum: `44px`.
- Do not rely on hover for critical actions.
- Avoid dense grids on mobile.
- Use one primary CTA per screen state.
- Keep modals usable in small viewport height.

### 5.5 RTL Logical Properties

Use logical properties:

| Avoid | Prefer |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |

In component APIs use:

```ts
type Placement = "start" | "end" | "top" | "bottom";
```

Do not use `left`/`right` for semantic placement unless a visual physical side is explicitly required.

---

## 6. Border Radius

### 6.1 Radius Scale

| Token | Value | Usage |
|---|---:|---|
| `radius-none` | `0px` | Reset / sharp separators. |
| `radius-sm` | `8px` | Small chips/input internals. |
| `radius-md` | `12px` | Inputs, compact buttons. |
| `radius-lg` | `16px` | Standard cards/buttons. |
| `radius-xl` | `20px` | Larger cards. |
| `radius-2xl` | `24px` | Prototype-style cards, modals. |
| `radius-3xl` | `32px` | Feature panels, bottom sheets. |
| `radius-hero` | `40px` | Large hero cards / premium surfaces. |
| `radius-full` | `9999px` | Pills, avatars, badges. |

### 6.2 Prototype Compatibility

The prototype uses classes like:

```text
rounded-[24px]
rounded-[40px]
```

Canonical mapping:

| Prototype | Token |
|---|---|
| `rounded-[24px]` | `radius-2xl` |
| `rounded-[40px]` | `radius-hero` |

Use named Tailwind tokens where possible instead of arbitrary values.

### 6.3 Shape Language

Swish & Game surfaces should feel:

- rounded enough to be premium.
- sharp enough to feel gaming-oriented.
- not overly soft or childish.

Cards may use slight rotation/angle effects through motion, not through inaccessible skewed content.

---

## 7. Shadows & Elevation

### 7.1 Elevation Tokens

| Token | Value | Usage |
|---|---|---|
| `shadow-soft` | `0 12px 40px rgba(0,0,0,0.28)` | Cards and panels. |
| `shadow-elevated` | `0 24px 80px rgba(0,0,0,0.38)` | Modals, bottom sheets. |
| `shadow-glow-primary` | `0 0 32px rgba(99,102,241,0.42)` | Primary action glow. |
| `shadow-glow-premium` | `0 0 36px rgba(245,158,11,0.38)` | Pro/premium elements. |
| `shadow-glow-success` | `0 0 32px rgba(16,185,129,0.34)` | Match/success state. |
| `shadow-glow-danger` | `0 0 32px rgba(239,68,68,0.32)` | Destructive focus/confirm. |
| `shadow-inner-glass` | `inset 0 1px 0 rgba(255,255,255,0.10)` | Glass highlight. |

### 7.2 Elevation Levels

| Level | Surface | Shadow | Use |
|---|---|---|---|
| `0` | background | none | App canvas. |
| `1` | `surface.default` | `shadow-soft` | Cards, list items. |
| `2` | `surface.elevated` | `shadow-elevated` | Active panels, bottom nav. |
| `3` | `surface.glass` | `shadow-elevated + glow` | Modals, upgrade, match celebration. |
| `focus` | any | glow token | Focus/selected/CTA states. |

### 7.3 Glow Discipline

Glow should reinforce state, not reduce readability.

Rules:

- Avoid glow behind dense paragraph text.
- Use glow on CTAs, badges, hero cards, selected nav, match celebration.
- Premium glow uses `premium`, not legacy cyan.
- Danger glow is reserved for destructive confirmation states.

---

## 8. Motion & Animation

### 8.1 Motion Stack

Use Framer Motion for React animation.

Motion must be:

- fast.
- responsive.
- reversible where possible.
- non-blocking.
- reduced-motion aware.

> **UI motion vs cosmetic FX:** סעיף זה מכסה **UI motion** (transitions, feedback) דרך Framer Motion. **Cosmetic rendering & FX** — avatars מונפשים, מסגרות דינמיות, particle/video backgrounds, וסאונד (Rive / Lottie / PixiJS / alpha-video / sprite / Howler) — מנוהלים ב-`docs/design/MOTION_AND_FX.md` (ADR-039). שניהם חייבים לכבד `prefers-reduced-motion`.

### 8.2 Motion Principles

| Principle | Rule |
|---|---|
| Feedback | Every tap/action should feel responsive. |
| Clarity | Animation should explain state change. |
| Speed | Most UI transitions should be `150–280ms`. |
| Safety | Never hide errors or destructive confirmation behind animation. |
| Performance | Avoid large blur/box-shadow animations on low-end devices. |
| Accessibility | Respect `prefers-reduced-motion`. |

### 8.3 Canonical Animations

| Name | Purpose | Suggested Use |
|---|---|---|
| `float` | subtle idle motion | Hero cards, ambient elements. |
| `pop` | button/card tap feedback | CTA press, item selection. |
| `pan` | slow background movement | Dark Matter ambient background. |
| `match-pop` | celebration entrance | Match celebration. |
| `fade-in` | content entrance | page sections, cards. |
| `slide-up` | bottom sheets/modals | mobile overlays. |
| `shake` | validation error | input error, limited use. |

### 8.4 Animation Specs

| Animation | Duration | Easing | Notes |
|---|---:|---|---|
| `fade-in` | `180ms` | `ease-out` | Default entry. |
| `slide-up` | `220ms` | `ease-out` | Bottom sheets/modals. |
| `pop` | `120ms` | `ease-out` | Tap feedback. |
| `match-pop` | `420ms` | spring | Celebration only. |
| `float` | `4–6s` | ease-in-out infinite | Ambient only. |
| `pan` | `12–20s` | linear infinite | Background only. |

### 8.5 Framer Motion Example

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 16 }}
  transition={{ duration: 0.22, ease: "easeOut" }}
>
  {children}
</motion.div>
```

### 8.6 Reduced Motion

Use `useReducedMotion`.

```tsx
const shouldReduceMotion = useReducedMotion();

const animation = shouldReduceMotion
  ? { opacity: 1 }
  : { opacity: 1, y: 0 };
```

If reduced motion is enabled:

- disable ambient float/pan.
- replace swipe animation with simple fade/position change.
- keep functional state changes visible.

---

## 9. Component Style Tokens

### 9.1 Buttons

Button variants are defined in `COMPONENTS.md` and styled here.

| Variant | Background | Text | Border | Shadow | Use |
|---|---|---|---|---|---|
| `primary` | `#6366F1` | `#FFFFFF` | transparent | `glow.primary` on hover/focus | Main CTA. |
| `secondary` | `surface.elevated` | `text.default` | `border` | `shadow-soft` | Secondary CTA. |
| `ghost` | transparent | `text.default` | transparent | none | Low emphasis. |
| `danger` | `#EF4444` | `#FFFFFF` | transparent | optional `glow.danger` | Destructive. |
| `pro` | `#F59E0B` or premium gradient | `#0F172A` | transparent | `glow.premium` | Upgrade/Pro. |

Button base:

```css
display: inline-flex;
align-items: center;
justify-content: center;
gap: 0.5rem;
min-height: 44px;
border-radius: 16px;
font-family: "Rubik", system-ui, sans-serif;
font-weight: 700;
transition: transform 120ms ease, box-shadow 160ms ease, background 160ms ease;
```

Button interaction:

```css
button:active {
  transform: scale(0.98);
}
```

### 9.2 Cards

Card variants:

| Variant | Style | Use |
|---|---|---|
| `default` | `surface.default`, `border`, `shadow-soft` | Generic content. |
| `glass` | translucent surface, blur, border | Premium panels, overlays. |
| `interactive` | default + hover/focus lift | Clickable cards. |
| `premium` | amber accent/glow | Pro/cosmetic cards. |
| `danger` | danger border/accent | destructive confirmation. |

Card base:

```css
border-radius: 24px;
background: #1E293B;
border: 1px solid rgba(255,255,255,0.10);
box-shadow: 0 12px 40px rgba(0,0,0,0.28);
```

### 9.3 Badges

Badge variants:

| Variant | Style | Use |
|---|---|---|
| `default` | muted surface | general tag. |
| `primary` | primary-tinted | active state. |
| `pro` | premium amber | Pro / verified badge. |
| `success` | emerald tint | success. |
| `danger` | red tint | report/block/error. |
| `rarity-common` | muted | common items. |
| `rarity-rare` | primary tint | rare items. |
| `rarity-epic` | indigo/purple tint | epic items. |
| `rarity-legendary` | premium glow | legendary items. |

### 9.4 Modals

Modal surface:

```css
background: rgba(30,41,59,0.88);
border: 1px solid rgba(255,255,255,0.10);
backdrop-filter: blur(20px);
border-radius: 32px;
box-shadow: 0 24px 80px rgba(0,0,0,0.38);
```

Modal rules:

- mobile bottom sheet when appropriate.
- focus trap.
- `aria-labelledby` and `aria-describedby`.
- Hebrew copy.
- no raw provider/Gemini errors.

### 9.5 Inputs

Input base:

```css
min-height: 44px;
border-radius: 16px;
background: rgba(15,23,42,0.72);
border: 1px solid rgba(255,255,255,0.10);
color: #F8FAFC;
```

Input focus:

```css
border-color: #6366F1;
box-shadow: 0 0 0 3px rgba(99,102,241,0.24);
outline: none;
```

Input error:

```css
border-color: #EF4444;
box-shadow: 0 0 0 3px rgba(239,68,68,0.20);
```

### 9.6 Bottom Nav

Bottom nav style:

```css
background: rgba(30,41,59,0.84);
border-top: 1px solid rgba(255,255,255,0.10);
backdrop-filter: blur(18px);
box-shadow: 0 -16px 48px rgba(0,0,0,0.32);
```

Active item:

- primary text/icon.
- subtle primary glow.
- no cyan.

### 9.7 ProBadge

`ProBadge` uses:

- `premium` color.
- optional glow.
- label from product copy, not enum hardcode.
- `verifiedBadge` is display-only and backend-derived.

---

## 10. Iconography

### 10.1 Icon Set

The prototype uses Font Awesome. This remains acceptable for MVP.

Recommended usage:

```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
```

### 10.2 Icon Style

| Use | Guidance |
|---|---|
| Navigation | simple, recognizable, filled/solid where possible. |
| Actions | pair with text when action is important. |
| Pro/Premium | amber accent. |
| Danger | red accent; do not overuse. |
| AI | primary indigo; optional glow. |

### 10.3 RTL Directional Icons

Directional icons must be reviewed in RTL.

Examples:

| Icon Meaning | RTL Rule |
|---|---|
| Back | should point toward navigation back direction expected by platform/app. |
| Next | may need mirroring. |
| Chevron start/end | use semantic `start`/`end`, not physical `left`/`right`. |
| Send | can remain if culturally expected, but test in RTL chat. |
| Swipe arrows | product decision required for RTL semantics. |

### 10.4 Icon-Only Buttons

Icon-only buttons require Hebrew `aria-label`.

```tsx
<button aria-label="פתח תפריט">
  <FontAwesomeIcon icon={faEllipsis} />
</button>
```

---

## 11. Dark / Light Mode

### 11.1 Default

Dark mode is default and primary.  
`Dark Matter` is designed around dark mode.

### 11.2 Token Mapping

Use semantic tokens, not raw colors in components.

```tsx
<Card className="bg-surface text-text border-border" />
```

### 11.3 Dark Mode CSS Variables

```css
:root {
  --color-background: #0F172A;
  --color-surface: #1E293B;
  --color-surface-elevated: #273449;
  --color-text: #F8FAFC;
  --color-text-muted: #94A3B8;
  --color-border: rgba(255,255,255,0.10);
  --color-primary: #6366F1;
  --color-premium: #F59E0B;
  --color-success: #10B981;
  --color-danger: #EF4444;
}
```

### 11.4 Light Mode CSS Variables

```css
[data-theme="light"] {
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #F1F5F9;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-border: rgba(15,23,42,0.12);
  --color-primary: #4F46E5;
  --color-premium: #D97706;
  --color-success: #059669;
  --color-danger: #DC2626;
}
```

### 11.5 Light Mode Status

Light mode is supported at token level but not necessarily a launch requirement.

Do not hardcode dark-only assumptions in components unless the component is explicitly dark-only.

---

## 12. Accessibility & Contrast

### 12.1 Baseline

Swish & Game targets WCAG AA for production UI.

Minimum guidance:

| Text Type | Minimum Contrast |
|---|---:|
| Normal text | `4.5:1` |
| Large text | `3:1` |
| UI components/focus indicators | `3:1` |
| Disabled text | may be lower but must remain understandable |

### 12.2 Neon Contrast

Neon glow does not count as contrast.  
Text must remain readable without glow.

Avoid:

```css
color: #6366F1;
background: #0F172A;
text-shadow: 0 0 20px rgba(99,102,241,0.8);
```

for body text if contrast is insufficient.

Use bright text on dark surface:

```css
color: #F8FAFC;
```

and reserve neon for borders/glow/accent.

### 12.3 Focus States

Every interactive element must have visible focus.

Recommended focus ring:

```css
outline: none;
box-shadow: 0 0 0 3px rgba(99,102,241,0.34);
```

Danger focus:

```css
box-shadow: 0 0 0 3px rgba(239,68,68,0.30);
```

Premium focus:

```css
box-shadow: 0 0 0 3px rgba(245,158,11,0.30);
```

### 12.4 Motion Accessibility

- Respect `prefers-reduced-motion`.
- No flashing effects.
- No animation needed to understand state.
- Match celebration must not block navigation.

### 12.5 RTL Accessibility

Cross-reference `LOCALIZATION.md §11`.

Required:

- `lang="he"`.
- `dir="rtl"`.
- `bdi` / `dir="auto"` for mixed content.
- Hebrew `aria-label`.
- logical keyboard navigation.

---

## 13. Tailwind Config Mapping

### 13.1 Theme Extension

Recommended `tailwind.config.ts` mapping:

```ts
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: {
          DEFAULT: "#1E293B",
          elevated: "#273449",
          input: "rgba(15,23,42,0.72)",
          glass: "rgba(30,41,59,0.72)",
          overlay: "rgba(15,23,42,0.82)"
        },
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF"
        },
        premium: {
          DEFAULT: "#F59E0B",
          foreground: "#0F172A"
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#052E24"
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF"
        },
        border: "rgba(255,255,255,0.10)",
        text: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          subtle: "#64748B",
          inverse: "#0F172A",
          premium: "#FCD34D",
          success: "#6EE7B7",
          danger: "#FCA5A5"
        }
      },
      fontFamily: {
        sans: [
          "Rubik",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        display: [
          "Rubik",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
        ]
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        hero: "40px"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.28)",
        elevated: "0 24px 80px rgba(0,0,0,0.38)",
        "glow-primary": "0 0 32px rgba(99,102,241,0.42)",
        "glow-premium": "0 0 36px rgba(245,158,11,0.38)",
        "glow-success": "0 0 32px rgba(16,185,129,0.34)",
        "glow-danger": "0 0 32px rgba(239,68,68,0.32)",
        "inner-glass": "inset 0 1px 0 rgba(255,255,255,0.10)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        pan: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        },
        "match-pop": {
          "0%": { transform: "scale(0.88)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        pop: "pop 120ms ease-out",
        pan: "pan 16s linear infinite",
        "match-pop": "match-pop 420ms cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  }
} satisfies Config;
```

### 13.2 No `dogame` Namespace

Do not add:

```text
dogame-*
.doGame*
.gameon-*
```

Use token names and component variants instead.

### 13.3 No Raw Hex in Components

Avoid:

```tsx
<div className="bg-[#22D3EE]" />
```

Use:

```tsx
<div className="bg-primary" />
```

or semantic variants.

### 13.4 Arbitrary Values

Arbitrary values are allowed only when:

- no token exists yet.
- usage is isolated.
- PR includes a comment or follow-up to create a token if repeated.

Repeated arbitrary values must become tokens.

---

## 14. Deprecated

### 14.1 Deprecated Colors

| Deprecated | Replacement |
|---|---|
| `#22D3EE` | `primary #6366F1` or semantic token |
| untracked cyan glow | `shadow-glow-primary` |
| untracked gradients | approved primary/premium gradients |

### 14.2 Deprecated Namespaces

| Deprecated | Replacement |
|---|---|
| `dogame-*` | token/component-based classes |
| `DoGame` | `Swish & Game` |
| `GameOn` | `Swish & Game` |

### 14.3 Deprecated Fonts for Hebrew UI

| Deprecated for Hebrew UI | Replacement |
|---|---|
| `Space Grotesk` | `Rubik` |
| `Inter` | `Rubik` |
| `JetBrains Mono` as general UI font | `Rubik`; optional mono only for isolated technical data |

### 14.4 Deprecated Practices

Do not use:

- hardcoded enum labels in components.
- Hebrew enum values in data.
- client-side business enforcement as source of truth.
- inline CSS for reusable UI.
- animation that blocks function.
- low-contrast neon text.
- hover-only interactions on mobile.

---

## 15. Open Items

| Item | Status | Impact |
|---|---|---|
| Final light mode launch requirement | Open | Tokens exist; product may choose dark-only MVP. |
| Tailwind RTL plugin | Open | Impacts logical utility implementation. |
| Final gradient set | Open | Need approved primary/pro gradients if repeated. |
| Storybook adoption | Open | Recommended for shared component QA. |
| Detailed icon set | Open | Font Awesome accepted; exact icons per screen still pending. |
| Swipe gesture visuals in RTL | Open | Depends on UX decision in `UX_FLOWS.md`. |
| Pro cosmetic animation budget | Open | Performance constraints for low-end mobile. |
| Final component variants | Open | May evolve through `COMPONENTS.md`. |
| Font loading strategy | Open | Need final webfont loading/preload policy. |
| Reduced-motion QA matrix | Open | Needs implementation/testing checklist. |
| Light mode contrast audit | Open | Required if light mode ships. |
| Marketing/landing page visual extension | Open | App design tokens exist; marketing-specific components may need additions. |
