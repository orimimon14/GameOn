# Swish & Game — Decision Log (ADR)

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Product & Technical Decision Log |
| Date | 2026-06-28 |
| Owner | Product Lead / Technical Product Lead |
| Repository Path | `docs/product/DECISIONS.md` |
| Product | Swish & Game |
| Format | ADR — Architecture Decision Records |
| Scope | מקור האמת היחיד לכל ההחלטות המוצריות והטכניות בפרויקט |

---

## 2. מתודולוגיית ADR וסטטוסים

מסמך זה מרכז את כל ההחלטות המוצריות והטכניות המרכזיות של Swish & Game. כל החלטה מתועדת כ-ADR כדי לשמור על היסטוריה ברורה של ההקשר, ההחלטה, הנימוק וההשלכות.

### משמעות ה-Status

| Status | משמעות |
|---|---|
| `Accepted` | החלטה מאושרת ומחייבת. יש ליישם אותה במוצר, בקוד, במסמכי הארכיטקטורה ובסכמה. |
| `Proposed – pending confirmation` | החלטה מומלצת אך ממתינה לאישור owner. ניתן לתכנן לפיה, אך אין לנעול implementation סופי ללא אישור. |
| `Open` | נושא פתוח שדורש החלטה. אינו חוסם בהכרח את תחילת הפיתוח, אך חייב להיסגר לפני milestone רלוונטי. |

---

## 3. אינדקס החלטות

| ADR ID | כותרת | קטגוריה | Status |
|---|---|---|---|
| ADR-001 | Product Name Canonicalization | A — החלטות יסוד | Accepted |
| ADR-002 | Canonical PRD as Official Product Source | A — החלטות יסוד | Accepted |
| ADR-003 | Canonical Data Model in DATA_MODEL.md | A — החלטות יסוד | Accepted |
| ADR-004 | Canonical `skillLevel` Taxonomy | A — החלטות יסוד | Accepted |
| ADR-005 | MVP Coin Model | A — החלטות יסוד | Accepted |
| ADR-006 | Backend-Authoritative Architecture | A — החלטות יסוד | Accepted |
| ADR-007 | Canonical Production Stack | A — החלטות יסוד | Accepted |
| ADR-008 | Hebrew-First RTL Localization | A — החלטות יסוד | Accepted |
| ADR-009 | Canonical Design Tokens and Deprecated Styling Names | A — החלטות יסוד | Accepted |
| ADR-010 | Controlled `platforms` Field | B — החלטות מודל נתונים | Accepted |
| ADR-011 | Unified Shop Taxonomy | B — החלטות מודל נתונים | Accepted |
| ADR-012 | Avatar Border Stored as Shop Item Reference | B — החלטות מודל נתונים | Accepted |
| ADR-013 | Minimum User Age Recommendation | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-014 | Age Visibility in Discovery | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-015 | Basic Daily Swipe Limit | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-016 | Unlimited Basic Matches | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-017 | Israel-Facing Payment Provider Selection | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-018 | Coins Used for Cosmetics Only in MVP | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-019 | Curated Game Catalog | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-020 | Free-Text Ranks in MVP | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-021 | MVP Discovery Filters Limited to Game | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-022 | Read Receipts Deferred | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-023 | Last-Active Presence in MVP | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-024 | Manual / Report-Based Image Moderation in MVP | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-025 | Verified Badge Means Pro Member | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-026 | Initial Launch Market and Language | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-033 | Likes You Visibility & Pro Gating | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-034 | Coin Granting & Earning Mechanism (MVP) | C — החלטות מוצר מוצעות | Proposed – pending confirmation |
| ADR-040 | Cross-Game Likes & Dead-End Like Prevention | C — החלטות מוצר מוצעות | Accepted (2026-07-07): cross-game likes allowed in MVP |
| ADR-041 | Live Voice & Video Calls in MVP | C — החלטות מוצר מוצעות | Accepted |
| ADR-042 | Profile Media Gallery (tier-gated) | C — החלטות מוצר מוצעות | Accepted (2026-07-09) |
| ADR-027 | AI Request Limits by Tier | D — נושאים פתוחים | Open |
| ADR-028 | Chat Abuse Threshold | D — נושאים פתוחים | Open |
| ADR-029 | Daily Limit Reset Timezone | D — נושאים פתוחים | Open |
| ADR-030 | Final `Platform` Vocabulary | D — נושאים פתוחים | Open |
| ADR-031 | Maximum `bio` Length | D — נושאים פתוחים | Open |
| ADR-032 | Pro-Required Cosmetics After Pro Expiration | D — נושאים פתוחים | Open |
| ADR-035 | Bidirectional UI & Internationalization (RTL + LTR) | E — פלטפורמה, תשלום ובינלאומיות | Accepted |
| ADR-036 | Web-First Delivery with Capacitor Path to App Stores | E — פלטפורמה, תשלום ובינלאומיות | Accepted |
| ADR-037 | RevenueCat as Billing & Entitlement Abstraction | E — פלטפורמה, תשלום ובינלאומיות | Accepted |
| ADR-038 | Mandatory In-App Account Deletion | E — פלטפורמה, תשלום ובינלאומיות | Accepted |
| ADR-039 | Cosmetic Rendering & Animation Stack | E — פלטפורמה, תשלום ובינלאומיות | Accepted |

---

# 4. ADRs

---

## Category A — החלטות יסוד

---

### ADR-001: Product Name Canonicalization

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

בשלב ה-prototype הופיעו מספר שמות למוצר ול-code namespace, כולל `GameOn` ו-`DoGame`. שימוש בכמה שמות יוצר בלבול במסמכי מוצר, בקוד, בעיצוב, ב-copy, ב-Firebase resources וב-brand identity.

#### Decision

שם המוצר הקנוני הוא **Swish & Game**.  
השמות `GameOn` ו-`DoGame` מוגדרים כ-deprecated ואינם בשימוש במסמכים, UI, code namespaces, CSS tokens, routes, או Firebase naming עתידי.

#### Rationale

שם אחד מייצר עקביות מותגית, מפחית בלבול בצוות, ומונע מצב שבו מסמכים, קוד ו-design tokens מתפצלים לכיוונים שונים.

#### Consequences

- כל מסמך חדש ישתמש בשם `Swish & Game`.
- references ל-`GameOn` ו-`DoGame` יוסרו או יסומנו כ-stale.
- CSS namespace ישן כמו `dogame` לא ימשיך ל-production.
- Firebase project names, package names, docs paths ו-copy צריכים להתיישר סביב Swish & Game.

---

### ADR-002: Canonical PRD as Official Product Source

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

הפרויקט עבר כמה איטרציות של PRD ו-product direction. חלק מהגרסאות הכילו שמות ישנים, monetization ישן, או feature assumptions שלא מתאימים ל-MVP הנוכחי.

#### Decision

ה-PRD הקנוני ב-`docs/product/PRD.md` הוא מקור האמת הרשמי ל-product requirements. גרסאות ישנות או סותרות יועברו ל-Stale Docs / archive ולא ישמשו לתכנון implementation.

#### Rationale

צריך מקור אמת אחד כדי למנוע סתירות בין product, architecture, schema, QA ו-roadmap.

