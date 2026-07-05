# Swish & Game — Development Work Plan

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.1 |
| Status | Canonical Development Execution Plan — **Live Progress Tracker** |
| Repository Path | `docs/engineering/WORK_PLAN.md` |
| Product | Swish & Game |
| Source of Truth | `docs/engineering/MIGRATION_PLAN.md`, `docs/product/ROADMAP.md`, `docs/quality/TEST_STRATEGY.md`, `docs/quality/TEST_CASES.md`, `docs/quality/DEFINITION_OF_DONE.md`, `docs/quality/CI_CD.md`, `docs/product/DECISIONS.md` |
| Alignment | שלבי התוכנית ממופים 1:1 ל-`MIGRATION_PLAN.md` Phases 0–8 + שלב QA/Launch (ROADMAP Phase 11) |
| Scope Covered | כל 39 ה-ADRs, כולל ADR-035 (bidi i18n), ADR-037 (RevenueCat), ADR-038 (deleteAccount), ADR-039 (Motion & FX) |
| Date Policy | אין תאריכים; אומדני מאמץ יחסיים בלבד (S/M/L) |
| Working Principle | שום שלב לא נסגר בלי שער בדיקות (Verification Gate) ירוק מלא |
| Tracking Rule | קובץ זה הוא ה-progress tracker החי: checkbox מסומן = בוצע ואומת. עדכון הסימון נעשה באותו commit שסוגר את המשימה/השלב. |

