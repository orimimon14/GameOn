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
- [x] **Phase 1 — Foundation** (תלוי ב: 0, אומדן L, milestone M1) ✅
- [x] **Phase 2 — Auth & Data Layer** (תלוי ב: 1, אומדן L, milestone M2) ✅
- [x] **Phase 3 — Discovery & Matching** (תלוי ב: 2, אומדן L, milestone M3) ✅
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

- [x] **P1-T01 — Tailwind כ-build dependency** `(M)` — CDN הוסר; Tailwind v3 + PostCSS מותקנים; `tailwind.config.ts` עם הטוקנים הקנוניים (DESIGN_SYSTEM §13); כל 231 מופעי `dogame-*` הוחלפו בטוקנים סמנטיים (MIGRATION_PLAN §1.2 בוצע יחד); importmap CDN של React הוסר. אומת: typecheck+build ירוקים, preview מציג צבעים קנוניים מדויקים (#0F172A/#6366F1/#1E293B), Rubik נטען, אפס אזהרות console.
- [x] **P1-T02 — ESLint + Prettier** `(S)` — ESLint 9 flat config + typescript-eslint + react-hooks + import/order + Prettier; `no-explicit-any` error; scripts הופרדו (`typecheck`=tsc, `lint`=eslint); **`strict: true` הופעל ב-tsconfig** (עבר נקי); תוקנו 2 `any`, 3 unused, ובאג rules-of-hooks אמיתי (useMemo מותנה ב-SwipeView). lint נקי לחלוטין. (אכיפת named-exports תתווסף ב-P1-T04.)
- [x] **P1-T03 — Vitest + Testing Library** `(S)` — Vitest + @testing-library/react + jest-dom + jsdom; setup עם matchMedia stub; 2 בדיקות עוברות (unit ל-stub + component ל-App בעברית).
- [x] **P1-T04 — מבנה feature-based** `(M)` — כל הקוד הועבר (git mv) ל-`src/app|config|shared|features/{auth,onboarding,profile,discovery,matches,chat,shop,subscription,ai,safety}`; SwipeView/LikesGrid/SideNav חולצו מ-App לקבצים ייעודיים; **named exports בכל src/** + כלל `import/no-default-export` (error) + `import/order` (error); alias `@/`→src.
- [x] **P1-T05 — React Router** `(M)` — react-router-dom 7; routes: `/login`, `/onboarding`, `/discover`, `/likes`, `/games`, `/chat`, `/shop`, `/profile`, `/settings`, `/subscriptions`, `/ai` + fallback→`/discover`; `RequireAuth` guard placeholder (אכיפה אמיתית ב-P2-T02); `/chat/:chatId` יתווסף ב-Phase 4. אומת חי: ניווט SPA משנה URL+תוכן, אפס שגיאות console.
- [x] **P1-T06 — Zustand + Zod + React Hook Form** `(S)` — הותקנו; `uiStore` (theme+game filter) מחווט ל-App עם 3 בדיקות; `profileEditSchema` (zod, גיל מינימום 16 לפי ADR-013) מחווט ל-ProfileView עם 4 בדיקות; RHF מותקן — שימוש בפועל בטפסי Phase 2.
- [x] **P1-T07 — bundle scan script** `(S)` — `scripts/scan-bundle.mjs` + `npm run scan:bundle`; סורק את כל dist/ על 7 המחרוזות האסורות; PASS.

### 6.2 משימות — i18n & RTL/LTR (ADR-035)

- [x] **P1-T08 — בחירת ספריית i18n** `(S)` — נבחר **react-i18next** (עודכן ב-LOCALIZATION open items).
- [x] **P1-T09 — תשתית catalogs** `(M)` — `src/config/i18n.ts` + catalogs he/en (typed — key חסר נכשל ב-typecheck); `LocaleSync` מעדכן `lang`/`dir` על `<html>`; hook `useLocale()`; persistence ל-localStorage (`preferredLocale`; sync ל-Firestore ב-Phase 2); מחליף שפה חי ב-Settings. אומת בלייב: en→ltr+"Shop", he→rtl+"חנות". מסכי prototype ישנים יעברו ל-catalogs כשייבנו מחדש (workstream).
- [x] **P1-T10 — label maps typed** `(M)` — enums קנוניים ב-`src/shared/enums.ts` (SkillLevel/Platform/LookingFor/ShopItemCategory/Rarity/ReportReason); `src/shared/labels/` he+en לפי LOCALIZATION §4 + hook `useLabels()`; 12 בדיקות כיסוי (TC-X-002).
- [x] **P1-T11 — RTL/LTR foundations** `(S)` — shell הומר ל-logical properties (`end-0`/`border-s`/`me-`/`rounded-s`/`text-start`); ה-nav עובר צד אוטומטית עם `dir`. המרת ה-views הישנים — עם בנייתם מחדש.

### 6.3 משימות — Firebase & CI

- [x] **P1-T12 — פרויקטי Firebase** `(M)` — `swish-game-dev` + `swish-game-staging` נוצרו וחוברו ל-Firebase (אחרי אישור ToS ע"י הבעלים); web apps רשומים בשניהם; `.env.local` מולא ב-config אמיתי של dev; `.firebaserc` עם aliases. הפעלת ספקי Auth בקונסולה + יצירת Firestore DB בענן — בתחילת Phase 2 (P2-T02/P2-T07). ⚠️ נוצר בטעות פרויקט עודף `swish-and-game` — למחיקה בקונסולה.
- [x] **P1-T13 — Firebase client config** `(S)` — `firebase` SDK הותקן; `src/config/firebase.ts` (רק `VITE_*`, lazy init, חיבור אמולטורים כש-`VITE_USE_EMULATORS=true`); `.env.example` + `.env.local` (gitignored).
- [x] **P1-T14 — Emulator Suite** `(M)` — `firebase.json` (auth/firestore/storage/functions/ui) + baseline deny rules + `scripts/emulator-smoke.mjs`; **smoke מלא PASS** כולל קריאת callable מקצה לקצה. seed מלא — P2-T09.
- [x] **P1-T15 — functions workspace** `(M)` — `functions/` TS strict (build+typecheck ירוקים), מבנה CONVENTIONS מלא, callable ראשון `ping` עובד באמולטור, engines node 22.
- [x] **P1-T16 — CI pipeline (GitHub Actions)** `(M)` — `.github/workflows/ci.yml`: web (typecheck/lint/test/build/scan) + functions (build) על PR+main.

### 6.4 בדיקות ואימות

- [x] כל פקודות ה-toolkit (§3.1 עד וכולל build+scan) רצות ועוברות (typecheck/lint/test/build/scan:bundle; test:rules — Phase 2).
- [x] בדיקת unit לדוגמה + בדיקת component לדוגמה עוברות (27 בדיקות ב-6 קבצים).
- [x] TC-X-001 (חלקי): `lang`/`dir` נכונים ב-`he` וב-`en`; החלפת שפה חיה אומתה בדפדפן.
- [x] TC-X-002: כל enum מכוסה label בשתי השפות (12 בדיקות + אכיפת טיפוסים).
- [x] TC-X-009: scan:bundle נקי.
- [x] emulators עולים — smoke מלא ALL PASS כולל callable; חיבור ה-UI לאמולטורים מחווט ב-`firebase.ts` (שימוש בפועל — Phase 2).
- [x] CI רץ ב-GitHub — run ראשון על main הסתיים `success` (web+functions); fail-path אומת לוקאלית לאורך הפיתוח.

### 6.5 Exit Criteria

- [x] מבנה הפרויקט תואם CONVENTIONS במלואו.
- [x] i18n חי בשתי שפות עם RTL/LTR מתחלף (אומת בדפדפן).
- [x] CI פעיל וירוק על main/PRs. (הפיכת ה-checks לחוסמי-merge = branch protection בהגדרות GitHub — נדרש לפני production gate ב-Phase 9; מומלץ להגדיר מוקדם.)
- [x] אין רגרסיה ב-Phase 0 (scan:bundle נקי בכל commit).

### 6.6 סגירת שלב

- [x] **✅ Phase 1 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 7. Phase 2 — Auth & Data Layer

**מטרה:** משתמש אמיתי: הרשמה, bootstrap, onboarding, פרופיל — על סכמת הנתונים הקנונית ו-Security Rules אמיתיים.
**מקור:** MIGRATION_PLAN Phase 2 + DATA_MODEL + SECURITY. **אומדן כולל:** L.

### 7.1 משימות

- [x] **P2-T01 — טיפוסי הליבה** `(M)` — `src/shared/enums.ts` הושלם לכל 21 ה-enums הקנוניים (עם runtime arrays ל-Zod/tests); `src/shared/models.ts` — UserDocument, PrivateAccountDocument, PublicProfileDocument, UserGameDocument, GameCatalogDocument נגזרים 1:1 מ-DATA_MODEL §4; `src/shared/schemas/userSchemas.ts` — Zod לשדות client-writable (גיל 16+, enums אנגלית בלבד) עם 12 בדיקות כולל דחיית `"expert"` ועברית כ-enum. מודלים של matches/chat/shop יתווספו בשלבים שלהם.
- [x] **P2-T02 — Firebase Auth** `(M)` — `authService` (email/password + Google popup + signOut) עם מיפוי שגיאות מלא ל-i18n (12 קודים, אפס raw errors); `authStore` (Zustand) עם listener יחיד; `LoginPage` אמיתי (RHF+Zod, דו-לשוני, מצבי login/signup, loading/error states); `RequireAuth` אוכף בפועל (loading/redirect/outlet); logout מחווט ב-Settings. 19 בדיקות חדשות (58 סה"כ) + תוקן באג cleanup ב-Testing Library. **E2E חי מול Auth Emulator: guard→signup→כניסה לאפליקציה→logout→חזרה ל-login, אפס שגיאות console.**
- [x] **P2-T03 — User bootstrap** `(M)` — ארכיטקטורה דו-שלבית לפי SECURITY: ה-client יוצר `users/{uid}` עם client-writable keys בלבד (`ensureUserDocument`, retry-safe, 3 בדיקות); טריגר שרת חדש **`onUserCreated`** ממלא server-owned defaults ויוצר `private/account` (set-if-missing merge = idempotent). **פער תיעוד נסגר: הטריגר נוסף ל-API_CONTRACT §5.9 באותו commit.** E2E מלא: הרשמה בדפדפן → אומת ב-Firestore ש-12 שדות השרת מולאו + private/account נוצר (client חסום).
- [x] **P2-T04 — Onboarding flow** `(L)` — אשף דו-שלבי (basics: שם/גיל/ביו/skill/platforms → game: בחירה מהקטלוג+rank+lookingFor+voice) עם RHF+Zod דו-לשוני; `RequireOnboarding` guard חוסם את ה-shell עד השלמה; **פער חוזה נסגר: callable חדש `completeOnboarding` נוסף ל-API_CONTRACT §3.15** (כי `onboardingCompleted`/`publicProfiles` הם server-owned ויצירת game דורשת onboarding שהושלם); labels ל-voicePreference נוספו. 9 בדיקות UI+guard. **E2E מלא: הרשמה→נחיתה אוטומטית באשף→מילוי→נחיתה ב-discover; אומת ב-DB: onboardingCompleted=true, game doc, publicProfile.**
- [x] **P2-T05 — `syncPublicProfile`** `(M)` — שירות sync משותף (`publicProfileSync`) בונה את `publicProfiles/{uid}` מ-users+games פעילים (ללא שדות פרטיים; `verifiedBadge`=isPro לפי ADR-025); callable `syncPublicProfile` לפי החוזה §3.9 (owner/admin, `failed_precondition` לפני onboarding); triggers `onUserProfileUpdated`+`onUserGameUpdated` שומרים סנכרון על כל עריכה. אומת ב-E2E (publicProfile נוצר ומדויק).
- [x] **P2-T06 — Profile view/edit** `(M)` — `MyProfilePage` על נתוני Firestore חיים (userStore): תצוגה (שם/גיל/ביו/skill/platforms/coins/tier/משחקים) + עריכת client-writable בלבד (RHF+Zod משותף עם onboarding); עריכה→trigger מסנכרן publicProfiles אוטומטית (אומת E2E). **פער עקביות נסגר: `preferredLocale` נוסף ל-userClientWritableKeys ב-SECURITY+rules** (+2 בדיקות rules=49); בחירת שפה נשמרת ל-Firestore ומוחלת בהתחברות. צפייה בפרופיל של אחרים נשארת mock עד Phase 3. 4 בדיקות UI.
- [x] **P2-T07 — Security Rules v1** `(L)` — **ה-ruleset הקנוני המלא** מ-SECURITY §4 הועתק ל-`firestore.rules` (כל הקולקציות: users/private/games/swipes/blocks/ownedItems/transactions/usage/publicProfiles/discovery/matches/chats/messages/shop/catalog/subscriptions/billing/ai/reports/moderation/system + default deny). קומפל ורץ באמולטור; allow-path של bootstrap אומת ב-E2E. deny/allow matrix מלא — ב-P2-T08.
- [x] **P2-T08 — rules test harness** `(M)` — `npm run test:rules` (emulators:exec + vitest config נפרד) עם **מטריצת deny/allow של 47 בדיקות**: users (create/read/update, server-owned, enums, suspended), private/account, games (onboarding gate, catalog), כל הקולקציות server-only (TC-SEC-001..009, 018..020), קריאות (publicProfiles/reports/billing/system), chats+messages (participant, text-only, TC-SEC-013/015/016), reports (self-report deny). 47/47 ✓. נוסף ל-CI עם cache לאמולטור.
- [x] **P2-T09 — Emulator seed** `(S)` — `npm run seed` (REST טהור, ללא תלויות): 6 משחקים ב-gameCatalog עם supportedRanks, `system/config` מלא (flags+limits+billing+ai), 3 משתמשי דמו (auth+users+private+games+publicProfiles discoverable, סיסמה `demo123456`). אומת: ריצה כפולה idempotent (אותם UIDs), התחברות דמו עובדת, כל הספירות נכונות.

### 7.2 בדיקות ואימות

**Test cases (TEST_CASES):** `TC-AUTH-001…008`, `TC-ONB-001…006`, `TC-PROF-001…004`, `TC-SEC-012`, `TC-SEC-019`.

- [x] TC-AUTH ליבה: signup/login/logout/re-login חיים באמולטור; שגיאות i18n; bootstrap כפול idempotent (E2E+unit). (Google popup — נבדק mocked; E2E מלא ב-staging.)
- [x] TC-ONB ליבה: אשף מלא E2E; `skillLevel="expert"` נדחה ב-Zod (unit) וב-rules (rules test); guard חוסם discovery.
- [x] TC-PROF: תצוגה/עריכה E2E; rules: כל ה-server-owned חסומים (49 בדיקות deny/allow).
- [x] TC-SEC-012/019 במטריצת ה-rules.
- [x] E2E he מלא (signup→onboarding→profile); en אומת ברמת i18n חי + typed catalogs (E2E מלא en — ב-P9 E2E suite).

### 7.3 Exit Criteria

- [x] משתמש חדש עובר מקצה לקצה עד פרופיל discoverable (אומת E2E כולל publicProfiles).
- [x] deny matrix ירוקה במלואה על הקולקציות הקיימות (49/49, גם ב-CI).
- [x] אפס mock data במסלול auth/onboarding/הפרופיל האישי. (צפייה בפרופיל של *אחרים* — mock עד ה-discovery האמיתי ב-Phase 3, מתועד.)

### 7.4 סגירת שלב

- [x] **✅ Phase 2 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 8. Phase 3 — Discovery & Matching

**מטרה:** לולאת הליבה — deck, swipe, match — כולה backend-authoritative.
**מקור:** MIGRATION_PLAN Phase 3 + API_CONTRACT §3.1. **אומדן כולל:** L.

### 8.1 משימות

- [x] **P3-T01 — Deck query (MVP)** `(M)` — שאילתת client מסוננת על `publicProfiles` לפי `gameId` (ADR-021); סינון self/swiped/matched/blocked.
- [x] **P3-T02 — `submitSwipe`** `(L)` — callable: Zod, auth, self-swipe reject, daily limit (`system/config.limits.basicDailySwipeLimit`), transaction, deterministic IDs.
- [x] **P3-T03 — Match creation** `(M)` — reciprocal like → `matches/{matchId}` + `chats/{chatId}` באותה transaction; idempotent.
- [x] **P3-T04 — Swipe UI** `(M)` — SwipeCard/SwipeHud/SwipeActions עם Framer Motion (drag-to-swipe, exit animations, `prefers-reduced-motion` fallback); optimistic UI מתואם לתוצאת backend; disable על double-tap.
- [x] **P3-T05 — MatchCelebration** `(S)` — overlay + CTA לצ'אט.
- [x] **P3-T06 — Likes You** `(M)` — לפי ADR-033 (פתוח לכולם ב-MVP): collection-group read rule + index על swipes נכנסים (`toUid == me && direction == "like"`), `likesApi.loadLikesYou`, מסך LikesGrid אמיתי עם לייק-בחזרה דרך `submitSwipe`.
- [x] **P3-T07 — Rules — swipes/matches** `(M)` — client לא יוצר `swipes`/`matches` ישירות; קריאת match למשתתפים בלבד.
- [x] **P3-T08 — `system/config` seed** `(S)` — מסמך config עם featureFlags + limits בסביבת dev.

### 8.2 בדיקות ואימות

**Test cases:** `TC-DISC-001…010`, `TC-MATCH-001…005`, `TC-SEC-008…011`, `TC-SEC-020`.

- [x] TC-DISC-001…007 עוברים (deck, filter, skip/like, empty, no-games, blocked exclusion).
- [x] race: שני swipes הדדיים במקביל → match/chat יחיד (TC-DISC-010, TC-MATCH-004) — בדיקת emulator חובה. *(20 קריאות מקביליות בשני הכיוונים → מסמך match יחיד.)*
- [x] self-swipe → `self_action_forbidden` (TC-DISC-008); double-submit חסום (TC-DISC-009).
- [x] daily limit → `resource_exhausted` אחרי ה-limit.
- [x] TC-MATCH-001…003/005 עוברים (match, celebration, duplicate no-op).
- [x] rules: יצירת swipe/match ישירה נדחית (TC-SEC-008/009); suspended user נדחה (TC-SEC-011); client לא כותב `system/config` (TC-SEC-020).
- [x] E2E: userA like → userB like → celebration → chat route.

### 8.3 Exit Criteria

- [x] לולאת discovery→swipe→match עובדת מקצה לקצה על emulators עם שני משתמשים אמיתיים.
- [x] אפס יצירת match כפול תחת עומס (בדיקה חוזרת ×20 ריצות).

### 8.4 סגירת שלב

- [x] **✅ Phase 3 הושלם — כל המשימות, הבדיקות וה-Exit Criteria ירוקים; מסומן גם ב-§4.**

---

## 9. Phase 4 — Chat

**מטרה:** צ'אט real-time בין matched users; text חינם, media גייטד ל-Pro.
**מקור:** MIGRATION_PLAN Phase 4 + API_CONTRACT. **אומדן כולל:** M–L.

### 9.1 משימות

- [x] **P4-T01 — Chat list** `(M)` — רשימת שיחות עם `lastMessage` denormalized (trigger `onMessageCreated`).
- [x] **P4-T02 — Real-time messages** `(M)` — subscription על `chats/{chatId}/messages`; pagination בסיסי (limitToLast 100).
- [x] **P4-T03 — Text send** `(M)` — כתיבה ישירה של `type:"text"` תחת rules (participant, גודל, rate).
- [x] **P4-T04 — Media Pro gating** `(M)` — `sendChatMediaMessage` callable + Storage Rules (MIME/size); תמונות + הודעות וידאו מוקלטות (ADR-041) — Pro-only; Basic → upsell + `pro_required`. *(אומת באמולטור: הקלטה→העלאה→callable→בועת וידאו; UI צירוף תמונות — עתידי.)*
- [ ] **P4-T05 — Block awareness hooks** `(S)` — סכמת chat תומכת `blocked` state; אכיפה מלאה תושלם ב-Phase 8.
- [x] **P4-T06 — Rules — chats/messages** `(M)` — participants-only read/write; image ישיר נדחה (רק דרך function); קריאת chat list בצורת query-provable (`resource.data.participants`).
- [x] **P4-T07 — Live voice/video calls** `(L)` — ADR-041 (החלטת מוצר 2026-07-06): WebRTC P2P עם Firestore signaling (`chats/{chatId}/calls`), STUN-only; CallOverlay UI + incoming-call listener; rules participants-only. *(אומת באמולטור: offer/ICE/incoming/decline; שיחה חיה מלאה בין שני דפדפנים — לבדיקת QA ידנית.)*

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

- [x] **P5-T01 — הסרת coins מקומיים** `(S)` — ביטול ה-1,000,000 placeholder; `coins` נקרא מ-`users/{uid}` בלבד.
- [x] **P5-T02 — Signup bonus** `(M)` — (מוענק ב-completeOnboarding לפי ADR-034; `economy.signupBonusCoins` ב-system/config) — הענקת coins חד-פעמית ב-bootstrap לפי `system/config` (ADR-034) + `transactions` audit.
- [x] **P5-T03 — `shopItems` seed** `(M)` — (8 פריטי static_image; פריטים מונפשים יגיעו עם Motion & FX) — קטלוג לפי הטקסונומיה (category/rarity/renderType) כולל `renderConfig` לפריטים מונפשים.
- [x] **P5-T04 — `purchaseShopItem`** `(L)` — callable: transaction, `insufficient_coins`, `pro_required`, idempotency, audit, מניעת balance שלילי.
- [x] **P5-T05 — `equipItem`** `(M)` — callable: ownership check, עדכון `users` + sync ל-`publicProfiles`.
- [x] **P5-T06 — Shop UI** `(M)` — grid, קטגוריות, `ShopItemPreview`, `PurchaseConfirmModal`.

### 10.2 משימות — Motion & FX (ADR-039)

- [ ] **P5-T07 — `CosmeticRenderer`** `(M)` — קומפוננטת שער עם החלטת rendering לפי `renderType`/tier/reduced-motion (MOTION_AND_FX §11).
- [ ] **P5-T08 — Static + Lottie renderers** `(M)` — `static_image` (poster/fallback) + lottie micro-animations; lazy import.
- [ ] **P5-T09 — Rive renderer** `(M)` — `.riv` עם artboard/state machine; pause off-screen (IntersectionObserver).
- [ ] **P5-T10 — Video/Particle renderers** `(L)` — alpha-video dual-format (HEVC+WebM) + PixiJS particles; quality tiers + fallback.
- [ ] **P5-T11 — Sound controller** `(M)` — Howler audio sprites; off by default; mute/volume settings (MOTION_AND_FX §9).
- [x] **P5-T12 — Rules — shop/economy** `(M)` — `shopItems` read-only ל-client; `transactions`/`ownedItems` server-only.

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