#### Consequences

- Engineering מתכנן לפי `PRD.md`.
- Architecture, Data Model, API Contract ו-Security docs חייבים להיות עקביים עם ה-PRD.
- דרישות שאינן מופיעות ב-PRD נחשבות out-of-scope עד להחלטה חדשה.
- שינוי משמעותי בדרישות ידרוש עדכון PRD ו-Decision Log.

---

### ADR-003: Canonical Data Model in DATA_MODEL.md

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

מסמך הארכיטקטורה מתאר את מבנה המערכת ברמת overview, אך אינו מיועד להחזיק schema מלאה שדה-אחר-שדה. Firestore דורש עקביות גבוהה בשמות collections, fields, ownership rules ו-enums.

#### Decision

הסכמה הקנונית מוגדרת ב-`docs/architecture/DATA_MODEL.md`, ומחולקת ל-MVP מול Scale/V1. זהו מקור האמת היחיד עבור collections, fields, enums, deterministic IDs, denormalization, ו-field ownership.

#### Rationale

הפרדה בין architecture overview לבין schema canonical מונעת כפילויות וסתירות.

#### Consequences

- כל שינוי field/collection חייב להתעדכן קודם ב-`DATA_MODEL.md`.
- Security Rules, Cloud Functions ו-frontend types צריכים להיגזר מה-data model.
- `ARCHITECTURE.md` מסכם collections אך מפנה ל-`DATA_MODEL.md` עבור פירוט מלא.

---

### ADR-004: Canonical `skillLevel` Taxonomy

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

ב-prototype הופיעו ערכים בעברית או ערכים לא אחידים עבור skill level. זה מקשה על queries, validation, analytics ו-localization.

#### Decision

`skillLevel` נשמר בדיוק כאחד מארבעה ערכים באנגלית:

- `beginner`
- `intermediate`
- `pro`
- `elite`

עברית תשמש רק כ-UI labels.

#### Rationale

Enum באנגלית מאפשר consistency בין Firestore, TypeScript, Cloud Functions, analytics ו-future localization.

#### Consequences

- אין לשמור ערכי enum בעברית ב-Firestore.
- UI צריך להחזיק label map, לדוגמה `beginner` → "מתחיל".
- כל validation schema חייב לאכוף את ארבעת הערכים בלבד.
- Migration מה-prototype יידרש אם קיימים ערכים ישנים.

---

### ADR-005: MVP Coin Model

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

היו רעיונות מוקדמים למכירת coin packs בכסף אמיתי. אך coin sales מוסיפים complexity משפטי, billing, refunds, fraud, tax, support, ו-risk של perceived pay-to-win.

#### Decision

ב-MVP, coins הם granted/earned בלבד ולא נרכשים בכסף אמיתי. כסף אמיתי משמש רק למנוי Pro. Coin packs בתשלום נדחים ל-V1.

#### Rationale

החלטה זו מפשטת launch, מפחיתה סיכון משפטי ותשלומי, ומאפשרת להתמקד בלולאת הליבה: discovery → match → chat → cosmetics → Pro.

#### Consequences

- אין checkout ל-coins ב-MVP.
- Coin balance עדיין server-owned.
- כל שינוי ב-coins חייב ליצור transaction audit.
- Shop items נרכשים עם coins בלבד.
- Real-money coin packs דורשים ADR חדש או עדכון ADR לפני V1.

---

### ADR-006: Backend-Authoritative Architecture

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

ה-prototype מחזיק logic ו-state בצד client. במוצר production, client-side mutation של state רגיש תאפשר זיוף coins, Pro status, matches, AI access ו-owned items.

#### Decision

הארכיטקטורה היא backend-authoritative. ה-client רשאי לבקש actions, אך לא לשנות ישירות state רגיש:

- `coins`
- `subscriptionTier`
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `isPro`
- `verifiedBadge`
- `matches`
- `swipes`
- `transactions`
- `ownedItems`
- `aiRequests`
- `subscriptions`

#### Rationale

Trust-sensitive state חייב להיות מוגן ב-Cloud Functions, Firestore Security Rules ו-server-side validation.

#### Consequences

- Swipe ומatch creation דרך `submitSwipe`.
- Item purchase דרך `purchaseShopItem`.
- Equip cosmetic דרך `equipItem`.
- AI דרך server-side Gemini proxy.
- Pro דרך payment webhook.
- Client-side gating הוא UX בלבד, לא security enforcement.

---

### ADR-007: Canonical Production Stack

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

הפרויקט עובר מ-prototype ל-production. יש צורך ב-stack ברור המאזן מהירות פיתוח, real-time capabilities, security, וסקייל עתידי.

#### Decision

ה-stack הקנוני:

- Frontend: React + Vite + TypeScript + Tailwind CSS + Framer Motion
- Routing: React Router
- Local UI state: Zustand
- Validation: Zod
- Forms: React Hook Form
- Backend: Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Functions
- Secrets: Secret Manager
- AI: Gemini דרך server-side proxy בלבד
- Future heavy workloads: Cloud Run reserved for Scale/V1

#### Rationale

Firebase-first מתאים למוצר real-time, mobile-first, early-stage. הוא מאפשר delivery מהיר בלי לבנות backend מסורתי מלא.

#### Consequences

- אין שימוש ישיר ב-Gemini SDK מה-client.
- אין SQL/Drizzle ב-MVP.
- Firestore הוא primary database.
- Cloud Functions מחזיקות logic רגיש.
- TypeScript strict צריך להיות enforced.

---

### ADR-008: Hebrew-First RTL Localization

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

קהל ההשקה הראשוני הוא ישראלי, וה-UI צריך להרגיש טבעי בעברית. במקביל, data model ו-enums צריכים להישאר באנגלית כדי לתמוך ב-code consistency ו-future localization.

#### Decision

Swish & Game יהיה Hebrew-first עם RTL UI. כל stored data fields ו-enum values נשארים באנגלית.

#### Rationale

עברית ב-UI משפרת התאמה לשוק המקומי, בעוד אנגלית בסכמה מונעת coupling בין localization לבין data model.

#### Consequences

- כל המסכים צריכים לתמוך RTL.
- UI labels בעברית יגיעו מ-label maps או i18n.
- Firestore values נשארים באנגלית.
- QA צריך לכלול RTL layout checks.
- אין לשמור strings כמו "מקצוען" כ-enum value.

---

### ADR-009: Canonical Design Tokens and Deprecated Styling Names

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | A — החלטות יסוד |

#### Context

ה-prototype השתמש בצבעים ו-namespaces ישנים, כולל cyan `#22D3EE` ו-CSS namespace בשם `dogame`. המפרט החדש מגדיר theme בשם Dark Matter וטוקנים אחרים.

#### Decision

ה-design tokens הקנוניים:

- Primary indigo: `#6366F1`
- Premium amber: `#F59E0B`
- Success emerald: `#10B981`
- Danger red: `#EF4444`

ה-cyan הישן `#22D3EE` ו-namespace `dogame` מבוטלים.

#### Rationale

הטוקנים החדשים מתאימים למותג premium gaming ול-PRD. שם namespace ישן יוצר חוסר עקביות מול המוצר הקנוני.