**מקרא אומדני מאמץ:** `S` = עד יום עבודה · `M` = 2–4 ימי עבודה · `L` = 5+ ימי עבודה. האומדנים יחסיים ולא התחייבות.

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. שיטת העבודה](#2-שיטת-העבודה)
- [3. ערכת האימות (Verification Toolkit)](#3-ערכת-האימות-verification-toolkit)
- [4. מעקב התקדמות ראשי](#4-מעקב-התקדמות-ראשי)
- [5. Phase 0 — Security & Hygiene](#5-phase-0--security--hygiene)
- [6. Phase 1 — Foundation](#6-phase-1--foundation)
- [7. Phase 2 — Auth & Data Layer](#7-phase-2--auth--data-layer)
- [8. Phase 3 — Discovery & Matching](#8-phase-3--discovery--matching)
- [9. Phase 4 — Chat](#9-phase-4--chat)
- [10. Phase 5 — Economy & Cosmetics](#10-phase-5--economy--cosmetics)
- [11. Phase 6 — Subscription (RevenueCat)](#11-phase-6--subscription-revenuecat)
- [12. Phase 7 — AI Hub](#12-phase-7--ai-hub)
- [13. Phase 8 — Safety, Account Lifecycle & Hardening](#13-phase-8--safety-account-lifecycle--hardening)
- [14. Phase 9 — QA, Observability & Launch Readiness](#14-phase-9--qa-observability--launch-readiness)
- [15. Workstreams רוחביים](#15-workstreams-רוחביים)
- [16. מטריצת עקיבות בדיקות לפי שלב](#16-מטריצת-עקיבות-בדיקות-לפי-שלב)
- [17. ניהול סיכונים](#17-ניהול-סיכונים)
- [18. שלבים עתידיים (Post-MVP)](#18-שלבים-עתידיים-post-mvp)
- [19. Open Items](#19-open-items)

---

## 2. שיטת העבודה

### 2.1 מחזור חיים של כל משימה

כל משימה (Task) עוברת את המחזור הבא, ללא קיצורי דרך:

```text
DoR check (DEFINITION_OF_DONE §2)
  → branch מ-main
  → implementation לפי המסמך הקנוני הרלוונטי
  → tests לפי TEST_STRATEGY + TEST_CASES
  → docs sync באותו PR אם חוזה השתנה (DoD §3.5)
  → local gate: typecheck + lint + test + test:rules + build
  → PR review
  → CI ירוק
  → merge
  → סימון ה-checkbox של המשימה בקובץ זה
```

### 2.2 כללי יסוד (אין לעבור עליהם)

1. **Backend-authoritative** — כל state רגיש נכתב רק בשרת (CLAUDE.md rules).
2. **אין secrets ב-client** — רק `VITE_*` Firebase config ציבורי.
3. **אין קוד לפני מסמך** — אם החוזה לא מוגדר ב-DATA_MODEL/API_CONTRACT, קודם מעדכנים מסמך.
4. **i18n מהיום הראשון** — אין hardcoded strings; הכל דרך catalogs `he`/`en` (ADR-035).
5. **שער שלב** — שלב נסגר רק כשכל ה-Exit Criteria שלו ירוקים, כולל regression של שלבים קודמים.
6. **Emulators בלבד לפיתוח** — `firebase emulators:start --project swish-game-dev`. לעולם לא `swish-game-prod`.
7. **כל PR קטן וממוקד** — משימה אחת או שתיים לכל היותר.

### 2.3 פרוטוקול סימון התקדמות (מחייב)

1. checkbox של **משימה** (`P#-T##`) מסומן רק כשהמשימה הושלמה **והבדיקות שלה עוברות**.
2. checkbox של **בדיקת אימות** מסומן רק כשהבדיקה נכתבה, רצה, ועברה בפועל.
3. checkbox של **Exit Criteria** מסומן רק אחרי אימות מפורש.
4. checkbox של **שלב** (במעקב הראשי §4 ובסוף השלב) מסומן רק כשכל המשימות + כל הבדיקות + כל ה-Exit Criteria של השלב ירוקים.
5. **אין מעבר לשלב הבא לפני סימון סגירת השלב הנוכחי.**
6. עדכון הסימונים נעשה בקובץ זה, באותו commit שסוגר את העבודה.

### 2.4 הגדרת "שלב הושלם בצורה מושלמת"

שלב נחשב הושלם רק אם:

- כל המשימות בוצעו וה-deliverables קיימים.
- כל בדיקות השלב (unit/component/integration/rules/E2E לפי הרשימה בשלב) עוברות.
- כל בדיקות השלבים הקודמים עדיין עוברות (regression).
- `npm run typecheck && npm run lint && npm run test && npm run test:rules && npm run build` ירוקים.
- bundle scan נקי (מ-Phase 1 ואילך).
- המסמכים הקנוניים מסונכרנים.
- אין TODO קריטי פתוח בקוד השלב.

---

## 3. ערכת האימות (Verification Toolkit)

### 3.1 פקודות חובה

| פקודה | מה מאמתת | זמינה החל מ- |
|---|---|---|
| `npm run typecheck` | TypeScript strict, אפס שגיאות | Phase 1 |
| `npm run lint` | ESLint + כללי conventions | Phase 1 |
| `npm run test` | Vitest — unit + component | Phase 1 |
| `npm run test:rules` | Firestore/Storage Rules deny/allow matrix באמולטור | Phase 2 |
| `npm run build` | production build תקין | קיים (Phase 0) |
| `npm run scan:bundle` | אין forbidden strings ב-bundle | Phase 1 |
| `npm run test:e2e` | Playwright core journeys | Phase 3 ואילך |
| `firebase emulators:start --project swish-game-dev` | סביבת פיתוח מקומית מלאה | Phase 1 |

### 3.2 Forbidden bundle strings (חובה בכל scan)

```text
GEMINI_API_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_API_SECRET
PAYMENT_API_KEY
process.env.API_KEY
gemini-3-flash-preview
@google/genai
```

### 3.3 רמות בדיקה (TEST_STRATEGY)

| רמה | כלי | מתי נכתבת |
|---|---|---|
| unit | Vitest | עם כל util/schema/helper |
| component | Vitest + Testing Library | עם כל component בעל התנהגות |
| rules | Emulator Suite | עם כל שינוי rules/collection |
| integration | Emulator Suite + Vitest | עם כל Cloud Function / flow |
| E2E | Playwright | עם כל user journey קריטי |
| manual | QA checklist | בסוף כל שלב + לפני release |

---

## 4. מעקב התקדמות ראשי

סטטוס-על של כל שלב. checkbox כאן מסומן **רק** כשהשלב כולו (משימות + בדיקות + Exit Criteria) ירוק.

- [x] **Phase 0 — Security & Hygiene** (תלוי ב: —, אומדן S–M, milestone M0→M1) ✅
- [ ] **Phase 1 — Foundation** (תלוי ב: 0, אומדן L, milestone M1)
- [ ] **Phase 2 — Auth & Data Layer** (תלוי ב: 1, אומדן L, milestone M2)
- [ ] **Phase 3 — Discovery & Matching** (תלוי ב: 2, אומדן L, milestone M3)
- [ ] **Phase 4 — Chat** (תלוי ב: 3, אומדן M–L, milestone M4)
- [ ] **Phase 5 — Economy & Cosmetics** (תלוי ב: 2; UI: 3, אומדן L, milestone M5)
- [ ] **Phase 6 — Subscription (RevenueCat)** (תלוי ב: 5, אומדן L, milestone M5)
- [ ] **Phase 7 — AI Hub** (תלוי ב: 2, אומדן M, milestone M6)
- [ ] **Phase 8 — Safety, Account Lifecycle & Hardening** (תלוי ב: 3, 4, אומדן L, milestone M6)
- [ ] **Phase 9 — QA, Observability & Launch Readiness** (תלוי ב: הכל, אומדן L, milestone M7–M8)

הערה: Phases 5–7 ניתנים למקבול חלקי אחרי Phase 2, כל עוד ה-dependency chain של ROADMAP §8 נשמר.

---

## 5. Phase 0 — Security & Hygiene

**מטרה:** לנטרל את חשיפת ה-Gemini key ולנקות את שרידי ה-prototype לפני כל עבודה אחרת.
**מקור:** MIGRATION_PLAN Phase 0. **אומדן כולל:** S–M.

### 5.1 משימות

- [x] **P0-T01 — הסרת Gemini מה-client** `(S)` — `services/geminiService.ts` הוחלף ב-safe stub; `@google/genai` הוסר מ-`package.json`, מ-`index.html` importmap ומ-node_modules; `define` של `process.env.API_KEY`/`GEMINI_API_KEY` הוסר מ-`vite.config.ts`.
- [x] **P0-T02 — ביטול מזהה מודל שגוי** `(S)` — אפס מופעי `gemini-3-flash-preview` בקוד (אומת ב-grep).
- [x] **P0-T03 — ניקוי קוד מת** `(S)` — נמחקו FeatureTable, GeminiFeatureIdeation, Roadmap, Section, PersonaCard + הטיפוסים Persona/Feature/RoadmapItem/GeneratedIdea. (החלפת `dogame` classes — ב-Phase 1.2 לפי MIGRATION_PLAN.)
- [x] **P0-T04 — rotate API key** `(S)` — ה-key שנחשף נמחק על ידי בעל החשבון ב-Google AI Studio (אושר 2026-07-05).

### 5.2 בדיקות ואימות

- [x] `grep` על הריפו: אפס תוצאות ל-`@google/genai`, `GEMINI_API_KEY`, `process.env.API_KEY`, `gemini-3-flash-preview` בקוד client.
- [x] `npm run build` עובר (566ms, bundle זהה); `tsc --noEmit` נקי; חיפוש ב-`dist/` מאשר שאין את המחרוזות האסורות.
- [x] האפליקציה עדיין עולה (`npm run dev` + preview) — UI מלא נטען, אפס שגיאות console.

### 5.3 Exit Criteria

- [x] אפס secrets בקוד וב-bundle.
- [x] ה-key הישן בוטל בפועל (נמחק ב-Google AI Studio).
- [x] commit נקי נדחף.

### 5.4 סגירת שלב

- [x] **✅ Phase 0 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 6. Phase 1 — Foundation

**מטרה:** תשתית מקצועית מלאה — tooling, מבנה תיקיות, i18n, Firebase, CI — שכל השלבים הבאים נשענים עליה.
**מקור:** MIGRATION_PLAN Phase 1 + ADR-035 + CI_CD. **אומדן כולל:** L.

### 6.1 משימות — Tooling & Project Structure

- [ ] **P1-T01 — Tailwind כ-build dependency** `(M)` — הסרת CDN; התקנת Tailwind + config עם ה-design tokens מ-DESIGN_SYSTEM (Dark Matter, amber `#F59E0B`, Rubik).
- [ ] **P1-T02 — ESLint + Prettier** `(S)` — כללי CONVENTIONS (named exports, no `any`, import order); script `npm run lint` אמיתי (לא רק tsc).
- [ ] **P1-T03 — Vitest + Testing Library** `(S)` — הקמת `npm run test`, קובץ בדיקה ראשון עובר.
- [ ] **P1-T04 — מבנה feature-based** `(M)` — יצירת `src/app`, `src/config`, `src/features/*`, `src/shared` לפי CONVENTIONS §2; העברת קוד prototype רלוונטי.
- [ ] **P1-T05 — React Router** `(M)` — routes בסיסיים: `/login`, `/onboarding`, `/discover`, `/matches`, `/chat/:chatId`, `/shop`, `/profile`, `/ai`, `/settings` + route guards ריקים.
- [ ] **P1-T06 — Zustand + Zod + React Hook Form** `(S)` — התקנה, store בסיסי ו-schema לדוגמה עם בדיקות.
- [ ] **P1-T07 — bundle scan script** `(S)` — `npm run scan:bundle` שסורק את `dist/` על כל ה-forbidden strings (§3.2) ונכשל אם נמצאו.

### 6.2 משימות — i18n & RTL/LTR (ADR-035)

- [ ] **P1-T08 — בחירת ספריית i18n** `(S)` — `react-i18next` או FormatJS (החלטה מתועדת ב-LOCALIZATION open item).
- [ ] **P1-T09 — תשתית catalogs** `(M)` — קבצי `he` + `en`, `dir`/`lang` דינמיים על `<html>`, hook `useLocale()`, persistence ל-`preferredLocale`.
- [ ] **P1-T10 — label maps typed** `(M)` — `Record<Enum, string>` לכל enum קנוני, per locale, עם בדיקת כיסוי (TC-X-002).
- [ ] **P1-T11 — RTL/LTR foundations** `(S)` — logical properties בלבד (`start`/`end`), בדיקת mirror לאייקונים כיווניים.

### 6.3 משימות — Firebase & CI

- [ ] **P1-T12 — פרויקטי Firebase** `(M)` — יצירת `swish-game-dev` + `swish-game-staging` (prod נדחה עד Phase 9); הפעלת Auth/Firestore/Storage/Functions.
- [ ] **P1-T13 — Firebase client config** `(S)` — `src/config/firebase.ts` עם `VITE_*` env vars בלבד; `.env.example`.
- [ ] **P1-T14 — Emulator Suite** `(M)` — `firebase.json` עם Auth/Firestore/Storage/Functions emulators + seed script בסיסי.
- [ ] **P1-T15 — functions workspace** `(M)` — `functions/` עם TypeScript strict, מבנה `callable/http/triggers/shared/repositories/services/schemas/types` (CONVENTIONS).
- [ ] **P1-T16 — CI pipeline (GitHub Actions)** `(M)` — workflow PR: typecheck→lint→test→build→scan:bundle לפי CI_CD §5; ללא deploy עדיין.

### 6.4 בדיקות ואימות

- [ ] כל פקודות ה-toolkit (§3.1 עד וכולל build+scan) רצות ועוברות.
- [ ] בדיקת unit לדוגמה + בדיקת component לדוגמה עוברות.
- [ ] TC-X-001 (חלקי): `lang`/`dir` נכונים ב-`he` וב-`en`; החלפת שפה חיה עובדת.
- [ ] TC-X-002: כל enum מכוסה label בשתי השפות (בדיקת טיפוסים נכשלת על חוסר).
- [ ] TC-X-009: scan:bundle נקי.
- [ ] emulators עולים; אפליקציה מתחברת אליהם ב-dev.
- [ ] CI רץ על PR ונכשל כשצריך (בדיקת שבירה מכוונת אחת).

### 6.5 Exit Criteria

- [ ] מבנה הפרויקט תואם CONVENTIONS במלואו.
- [ ] i18n חי בשתי שפות עם RTL/LTR מתחלף.
- [ ] CI חוסם merge על כשל.
- [ ] אין רגרסיה ב-Phase 0.

### 6.6 סגירת שלב

- [ ] **✅ Phase 1 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 7. Phase 2 — Auth & Data Layer

**מטרה:** משתמש אמיתי: הרשמה, bootstrap, onboarding, פרופיל — על סכמת הנתונים הקנונית ו-Security Rules אמיתיים.
**מקור:** MIGRATION_PLAN Phase 2 + DATA_MODEL + SECURITY. **אומדן כולל:** L.

### 7.1 משימות

- [ ] **P2-T01 — טיפוסי הליבה** `(M)` — `types/` נגזרים 1:1 מ-DATA_MODEL (UserDocument, PublicProfileDocument, enums…) + Zod schemas.
- [ ] **P2-T02 — Firebase Auth** `(M)` — Google + email/password; מסכי login/signup; מיפוי שגיאות ל-i18n (בלי raw Firebase errors).
- [ ] **P2-T03 — User bootstrap** `(M)` — יצירת `users/{uid}` + `users/{uid}/private/account` בהרשמה, idempotent (retry-safe).
- [ ] **P2-T04 — Onboarding flow** `(L)` — steps: basics → game (מ-`gameCatalog` seeded) → completion; חסימת `/discover` עד השלמה; `skillLevel` enum אנגלית.
- [ ] **P2-T05 — `syncPublicProfile`** `(M)` — callable + triggers `onUserProfileUpdated`/`onUserGameUpdated`; אין שדות פרטיים ב-public.
- [ ] **P2-T06 — Profile view/edit** `(M)` — מסך פרופיל עם קריאה/עדכון שדות מותרים בלבד; `preferredLocale` setting.
- [ ] **P2-T07 — Security Rules v1** `(L)` — rules מלאים ל-`users`, `publicProfiles`, `gameCatalog` לפי SECURITY, כולל חסימת כל ה-server-owned fields.
- [ ] **P2-T08 — rules test harness** `(M)` — `npm run test:rules` עם deny/allow matrix ראשוני.
- [ ] **P2-T09 — Emulator seed** `(S)` — סקריפט seed: משתמשים, gameCatalog, פרופילים discoverable.

### 7.2 בדיקות ואימות

**Test cases (TEST_CASES):** `TC-AUTH-001…008`, `TC-ONB-001…006`, `TC-PROF-001…004`, `TC-SEC-012`, `TC-SEC-019`.

- [ ] TC-AUTH-001…008 עוברים (signup Google/email, routing, logout, שגיאות, bootstrap כפול idempotent).
- [ ] TC-ONB-001…006 עוברים, כולל `skillLevel = "expert"` נדחה ב-Zod וב-rules (TC-ONB-006).
- [ ] TC-PROF-001…004 עוברים, כולל rules: user לא כותב `coins`/`isPro`/`subscription*`/`verifiedBadge`/`isSuspended`.
- [ ] user לא קורא `private/account` של אחר (TC-SEC-012); client לא כותב `gameCatalog` (TC-SEC-019).
- [ ] E2E: signup→onboarding→profile מלא בשתי השפות (he RTL / en LTR).

### 7.3 Exit Criteria

- [ ] משתמש חדש עובר מקצה לקצה עד פרופיל discoverable.
- [ ] deny matrix ירוקה במלואה על הקולקציות הקיימות.
- [ ] אפס mock data במסלול auth/onboarding/profile.

### 7.4 סגירת שלב

- [ ] **✅ Phase 2 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 8. Phase 3 — Discovery & Matching

**מטרה:** לולאת הליבה — deck, swipe, match — כולה backend-authoritative.
**מקור:** MIGRATION_PLAN Phase 3 + API_CONTRACT §3.1. **אומדן כולל:** L.

### 8.1 משימות

- [ ] **P3-T01 — Deck query (MVP)** `(M)` — שאילתת client מסוננת על `publicProfiles` לפי `gameId` (ADR-021); סינון self/swiped/matched/blocked.
- [ ] **P3-T02 — `submitSwipe`** `(L)` — callable: Zod, auth, self-swipe reject, daily limit (`system/config.limits.basicDailySwipeLimit`), transaction, deterministic IDs.
- [ ] **P3-T03 — Match creation** `(M)` — reciprocal like → `matches/{matchId}` + `chats/{chatId}` באותה transaction; idempotent.
- [ ] **P3-T04 — Swipe UI** `(M)` — SwipeCard/SwipeHud/SwipeActions עם Framer Motion; optimistic UI מתואם לתוצאת backend; disable על double-tap.
- [ ] **P3-T05 — MatchCelebration** `(S)` — overlay + CTA לצ'אט.
- [ ] **P3-T06 — Likes You** `(M)` — לפי ADR-033 (פתוח לכולם ב-MVP).
- [ ] **P3-T07 — Rules — swipes/matches** `(M)` — client לא יוצר `swipes`/`matches` ישירות; קריאת match למשתתפים בלבד.
- [ ] **P3-T08 — `system/config` seed** `(S)` — מסמך config עם featureFlags + limits בסביבת dev.

### 8.2 בדיקות ואימות

**Test cases:** `TC-DISC-001…010`, `TC-MATCH-001…005`, `TC-SEC-008…011`, `TC-SEC-020`.

- [ ] TC-DISC-001…007 עוברים (deck, filter, skip/like, empty, no-games, blocked exclusion).
- [ ] race: שני swipes הדדיים במקביל → match/chat יחיד (TC-DISC-010, TC-MATCH-004) — בדיקת emulator חובה.
- [ ] self-swipe → `self_action_forbidden` (TC-DISC-008); double-submit חסום (TC-DISC-009).
- [ ] daily limit → `resource_exhausted` אחרי ה-limit.
- [ ] TC-MATCH-001…003/005 עוברים (match, celebration, duplicate no-op).
- [ ] rules: יצירת swipe/match ישירה נדחית (TC-SEC-008/009); suspended user נדחה (TC-SEC-011); client לא כותב `system/config` (TC-SEC-020).
- [ ] E2E: userA like → userB like → celebration → chat route.

### 8.3 Exit Criteria

- [ ] לולאת discovery→swipe→match עובדת מקצה לקצה על emulators עם שני משתמשים אמיתיים.
- [ ] אפס יצירת match כפול תחת עומס (בדיקה חוזרת ×20 ריצות).

### 8.4 סגירת שלב

- [ ] **✅ Phase 3 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 9. Phase 4 — Chat

**מטרה:** צ'אט real-time בין matched users; text חינם, media גייטד ל-Pro.
**מקור:** MIGRATION_PLAN Phase 4 + API_CONTRACT. **אומדן כולל:** M–L.

### 9.1 משימות

- [ ] **P4-T01 — Chat list** `(M)` — רשימת שיחות עם `lastMessage` denormalized (trigger `onMessageCreated`).
- [ ] **P4-T02 — Real-time messages** `(M)` — subscription על `chats/{chatId}/messages`; pagination בסיסי.
- [ ] **P4-T03 — Text send** `(M)` — כתיבה ישירה של `type:"text"` תחת rules (participant, גודל, rate).
- [ ] **P4-T04 — Media Pro gating** `(M)` — `sendChatMediaMessage` callable + Storage Rules (MIME/size); Basic → `UpgradeModal` + `pro_required`.
- [ ] **P4-T05 — Block awareness hooks** `(S)` — סכמת chat תומכת `blocked` state; אכיפה מלאה תושלם ב-Phase 8.
- [ ] **P4-T06 — Rules — chats/messages** `(M)` — participants-only read/write; image ישיר נדחה (רק דרך function).

### 9.2 בדיקות ואימות

**Test cases:** `TC-CHAT-001…005`, `TC-CHAT-007…009`, `TC-SEC-013…017` (TC-CHAT-006 יאומת שוב ב-Phase 8).

- [ ] TC-CHAT-001/002/004/005 עוברים (פתיחה, שליחת text, empty/long message).
- [ ] non-participant לא קורא chat/messages (TC-CHAT-007, TC-SEC-013/014); participant text תקין מותר (TC-SEC-015).
- [ ] message `type:"image"` ישיר נדחה (TC-SEC-016).
- [ ] Basic media → `pro_required` בשרת, לא רק UI (TC-SEC-017, TC-CHAT-003).
- [ ] קובץ גדול/MIME שגוי נדחים ב-Storage Rules (TC-CHAT-008/009).
- [ ] E2E: שיחת טקסט מלאה בין שני משתמשים בשתי השפות.

### 9.3 Exit Criteria

- [ ] שני matched users משוחחים real-time על emulators.
- [ ] כל גייטי ה-media נאכפים server-side.

### 9.4 סגירת שלב

- [ ] **✅ Phase 4 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 10. Phase 5 — Economy & Cosmetics

**מטרה:** coins server-owned עם audit מלא, חנות, רכישה/ציוד, ותשתית ה-Motion & FX ל-cosmetics מונפשים.
**מקור:** MIGRATION_PLAN Phase 5 + MOTION_AND_FX + ADR-005/011/034/039. **אומדן כולל:** L.

### 10.1 משימות — Economy

- [ ] **P5-T01 — הסרת coins מקומיים** `(S)` — ביטול ה-1,000,000 placeholder; `coins` נקרא מ-`users/{uid}` בלבד.
- [ ] **P5-T02 — Signup bonus** `(M)` — הענקת coins חד-פעמית ב-bootstrap לפי `system/config` (ADR-034) + `transactions` audit.
- [ ] **P5-T03 — `shopItems` seed** `(M)` — קטלוג לפי הטקסונומיה (category/rarity/renderType) כולל `renderConfig` לפריטים מונפשים.
- [ ] **P5-T04 — `purchaseShopItem`** `(L)` — callable: transaction, `insufficient_coins`, `pro_required`, idempotency, audit, מניעת balance שלילי.
- [ ] **P5-T05 — `equipItem`** `(M)` — callable: ownership check, עדכון `users` + sync ל-`publicProfiles`.
- [ ] **P5-T06 — Shop UI** `(M)` — grid, קטגוריות, `ShopItemPreview`, `PurchaseConfirmModal`.

### 10.2 משימות — Motion & FX (ADR-039)

- [ ] **P5-T07 — `CosmeticRenderer`** `(M)` — קומפוננטת שער עם החלטת rendering לפי `renderType`/tier/reduced-motion (MOTION_AND_FX §11).
- [ ] **P5-T08 — Static + Lottie renderers** `(M)` — `static_image` (poster/fallback) + lottie micro-animations; lazy import.
- [ ] **P5-T09 — Rive renderer** `(M)` — `.riv` עם artboard/state machine; pause off-screen (IntersectionObserver).
- [ ] **P5-T10 — Video/Particle renderers** `(L)` — alpha-video dual-format (HEVC+WebM) + PixiJS particles; quality tiers + fallback.
- [ ] **P5-T11 — Sound controller** `(M)` — Howler audio sprites; off by default; mute/volume settings (MOTION_AND_FX §9).
- [ ] **P5-T12 — Rules — shop/economy** `(M)` — `shopItems` read-only ל-client; `transactions`/`ownedItems` server-only.

### 10.3 בדיקות ואימות

**Test cases:** `TC-SHOP-001…009`, `TC-SEC-001`, `TC-SEC-007`, `TC-SEC-018`, `TC-SEC-021` + MOTION_AND_FX QA §12.

- [ ] TC-SHOP-001…005/007/008 עוברים (browse, view, purchase, equip, insufficient, inactive, pro-required).
- [ ] double-purchase במקביל → חיוב יחיד (TC-SHOP-006) — emulator, ריצות חוזרות.
- [ ] שתי רכישות מקבילות מעל היתרה → לכל היותר אחת מצליחה, אין שלילי (TC-SHOP-009).
- [ ] `transactions` audit נכתב על כל שינוי coins (ADR-005); client לא יוצר transactions/כותב shopItems (TC-SEC-007/018); inactive item נדחה (TC-SEC-021); client לא משנה coins (TC-SEC-001).
- [ ] FX: כל renderer מציג fallback static כשצריך; `prefers-reduced-motion` מכובד; אנימציות offscreen מושהות (MOTION_AND_FX QA §12.1–12.3).
- [ ] FPS על מכשיר mid-tier ≥ 30 בפרופיל עם cosmetic כבד.
- [ ] סאונד לא מתנגן לפני user gesture.

### 10.4 Exit Criteria

- [ ] רכישה+ציוד עובדים מקצה לקצה עם audit מלא.
- [ ] פריט Rive אחד + פריט video אחד + פריט static רצים בייצוגיות מלאה כולל fallbacks.
- [ ] אפס דרך לשנות coins מה-client (rules ירוקות).

### 10.5 סגירת שלב

- [ ] **✅ Phase 5 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 11. Phase 6 — Subscription (RevenueCat)

**מטרה:** מנוי Pro בתשלום אמיתי דרך RevenueCat (web), entitlement רק מ-webhook מאומת.
**מקור:** MIGRATION_PLAN Phase 6 + PAYMENTS + ADR-037 + API_CONTRACT §3.13/§4.1. **אומדן כולל:** L.

### 11.1 משימות

- [ ] **P6-T01 — RevenueCat project setup** `(M)` — חשבון, product `pro` ‏29.90 ILS/חודש, entitlement mapping, sandbox.
- [ ] **P6-T02 — `createCheckoutSession`** `(M)` — callable לפי API_CONTRACT §3.13; חסימת מנוי כפול (`failed_precondition`).
- [ ] **P6-T03 — `paymentWebhook`** `(L)` — HTTP: אימות signature, נורמליזציית events, idempotency לפי event ID, כתיבת `subscriptions/{uid}`.
- [ ] **P6-T04 — Entitlement sync** `(M)` — trigger `onSubscriptionUpdated` → `users` (`isPro`, tier, status, expiresAt) → `publicProfiles.verifiedBadge`.
- [ ] **P6-T05 — Pro gating אחיד** `(M)` — hook `useEntitlement()`; אכיפה כפולה — UI + functions/rules.
- [ ] **P6-T06 — UpgradeModal + subscription screen** `(M)` — מחיר, חידוש, ביטול; מצבי active/past_due/cancelled/expired.
- [ ] **P6-T07 — Lifecycle handling** `(M)` — renewal, cancellation, expiration, refund/chargeback לפי PAYMENTS state machine.

### 11.2 בדיקות ואימות

**Test cases:** `TC-SUB-001…009`, `TC-SEC-002…006`, `TC-SEC-022/023/025`.

- [ ] TC-SUB-001/002/005 עוברים (upgrade modal, checkout session, כפל מנוי חסום).
- [ ] webhook עם signature שגוי → 401/400, אפס שינוי entitlement (TC-SUB-009/TC-SEC-022).
- [ ] webhook כפול (replay) → idempotent (TC-SEC-023).
- [ ] redirect/success URL בלי webhook → נשאר Basic (TC-SUB-004). **בדיקה קריטית.**
- [ ] sandbox purchase מלא: checkout → webhook → `isPro=true` → `verifiedBadge` מוצג (TC-SUB-003).
- [ ] expiry/cancellation/refund → entitlement יורד בהתאם (TC-SUB-006/007/008).
- [ ] rules: client לא כותב `isPro`/`subscriptionTier`/`subscriptionStatus`/`subscriptionExpiresAt`/`verifiedBadge` (TC-SEC-002…006).
- [ ] scan:bundle: אפס payment secrets (TC-SEC-025).

### 11.3 Exit Criteria

- [ ] רכישת Pro אמיתית ב-sandbox עובדת מקצה לקצה.
- [ ] כל מסלולי ה-lifecycle מכוסים בבדיקות integration.
- [ ] אין שום דרך ל-Pro בלי webhook מאומת.

### 11.4 סגירת שלב

- [ ] **✅ Phase 6 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 12. Phase 7 — AI Hub

**מטרה:** פיצ'רי AI דרך proxy שרת בלבד, עם guardrails, audit ו-rate limits.
**מקור:** MIGRATION_PLAN Phase 7 + AI_INTEGRATION. **אומדן כולל:** M.

### 12.1 משימות

- [ ] **P7-T01 — Secret Manager** `(S)` — `GEMINI_API_KEY` ב-Secret Manager; אימות מזהה מודל production (לא `gemini-3-flash-preview`).
- [ ] **P7-T02 — `sendAIProfileReview`** `(M)` — callable: Zod, guardrails, קריאת Gemini server-side, `aiRequests` audit.
- [ ] **P7-T03 — `sendAISquadAdvice`** `(M)` — כנ"ל לפי החוזה.
- [ ] **P7-T04 — Rate limits** `(S)` — לפי `system/config.limits.ai*` → `resource_exhausted` (ADR-027 placeholder).
- [ ] **P7-T05 — AI Hub UI** `(M)` — `/ai` עם loading/result/refusal/error states; `AIRefusalState`.
- [ ] **P7-T06 — Safe logging** `(S)` — אפס prompts/responses בלוגים/analytics; normalized errors בלבד.

### 12.2 בדיקות ואימות

**Test cases:** `TC-AI-001…007`, `TC-SEC-024`, `TC-SEC-026`.

- [ ] TC-AI-001…003 עוברים (hub, profile review, squad advice — דרך callables בלבד).
- [ ] provider failure → error בטוח + `aiRequests.status="failed"` (TC-AI-004).
- [ ] unsafe input → refusal/blocked + audit (TC-AI-005).
- [ ] ספאם → `resource_exhausted` (TC-AI-006); input ארוך נדחה לפני provider (TC-AI-007).
- [ ] scan:bundle: אפס `@google/genai`/key (TC-SEC-024).
- [ ] בדיקת log capture: אפס prompt בלוגים (TC-SEC-026).

### 12.3 Exit Criteria

- [ ] שני הפיצ'רים עובדים עם Gemini אמיתי ב-dev, עם audit מלא.
- [ ] feature flag `aiHubEnabled` מכבה את ה-Hub בפועל.

### 12.4 סגירת שלב

- [ ] **✅ Phase 7 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 13. Phase 8 — Safety, Account Lifecycle & Hardening

**מטרה:** report/block מלאים, `deleteAccount`, והקשחת rules/storage כוללת.
**מקור:** MIGRATION_PLAN Phase 8 + TRUST_AND_SAFETY + ADR-038. **אומדן כולל:** L.

### 13.1 משימות

- [ ] **P8-T01 — `blockUser`** `(M)` — callable + `onBlockCreated`: block doc, סגירת match/chat, הוצאה מ-discovery.
- [ ] **P8-T02 — `createReport`** `(M)` — callable: reasons enum (8), sources, `reports/{id}` status=open; פרטיות מלאה.
- [ ] **P8-T03 — Safety UI** `(M)` — ReportModal, BlockConfirmModal, safety menu בפרופיל/צ'אט.
- [ ] **P8-T04 — `deleteAccount` (ADR-038)** `(L)` — callable לפי API_CONTRACT §3.14: confirm, ביטול מנוי, מחיקה/anonymization, `isDeleted=true`, retention exceptions.
- [ ] **P8-T05 — Settings → Delete flow** `(M)` — UI מחיקה עם אזהרות מנוי/נתונים; עמוד web ציבורי למחיקה (דרישת Google עתידית).
- [ ] **P8-T06 — suspended/deleted enforcement** `(M)` — כל ה-callables דוחים `isSuspended`/`isDeleted`; route guard ל-account state.
- [ ] **P8-T07 — Rules hardening סופי** `(L)` — מעבר מלא על SECURITY §9 deny matrix; Storage Rules סופיים; chat blocked enforcement (השלמת P4-T05).
- [ ] **P8-T08 — Moderation review מינימלי** `(S)` — תהליך פנימי לצפייה ב-reports + escalation owner.

### 13.2 בדיקות ואימות

**Test cases:** `TC-SAFE-001…006`, `TC-CHAT-006`, `TC-DISC-007`, `TC-SEC-001…026` (ריצה מלאה).

- [ ] TC-SAFE-001…004/006 עוברים (report, block, duplicate report, block-after-report, moderation path).
- [ ] block → target נעלם מ-discovery (TC-DISC-007) + צ'אט נחסם (TC-CHAT-006).
- [ ] self-report/self-block → `self_action_forbidden` (TC-SAFE-005).
- [ ] reports לא קריאים למשתמש רגיל; block list פרטי.
- [ ] `deleteAccount`: משתמש נמחק, נעלם מ-discovery, לא יכול להתחבר ל-core app; ריצה כפולה idempotent.
- [ ] suspended user נדחה בכל callable (TC-SEC-011).
- [ ] **deny matrix מלאה ירוקה — כל 26 בדיקות TC-SEC.**

### 13.3 Exit Criteria

- [ ] כל פעולות הבטיחות עובדות ונאכפות server-side.
- [ ] מחיקת חשבון עומדת ב-ADR-038 מקצה לקצה.
- [ ] אפס פערי rules ידועים.

### 13.4 סגירת שלב

- [ ] **✅ Phase 8 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 14. Phase 9 — QA, Observability & Launch Readiness

**מטרה:** ייצוב, ניטור, ותנאי Go/No-Go לפי ROADMAP §9.
**מקור:** ROADMAP Phase 11 + OBSERVABILITY + ANALYTICS + CI_CD §10. **אומדן כולל:** L.

### 14.1 משימות

- [ ] **P9-T01 — E2E suite מלא** `(L)` — Playwright: כל ה-core journeys (signup→onboarding→discover→match→chat→shop→pro→ai→report/block→delete) בשתי השפות + viewports ניידים.
- [ ] **P9-T02 — Analytics events** `(M)` — כל האירועים מ-ANALYTICS מחוברים; בדיקת no-PII (TC-X-008).
- [ ] **P9-T03 — Observability** `(L)` — structured logging בכל function; dashboards + alerts לפי ROADMAP §9.9 (webhook failures, negative coins, rule denials, AI cost).
- [ ] **P9-T04 — סביבת staging מלאה** `(M)` — deploy pipeline ל-staging (CI_CD §6–8), smoke suite אוטומטי.
- [ ] **P9-T05 — סביבת production** `(M)` — יצירת `swish-game-prod`, secrets, protected environment, manual approval gate.
- [ ] **P9-T06 — Accessibility & RTL/LTR QA** `(M)` — TC-X-001…007 מלאים; keyboard/focus/contrast; `prefers-reduced-motion`.
- [ ] **P9-T07 — Performance QA** `(M)` — Lighthouse mobile, bundle size, FX budgets (MOTION_AND_FX §6) על מכשירים אמיתיים.
- [ ] **P9-T08 — Legal gate** `(תלוי-חיצוני)` — אישור עו"ד ל-Privacy/ToS/גיל 16+/refunds; פרסום ב-URL ציבורי.
- [ ] **P9-T09 — Go/No-Go review** `(S)` — מעבר מלא על ROADMAP §9.11 + DEFINITION_OF_DONE §6.

### 14.2 בדיקות ואימות

- [ ] **כל** ה-P0 test cases מ-TEST_CASES ירוקים (traceability matrix §16 שם).
- [ ] staging smoke: signup→match→chat→purchase→pro-webhook→ai→report — אוטומטי וירוק.
- [ ] TC-X-001…009 מלאים.
- [ ] deploy אמיתי ל-staging דרך CI בלבד; rollback מתורגל פעם אחת בפועל.
- [ ] post-deploy monitoring window מוגדר (30–60 דק').

### 14.3 Exit Criteria — Go/No-Go

- [ ] כל סעיפי ROADMAP §9.1–§9.10 מסומנים.
- [ ] אף אחד מתנאי ה-No-Go (§9.11) לא מתקיים.
- [ ] legal sign-off התקבל.

### 14.4 סגירת שלב

- [ ] **✅ Phase 9 הושלם — המוצר מוכן ל-production launch; מסומן גם ב-§4.**

---

## 15. Workstreams רוחביים

פעילויות שרצות לאורך כל השלבים, לא כשלב נפרד:

| Workstream | כלל | אכיפה |
|---|---|---|
| i18n | כל string חדש נכנס ל-catalogs `he`+`en` באותו PR | lint rule / review checklist |
| Docs sync | שינוי חוזה = עדכון המסמך באותו PR (DoD §3.5) | PR template |
| Security | כל collection חדש מקבל rules+tests לפני שימוש | test:rules ב-CI |
| Analytics | כל feature מוסיף את האירועים שלו מ-ANALYTICS | phase checklist |
| Observability | כל function מקבלת structured logging מהיום הראשון | code review |
| Regression | כל שלב מריץ את כל בדיקות השלבים הקודמים | CI מלא |
| FX budget | כל cosmetic חדש עובר את ה-Asset Review Checklist (MOTION_AND_FX §4.7) | catalog governance |
| **Progress tracking** | **סימון checkboxes בקובץ זה לפי הפרוטוקול ב-§2.3, באותו commit שסוגר את העבודה** | **review** |

---

## 16. מטריצת עקיבות בדיקות לפי שלב

| Phase | Test Cases (TEST_CASES) | סוגי בדיקה עיקריים |
|---|---|---|
| 0 | scan ידני + build | manual/build |
| 1 | TC-X-001 (חלקי), TC-X-002, TC-X-009 | unit/build/CI |
| 2 | TC-AUTH-001…008, TC-ONB-001…006, TC-PROF-001…004, TC-SEC-012/019 | כל הרמות |
| 3 | TC-DISC-001…010, TC-MATCH-001…005, TC-SEC-008…011, TC-SEC-020 | integration/rules/E2E |
| 4 | TC-CHAT-001…005/007…009, TC-SEC-013…017 | rules/integration/E2E |
| 5 | TC-SHOP-001…009, TC-SEC-001/007/018/021 + MOTION_AND_FX QA §12 | integration/component/manual |
| 6 | TC-SUB-001…009, TC-SEC-002…006/022/023/025 | integration |
| 7 | TC-AI-001…007, TC-SEC-024/026 | integration/unit |
| 8 | TC-SAFE-001…006, TC-CHAT-006, TC-DISC-007, **TC-SEC-001…026 מלא** | rules/integration/E2E |
| 9 | TC-X-001…009 מלא + כל ה-P0 regression | E2E/manual/CI |

---

## 17. ניהול סיכונים

| סיכון | הסתברות | השפעה | מיטיגציה |
|---|---|---|---|
| ADR-017 (ספק web מאחורי RevenueCat) לא נסגר בזמן | בינונית | חוסם Phase 6 | לסגור החלטה לפני תחילת Phase 6; RevenueCat Web Billing כברירת מחדל |
| ביצועי FX חלשים במכשירים אמיתיים | בינונית | UX ליבה של cosmetics | quality tiers + fallbacks מיום ראשון; בדיקת מכשיר אמיתי כבר ב-Phase 5 |
| race conditions ב-match/purchase | בינונית | data integrity | transactions + deterministic IDs + בדיקות מקביליות חוזרות ב-CI |
| legal review מתעכב | בינונית | חוסם launch בלבד | להתחיל מוקדם (במקביל ל-Phase 6) |
| עלויות Gemini/Firebase חורגות | נמוכה-בינונית | תפעולי | rate limits, budget alerts, feature flags לכיבוי |
| scope creep מעבר ל-MVP | גבוהה | לוח זמנים | כל פיצ'ר חדש דורש ADR; ROADMAP tiers נאכפים |

---

## 18. שלבים עתידיים (Post-MVP)

מחוץ להיקף תוכנית זו; מתועדים בקצרה לשמירת כיוון:

| שלב | תוכן | מקור |
|---|---|---|
| V1 | automated moderation, Likes You gating (ADR-033), throttles, analytics dashboards | ROADMAP §5 |
| Scale/V1 | `moderationActions`, `billingEvents`, `reconcileSubscription`, moderation panel | ROADMAP §6 |
| Store distribution | Capacitor packaging, store IAP דרך RevenueCat, privacy manifests, age ratings — **checklist מלא ב-`STORE_COMPLIANCE.md` §8** | ADR-036/037 |

---

## 19. Open Items

| פריט | תלוי ב- | חוסם |
|---|---|---|
| בחירת ספריית i18n סופית (P1-T08) | החלטת engineering | Phase 1 |
| ערכי limits סופיים (swipes/AI/bio) | ADR-015/027/031 | לא חוסם — placeholders ב-config |
| ספק web מאחורי RevenueCat | ADR-017 | Phase 6 |
| מדיניות cosmetics אחרי פקיעת Pro | ADR-032 | לא חוסם MVP |
| legal sign-off | עו"ד | Phase 9 בלבד |
| מכשירי בדיקה אמיתיים (low/mid/high) | רכש/זמינות | Phase 5 FX QA |
