# Swish & Game — Test Cases

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Test Cases Catalog |
| Repository Path | `docs/quality/TEST_CASES.md` |
| Product | Swish & Game |
| Source of Truth | `docs/product/PRD.md`, `docs/design/UX_FLOWS.md`, `docs/architecture/API_CONTRACT.md`, `docs/architecture/SECURITY.md`, `docs/quality/TEST_STRATEGY.md`, `docs/quality/DEFINITION_OF_DONE.md` |
| Purpose | אוסף מקרי בדיקה קונקרטיים שמכסים user stories, acceptance criteria, happy paths, edge cases, ו-negative/security cases |
| Testing Principle | כל acceptance criterion חייב להיות מכוסה על ידי Test ID אחד או יותר |
| Security Principle | backend-authoritative: UI behavior לא מספיק; חייבים negative/security tests שמוכיחים שה-client לא יכול לעקוף |
| Primary Locale | `he-IL` |
| Direction | RTL |
| Data Rule | enum values באנגלית; UI labels בעברית דרך label maps |
| Related Strategy | `docs/quality/TEST_STRATEGY.md` מגדיר איך לבדוק; מסמך זה מגדיר מה לבדוק |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Test Case Conventions](#2-test-case-conventions)
- [3. Test Cases by Feature](#3-test-cases-by-feature)
  - [3.1 Authentication](#31-authentication)
  - [3.2 Onboarding & Profile](#32-onboarding--profile)
  - [3.3 Discovery & Swipe](#33-discovery--swipe)
  - [3.4 Matching](#34-matching)
  - [3.5 Chat](#35-chat)
  - [3.6 Shop & Economy](#36-shop--economy)
  - [3.7 Subscription](#37-subscription)
  - [3.8 AI Hub](#38-ai-hub)
  - [3.9 Safety](#39-safety)
- [4. Security / Negative Test Cases](#4-security--negative-test-cases)
- [5. Cross-Cutting Test Cases](#5-cross-cutting-test-cases)
- [6. Traceability Matrix](#6-traceability-matrix)
- [7. Open Items](#7-open-items)

---

## 2. Test Case Conventions

### 2.1 Test Case Format

Each test case uses this structure:

| Field | Description |
|---|---|
| `Test ID` | מזהה יציב, למשל `TC-AUTH-001`. |
| Title | שם קצר וברור של הבדיקה. |
| User Story | user story מקושר, למשל `AUTH-001`. אם זה security/cross-cutting, השתמש ב-`SEC-*` או `X-*`. |
| Preconditions | תנאים מקדימים, test user, seed data, feature flags. |
| Steps | צעדי בדיקה ברורים. |
| Expected Result | תוצאה צפויה מדידה. |
| Priority | `P0`, `P1`, `P2`. |
| Type | `unit`, `component`, `integration`, `rules`, `E2E`, `manual`. |

### 2.2 Priorities

| Priority | Meaning |
|---|---|
| `P0` | קריטי ל-MVP, security, billing/economy, auth, core flow, או data integrity. חייב לרוץ לפני release. |
| `P1` | חשוב ל-quality ול-flow מרכזי, אך לא בהכרח blocker מיידי אם יש workaround. |
| `P2` | edge case, polish, regression coverage, או manual exploratory. |

### 2.3 Test Types

| Type | Tooling | Scope |
|---|---|---|
| `unit` | Vitest | pure logic, Zod schemas, helpers, formatters, state machines. |
| `component` | Vitest + Testing Library | React UI behavior, states, RTL, accessibility basics. |
| `integration` | Firebase Emulator Suite + Vitest | Auth/Firestore/Storage/Functions flows. |
| `rules` | Firebase Emulator Suite | Firestore/Storage Security Rules allow/deny. |
| `E2E` | Playwright | critical user journeys through browser. |
| `manual` | QA checklist | visual, usability, device/browser, accessibility exploratory. |

### 2.4 Naming Convention

Use feature prefixes:

| Feature | Prefix |
|---|---|
| Authentication | `TC-AUTH-*` |
| Onboarding | `TC-ONB-*` |
| Profile | `TC-PROF-*` |
| Discovery | `TC-DISC-*` |
| Matching | `TC-MATCH-*` |
| Chat | `TC-CHAT-*` |
| Shop/Economy | `TC-SHOP-*` |
| Subscription | `TC-SUB-*` |
| AI Hub | `TC-AI-*` |
| Safety | `TC-SAFE-*` |
| Security/Rules | `TC-SEC-*` |
| Cross-cutting | `TC-X-*` |

### 2.5 Required Commands Before Release

```bash
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
npm run scan:bundle
```

---

## 3. Test Cases by Feature

## 3.1 Authentication

### TC-AUTH-001 — הרשמה עם Google מצליחה

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-001` |
| User Story | `AUTH-001` |
| Preconditions | Firebase Emulator Auth פעיל; אין user קיים עם אותו provider; app ב-`/login`. |
| Steps | 1. פתח `/login`.<br>2. לחץ על Google sign-in.<br>3. השלם OAuth mock/emulator sign-in.<br>4. המתן ל-auth state. |
| Expected Result | user נוצר/מזוהה; route guard מפנה ל-`/onboarding` אם onboarding לא הושלם; לא נוצרים fields server-owned לא תקינים. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-AUTH-002 — הרשמה עם email/password מצליחה

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-002` |
| User Story | `AUTH-001` |
| Preconditions | Auth emulator; email לא קיים. |
| Steps | 1. פתח `/login`.<br>2. הזן email תקין וסיסמה תקינה.<br>3. שלח signup form. |
| Expected Result | user נוצר; מוצג loading בזמן submit; לאחר הצלחה redirect ל-`/onboarding`. |
| Priority | `P0` |
| Type | `component`, `E2E`, `integration` |

### TC-AUTH-003 — משתמש קיים נכנס ומועבר ליעד הנכון

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-003` |
| User Story | `AUTH-002` |
| Preconditions | user קיים; scenario A: onboarding incomplete; scenario B: onboarding complete. |
| Steps | 1. בצע login.<br>2. המתן ל-auth restore.<br>3. בדוק route. |
| Expected Result | incomplete → `/onboarding`; complete → `/discover`; אם user suspended/deleted מוצג account state מתאים ולא core app. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-AUTH-004 — logout מנקה session ומחזיר ל-login

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-004` |
| User Story | `AUTH-003` |
| Preconditions | user מחובר ונמצא ב-`/settings`. |
| Steps | 1. לחץ logout.<br>2. אשר אם יש dialog.<br>3. נסה לפתוח `/discover`. |
| Expected Result | user מנותק; redirect ל-`/login`; protected routes חסומים. |
| Priority | `P1` |
| Type | `E2E`, `component` |

### TC-AUTH-005 — OAuth popup closed

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-005` |
| User Story | `AUTH-001` |
| Preconditions | mock provider מוגדר להחזיר `popup_closed_by_user`. |
| Steps | 1. לחץ Google sign-in.<br>2. סגור popup. |
| Expected Result | נשארים ב-`/login`; מוצגת הודעת שגיאה עברית בטוחה; לא נוצר user חלקי. |
| Priority | `P1` |
| Type | `component`, `E2E` |

### TC-AUTH-006 — email already exists

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-006` |
| User Story | `AUTH-001` |
| Preconditions | email כבר קיים ב-Auth emulator. |
| Steps | 1. נסה signup עם אותו email.<br>2. שלח form. |
| Expected Result | מוצגת הודעת error עברית ידידותית; לא נוצר user נוסף; אין raw Firebase error ל-client. |
| Priority | `P1` |
| Type | `component`, `integration` |

### TC-AUTH-007 — weak password rejected

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-007` |
| User Story | `AUTH-001` |
| Preconditions | login form פתוח. |
| Steps | 1. הזן email תקין וסיסמה חלשה.<br>2. שלח. |
| Expected Result | validation error בעברית; submit לא ממשיך או Auth מחזיר error ממופה; אין user חדש. |
| Priority | `P1` |
| Type | `component`, `unit` |

### TC-AUTH-008 — profile creation failure after auth

| Field | Value |
|---|---|
| Test ID | `TC-AUTH-008` |
| User Story | `AUTH-001` |
| Preconditions | Auth succeeds; Firestore user bootstrap fails via emulator rule/function failure. |
| Steps | 1. בצע signup.<br>2. גרום לכשל ביצירת user doc.<br>3. רענן app. |
| Expected Result | מוצג recoverable error; user לא נכנס ל-discovery בלי bootstrap/onboarding; retry יוצר/משלים state בצורה idempotent. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

---

## 3.2 Onboarding & Profile

### TC-ONB-001 — התחלת onboarding אחרי signup

| Field | Value |
|---|---|
| Test ID | `TC-ONB-001` |
| User Story | `ONB-001` |
| Preconditions | user מחובר ללא onboarding complete. |
| Steps | 1. פתח app.<br>2. בדוק redirect.<br>3. ודא step ראשון מוצג. |
| Expected Result | user נשלח ל-`/onboarding`; progress מוצג; אי אפשר להיכנס ל-`/discover` עד completion. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-ONB-002 — השלמת פרטי בסיס

| Field | Value |
|---|---|
| Test ID | `TC-ONB-002` |
| User Story | `ONB-001` |
| Preconditions | user ב-onboarding step profile basics. |
| Steps | 1. הזן display/profile fields תקינים.<br>2. הוסף bio בטווח מותר.<br>3. המשך. |
| Expected Result | form עובר validation; נשמרים רק fields מותרים; אין כתיבה ל-server-owned fields. |
| Priority | `P0` |
| Type | `component`, `integration` |

### TC-ONB-003 — הוספת משחק ראשון

| Field | Value |
|---|---|
| Test ID | `TC-ONB-003` |
| User Story | `ONB-002` |
| Preconditions | `gameCatalog` seeded; user ב-game preferences step. |
| Steps | 1. בחר `game_id` כמו `valorant`.<br>2. בחר `platform`.<br>3. בחר `skillLevel` מתוך `beginner/intermediate/pro/elite`.<br>4. שמור. |
| Expected Result | game נשמר תחת user game profile; enum values באנגלית; UI labels בעברית. |
| Priority | `P0` |
| Type | `component`, `integration` |

### TC-ONB-004 — onboarding completed מוביל ל-discovery

| Field | Value |
|---|---|
| Test ID | `TC-ONB-004` |
| User Story | `ONB-003` |
| Preconditions | user השלים profile basics והוסיף game. |
| Steps | 1. לחץ finish/continue.<br>2. המתן לשמירה.<br>3. בדוק route. |
| Expected Result | `onboardingCompleted = true` או field קנוני מתאים מתעדכן; `publicProfiles/{uid}` נוצר/מסונכרן; redirect ל-`/discover`. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-ONB-005 — חסימת onboarding ללא game

| Field | Value |
|---|---|
| Test ID | `TC-ONB-005` |
| User Story | `ONB-002` |
| Preconditions | user ב-onboarding ללא game. |
| Steps | 1. נסה לסיים onboarding בלי להוסיף game. |
| Expected Result | submit נחסם; error copy בעברית; לא נפתח discovery. |
| Priority | `P0` |
| Type | `component`, `E2E` |

### TC-ONB-006 — invalid `skillLevel` rejected

| Field | Value |
|---|---|
| Test ID | `TC-ONB-006` |
| User Story | `ONB-002` |
| Preconditions | access to schema/unit test. |
| Steps | 1. נסה לשמור `skillLevel = "expert"`. |
| Expected Result | Zod/schema rejects; Firestore rules/function לא מקבלים enum לא קנוני. |
| Priority | `P0` |
| Type | `unit`, `integration`, `rules` |

### TC-PROF-001 — צפייה בפרופיל עצמי

| Field | Value |
|---|---|
| Test ID | `TC-PROF-001` |
| User Story | `PROF-001` |
| Preconditions | user complete עם profile/game data. |
| Steps | 1. פתח `/profile`.<br>2. בדוק avatar/name/games/skill/platforms/cosmetics. |
| Expected Result | profile נטען; Pro badge מופיע רק אם `verifiedBadge` backend-derived; coins/pro read-only. |
| Priority | `P0` |
| Type | `component`, `E2E` |

### TC-PROF-002 — עדכון פרופיל מותר

| Field | Value |
|---|---|
| Test ID | `TC-PROF-002` |
| User Story | `PROF-002` |
| Preconditions | user complete; profile edit פתוח. |
| Steps | 1. שנה bio/display fields מותרים.<br>2. שמור.<br>3. רענן. |
| Expected Result | השינויים נשמרים; `publicProfiles/{uid}` מתעדכן ללא private fields; analytics `profile_updated` אם רלוונטי. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-PROF-003 — bio ארוך מדי נדחה

| Field | Value |
|---|---|
| Test ID | `TC-PROF-003` |
| User Story | `PROF-002` |
| Preconditions | max bio length מוגדר או open item. |
| Steps | 1. הזן bio מעבר למגבלה.<br>2. נסה לשמור. |
| Expected Result | validation error בעברית; לא נשמר ל-Firestore. |
| Priority | `P1` |
| Type | `unit`, `component` |

### TC-PROF-004 — ניסיון לעדכן `isPro` מה-client נדחה

| Field | Value |
|---|---|
| Test ID | `TC-PROF-004` |
| User Story | `PROF-002`, `SEC-FIELDS` |
| Preconditions | authenticated user. |
| Steps | 1. נסה `updateDoc(users/{uid}, { isPro: true })` מה-client. |
| Expected Result | Security Rules deny; לא משתנה `isPro`; rule test עובר. |
| Priority | `P0` |
| Type | `rules` |

---

## 3.3 Discovery & Swipe

### TC-DISC-001 — פתיחת discovery עם deck

| Field | Value |
|---|---|
| Test ID | `TC-DISC-001` |
| User Story | `DISC-001` |
| Preconditions | user complete; יש discoverable profiles באותו `game_id`. |
| Steps | 1. פתח `/discover`.<br>2. המתן ל-deck.<br>3. בדוק `SwipeCard`, `SwipeHud`, `SwipeActions`. |
| Expected Result | deck מוצג; אין self profile; אין blocked/matched/swiped profiles; loading/empty/error/success קיימים. |
| Priority | `P0` |
| Type | `E2E`, `integration`, `component` |

### TC-DISC-002 — בחירת game filter

| Field | Value |
|---|---|
| Test ID | `TC-DISC-002` |
| User Story | `DISC-002` |
| Preconditions | user עם מספר games; deck seeded. |
| Steps | 1. פתח discovery.<br>2. בחר game filter.<br>3. בדוק deck. |
| Expected Result | deck מציג candidates למשחק הנבחר; event `game_filter_selected` נשלח ללא PII. |
| Priority | `P1` |
| Type | `component`, `E2E` |

### TC-DISC-003 — swipe left / skip

| Field | Value |
|---|---|
| Test ID | `TC-DISC-003` |
| User Story | `DISC-003` |
| Preconditions | deck עם target profile. |
| Steps | 1. לחץ skip או בצע swipe left.<br>2. המתן ל-`submitSwipe`.<br>3. בדוק card הבא. |
| Expected Result | `submitSwipe` מחזיר `skipped`; swipe audit נוצר server-side אם קנוני; target לא חוזר מיידית. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-DISC-004 — swipe right / like

| Field | Value |
|---|---|
| Test ID | `TC-DISC-004` |
| User Story | `DISC-003` |
| Preconditions | deck עם target שלא עשה like חזרה. |
| Steps | 1. לחץ like או swipe right.<br>2. המתן לתגובה. |
| Expected Result | `submitSwipe` מחזיר `liked`; לא נוצר match; card הבא מוצג. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-DISC-005 — empty deck

| Field | Value |
|---|---|
| Test ID | `TC-DISC-005` |
| User Story | `DISC-004` |
| Preconditions | אין candidates זמינים. |
| Steps | 1. פתח `/discover`. |
| Expected Result | מוצג `EmptyDeck` עם הודעה עברית ו-action הגיוני; לא מוצג crash. |
| Priority | `P1` |
| Type | `component`, `E2E` |

### TC-DISC-006 — user ללא games לא יכול לקבל deck

| Field | Value |
|---|---|
| Test ID | `TC-DISC-006` |
| User Story | `DISC-001`, `ONB-002` |
| Preconditions | user complete=false או ללא games. |
| Steps | 1. נסה לפתוח `/discover`. |
| Expected Result | redirect ל-`/onboarding` או empty/guidance state; backend לא מחזיר deck לא תקין. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-DISC-007 — blocked user לא מופיע ב-discovery

| Field | Value |
|---|---|
| Test ID | `TC-DISC-007` |
| User Story | `DISC-001`, `SAFE-002` |
| Preconditions | user A חסם user B או להפך. |
| Steps | 1. user A פותח discovery.<br>2. בדוק deck. |
| Expected Result | user B לא מופיע; backend deck filtering אוכף זאת. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-DISC-008 — self-swipe נדחה

| Field | Value |
|---|---|
| Test ID | `TC-DISC-008` |
| User Story | `DISC-003`, `SEC-SWIPE` |
| Preconditions | authenticated user. |
| Steps | 1. קרא `submitSwipe` עם `targetUid = uid`. |
| Expected Result | function מחזירה `self_action_forbidden` או error קנוני מתאים; לא נוצר swipe/match. |
| Priority | `P0` |
| Type | `unit`, `integration` |

### TC-DISC-009 — rapid swipe double submit

| Field | Value |
|---|---|
| Test ID | `TC-DISC-009` |
| User Story | `DISC-003` |
| Preconditions | deck עם target; network delay simulated. |
| Steps | 1. לחץ like במהירות מספר פעמים.<br>2. המתן לתגובות. |
| Expected Result | UI disables duplicate submit; backend idempotency מונעת duplicate side effects. |
| Priority | `P0` |
| Type | `component`, `integration` |

### TC-DISC-010 — race condition בשני swipes במקביל

| Field | Value |
|---|---|
| Test ID | `TC-DISC-010` |
| User Story | `DISC-003`, `MATCH-001` |
| Preconditions | user A/B לא matched. |
| Steps | 1. שלח `submitSwipe` הדדי במקביל מ-A ומ-B. |
| Expected Result | נוצר match/chat אחד בלבד; deterministic IDs; אין duplicate docs. |
| Priority | `P0` |
| Type | `integration` |

---

## 3.4 Matching

### TC-MATCH-001 — reciprocal like יוצר match

| Field | Value |
|---|---|
| Test ID | `TC-MATCH-001` |
| User Story | `MATCH-001` |
| Preconditions | user A liked user B; user B טרם liked A. |
| Steps | 1. user B עושה like ל-user A באותו `game_id`. |
| Expected Result | `submitSwipe` מחזיר `matched`; נוצר `matches/{matchId}`; נוצר/מקושר `chats/{chatId}`; event server `match_created`. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-MATCH-002 — match celebration ופתיחת chat

| Field | Value |
|---|---|
| Test ID | `TC-MATCH-002` |
| User Story | `MATCH-002` |
| Preconditions | reciprocal like עומד להתרחש. |
| Steps | 1. בצע like שיוצר match.<br>2. בדוק overlay.<br>3. לחץ open chat. |
| Expected Result | `MatchCelebration` מוצג; CTA מוביל ל-`/chat/:chatId`; chat נגיש לשני המשתתפים בלבד. |
| Priority | `P0` |
| Type | `E2E`, `component` |

### TC-MATCH-003 — duplicate match attempt

| Field | Value |
|---|---|
| Test ID | `TC-MATCH-003` |
| User Story | `MATCH-001` |
| Preconditions | match כבר קיים בין A/B. |
| Steps | 1. שלח שוב reciprocal `submitSwipe` או retry. |
| Expected Result | מוחזר match קיים או no-op בטוח; לא נוצרים duplicate `matches`/`chats`. |
| Priority | `P0` |
| Type | `integration` |

### TC-MATCH-004 — simultaneous like

| Field | Value |
|---|---|
| Test ID | `TC-MATCH-004` |
| User Story | `MATCH-001` |
| Preconditions | A/B אין swipes קודמים. |
| Steps | 1. שלח like מ-A ומ-B בו זמנית. |
| Expected Result | transaction מטפל ב-race; match/chat יחיד; שני המשתמשים רואים match. |
| Priority | `P0` |
| Type | `integration` |

### TC-MATCH-005 — game removed after match

| Field | Value |
|---|---|
| Test ID | `TC-MATCH-005` |
| User Story | `MATCH-002` |
| Preconditions | A/B matched על `game_id`; אחד המשתמשים מסיר game מה-profile. |
| Steps | 1. הסר game.<br>2. פתח matches/chat. |
| Expected Result | match קיים נשאר או מסומן לפי policy; chat לא נשבר; display מטפל ב-game missing gracefully. |
| Priority | `P2` |
| Type | `integration`, `manual` |

---

## 3.5 Chat

### TC-CHAT-001 — פתיחת chat כמשתתף

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-001` |
| User Story | `CHAT-001` |
| Preconditions | match/chat קיים; user הוא participant. |
| Steps | 1. פתח `/chat/:chatId`. |
| Expected Result | chat header/messages/composer מוצגים; messages נטענים; non-sensitive profile info בלבד. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-CHAT-002 — שליחת הודעת text

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-002` |
| User Story | `CHAT-002` |
| Preconditions | participant ב-chat פעיל. |
| Steps | 1. הזן הודעת text תקינה.<br>2. לחץ send.<br>3. בדוק message list. |
| Expected Result | הודעת `type: "text"` נוצרת; מוצגת לשני המשתתפים; analytics `message_sent` ללא raw text. |
| Priority | `P0` |
| Type | `E2E`, `integration`, `component` |

### TC-CHAT-003 — Basic media blocked

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-003` |
| User Story | `CHAT-003`, `SUB-001` |
| Preconditions | Basic user participant ב-chat. |
| Steps | 1. לחץ media upload.<br>2. נסה לשלוח image. |
| Expected Result | UI מציג `UpgradeModal`; `sendChatMediaMessage` מחזיר `pro_required` אם נקרא ישירות; לא נוצרת image message. |
| Priority | `P0` |
| Type | `component`, `integration`, `rules`, `E2E` |

### TC-CHAT-004 — empty message rejected

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-004` |
| User Story | `CHAT-002` |
| Preconditions | chat פתוח. |
| Steps | 1. לחץ send עם input ריק או whitespace. |
| Expected Result | submit נחסם; אין message חדש. |
| Priority | `P1` |
| Type | `component`, `unit` |

### TC-CHAT-005 — long message rejected or constrained

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-005` |
| User Story | `CHAT-002` |
| Preconditions | max message length מוגדר או open item. |
| Steps | 1. הזן הודעה מעבר למגבלה.<br>2. נסה לשלוח. |
| Expected Result | validation error בעברית או truncation אסור; אין raw stack/client crash. |
| Priority | `P1` |
| Type | `component`, `unit` |

### TC-CHAT-006 — blocked chat prevents new messages

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-006` |
| User Story | `CHAT-002`, `SAFE-002` |
| Preconditions | user A חסם user B; chat קיים. |
| Steps | 1. user B מנסה לשלוח message. |
| Expected Result | message write denied; function/rules מחזירים `blocked` או permission error; UI מציג state בטוח. |
| Priority | `P0` |
| Type | `rules`, `integration`, `E2E` |

### TC-CHAT-007 — non-participant cannot read chat

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-007` |
| User Story | `CHAT-001`, `SEC-CHAT` |
| Preconditions | chat בין A/B; user C authenticated. |
| Steps | 1. user C מנסה לקרוא `chats/{chatId}` ו-`messages`. |
| Expected Result | Security Rules deny. |
| Priority | `P0` |
| Type | `rules` |

### TC-CHAT-008 — media file too large rejected

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-008` |
| User Story | `CHAT-003` |
| Preconditions | Pro user participant; file מעל limit. |
| Steps | 1. נסה upload image גדולה מהמותר. |
| Expected Result | Storage Rules/function validation דוחים; לא נוצר message; error בטוח. |
| Priority | `P0` |
| Type | `rules`, `integration`, `component` |

### TC-CHAT-009 — invalid media type rejected

| Field | Value |
|---|---|
| Test ID | `TC-CHAT-009` |
| User Story | `CHAT-003` |
| Preconditions | Pro user participant. |
| Steps | 1. נסה upload non-image file. |
| Expected Result | Storage Rules/function דוחים MIME לא מורשה; לא נוצר message. |
| Priority | `P0` |
| Type | `rules`, `integration` |

---

## 3.6 Shop & Economy

### TC-SHOP-001 — פתיחת shop

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-001` |
| User Story | `SHOP-001` |
| Preconditions | authenticated user; `shopItems` seeded. |
| Steps | 1. פתח `/shop`.<br>2. בדוק categories/items. |
| Expected Result | items פעילים מוצגים; categories labels בעברית; `shop_opened` ללא PII. |
| Priority | `P1` |
| Type | `E2E`, `component` |

### TC-SHOP-002 — צפייה בפריט

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-002` |
| User Story | `SHOP-001` |
| Preconditions | shop פתוח; item קיים. |
| Steps | 1. לחץ item.<br>2. בדוק preview/details. |
| Expected Result | `ShopItemPreview` מוצג; rarity/price/category labels דרך label maps; event `item_viewed`. |
| Priority | `P1` |
| Type | `component`, `E2E` |

### TC-SHOP-003 — רכישת item עם coins מספיקים

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-003` |
| User Story | `SHOP-002` |
| Preconditions | user עם `coins >= priceCoins`; item פעיל ולא owned. |
| Steps | 1. לחץ purchase.<br>2. אשר `PurchaseConfirmModal`.<br>3. המתן ל-`purchaseShopItem`. |
| Expected Result | coins יורדים server-side; ownership נוצר; `transactions` audit נכתב; `item_purchased` server event; UI מתעדכן מקריאת backend. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-SHOP-004 — equip item owned

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-004` |
| User Story | `SHOP-003` |
| Preconditions | user owns item. |
| Steps | 1. לחץ equip.<br>2. פתח profile. |
| Expected Result | `equipItem` מעדכן equipped item; `publicProfiles/{uid}` משקף cosmetic reference; event `item_equipped`. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-SHOP-005 — insufficient coins

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-005` |
| User Story | `SHOP-002` |
| Preconditions | user עם coins נמוכים ממחיר item. |
| Steps | 1. נסה purchase. |
| Expected Result | `purchaseShopItem` מחזיר `insufficient_coins`; coins לא משתנים; אין ownership/transaction של purchase successful. |
| Priority | `P0` |
| Type | `integration`, `component` |

### TC-SHOP-006 — double-tap purchase לא גורם לחיוב כפול

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-006` |
| User Story | `SHOP-002` |
| Preconditions | user עם מספיק coins; item לא owned. |
| Steps | 1. לחץ purchase/confirm פעמיים במהירות.<br>2. בדוק Firestore. |
| Expected Result | coins deducted פעם אחת בלבד; ownership יחיד; transaction audit יחיד או duplicate marked idempotent. |
| Priority | `P0` |
| Type | `component`, `integration` |

### TC-SHOP-007 — item removed/inactive during purchase

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-007` |
| User Story | `SHOP-002` |
| Preconditions | item מוצג ל-user; לפני confirm item הופך inactive/deleted. |
| Steps | 1. נסה confirm purchase. |
| Expected Result | backend דוחה `not_found`/`failed_precondition`; coins לא משתנים; UI מציג error בטוח. |
| Priority | `P0` |
| Type | `integration` |

### TC-SHOP-008 — Pro-required item blocked for Basic

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-008` |
| User Story | `SHOP-002`, `SUB-001` |
| Preconditions | Basic user; item `requiresPro = true`. |
| Steps | 1. נסה purchase. |
| Expected Result | UI מציג upgrade; backend מחזיר `pro_required`; אין coins deduction. |
| Priority | `P0` |
| Type | `component`, `integration` |

### TC-SHOP-009 — negative coin balance impossible

| Field | Value |
|---|---|
| Test ID | `TC-SHOP-009` |
| User Story | `SHOP-002`, `SEC-ECONOMY` |
| Preconditions | user עם coins נמוכים; concurrent purchase attempts. |
| Steps | 1. שלח שתי רכישות במקביל שיחד עולות יותר מה-balance. |
| Expected Result | transaction מונעת balance שלילי; לכל היותר purchase אחת מצליחה; alert/audit אם invariant נשבר. |
| Priority | `P0` |
| Type | `integration` |

---

## 3.7 Subscription

### TC-SUB-001 — Upgrade modal מוצג ל-Pro gated action

| Field | Value |
|---|---|
| Test ID | `TC-SUB-001` |
| User Story | `SUB-001` |
| Preconditions | Basic user; action Pro-only כמו media upload. |
| Steps | 1. הפעל action Pro-only.<br>2. בדוק modal. |
| Expected Result | `UpgradeModal` מוצג; price `29.90 ILS/month`; reason מתאים; event `upgrade_modal_viewed`. |
| Priority | `P0` |
| Type | `component`, `E2E` |

### TC-SUB-002 — createCheckoutSession מתחיל checkout

| Field | Value |
|---|---|
| Test ID | `TC-SUB-002` |
| User Story | `SUB-002` |
| Preconditions | Basic authenticated user; payments enabled; provider sandbox/stub. |
| Steps | 1. לחץ upgrade.<br>2. קרא `createCheckoutSession`. |
| Expected Result | מוחזר `checkoutUrl`; לא מתעדכן `isPro`; metadata server-side; `subscription_started` event. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-SUB-003 — paymentWebhook activates Pro

| Field | Value |
|---|---|
| Test ID | `TC-SUB-003` |
| User Story | `SUB-002` |
| Preconditions | checkout session קיים; webhook signature valid. |
| Steps | 1. שלח verified webhook sandbox.<br>2. בדוק `subscriptions/{uid}`.<br>3. בדוק `users/{uid}` ו-`publicProfiles/{uid}`. |
| Expected Result | `subscriptionStatus = "active"`; `isPro = true`; `verifiedBadge = true`; event `subscription_activated`; idempotent `billingEvents` אם מיושם. |
| Priority | `P0` |
| Type | `integration` |

### TC-SUB-004 — checkout callback ללא webhook לא מעניק Pro

| Field | Value |
|---|---|
| Test ID | `TC-SUB-004` |
| User Story | `SUB-002`, `SEC-BILLING` |
| Preconditions | Basic user; fake/success callback route. |
| Steps | 1. פתח success URL/callback בלי webhook.<br>2. בדוק user state. |
| Expected Result | user נשאר Basic/pending; אין `isPro = true`; UI מציג pending activation. |
| Priority | `P0` |
| Type | `E2E`, `integration` |

### TC-SUB-005 — active Pro לא יכול ליצור checkout כפול

| Field | Value |
|---|---|
| Test ID | `TC-SUB-005` |
| User Story | `SUB-002` |
| Preconditions | user active Pro. |
| Steps | 1. קרא `createCheckoutSession`. |
| Expected Result | מוחזר `failed_precondition`; לא נוצר subscription כפול. |
| Priority | `P0` |
| Type | `integration` |

### TC-SUB-006 — expires mid-session

| Field | Value |
|---|---|
| Test ID | `TC-SUB-006` |
| User Story | `SUB-003` |
| Preconditions | user Pro עם `subscriptionExpiresAt` קרוב; fake timers. |
| Steps | 1. פתח app כ-Pro.<br>2. הזמן מתקדם מעבר לתוקף.<br>3. בצע Pro-only action. |
| Expected Result | entitlement מתעדכן לפי policy; action נחסם אם expired; UI מתעדכן ללא reload אם subscription listener פעיל. |
| Priority | `P1` |
| Type | `integration`, `E2E` |

### TC-SUB-007 — cancellation/downgrade

| Field | Value |
|---|---|
| Test ID | `TC-SUB-007` |
| User Story | `SUB-003` |
| Preconditions | active Pro; provider emits cancellation. |
| Steps | 1. שלח webhook cancellation.<br>2. בדוק subscription/user/public profile. |
| Expected Result | status מתעדכן `cancelled`/`expired` לפי policy; `verifiedBadge` מתעדכן לפי entitlement; event `subscription_cancelled`. |
| Priority | `P0` |
| Type | `integration` |

### TC-SUB-008 — refund/chargeback

| Field | Value |
|---|---|
| Test ID | `TC-SUB-008` |
| User Story | `SUB-003` |
| Preconditions | active Pro; provider emits refund/chargeback normalized event. |
| Steps | 1. שלח webhook refund/chargeback.<br>2. בדוק entitlement. |
| Expected Result | entitlement/status מתעדכן לפי `PAYMENTS.md`; audit נכתב; אין raw payment payload בלוגים. |
| Priority | `P0` |
| Type | `integration` |

### TC-SUB-009 — invalid webhook signature rejected

| Field | Value |
|---|---|
| Test ID | `TC-SUB-009` |
| User Story | `SUB-002`, `SEC-BILLING` |
| Preconditions | HTTP webhook endpoint. |
| Steps | 1. שלח webhook עם signature לא תקין. |
| Expected Result | HTTP `401`/`400`; לא מתעדכן subscription; alert/log safe. |
| Priority | `P0` |
| Type | `integration` |

---

## 3.8 AI Hub

### TC-AI-001 — פתיחת AI Hub

| Field | Value |
|---|---|
| Test ID | `TC-AI-001` |
| User Story | `AI-001` |
| Preconditions | authenticated user; `aiHubEnabled = true`. |
| Steps | 1. פתח `/ai`. |
| Expected Result | AI tools מוצגים; Hebrew RTL; event `ai_hub_opened`; אין direct Gemini client code. |
| Priority | `P1` |
| Type | `component`, `E2E` |

### TC-AI-002 — AI profile review requested

| Field | Value |
|---|---|
| Test ID | `TC-AI-002` |
| User Story | `AI-002` |
| Preconditions | authenticated user; profile קיים; AI provider stub מחזיר success. |
| Steps | 1. פתח AI Hub.<br>2. בחר profile review.<br>3. שלח בקשה. |
| Expected Result | `sendAIProfileReview` נקרא server-side; loading מוצג; result מוצג; `aiRequests/{requestId}` audit נשמר; prompts/responses לא ב-analytics/logs. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-AI-003 — AI squad advice requested

| Field | Value |
|---|---|
| Test ID | `TC-AI-003` |
| User Story | `AI-003` |
| Preconditions | authenticated user; squad advice input תקין; provider stub success. |
| Steps | 1. בחר squad advice.<br>2. הזן קלט מותר.<br>3. שלח. |
| Expected Result | `sendAISquadAdvice` מחזיר result/refusal קנוני; audit נשמר; no raw prompt logging. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-AI-004 — provider/API fail

| Field | Value |
|---|---|
| Test ID | `TC-AI-004` |
| User Story | `AI-002`, `AI-003` |
| Preconditions | provider stub מחזיר timeout/error. |
| Steps | 1. שלח AI request. |
| Expected Result | UI מציג error בטוח; `aiRequests.status = "failed"`; logs safe normalized error; אין raw Gemini error ל-client. |
| Priority | `P0` |
| Type | `integration`, `component` |

### TC-AI-005 — unsafe request refused/blocked

| Field | Value |
|---|---|
| Test ID | `TC-AI-005` |
| User Story | `AI-002`, `AI-003` |
| Preconditions | input מסומן unsafe לפי guardrails. |
| Steps | 1. שלח בקשה unsafe. |
| Expected Result | `AIRefusalState` או blocked error; audit `status = "blocked"`; no provider call אם pre-check חוסם. |
| Priority | `P0` |
| Type | `integration`, `component` |

### TC-AI-006 — spam/rate limit

| Field | Value |
|---|---|
| Test ID | `TC-AI-006` |
| User Story | `AI-002`, `AI-003` |
| Preconditions | rate limit מוגדר ב-`system/config` או open item. |
| Steps | 1. שלח בקשות AI רבות ברצף. |
| Expected Result | לאחר limit מוחזר `resource_exhausted`; UI מציג rate-limit state; אין cost spike. |
| Priority | `P1` |
| Type | `integration` |

### TC-AI-007 — token/input limit

| Field | Value |
|---|---|
| Test ID | `TC-AI-007` |
| User Story | `AI-002`, `AI-003` |
| Preconditions | input ארוך מהמותר. |
| Steps | 1. שלח input גדול מהמגבלה. |
| Expected Result | validation דוחה לפני provider call; error עברי בטוח; no prompt logged. |
| Priority | `P1` |
| Type | `unit`, `component`, `integration` |

---

## 3.9 Safety

### TC-SAFE-001 — report user

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-001` |
| User Story | `SAFE-001` |
| Preconditions | authenticated user; target user קיים; source profile/chat. |
| Steps | 1. פתח `ReportModal`.<br>2. בחר `ReportReason`.<br>3. שלח. |
| Expected Result | `createReport` יוצר `reports/{reportId}` עם `status = "open"`; success state מוצג; report description לא נשלח ל-analytics/logs. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-SAFE-002 — block user

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-002` |
| User Story | `SAFE-002` |
| Preconditions | authenticated user; target user קיים; match/chat אופציונלי. |
| Steps | 1. פתח safety menu.<br>2. לחץ block.<br>3. אשר `BlockConfirmModal`. |
| Expected Result | `blockUser` יוצר block state; affected match/chat נסגר/נחסם לפי contract; target לא מופיע ב-discovery; event `user_blocked` ללא PII. |
| Priority | `P0` |
| Type | `integration`, `E2E` |

### TC-SAFE-003 — duplicate report

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-003` |
| User Story | `SAFE-001` |
| Preconditions | report קיים מאותו reporter על אותו target/source. |
| Steps | 1. שלח report זהה שוב. |
| Expected Result | behavior idempotent או duplicate מותר לפי policy; לא נוצרת הצפה לא מבוקרת; UI מציג success/duplicate safely. |
| Priority | `P1` |
| Type | `integration` |

### TC-SAFE-004 — block after report

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-004` |
| User Story | `SAFE-001`, `SAFE-002` |
| Preconditions | user דיווח על target. |
| Steps | 1. אחרי report לחץ block. |
| Expected Result | block מצליח; report נשאר; chat/match מתעדכן; אין duplicate side effects. |
| Priority | `P1` |
| Type | `E2E`, `integration` |

### TC-SAFE-005 — self-report/self-block denied

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-005` |
| User Story | `SAFE-001`, `SAFE-002` |
| Preconditions | authenticated user. |
| Steps | 1. קרא `createReport`/`blockUser` עם `targetUid = uid`. |
| Expected Result | function מחזירה `self_action_forbidden`; לא נוצר report/block. |
| Priority | `P0` |
| Type | `integration`, `unit` |

### TC-SAFE-006 — false report moderation path

| Field | Value |
|---|---|
| Test ID | `TC-SAFE-006` |
| User Story | `SAFE-001` |
| Preconditions | report קיים; moderation Scale/V1 אם מיושם. |
| Steps | 1. moderator מסמן report כ-dismissed. |
| Expected Result | `reports.status = "dismissed"`; `moderationActions` audit אם מיושם; regular users לא קוראים moderation data. |
| Priority | `P2` |
| Type | `manual`, `integration` |

---

## 4. Security / Negative Test Cases

### 4.1 Server-Owned Fields

| Test ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|
| `TC-SEC-001` | client לא יכול לשנות `coins` | authenticated user | נסה `updateDoc(users/{uid}, { coins: 999999 })` | deny; coins unchanged | `P0` | `rules` |
| `TC-SEC-002` | client לא יכול לשנות `isPro` | authenticated user | נסה `updateDoc(users/{uid}, { isPro: true })` | deny | `P0` | `rules` |
| `TC-SEC-003` | client לא יכול לשנות `subscriptionTier` | authenticated user | נסה write ל-`subscriptionTier` | deny | `P0` | `rules` |
| `TC-SEC-004` | client לא יכול לשנות `subscriptionStatus` | authenticated user | נסה write ל-`subscriptionStatus` | deny | `P0` | `rules` |
| `TC-SEC-005` | client לא יכול לשנות `subscriptionExpiresAt` | authenticated user | נסה write ל-expiry | deny | `P0` | `rules` |
| `TC-SEC-006` | client לא יכול לשנות `verifiedBadge` | authenticated user | נסה write ל-`publicProfiles/{uid}.verifiedBadge` | deny | `P0` | `rules` |
| `TC-SEC-007` | client לא יכול ליצור `transactions` | authenticated user | נסה create `users/{uid}/transactions/{id}` | deny | `P0` | `rules` |

### 4.2 Matching / Swipes

| Test ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|
| `TC-SEC-008` | client לא יכול ליצור `matches` ישירות | authenticated user | create `matches/{matchId}` | deny | `P0` | `rules` |
| `TC-SEC-009` | client לא יכול ליצור `swipes` ישירות | authenticated user | create `users/{uid}/swipes/{swipeId}` | deny | `P0` | `rules` |
| `TC-SEC-010` | self-swipe נדחה ב-function | authenticated user | call `submitSwipe` with self target | `self_action_forbidden`; no docs | `P0` | `integration` |
| `TC-SEC-011` | suspended user לא יכול לעשות swipe | suspended user | call `submitSwipe` | denied/`failed_precondition` | `P0` | `integration` |

### 4.3 Private Data / Chat

| Test ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|
| `TC-SEC-012` | user לא קורא private account של אחר | user A/B | A reads `users/{B}/private/account` | deny | `P0` | `rules` |
| `TC-SEC-013` | non-participant לא קורא chat | chat A/B; user C | C reads `chats/{chatId}` | deny | `P0` | `rules` |
| `TC-SEC-014` | non-participant לא קורא messages | chat A/B; user C | C reads `chats/{chatId}/messages` | deny | `P0` | `rules` |
| `TC-SEC-015` | participant יכול ליצור text message תקין | chat A/B | A creates message `type: "text"` if rules allow | allow | `P0` | `rules` |
| `TC-SEC-016` | client לא שולח image message ישירות | participant | create message `type: "image"` directly | deny; only `sendChatMediaMessage` allowed | `P0` | `rules` |
| `TC-SEC-017` | Basic media blocked server-side | Basic participant | call `sendChatMediaMessage` | `pro_required`; no message | `P0` | `integration` |

### 4.4 Catalog / Shop / Config

| Test ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|
| `TC-SEC-018` | client לא כותב `shopItems` | authenticated user | create/update `shopItems/{itemId}` | deny | `P0` | `rules` |
| `TC-SEC-019` | client לא כותב `gameCatalog` | authenticated user | create/update `gameCatalog/{gameId}` | deny | `P0` | `rules` |
| `TC-SEC-020` | client לא כותב `system/config` | authenticated user | update `system/config` | deny | `P0` | `rules` |
| `TC-SEC-021` | inactive item לא ניתן לרכישה | item inactive | call `purchaseShopItem` | `failed_precondition`; no coins change | `P0` | `integration` |

### 4.5 Payments / AI / Logs

| Test ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|
| `TC-SEC-022` | invalid webhook signature rejected | webhook endpoint | send invalid signature | HTTP `401/400`; no entitlement | `P0` | `integration` |
| `TC-SEC-023` | duplicate webhook idempotent | valid webhook processed once | replay same event | no duplicate entitlement/audit | `P0` | `integration` |
| `TC-SEC-024` | Gemini API key לא ב-client bundle | built app | run bundle scan | no `GEMINI_API_KEY`, no `@google/genai`, no `gemini-3-flash-preview` | `P0` | `build/CI` |
| `TC-SEC-025` | payment secrets לא ב-client bundle | built app | run bundle scan | no `PAYMENT_*_SECRET` | `P0` | `build/CI` |
| `TC-SEC-026` | logs לא כוללים raw chat/payment/AI | function calls with sensitive inputs | inspect logs/stub logger | forbidden keys redacted/absent | `P0` | `unit`, `integration` |

---

## 5. Cross-Cutting Test Cases

### TC-X-001 — Hebrew RTL app shell

| Field | Value |
|---|---|
| Test ID | `TC-X-001` |
| User Story | `X-RTL` |
| Preconditions | app loaded. |
| Steps | 1. בדוק root html/app shell.<br>2. פתח nav screens. |
| Expected Result | `lang="he"` and `dir="rtl"`; bottom nav and layout align correctly. |
| Priority | `P0` |
| Type | `component`, `E2E`, `manual` |

### TC-X-002 — label maps cover enums

| Field | Value |
|---|---|
| Test ID | `TC-X-002` |
| User Story | `X-LOCALIZATION` |
| Preconditions | label maps exported. |
| Steps | 1. בדוק כל enum value: `SkillLevel`, `Platform`, `ShopItemCategory`, `ReportReason`, etc. |
| Expected Result | לכל enum יש label עברי; TypeScript `Record<Enum, string>` מכסה missing keys. |
| Priority | `P0` |
| Type | `unit` |

### TC-X-003 — ApiErrorCode maps to Hebrew safe copy

| Field | Value |
|---|---|
| Test ID | `TC-X-003` |
| User Story | `X-ERRORS` |
| Preconditions | error mapper קיים. |
| Steps | 1. עבור על כל `ApiErrorCode` מ-`API_CONTRACT.md`.<br>2. בדוק output copy. |
| Expected Result | כל error ממופה; no raw provider/stack; `internal` generic. |
| Priority | `P0` |
| Type | `unit`, `component` |

### TC-X-004 — mobile viewport core flows

| Field | Value |
|---|---|
| Test ID | `TC-X-004` |
| User Story | `X-MOBILE` |
| Preconditions | Playwright viewports `360x740`, `390x844`, `430x932`. |
| Steps | 1. הרץ smoke flows: onboarding, discovery, chat, shop. |
| Expected Result | אין overflow קריטי; touch targets usable; bottom nav accessible. |
| Priority | `P0` |
| Type | `E2E`, `manual` |

### TC-X-005 — accessibility basics

| Field | Value |
|---|---|
| Test ID | `TC-X-005` |
| User Story | `X-A11Y` |
| Preconditions | core pages loaded. |
| Steps | 1. בדוק keyboard nav.<br>2. בדוק focus states.<br>3. בדוק icon-only buttons.<br>4. בדוק modals focus trap. |
| Expected Result | controls נגישים; aria labels בעברית; no keyboard trap. |
| Priority | `P0` |
| Type | `component`, `manual`, `E2E` |

### TC-X-006 — offline/retry safe behavior

| Field | Value |
|---|---|
| Test ID | `TC-X-006` |
| User Story | `X-OFFLINE` |
| Preconditions | network simulation. |
| Steps | 1. נתק network במהלך swipe/purchase/chat send.<br>2. החזר network.<br>3. לחץ retry. |
| Expected Result | UI מציג error/retry; no duplicate sensitive side effects; idempotency נשמרת. |
| Priority | `P1` |
| Type | `E2E`, `integration` |

### TC-X-007 — loading/empty/error/success לכל async screen

| Field | Value |
|---|---|
| Test ID | `TC-X-007` |
| User Story | `X-ASYNC-STATES` |
| Preconditions | mocked hooks/components. |
| Steps | 1. עבור Login/Onboarding/Discovery/Matches/Chat/Shop/Subscription/Profile/AI/Settings.<br>2. הרץ כל state. |
| Expected Result | כל screen מציג state מתאים; no crash; retry אם רלוונטי. |
| Priority | `P0` |
| Type | `component` |

### TC-X-008 — no PII in analytics events

| Field | Value |
|---|---|
| Test ID | `TC-X-008` |
| User Story | `X-PRIVACY` |
| Preconditions | analytics provider mocked. |
| Steps | 1. הפעל events מרכזיים.<br>2. בדוק payloads. |
| Expected Result | אין email/bio/raw chat/payment/Gemini prompts; IDs pseudonymous only. |
| Priority | `P0` |
| Type | `unit`, `component`, `integration` |

### TC-X-009 — forbidden bundle strings

| Field | Value |
|---|---|
| Test ID | `TC-X-009` |
| User Story | `X-BUILD-SAFETY` |
| Preconditions | production build קיים. |
| Steps | 1. הרץ `npm run scan:bundle`. |
| Expected Result | אין `GEMINI_API_KEY`, `PAYMENT_*_SECRET`, `process.env.API_KEY`, `gemini-3-flash-preview`. |
| Priority | `P0` |
| Type | `CI` |

---

## 6. Traceability Matrix

| User Story / Acceptance Criterion | Test IDs | Type | Priority |
|---|---|---|---|
| `AUTH-001` signup via Google/email | `TC-AUTH-001`, `TC-AUTH-002`, `TC-AUTH-005`, `TC-AUTH-006`, `TC-AUTH-007`, `TC-AUTH-008` | component/integration/E2E | `P0/P1` |
| `AUTH-002` returning user route guard | `TC-AUTH-003` | integration/E2E | `P0` |
| `AUTH-003` logout | `TC-AUTH-004` | component/E2E | `P1` |
| `ONB-001` onboarding starts after signup | `TC-ONB-001`, `TC-ONB-002` | component/integration/E2E | `P0` |
| `ONB-002` add game/preferences | `TC-ONB-003`, `TC-ONB-005`, `TC-ONB-006` | unit/component/integration/rules | `P0` |
| `ONB-003` onboarding completion unlocks discovery | `TC-ONB-004`, `TC-DISC-006` | integration/E2E | `P0` |
| `PROF-001` view own profile | `TC-PROF-001` | component/E2E | `P0` |
| `PROF-002` update profile | `TC-PROF-002`, `TC-PROF-003`, `TC-PROF-004` | unit/component/integration/rules | `P0/P1` |
| `DISC-001` discovery deck | `TC-DISC-001`, `TC-DISC-005`, `TC-DISC-006`, `TC-DISC-007` | component/integration/E2E | `P0/P1` |
| `DISC-002` game filter | `TC-DISC-002` | component/E2E | `P1` |
| `DISC-003` swipe actions | `TC-DISC-003`, `TC-DISC-004`, `TC-DISC-008`, `TC-DISC-009`, `TC-DISC-010` | integration/E2E | `P0` |
| `DISC-004` empty/no candidates | `TC-DISC-005` | component/E2E | `P1` |
| `MATCH-001` reciprocal match | `TC-MATCH-001`, `TC-MATCH-003`, `TC-MATCH-004`, `TC-DISC-010` | integration/E2E | `P0` |
| `MATCH-002` match UX and chat entry | `TC-MATCH-002`, `TC-MATCH-005` | component/integration/E2E/manual | `P0/P2` |
| `CHAT-001` open chat as participant | `TC-CHAT-001`, `TC-CHAT-007`, `TC-SEC-013`, `TC-SEC-014` | rules/integration/E2E | `P0` |
| `CHAT-002` send text | `TC-CHAT-002`, `TC-CHAT-004`, `TC-CHAT-005`, `TC-CHAT-006` | unit/component/integration/rules/E2E | `P0/P1` |
| `CHAT-003` media Pro gate | `TC-CHAT-003`, `TC-CHAT-008`, `TC-CHAT-009`, `TC-SEC-016`, `TC-SEC-017` | rules/integration/component/E2E | `P0` |
| `SHOP-001` browse/view shop | `TC-SHOP-001`, `TC-SHOP-002` | component/E2E | `P1` |
| `SHOP-002` purchase item | `TC-SHOP-003`, `TC-SHOP-005`, `TC-SHOP-006`, `TC-SHOP-007`, `TC-SHOP-008`, `TC-SHOP-009` | integration/component/E2E | `P0` |
| `SHOP-003` equip item | `TC-SHOP-004` | integration/E2E | `P0` |
| `SUB-001` Pro gating and upgrade prompt | `TC-SUB-001`, `TC-CHAT-003`, `TC-SHOP-008` | component/integration/E2E | `P0` |
| `SUB-002` checkout and activation | `TC-SUB-002`, `TC-SUB-003`, `TC-SUB-004`, `TC-SUB-005`, `TC-SUB-009` | integration/E2E | `P0` |
| `SUB-003` cancellation/expiry/refund | `TC-SUB-006`, `TC-SUB-007`, `TC-SUB-008` | integration/E2E | `P0/P1` |
| `AI-001` AI Hub available | `TC-AI-001` | component/E2E | `P1` |
| `AI-002` profile review | `TC-AI-002`, `TC-AI-004`, `TC-AI-005`, `TC-AI-006`, `TC-AI-007` | unit/component/integration/E2E | `P0/P1` |
| `AI-003` squad advice | `TC-AI-003`, `TC-AI-004`, `TC-AI-005`, `TC-AI-006`, `TC-AI-007` | unit/component/integration/E2E | `P0/P1` |
| `SAFE-001` report user/content | `TC-SAFE-001`, `TC-SAFE-003`, `TC-SAFE-004`, `TC-SAFE-005`, `TC-SAFE-006` | unit/integration/E2E/manual | `P0/P1/P2` |
| `SAFE-002` block user | `TC-SAFE-002`, `TC-SAFE-004`, `TC-SAFE-005`, `TC-DISC-007`, `TC-CHAT-006` | integration/E2E/rules | `P0/P1` |
| Security deny matrix | `TC-SEC-001`–`TC-SEC-026` | rules/integration/CI | `P0` |
| RTL/Hebrew launch | `TC-X-001`, `TC-X-002`, `TC-X-004`, `TC-X-005` | unit/component/E2E/manual | `P0` |
| Error mapping | `TC-X-003`, `TC-X-007` | unit/component | `P0` |
| Privacy analytics/logging | `TC-X-008`, `TC-SEC-026` | unit/integration | `P0` |
| Build/client secret safety | `TC-X-009`, `TC-SEC-024`, `TC-SEC-025` | CI | `P0` |

---

## 7. Open Items

| Item | Depends On | Impact |
|---|---|---|
| Final AI request limits | ADR-027 | Update `TC-AI-006` exact threshold and expected `resource_exhausted`. |
| Final chat abuse threshold | ADR-028 | Add spam/abuse test cases for chat throttling. |
| Daily reset timezone | ADR-029 | Add Basic swipe limit reset tests. |
| Final platform vocabulary | ADR-030 | Update enum coverage tests for `Platform`. |
| Max bio length | ADR-031 | Update `TC-PROF-003` exact value. |
| Pro-required cosmetics after Pro expiration | ADR-032 | Add tests for equipped Pro cosmetics after downgrade. |
| Likes You V1 gating | ADR-033 | Add/adjust tests if Likes You becomes Pro-gated. |
| Visual regression tooling | QA/CI open item | Add screenshot tests for core flows if adopted. |
| Payment provider final choice | ADR-017 | Add provider-specific sandbox/webhook tests. |
| Moderation actions implementation | Scale/V1 | Expand `TC-SAFE-006` and moderation audit cases. |
| Notifications/deep links | Future scope | Add test cases for notification-triggered chat/match opens. |