#### Consequences

- Tailwind config צריך להתעדכן לטוקנים החדשים.
- references ל-`dogame-*` צריכים לעבור refactor.
- אין להוסיף components חדשים עם namespace ישן.
- צבעי Pro/premium יתבססו על `#F59E0B`.

---

## Category B — החלטות מודל נתונים

---

### ADR-010: Controlled `platforms` Field

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | B — החלטות מודל נתונים |

#### Context

ה-code prototype מחזיק `platforms: string[]` ברמת הפרופיל. מסמך הארכיטקטורה המקורי השמיט את השדה, אך הוא חשוב להתאמת גיימרים לפי platform.

#### Decision

נשמר שדה `platforms: Platform[]` ב-`users/{uid}` וב-`publicProfiles/{uid}`. הערכים יהיו controlled vocabulary באנגלית בלבד.

#### Rationale

Platform הוא signal חשוב ל-compatibility. שדה מבוקר מונע חוסר עקביות כמו `PS5`, `Playstation`, `play station 5`.

#### Consequences

- `Platform` מוגדר ב-`DATA_MODEL.md`.
- UI יציג labels בעברית/ידידותיים לפי enum.
- Discovery יוכל בעתיד לסנן לפי platform.
- Migration מה-prototype צריך למפות strings קיימים ל-enum values.

---

### ADR-011: Unified Shop Taxonomy

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | B — החלטות מודל נתונים |

#### Context

ה-prototype השתמש ב-`itemType: 'background' | 'avatar-border'`, `rarity` באותיות גדולות, ו-`category` כ-theme כגון Cyber/Nature/Space. זה מתנגש עם data model production.

#### Decision

Shop taxonomy מאוחדת:

- `category: 'avatar_border' | 'profile_banner' | 'global_background'`
- `rarity: 'common' | 'rare' | 'epic' | 'legendary'`
- `requiresPro: boolean`
- `priceCoins`
- `previewUrl`
- `assetUrl`
- `isAnimated`
- `isActive`

ה-theme הישן נשמר כ-`themeTag?: string`.

#### Rationale

Taxonomy קנונית מאפשרת queries, validation, Pro gating ו-UI consistency.

#### Consequences

- אין להשתמש ב-`itemType` ב-production schema.
- `avatar-border` מוחלף ב-`avatar_border`.
- rarity באותיות גדולות דורש migration.
- `themeTag` הוא metadata בלבד, לא category ראשית.

---

### ADR-012: Avatar Border Stored as Shop Item Reference

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | B — החלטות מודל נתונים |

#### Context

ה-code prototype שמר CSS gradient ישירות על המשתמש כ-avatar border. זה יוצר coupling בין user document לבין presentation/CSS ומקשה על ownership validation.

#### Decision

קוסמטיקה של avatar border נשמרת כ-`avatarBorderItemId`, שהוא reference ל-`shopItems/{itemId}`. ערך העיצוב עצמו נשמר ב-shop item, למשל ב-`assetUrl` או `style.cssGradient`.

#### Rationale

Reference-based cosmetics מאפשרים ownership validation, reuse, item deactivation, Pro gating ו-migration נקי.

#### Consequences

- `users/{uid}.avatarBorderItemId` הוא server-owned.
- אין לשמור CSS raw על user document.
- `equipItem` מאמת ownership לפני עדכון reference.
- UI טוען את פרטי העיצוב מה-shop item catalog.

---

## Category C — החלטות מוצר מוצעות

---

### ADR-013: Minimum User Age Recommendation

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

האפליקציה כוללת social discovery, chat, profile images ו-user-generated content. יש צורך במדיניות גיל מינימלי לפני launch.

#### Decision

ההמלצה היא לקבוע גיל מינימלי של **16+**, בכפוף לאישור משפטי לגבי GDPR, minors ו-local privacy requirements.

#### Rationale

16+ מאזנת בין קהל גיימינג רלוונטי לבין הפחתת סיכון סביב קטינים צעירים יותר.

#### Consequences

- Onboarding ידרוש age validation.
- משתמשים מתחת לגיל המינימלי לא יוכלו להשלים onboarding.
- Terms/Privacy חייבים להתייחס לגיל.
- החלטה סופית דורשת legal review.

---

### ADR-014: Age Visibility in Discovery

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Age הוא signal חשוב להתאמה חברתית ובטיחותית, במיוחד בקרב גיימרים שרוצים לשחק עם אנשים בגיל דומה.

#### Decision

ההמלצה היא להציג גיל בכרטיס ה-discovery ולהשתמש בו כנתון התאמה. לכן age יהיה visible ב-`publicProfiles`.

#### Rationale

שקיפות גיל משפרת match quality ומפחיתה אינטראקציות לא מתאימות.

#### Consequences

- `age` משוכפל ל-`publicProfiles/{uid}`.
- UI יציג age ב-discovery/profile.
- יש צורך להגדיר privacy language ברור.
- החלטה סופית תלויה במדיניות משפטית ו-minors.

---

### ADR-015: Basic Daily Swipe Limit

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Basic tier צריך לאפשר חוויית core loop אמיתית, אך לשמור incentive ברור לשדרוג Pro.

#### Decision

ההמלצה היא Basic daily swipe limit של **30 swipes/day** כערך התחלתי, ניתן לכוונון דרך `system/config`.

#### Rationale

30 swipes/day מספיקים ל-value ראשוני, אך יוצרים upgrade moment למשתמשים פעילים.

#### Consequences

- `submitSwipe` יאכוף את המגבלה server-side.
- `system/config.limits.basicDailySwipeLimit` יכול להחזיק את הערך.
- Pro מקבל unlimited swipes מבחינת product limit, אך עדיין כפוף ל-abuse limits.
- הערך יכול להשתנות ללא code deploy.

---

### ADR-016: Unlimited Basic Matches

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

חסימת matches עלולה לפגוע בלולאת הליבה של המוצר ולייצר תחושה שהמוצר לא עובד למשתמשי Basic.

#### Decision

ההמלצה היא ש-Basic users יקבלו unlimited matches. רק כמות swipes יומית מוגבלת.

#### Rationale

ה-core value הוא למצוא teammate ולדבר איתו. הגבלת matches עלולה לפגוע ב-retention ובאמון.

#### Consequences

- Monetization יתבסס על swipes, media, cosmetics ו-Pro status.
- Match creation לא ייחסם עבור Basic אם נוצר reciprocal like.
- Pro עדיין יהיה אטרקטיבי דרך unlimited swipes/media/dynamic cosmetics.
- אין paywall על עצם קבלת match.

---

### ADR-017: Israel-Facing Payment Provider Selection

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

המוצר מיועד להשקה ראשונית בישראל וצריך ספק תשלומים שתומך ב-recurring billing, webhooks, ILS, receipts ו-compliance מקומי.

#### Decision

ההמלצה היא לבחור ספק ישראלי או ספק שתומך היטב בישראל, עם recurring billing ו-webhooks. מועמד סופי TBD.

#### Rationale

