# Swish & Game — Store Listing Kit

Ready-to-paste submission material for Google Play Console and App Store
Connect. Owner pastes; values marked ⚠️ need a decision or an approved legal
doc first. Keep this file in sync with PRD.md and STORE_COMPLIANCE.md.

---

## 1. Identity

| Field | Value |
|---|---|
| App name (both stores) | Swish & Game |
| Bundle / application id | com.swishgame.app |
| Category | Social (primary); Games has no fit — this is a social matching app |
| Default language | Hebrew (he-IL); English (en-US) secondary |
| Privacy Policy URL | https://swish-game-dev.firebaseapp.com/privacy.html ⚠️ move to the production domain before submission |
| Terms of Service URL | https://swish-game-dev.firebaseapp.com/terms.html ⚠️ same |
| Support email | orimimon14@gmail.com ⚠️ consider a dedicated support address |

## 2. Play Store — short description (max 80 chars)

He: מוצאים שותפים למשחק לפי משחק ורמה — החלקה, מאץ׳, צ׳אט ומשחקים ביחד
En: Find gaming teammates by game and skill — swipe, match, chat, squad up

## 3. Full description (both stores)

### Hebrew

נמאס לשחק לבד? Swish & Game מוצאת לך שותפים למשחק — לפי המשחקים שאתה
משחק ולפי הרמה שלך.

איך זה עובד:
- בוחרים את המשחקים שלכם (Fortnite, EA FC, Valorant, Warzone ועוד עשרות)
- מסמנים רמה — מתחיל, בינוני, מקצוען או עילית
- מחליקים על שחקנים, וכשיש התאמה הדדית — SQUAD UP! נפתח צ׳אט
- סוגרים משחק: צ׳אט, שיחות קול ווידאו, בלי לצאת מהאפליקציה

מה עוד יש:
- פרופיל גיימר עם גלריה, סרטוני גיימפליי ודירוגים לכל משחק
- סינון שחקנים לפי רמה — משחקים עם אנשים ברמה שלך
- עיצוב הפרופיל: מסגרות, רקעים וצבעים
- Pro: גלריה מורחבת, תמונות ווידאו בצ׳אט, תג מאומת והחלקות בלי הגבלה

הקהילה מנוהלת: דיווח וחסימה בלחיצה, גיל מינימום 16, ואפס סובלנות
להטרדות.

### English

Tired of playing alone? Swish & Game finds you teammates — by the games
you play and the level you play at.

How it works:
- Pick your games (Fortnite, EA FC, Valorant, Warzone and dozens more)
- Set your skill level — beginner to elite
- Swipe on players; mutual match → SQUAD UP! A chat opens
- Set up the game: chat, voice and video calls, all in-app

Also inside:
- A gamer profile with gallery, gameplay clips and per-game ranks
- Skill-level filtering — play with people at your level
- Profile cosmetics: borders, backgrounds, colors
- Pro: bigger gallery, photos & video in chat, verified badge, unlimited swipes

Moderated community: one-tap report & block, 16+ minimum age, zero
tolerance for harassment.

## 4. App Store keywords (100 chars)

`gamer,teammates,duo,squad,lfg,fortnite,valorant,fifa,gaming chat,matchmaking,שותפים,גיימרים`

## 5. Age rating questionnaire — answer sheet

| Question (both stores ask variants) | Answer |
|---|---|
| User-generated content? | Yes — profiles, photos, videos, chat. Moderation: report + block + review |
| Users can communicate? | Yes — text chat, voice/video calls (matched users only) |
| Shares user location? | No |
| Gambling / contests | No |
| Violence / sexual content / drugs in app content | None provided by the app itself |
| Minimum age enforced | 16+ (birth date at signup, enforced server-side) |
| Expected rating | Play: rated for 16+ (social/UGC); App Store: 17+ likely due to unfiltered UGC ⚠️ accept whatever the questionnaire yields |

## 6. Data safety (Play) / Privacy labels (App Store)

Data we collect, why, and linkage — derived from DATA_MODEL.md. All data is
linked to identity (account-based app). No data sold; no third-party ads.

| Data | Collected | Purpose | Shared with third parties |
|---|---|---|---|
| Email address | Yes | Account management | No (Firebase Auth is a processor) |
| Name (display name) | Yes | Profile, shown to other users | Visible to users, not "shared" |
| Date of birth | Yes | Age gating (16+); age shown on cards | No |
| Photos & videos | Yes (user-provided) | Profile & chat content | Visible to users |
| Messages (chat) | Yes | Core feature | No |
| Voice/video calls | Relayed peer-to-peer (WebRTC); not recorded | Core feature | No |
| Purchase history (subscription) | Yes | Entitlement (Pro) | Payment handled by RevenueCat + store billing |
| Device push token | Yes | Notifications | No |
| Usage analytics | ⚠️ currently none beyond Firebase operational logs — declare "none" unless analytics added |
| Precise location | No | — | — |
| Contacts | No | — | — |

Account deletion: available IN-APP (settings → delete permanently) and
required by both stores — already implemented (`deleteAccount`).

## 6.5 In-app products to configure (RevenueCat + store consoles) — ADR-044

| Product id (suggested) | Type | Price | Notes |
|---|---|---|---|
| `pro_weekly` | auto-renewing subscription | ₪14.90/week | no trial |
| `pro_monthly` | auto-renewing subscription | ₪29.90/month | 14-day free trial |
| `pro_annual` | auto-renewing subscription | ₪119.90/year | 14-day free trial; badge "best value" |
| coins packs (`coins_100/250/550/1200`) | consumable | ₪4.90 / 10.90 / 19.90 / 34.90 | Phase 2 — do NOT configure at launch |
| `boost_1`, `boost_3` | consumable | ₪9.90 / ₪24.90 | Phase 2 |
| `super_invite_1`, `super_invite_5` | consumable | ₪6.90 / ₪27.90 | Phase 2 |

## 7. Assets checklist

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 (Play), 1024×1024 (App Store), no alpha | ⚠️ export from existing icon set |
| Feature graphic (Play) | 1024×500 | ⚠️ to design |
| Screenshots phone | ≥2 per store; 6.7" + 5.5" sizes for Apple | ⚠️ capture after TestFlight build |
| Preview video | optional | skip for v1 |

## 8. Submission blockers checklist (mirrors ROADMAP §9.11)

- [ ] Apple Developer account ($99/yr) — owner
- [ ] Google Play Console account ($25) — owner
- [ ] Legal counsel sign-off on privacy/terms — owner
- [ ] RevenueCat account + store products (pro monthly ₪29.90) — dev after accounts
- [ ] Production Firebase project setup (incl. cross-service IAM grant, ENVIRONMENTS.md) — dev
- [ ] Native shells: iOS `cap add ios` (needs Xcode + Apple account), push + Google sign-in native — dev
- [ ] TestFlight / Internal testing round with friends — both