Payment provider הוא integration קריטי ל-Pro. אסור לנעול ספק לפני בדיקת capabilities, fees, legal, webhooks ו-developer experience.

#### Consequences

- `PAYMENTS.md` יגדיר abstraction: checkout → webhook → Cloud Function → Firestore.
- `subscriptions/{uid}` לא תלוי provider ספציפי.
- `BillingProvider` כולל `stripe`, `cardcom`, `meshulam`, `other`.
- החלטה סופית נדרשת לפני implementation של billing.

---

### ADR-018: Coins Used for Cosmetics Only in MVP

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Coins יכולים לשמש לקוסמטיקה או ליכולות מוצריות. שימוש ב-coins ליכולות שאינן קוסמטיות עלול ליצור pay-to-win perception או לפגוע באמון ב-match fairness.

#### Decision

ההמלצה היא ש-coins יהיו cosmetic-only ב-MVP. Coins לא פותחים capabilities שאינן קוסמטיות.

#### Rationale

Cosmetic-only economy שומר על fairness ומפחית complexity מוצרית ומשפטית.

#### Consequences

- Coins משמשים ל-avatar borders, profile banners, global backgrounds.
- אין שימוש ב-coins ל-boosts, match priority, extra swipes, או AI advantages ב-MVP.
- Shop economy אינה משפיעה על match ranking.
- הרחבת שימוש coins דורשת ADR חדש.

---

### ADR-019: Curated Game Catalog

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

User-generated game names יוצרים duplicates, spelling variants ו-discovery fragmentation.

#### Decision

ההמלצה היא להשתמש ב-curated `gameCatalog`, לא user-generated games.

#### Rationale

Catalog מבוקר משפר query quality, analytics, rank mapping, icon consistency ו-discovery performance.

#### Consequences

- משתמשים בוחרים משחקים מתוך `gameCatalog`.
- ניתן להוסיף flow של "suggest game" שאינו יוצר game מיידית.
- `users/{uid}/games/{gameId}` משתמש ב-`gameId` קנוני.
- Admin/catalog management יידרש בהמשך.

---

### ADR-020: Free-Text Ranks in MVP

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

סטנדרטיזציה של ranks לכל משחק דורשת mapping מפורט ושונה לכל title. זה עלול להאט את ה-MVP.

#### Decision

ההמלצה היא לאפשר free-text ranks ב-MVP, עם מעבר ל-standardized rank lists ב-V1.

#### Rationale

Free-text מאפשר launch מהיר בלי לבנות rank taxonomy מלאה לכל משחק.

#### Consequences

- `rank` יהיה client-writable string ב-MVP.
- `rankNormalized` ו-`rankScore` יהיו Scale/V1.
- Discovery ranking לפי rank יהיה מוגבל ב-MVP.
- V1 יוסיף `supportedRanks` ו-`rankOrder` ב-`gameCatalog`.

---

### ADR-021: MVP Discovery Filters Limited to Game

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Advanced filters כמו age, rank, region ו-platform יכולים לשפר התאמה, אך מעלים complexity מוקדם.

#### Decision

ההמלצה היא שב-MVP discovery יסונן לפי selected game בלבד. פילטרים מתקדמים יידחו ל-V1.

#### Rationale

Game filter הוא ה-core requirement. שמירת MVP פשוט מפחיתה query complexity ומאיצה delivery.

#### Consequences

- MVP deck query מתבסס בעיקר על `gameIds`.
- age/rank/region filters יישארו out-of-scope ל-MVP.
- Data model עדיין שומר fields שיאפשרו פילטרים עתידיים.
- V1 יכול להוסיף backend-generated deck עם filters.

---

### ADR-022: Read Receipts Deferred

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Read receipts מוסיפים state נוסף, privacy questions ו-write volume לצ׳אט.

#### Decision

ההמלצה היא לא לכלול read receipts ב-MVP.

#### Rationale

Text chat בסיסי ו-last-message preview מספיקים ללולאת הליבה. Read receipts אינם קריטיים ל-MVP.

#### Consequences

- אין `readAt` per message ב-MVP.
- אפשר להשתמש ב-`unreadCounts` ברמת chat metadata.
- Read receipts יכולים להיכנס ב-V1 עם privacy setting.
- פחות writes ו-complexity ב-chat.

---

### ADR-023: Last-Active Presence in MVP

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Real-time presence דורש connection tracking, online/offline sync, race handling ו-cost considerations.

#### Decision

ההמלצה היא להשתמש ב-`lastActiveAt` בלבד ב-MVP, לא real-time presence.

#### Rationale

Last-active נותן מספיק context למשתמשים בלי complexity של presence engine.

#### Consequences

- UI יציג "נראה לאחרונה" או equivalent.
- אין green online dot אמיתי ב-MVP.
- `lastActiveAt` מתעדכן בצורה throttled.
- Real-time presence יכול להיכנס ב-V1.

---

### ADR-024: Manual / Report-Based Image Moderation in MVP

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

Profile images, banners ו-chat media הם UGC ומייצרים safety risk. אוטומציה מלאה דורשת ספק moderation, cost ו-integration.

#### Decision

ההמלצה היא moderation מבוססת דיווח/ידנית ב-MVP, עם אוטומציה ב-V1.

#### Rationale

החלטה זו מאזנת launch speed עם safety baseline: block/report קיימים מהיום הראשון, אך automation נדחה.

#### Consequences

- חובה block/report ב-MVP.
- Reports צריכים לכלול source/context.
- Admin review יכול להיות lightweight בתחילה.
- Image moderation automation תיבחן ב-V1.
- יש להגדיר Terms/UGC policy לפני launch.

---

### ADR-025: Verified Badge Means Pro Member

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

"Verified" יכול להתפרש כאימות זהות או game account verification. ב-MVP אין תשתית אימות כזו.

#### Decision

ההמלצה היא שב-MVP `verifiedBadge` אומר "Pro member", ולא identity verification או game account verification.

#### Rationale

זה מאפשר badge ברור ופשוט בלי לבנות verification flows.

#### Consequences

- UI copy צריך להבהיר שמדובר ב-Pro badge.
- אין להציג badge כהוכחת זהות.
- Identity/game verification יכול להיכנס בעתיד עם badge נפרד או משמעות מעודכנת.
- `verifiedBadge` נגזר מ-`isPro`.

---

### ADR-026: Initial Launch Market and Language

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

המוצר מתחיל סביב קהל ישראלי ודורש פוקוס בשוק, שפה, payments ו-support.

#### Decision

ההמלצה היא השקה ראשונית בישראל, Hebrew-first, RTL.

#### Rationale

פוקוס גיאוגרפי ושפתי מפשט marketing, QA, copy, support ו-payments.

#### Consequences

- UI בעברית ו-RTL כברירת מחדל.
- Billing ב-ILS.
- Terms/Privacy צריכים להתאים לשוק הישראלי ול-GDPR/Privacy requirements ככל שרלוונטי.
- English (LTR) נכלל כשפה שנייה ב-MVP תחת ADR-035 (bidi); שוק ההשקה נשאר ישראל/עברית-first. שפות נוספות דורשות ADR עתידי.

---


### ADR-033: Likes You Visibility & Pro Gating

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

מסך "מי עשה לך לייק" (`Likes You`) הוא נקודת monetization נפוצה במוצרים מסוג זה, במיוחד כ-premium capability מסוג "see who liked you". בקוד ה-prototype הנוכחי המסך פתוח לכל המשתמשים דרך `LikesGrid`. גרסת PRD מוקדמת שהועברה לארכיון הגדירה אותו כנעול למנויים. אין כיום החלטה קנונית, ואף ADR קיים אינו מכסה זאת.

#### Decision

ההמלצה היא שב-MVP מסך `Likes You` יהיה **פתוח לכל המשתמשים** — גם Basic וגם Pro. שקילה מחדש של נעילה ל-Pro תידחה ל-V1.

#### Rationale

בשלב cold-start, שבו יש מעט משתמשים ומעט התאמות, הסתרת likes פוגעת קשות בלולאת הליבה ובנזילות ההתאמות. זה מתחבר ישירות לסיכון מרכזי ב-PRD: deck ריק או חוויית matching חלשה בתחילת הדרך. פתיחת המסך לכולם ממקסמת התאמות מוקדמות, משפרת activation ו-retention, ומפחיתה friction למשתמשים חדשים.

נעילה ל-Pro היא מנוף הכנסה חזק, אך עדיף להפעיל אותה ב-V1 כאשר קיימת מסת משתמשים מספקת והמערכת כבר מספקת ערך ברור גם ללא חשיפת likes מלאה.

#### Consequences

- ב-MVP אין Pro gating על מסך `Likes You`.
- Monetization ב-MVP מתבסס על swipe limit, media transfer, cosmetics ו-Pro status/badge — לא על `Likes You`.
- אם תיבחר נעילה ל-Pro ב-V1, תידרש החלטה חדשה או עדכון ADR.
- ה-UI הנוכחי, שבו `LikesGrid` פתוח, כבר תואם להמלצה זו ל-MVP.

---

### ADR-034: Coin Granting & Earning Mechanism (MVP)

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

ADR-005 קובע ש-coins ניתנים/נצברים (`granted/earned`) ואינם נרכשים בכסף אמיתי ב-MVP, ו-ADR-018 קובע שהם קוסמטיים בלבד. עם זאת, מנגנון הקבלה בפועל עדיין לא הוגדר: איך משתמש מקבל coins, מתי, וכמה. בקוד ה-prototype קיים ערך placeholder של `1,000,000` coins, שאינו מתאים ל-production ואינו משקף economy מכוילת.

#### Decision

ההמלצה היא שמקורות ה-coins ב-MVP יהיו:

1. `signup_bonus` חד-פעמי בעת השלמת onboarding.
2. `admin_grant` ידני עבור תמיכה, קמפיינים או פעולות תפעוליות.

לא יהיה earning loop מתמשך ב-MVP, כגון daily rewards, gameplay rewards או achievements. לא תהיה רכישה של coins בכסף אמיתי. סכום ה-`signup_bonus` יישמר ב-`system/config` ויכויל מול מחירי ה-shop. הסכום המדויק עצמו נשאר sub-decision פתוחה עד שמחירי ה-shop ייקבעו.

#### Rationale

מקור הענקה פשוט עם בקרת שרת מלאה תואם ל-ADR-005 ול-ADR-006. הוא מאפשר למשתמשים לחוות את shop loop כבר ב-MVP בלי להכניס real-money coin packs, fraud risk, refund complexity או economy balancing מוקדם מדי. כיול הסכום מול מחירי החנות מונע מצב שבו למשתמשים יש עודף לא סביר או מחסור שמונע חוויית customization בסיסית. דחיית earning loop שומרת על פשטות ה-MVP.

#### Consequences

- כל מתן coins עובר backend ויוצר transaction audit עם type `signup_bonus` או `admin_grant`.
- ה-placeholder של `1,000,000` coins בקוד יוחלף ב-`signup_bonus` אמיתי במהלך המיגרציה.
- earning loops כגון daily reward או achievements דורשים ADR חדש לפני V1.
- real-money coin packs דורשים ADR חדש לפני V1.
- הסכום המדויק של `signup_bonus` תלוי בקביעת מחירי ה-shop ומסומן כ-sub-decision פתוחה.

---

### ADR-040: Cross-Game Likes & Dead-End Like Prevention

| Field | Value |
|---|---|
| Status | `Proposed – pending confirmation` |
| Category | C — החלטות מוצר מוצעות |

#### Context

במהלך מימוש P3-T06 (Likes You) התגלה פער בין ה-UI לבין חוזה ה-API. ה-deck בדיסקברי (`GamesView` → `SwipeView`) מציג את כל ה-`gameCatalog` הפעיל ומאפשר לכל משתמש לגלוש ולעשות like לשחקנים של **כל משחק**, כולל משחקים שהמשתמש עצמו לא משחק. לעומת זאת, `submitSwipe` (`API_CONTRACT.md` §3.1) דורש שה-**target** יכיל את ה-`gameId` ב-`publicProfiles/{targetUid}.gameIds`, ו-match נוצר רק מ-reciprocal like עם **אותו** `gameId` (match ID דטרמיניסטי: `{minUid}_{maxUid}_{gameId}`).

התוצאה: like ממשתמש שלא משחק את המשחק לעולם לא יכול להבשיל ל-match — ה-like-back של הצד השני נכשל ב-`failed_precondition` כי ה-caller המקורי אינו target חוקי באותו `gameId`. זהו **"dead-end like"**: הוא מופיע במסך Likes You (הפתוח לכולם לפי ADR-033), צורך מה-daily swipe limit של השולח (ADR-015), אך אינו actionable. ה-UI הנוכחי של `LikesGrid` מטפל בכך בחן (מסיר את הכרטיס עם הודעת "unavailable"), אבל זו הסתרה של בעיה מוצרית, לא פתרון.

#### Options Considered

1. **Option A — הגבלת ה-deck בצד ה-UI למשחקים של המשתמש בלבד.** `GamesView` יציג רק משחקים מתוך `gameIds` של המשתמש. פותר את ה-UX אך אינו backend-authoritative — client עוין עדיין יכול לייצר dead-end likes.
2. **Option B — דרישה סימטרית ב-`submitSwipe`: גם ה-caller חייב לשחק את המשחק.** validation rule חדש: `gameId` חייב להתקיים גם ב-`publicProfiles/{callerUid}.gameIds`, אחרת `failed_precondition`. סוגר את הפער בצורה סמכותית, אך בלעדי Option A משתמשים יפגשו שגיאה רק בזמן ה-swipe — UX גרוע.
3. **Option C — לאפשר ל-cross-game likes להבשיל ל-match.** הסרה/הרפיה של דרישת ה-reciprocity per-game. ממקסם נזילות בשלב cold-start, אך שובר את הסמנטיקה המוצרית (match = "בואו נשחק את המשחק הזה יחד"), את ה-match ID הדטרמיניסטי per-game, את ההקשר המשחקי של הצ׳אט, ואת ADR-021 (discovery לפי game). שינוי חוזה ו-data model רחב מדי ל-MVP.

#### Decision

ההמלצה היא **שילוב של Option A + Option B**:

1. **Backend (מקור האמת, לפי ADR-006):** `submitSwipe` יוסיף validation rule סימטרי — ה-caller חייב להכיל את `gameId` ב-`publicProfiles/{callerUid}.gameIds`, אחרת `failed_precondition`. אותה דרישה תחול על `getDiscoveryDeck` (§3.10) כשייבנה ב-V1.
2. **UI:** בורר המשחקים בדיסקברי יוגבל למשחקים שהמשתמש משחק. משחקים אחרים מה-catalog יכולים להישאר גלויים כ-browse-only עם CTA של **"הוסף את המשחק לפרופיל"** במקום כפתור like — נתיב של הקלקה אחת שממיר עניין במשחק לנזילות אמיתית.

Cross-game matching (Option C) נדחה ל-post-MVP ויידרש ADR חדש אם יעלה שוב.

#### Rationale

שיקול ה-cold-start ב-PRD (§21.1 — Empty Discovery Deck) לכאורה תומך בלאפשר כמה שיותר likes, וזו גם הרוח של ADR-033 (פתיחת Likes You לכולם כדי למקסם התאמות מוקדמות). אבל dead-end like אינו תורם לנזילות — הוא מייצר like שלעולם לא יכול להפוך ל-match, מבזבז swipe מה-quota של השולח, ופוגע בדיוק בערך ש-ADR-033 נועד למקסם: מסך Likes You שבו כל כרטיס הוא הזדמנות אמיתית. ככל שיש יותר dead-end likes, מסך ה-Likes You מתמלא בכרטיסים שנעלמים עם הודעת "unavailable" — חוויה גרועה יותר מ-deck קטן.

ה-CTA של "הוסף את המשחק לפרופיל" הוא mitigation עדיף ל-cold-start: במקום like עקר, המשתמש מוסיף את המשחק ל-`gameIds`, הופך בעצמו ל-discoverable באותו משחק, ומגדיל את ה-deck לכולם. זה עקבי עם ה-mitigations הקיימים ב-PRD §21.1 ("expand filters", "prioritize popular games").

Option B לבדו אינו מספיק (שגיאות בזמן swipe), ו-Option A לבדו מפר את עקרון ה-backend-authoritative (ADR-006). השילוב סוגר את הפער בשני הרבדים.

#### Consequences

- `API_CONTRACT.md` §3.1 (`submitSwipe`) יעודכן: validation rule חדש (caller מכיל את `gameId` ב-`publicProfiles`) ומקרה `failed_precondition` מתאים בטבלת ה-Error Codes.
- `API_CONTRACT.md` §3.10 (`getDiscoveryDeck`, V1) יאמץ את אותה דרישת caller.
- `GamesView`/`SwipeView` יעודכנו להגביל את בחירת ה-deck למשחקי המשתמש, בתוספת flow להוספת משחק מתוך הדיסקברי (נדרש UX קטן).
- הטיפול הקיים ב-`LikesGrid` (הסרת כרטיס + הודעת "unavailable") נשאר כ-defense-in-depth עבור dead-end likes היסטוריים שנוצרו לפני האכיפה.
- dead-end likes קיימים בנתונים נשארים אינרטיים; אין צורך ב-migration.
- החלטה זו היא docs-only בשלב זה — שינוי הקוד ייכנס כ-task נפרד לאחר אישור.

---


### ADR-041: Live Voice & Video Calls in MVP

| Field | Value |
|---|---|
| Status | `Accepted` (product owner, 2026-07-06) |
| Category | C — החלטות מוצר מוצעות |

#### Context

ה-PRD המקורי (§Out of Scope) וה-ARCHITECTURE סיווגו live voice/video כ-"Future / Out of scope for MVP". ב-2026-07-06 בעל המוצר הנחה במפורש להכניס שיחות קוליות ושיחות וידאו חיות בין matched users כבר ל-MVP, כחלק מחוויית הצ׳אט.

#### Decision

שיחות קול/וידאו חיות בין matched users נכנסות ל-MVP:

- WebRTC peer-to-peer; Firestore משמש כערוץ signaling בלבד (`chats/{chatId}/calls/{callId}` — DATA_MODEL §4.23).
- המדיה זורמת ישירות בין peers ואינה נשמרת בשרת.
- STUN-only ב-MVP (שרתי STUN ציבוריים); TURN relay הוא open item — מאחורי NAT מגביל החיבור עלול להיכשל.
- **שיחות חיות (קול/וידאו) פתוחות לכל matched users — Basic ו-Pro** (החלטת בעל המוצר 2026-07-06); עקבי עם ADR-033: בשלב cold-start ערוץ תקשורת עשיר מחזק את לולאת הליבה.
- **הודעות וידאו מוקלטות בצ׳אט הן Pro-only** — חלק מ-media gating הקיים (`sendChatMediaMessage`, API_CONTRACT §3.4), לצד תמונות.
- אכיפת participants-only ב-Security Rules; שדות identity חסינים לעדכון.

#### Rationale

בעל המוצר רואה בשיחות חיות חלק מהצעת הערך המרכזית של מציאת שותפי משחק. WebRTC P2P עם Firestore signaling אינו דורש תשתית שרת נוספת (עולה בקנה אחד עם מגבלת ה-Spark plan), ולכן העלות ההנדסית של הקדמת הפיצ׳ר סבירה.

#### Consequences

- עדכוני חוזה: DATA_MODEL §4.23, SECURITY §4 (rules לשיחות), index חדש ל-collection-group `calls`.
- PRD/ARCHITECTURE יעודכנו מ-"out of scope" ל-"in MVP" עם אישור ADR זה.
- open items: TURN relay, מדיניות ניתוב שיחות כשהיעד offline, אינטגרציה עם blocks (Phase 8).


### ADR-042: Profile Media Gallery (tier-gated)

**Status:** Accepted (2026-07-09) — בקשת מוצר ישירה.

**החלטה:** למשתמש יש גלריית מדיה בפרופיל שמוצגת לכל המשתמשים (בדק ה-discovery ובצפייה בפרופיל):

- **Basic:** עד 3 תמונות. ללא וידאו.
- **Pro:** עד 9 פריטים, כולל סרטוני גיימפליי (וידאו).

**מנגנון:**

- שדה `galleryMedia` (client-writable) על `users/{uid}` — ראה `DATA_MODEL.md` §4.1; משוכפל sanitized ל-`publicProfiles/{uid}` ע"י `syncPublicProfileForUser`.
- קבצים ב-Storage תחת `profileMedia/{uid}/{fileId}` — תמונות לכולם (≤10MB, נדחסות client-side), וידאו (`video/webm|mp4|quicktime`, ≤50MB) רק ל-Pro (נאכף ב-Storage Rules).
- מכסות הפריטים נאכפות ב-Firestore Rules לפי `isPro` (3 ל-Basic, 9 ל-Pro).
- אכיפת "וידאו רק ל-Pro" היא בשכבת ה-Storage (העלאה). פריט וידאו מזויף שמצביע על URL זר אינו מסוכן (render בלבד) — מקובל ל-MVP.

---

## Category D — נושאים פתוחים

---

### ADR-027: AI Request Limits by Tier

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

AI Hub משתמש ב-Gemini ועלול לייצר עלויות ושימוש לרעה אם אין rate limits.

#### Decision

טרם נקבעו מגבלות מדויקות לבקשות AI לפי tier.

#### Rationale

צריך להבין cost model, usage expectations ו-product packaging לפני קביעת מספרים.

#### Consequences

- נדרש להגדיר limits לפני production launch של AI Hub.
- Cloud Functions צריכות לתמוך ב-rate limiting configurable.
- `users/{uid}/usage/{yyyy-mm-dd}` מוכן ל-Scale/V1.
- נושא זה אינו חוסם פיתוח UI/Proxy בסיסי, אך חוסם public AI launch ללא הגבלה.

---

### ADR-028: Chat Abuse Threshold

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

צ׳אט פתוח בין matched users יכול להיות מנוצל ל-spam, harassment או abuse.

#### Decision

טרם נקבע threshold מדויק ל-abuse detection בהודעות צ׳אט.

#### Rationale

צריך לאזן בין חופש שיחה לבין safety/cost controls.

#### Consequences

- MVP יכול להתחיל עם block/report ו-basic validation.
- לפני scale יש לקבוע message rate thresholds.
- ייתכן צורך ב-usage counters או moderation triggers.
- לא להמציא ערכים עד product/safety decision.

---

### ADR-029: Daily Limit Reset Timezone

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

Daily limits כמו swipe count ו-AI requests צריכים reset יומי. בחירה בין UTC לבין locale משפיעה על UX, support ו-implementation.

#### Decision

טרם נקבע האם daily limits מתאפסים לפי UTC או לפי locale/user timezone.

#### Rationale

UTC פשוט יותר טכנית; locale נוח יותר למשתמשים בישראל. ההחלטה צריכה להיות אחידה לכל counters.

#### Consequences

- `users/{uid}/usage/{yyyy-mm-dd}` תלוי במדיניות זו.
- `system/config` יכול להחזיק policy בעתיד.
- יש להחליט לפני enforcement מלא של daily limits.
- לא נקבע ערך במסמך זה.

---

### ADR-030: Final `Platform` Vocabulary

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

`platforms` חזר לסכמה כשדה מבוקר, אך רשימת הערכים הסופית צריכה להתאים לשוק, משחקים נתמכים ו-UI.

#### Decision

רשימת `Platform` הסופית טרם אושרה.

#### Rationale

צריך לבדוק אילו פלטפורמות באמת נדרשות ב-MVP ואילו יוצרות noise מיותר.

#### Consequences

- `DATA_MODEL.md` כולל registry ראשוני.
- לפני launch יש לאשר או לצמצם את הרשימה.
- Migration mapping מה-prototype תלוי בהחלטה זו.
- UI labels צריכים להיגזר מהרשימה הסופית.

---

### ADR-031: Maximum `bio` Length

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

`bio` משפיע על card display, profile readability, moderation ו-Firestore document size.

#### Decision

טרם נקבע max length לשדה `bio`.

#### Rationale

צריך לאזן בין מספיק מקום לביטוי אישי לבין קריאות, safety ו-UI constraints.

#### Consequences

- Zod schemas ו-Firestore rules צריכים לקבל ערך סופי.
- UI צריך להציג character counter.
- AI profile optimization צריך לכבד את limit.
- אין להמציא מספר במסמך זה.

---

### ADR-032: Pro-Required Cosmetics After Pro Expiration

| Field | Value |
|---|---|
| Status | `Open` |
| Category | D — נושאים פתוחים |

#### Context

חלק מה-shop items יכולים להיות `requiresPro`. צריך להחליט מה קורה אם משתמש רכש/קיבל/צייד פריט כזה ואז מנוי Pro פג.

#### Decision

טרם נקבע האם Pro-required cosmetics נשארים equipped, מוסתרים, או מוחלפים אוטומטית לאחר Pro expiration.

#### Rationale

ההחלטה משפיעה על fairness, perceived value, retention ו-support.

#### Consequences

- `equipItem` צריך לאכוף policy סופי.
- `onSubscriptionUpdated` עשוי להוריד או להשאיר cosmetics.
- UI subscription copy צריך להסביר את ההתנהגות.
- אין לקבע implementation לפני החלטה.

---

# 4.E החלטות פלטפורמה, תשלום ובינלאומיות

החלטות אלה התקבלו בעדכון מאוחר יותר והן `Accepted`. הן מרחיבות/מעדנות החלטות קודמות (ADR-008, ADR-017, ADR-026) ומעגנות תמיכה דו-כיוונית, אריזה לחנויות בעתיד, abstraction לתשלומים, מחיקת חשבון, ו-stack ל-cosmetics מונפשים.

### ADR-035: Bidirectional UI & Internationalization (RTL + LTR)

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | E — פלטפורמה, תשלום ובינלאומיות |

#### Context

המוצר תוכנן Hebrew-first RTL (ADR-008, ADR-026). נדרשת תמיכה גם ב-LTR (אנגלית) להרחבת קהל ולהפצה בינלאומית עתידית.

#### Decision

ה-UI יתמוך bidirectional (RTL + LTR). ב-MVP שתי שפות: עברית (RTL, default) ואנגלית (LTR). תיבנה שכבת i18n (`react-i18next` או FormatJS) עם message catalogs, החלפת `dir`/`lang` דינמית לפי locale, ו-locale persistence. הארכיטקטורה תהיה i18n-ready להוספת שפות.

#### Rationale

logical properties (`start`/`end`) כבר בשימוש ב-DESIGN_SYSTEM; הוספת LTR מוקדם זולה מ-retrofit. עברית נשארת default אך לא בלעדית.

#### Consequences

- כל copy דרך message catalogs; אין hardcoded UI strings.
- אייקונים/לייאאוט כיווניים עוברים mirror ב-RTL↔LTR.
- פורמט תאריך/מספר/מטבע per-locale.
- enum values נשארים אנגלית; labels per-locale.
- מרחיב את ADR-008 ו-ADR-026 (Hebrew-first נשאר default).
- LOCALIZATION.md ו-DESIGN_SYSTEM.md מתעדכנים.

---

### ADR-036: Web-First Delivery with Capacitor Path to App Stores

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | E — פלטפורמה, תשלום ובינלאומיות |

#### Context

ייתכן רצון להפיץ ל-App Store ו-Google Play. כרגע המוצר הוא web app.

#### Decision

לעת עתה מפיצים **web בלבד**. כשנפנה לחנויות — נארוז את אותו codebase של React + Vite דרך **Capacitor** (לא React Native, לא PWA טהור). דרישות החנויות מתועדות מראש ב-`STORE_COMPLIANCE.md` ומשפיעות על החלטות עכשוויות כדי להימנע מ-rework.

#### Rationale

Capacitor משמר את codebase הקיים, נותן גישה ל-native APIs (IAP, push, camera), ומספק מסלול אחד לשתי החנויות. תיעוד מוקדם של דרישות מונע retrofit יקר.

#### Consequences

- בנייה web-first עם store-readiness.
- ADR-037 (RevenueCat) נבחר כך שמעבר ל-store IAP יהיה חלק.
- account deletion (ADR-038) נבנה מהיום.
- privacy manifest, ATT, age rating, target API מתועדים ב-`STORE_COMPLIANCE.md`.
- אין תלות ב-native APIs ללא web fallback מאחורי feature flag.

---

### ADR-037: RevenueCat as Billing & Entitlement Abstraction

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | E — פלטפורמה, תשלום ובינלאומיות |

#### Context

Apple (Guideline 3.1.1) ו-Google Play מחייבים את מנגנון התשלום שלהם עבור digital goods (coins, Pro, cosmetics). ADR-017 הניח provider web גנרי. נדרש layer שתומך web עכשיו ו-store IAP בעתיד בלי לשנות את מודל ה-entitlement.

#### Decision

**RevenueCat** ישמש כ-billing/entitlement abstraction. ב-web — RevenueCat Web Billing (או Stripe מאחורי RevenueCat). בעתיד במובייל — StoreKit + Google Play Billing דרך RevenueCat. אימות server-side ו-entitlement sync דרך RevenueCat webhook → `paymentWebhook`. ה-entitlement נשאר backend-authoritative.

#### Rationale

שכבה אחת לכל הפלטפורמות, מתאימה למודל webhook→entitlement הקיים, מאפשרת מעבר חלק לחנויות, ומפחיתה store-policy risk.

#### Consequences

- `PAYMENTS.md` מתעדכן ל-RevenueCat כ-provider abstraction.
- `paymentWebhook` מאמת RevenueCat events; entitlement רק מ-webhook מאומת.
- ספק web ספציפי (למשל Stripe) עדיין נבחר תחת ADR-017, אך מאחורי RevenueCat.
- עמלות store של 15–30% משפיעות על כלכלת Pro/coins.
- אין חיוב ישיר מה-client; checkout דרך RevenueCat.
- **מעדן את ADR-017** (הספק הסופי עדיין pending, אך ה-abstraction נקבע).

---

### ADR-038: Mandatory In-App Account Deletion

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | E — פלטפורמה, תשלום ובינלאומיות |

#### Context

שתי החנויות מחייבות מחיקת חשבון בתוך האפליקציה (ולא רק deactivation), וגם privacy/GDPR דורשים זאת.

#### Decision

תסופק מחיקת חשבון בתוך האפליקציה דרך callable `deleteAccount`, backend-authoritative, שמוחק או מאנונימיזציה את user data בהתאם ל-retention ולדין. נבנה מהיום (web), נדרש גם לחנויות.

#### Rationale

עמידה בדרישות חנויות ו-privacy; בנייה מוקדמת זולה מ-retrofit. deactivation אינו מספיק.

#### Consequences

- `deleteAccount` נוסף ל-`API_CONTRACT.md`.
- `SECURITY.md` ו-`DATA_MODEL.md` מטפלים ב-deletion/anonymization (`isDeleted` כבר קיים).
- `PRIVACY_AND_TERMS.md` מתאר את התהליך ואת ה-retention exceptions (billing/safety/legal).
- UI ב-settings; entry point גם מחוץ לאפליקציה (privacy policy).

---

### ADR-039: Cosmetic Rendering & Animation Stack

| Field | Value |
|---|---|
| Status | `Accepted` |
| Category | E — פלטפורמה, תשלום ובינלאומיות |

#### Context

ה-cosmetics צריכים להיות ברמה גבוהה (avatars, מסגרות דינמיות, רקעים מונפשים כמו דרקון נושף אש), עם animations/sound/graphics לגיימרים, בלי לפגוע בביצועים וסוללה במובייל.

#### Decision

stack שכבתי לפי שימוש:

| שכבה | טכנולוגיה | פורמט |
|---|---|---|
| interactive / skeletal / state-machine (avatars, frames, דמויות) | **Rive** | `.riv` |
| מיקרו-אנימציות UI | **Lottie** | `.json`/`.lottie` |
| particles / אש / אווירה | **PixiJS / WebGL** | particle systems |
| pre-rendered קולנועי | **Alpha video** | HEVC (iOS) + VP9/WebM (Android) |
| לולאות פשוטות | sprite sheets | PNG atlas |
| סאונד | **Howler.js** / Web Audio | audio sprites |

פורמטים, performance budgets, ו-asset delivery מפורטים ב-`MOTION_AND_FX.md`.

#### Rationale

כל טכנולוגיה לשימוש שבו היא מצטיינת; GPU-accelerated; Rive משהה אנימציות לא-פעילות (חוסך סוללה); תאימות cross-platform (web עכשיו, Capacitor בעתיד).

#### Consequences

- shop item schema מקבל `renderType` + asset format/refs (`DATA_MODEL.md`).
- כיבוד `prefers-reduced-motion` ו-quality tiers למכשירים חלשים.
- assets דרך CDN עם lazy-load; אין PNG sequences/GIF.
- `DESIGN_SYSTEM.md` מקבל motion system; `CONVENTIONS.md` מקבל performance rules.
- `MOTION_AND_FX.md` הוא מקור האמת ל-rendering ולפורמטים.

---

# 5. החלטות הממתינות לאישור

ההחלטות הבאות מסומנות כ-`Proposed – pending confirmation` ודורשות אישור owner לפני נעילת implementation סופי:

| ADR ID | החלטה מומלצת | נדרש אישור |
|---|---|---|
| ADR-013 | Minimum age = 16+ | Legal/Product |
| ADR-014 | Age visible in discovery | Product/Legal |
| ADR-015 | Basic daily swipe limit = 30/day via `system/config` | Product |
| ADR-016 | Basic matches are unlimited | Product |
| ADR-017 | Select Israel-facing recurring payment provider with webhooks | Product/Finance/Engineering |
| ADR-018 | Coins are cosmetic-only in MVP | Product |
| ADR-019 | Game catalog is curated, not user-generated | Product |
| ADR-020 | Ranks are free text in MVP; standardized in V1 | Product/Engineering |
| ADR-021 | MVP discovery filters by game only | Product |
| ADR-022 | No read receipts in MVP | Product |
| ADR-023 | Use `lastActiveAt`, no real-time presence in MVP | Product/Engineering |
| ADR-024 | Manual/report-based image moderation in MVP | Product/Legal/Safety |
| ADR-025 | `verifiedBadge` means Pro member only | Product |
| ADR-026 | Initial launch: Israel, Hebrew-first, RTL | Product/Business |
| ADR-033 | Likes You open to all in MVP; revisit Pro-gating in V1 | Product |
| ADR-034 | Coins via one-time signup_bonus + admin_grant only in MVP; amount via system/config | Product |
| ADR-040 | Symmetric game requirement in submitSwipe + deck limited to caller's games; "add game" CTA for other games | Product/Engineering |
| ADR-041 | ~~Live WebRTC voice/video calls in MVP~~ **Accepted 2026-07-06**: live 1:1 calls free for all; recorded video messages Pro-only | — |
| ADR-042 | Profile media gallery: Basic עד 3 תמונות, Pro עד 9 פריטים כולל וידאו; Storage `profileMedia/{uid}`; מכסות ב-Rules | Product |
