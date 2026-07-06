# Swish & Game Product Requirements Document

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Product Requirements Draft |
| Owner | Product Lead |
| Date | 2026-06-28 |
| Product | Swish & Game |
| Platform | Mobile-first responsive web app |
| Stack | React + Vite + TypeScript + Tailwind CSS; Firebase Auth, Firestore, Storage, Cloud Functions; Google Gemini via server-side proxy only |
| Business Model | Freemium + Pro subscription + cosmetic coin shop |
| Source | Refined from the existing uploaded PRD. |

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Executive Summary](#2-executive-summary)
- [3. Product Vision](#3-product-vision)
- [4. Product Positioning](#4-product-positioning)
- [5. Problem Statement](#5-problem-statement)
- [6. Target Audience & Personas](#6-target-audience--personas)
- [7. Business Objectives & Success Metrics](#7-business-objectives--success-metrics)
- [8. Product Principles](#8-product-principles)
- [9. Scope Definition](#9-scope-definition)
- [10. Core User Journeys](#10-core-user-journeys)
- [11. Functional Requirements](#11-functional-requirements)
- [12. Non-Functional Requirements](#12-non-functional-requirements)
- [13. Discovery Logic Requirements](#13-discovery-logic-requirements)
- [14. Data Requirements](#14-data-requirements)
- [15. UX Requirements](#15-ux-requirements)
- [16. Design Requirements](#16-design-requirements)
- [17. Analytics Requirements](#17-analytics-requirements)
- [18. Monetization Requirements](#18-monetization-requirements)
- [19. Admin & Moderation Requirements](#19-admin--moderation-requirements)
- [20. Legal, Policy & Compliance Considerations](#20-legal-policy--compliance-considerations)
- [21. Risks & Mitigations](#21-risks--mitigations)
- [22. MVP Acceptance Criteria](#22-mvp-acceptance-criteria)
- [23. Open Product Decisions](#23-open-product-decisions)
- [24. Release Plan Summary](#24-release-plan-summary)

---

## 2. Executive Summary

Swish & Game is a mobile-first, swipe-based gamer matchmaking web app that helps players find compatible teammates, duos, parties, and squads.

The product addresses solo-queue frustration: toxic teammates, rank mismatch, unreliable communication, different play intentions, and the difficulty of finding consistent players to play with over time.

Swish & Game is not a dating app. It uses a familiar swipe interaction pattern, but the product language, profile structure, matching logic, and visual system are built around gaming compatibility: squad, duo, party, match & play, rank, skill level, role fit, and looking-for intent.

The core product loop is: create gamer profile → select a game → swipe players → mutual match → real-time chat → play together → customize identity → upgrade to Pro → improve profile and squad strategy with AI.

The product should feel like a premium gaming social network: fast, visual, animated, competitive, safe, and highly personalized.

---

## 3. Product Vision

Swish & Game will become the preferred squad-building platform for gamers who want better teammates, better communication, and better gaming sessions.

The long-term vision is to create a trusted gaming identity layer where players can present themselves as gamers, find compatible teammates by game/rank/skill/intent/vibe, build recurring duos and squads, communicate safely before playing, customize their gaming identity, and use AI to improve profile quality, team strategy, and match success.

The product should make users feel:

1. “I look like a serious gamer here.”
2. “I can find people who match the way I want to play.”
3. “This experience is premium enough that I want to keep using it.”

---

## 4. Product Positioning

### One-Sentence Positioning Statement

For gamers tired of solo queue, toxic lobbies, and random teammates, Swish & Game is a premium gamer matchmaking platform that helps players find compatible squads through game-specific swipe discovery, mutual matching, real-time chat, profile customization, Pro features, and AI-powered squad support.

### Category

Swish & Game sits at the intersection of gamer social network, squad finder / looking-for-group platform, swipe-based discovery app, real-time chat app, gamified profile customization platform, and AI-assisted gaming companion.

### Differentiation

Unlike Discord servers, Reddit threads, in-game matchmaking, or generic social apps, Swish & Game provides structured gamer profiles, game-specific discovery, rank and skill context, looking-for intent per game, double opt-in matching, real-time chat after mutual match, cosmetic identity customization, Pro subscription benefits, AI-assisted profile and squad guidance, and safety controls from MVP.

---

## 5. Problem Statement

Gamers frequently struggle to find teammates who match their goals, skill level, communication style, and gaming schedule.

| Alternative | Limitations |
|---|---|
| In-game matchmaking | Random teammates, toxicity, leavers, skill mismatch, weak communication, no pre-game context |
| Discord servers | Chaotic channels, manual posting, hard discovery, low signal-to-noise, no structured profile matching |
| Reddit / forums | Slow, asynchronous, fragmented, not optimized for real-time play |
| Generic social platforms | Not game-specific, weak rank/context signals, poor conversion from chat to actual play |
| Friend-of-friend networks | Limited scale, hard to fill specific squad roles, unreliable availability |

### Opportunity

There is a clear opportunity to build a dedicated, mobile-first, gamer-native product that makes teammate discovery structured, visual, safe, and repeatable.

---

## 6. Target Audience & Personas

### 6.1 Persona 1: The Competitive Grinder

| Attribute | Description |
|---|---|
| Profile | Serious ranked player looking for consistent, skilled, communicative teammates |
| Typical Games | Valorant, League of Legends, Counter-Strike, Rocket League, Apex Legends, Overwatch |
| Primary Goal | Rank up with reliable teammates at a similar level |
| Matching Priority | Rank, skill level, communication, role fit, competitive intent |
| Monetization Likelihood | High, if Pro improves discovery speed and squad quality |

#### Motivations

- Rank up faster.
- Avoid toxic or unserious players.
- Find consistent duo/squad partners.
- Match with similar rank players.
- Build long-term competitive synergy.
- Reduce wasted time in poor lobbies.

#### Pain Points

- Teammates do not communicate.
- Teammates troll, leave, or play selfishly.
- Skill/rank mismatch ruins sessions.
- In-game matchmaking does not reveal intent.
- Discord LFG channels are noisy and inconsistent.

#### Product Needs

- Game-specific filtering.
- Rank badge visibility.
- Skill level visibility.
- Looking-for intent.
- Fast swipe deck.
- Clear match quality signals.
- Real-time chat for coordination.
- AI squad/strategy advice.

#### Success Moment

“I found a duo at my rank, we communicated well, and now we queue together every night.”

### 6.2 Persona 2: The Casual Socializer

| Attribute | Description |
|---|---|
| Profile | Casual gamer looking for friendly, safe, chill gaming sessions |
| Typical Games | Minecraft, Among Us, Fortnite, Fall Guys, Roblox, GTA Online, Party Animals |
| Primary Goal | Meet friendly people to play with casually |
| Matching Priority | Personality fit, safety, age appropriateness, vibe, communication preference |
| Monetization Likelihood | Medium, driven by cosmetics and identity customization |

#### Motivations

- Meet friendly players.
- Avoid toxic or aggressive lobbies.
- Find people with the same vibe.
- Play casually without pressure.
- Build small social gaming circles.
- Feel safe starting conversations.

#### Pain Points

- Public lobbies can be hostile.
- Discord can feel intimidating.
- Rank is often irrelevant.
- Hard to know if someone is chill before playing.
- Wants social comfort more than mechanical skill.

#### Product Needs

- Friendly profile prompts.
- Bio and looking-for intent.
- Block/report controls.
- Basic text chat free for all.
- Profile images and cosmetics.
- Clear safe empty states and guidance.

#### Success Moment

“I found a chill group to play with and felt comfortable joining them.”

### 6.3 Persona 3: The Squad Organizer

| Attribute | Description |
|---|---|
| Profile | Player who coordinates parties, fills missing roles, and assembles 3-stacks or 5-stacks |
| Typical Games | Valorant, League of Legends, Counter-Strike, Apex Legends, Overwatch, Fortnite |
| Primary Goal | Build a complete, balanced squad quickly |
| Matching Priority | Role fit, game intent, availability, skill/rank compatibility |
| Monetization Likelihood | High, if Pro improves match volume and discovery speed |

#### Motivations

- Fill missing squad slots.
- Find specific roles.
- Build recurring teams.
- Coordinate sessions quickly.
- Reduce last-minute teammate search friction.

#### Pain Points

- One missing player blocks the session.
- Hard to find reliable role-specific teammates.
- Current LFG tools are noisy.
- Manually messaging people is slow.
- Players often have different goals.

#### Product Needs

- Game-specific discovery.
- Looking-for intent.
- Future role preference filtering.
- Matches list.
- Real-time chat.
- AI squad composition advice.
- Pro unlimited swipes/matches.

#### Success Moment

“I needed one more player for tonight and found someone who fit the squad.”

---

## 7. Business Objectives & Success Metrics

### 7.1 Business Objectives

1. Build a high-retention gamer matchmaking platform.
2. Create a fast path from signup to first meaningful match.
3. Convert engaged users from Basic to Pro.
4. Drive engagement through profile customization and cosmetic ownership.
5. Maintain trust through safety, moderation, and secure backend-owned state.
6. Establish Swish & Game as a premium gaming social network, not a generic swipe clone.

### 7.2 Success Metrics

#### Acquisition KPIs

| KPI | Definition |
|---|---|
| Visitor-to-signup conversion | Percentage of landing visitors who start account creation |
| Signup completion rate | Percentage of signup starts that create an authenticated account |
| OAuth share | Percentage of signups using Google OAuth |
| Email/password share | Percentage of signups using email/password |
| Cost per registered user | Paid acquisition cost divided by completed registrations |

#### Activation KPIs

| KPI | Definition |
|---|---|
| Onboarding completion rate | Percentage of authenticated users who complete required profile setup |
| Game-added rate | Percentage of users who add at least one game |
| First-swipe rate | Percentage of onboarded users who perform at least one swipe |
| Time to first swipe | Median time from signup completion to first swipe |
| First-match rate | Percentage of users who receive at least one mutual match |
| Time to first match | Median time from onboarding completion to first match |

#### Engagement KPIs

| KPI | Definition |
|---|---|
| DAU | Daily active users |
| WAU | Weekly active users |
| Swipes per active user | Average daily swipes per active user |
| Right-swipe rate | Percentage of discovery actions that are likes |
| Match rate | Mutual matches divided by right swipes |
| Chats opened per match | Percentage of matches that lead to a chat open |
| Messages per conversation | Average messages exchanged per chat |
| Return after first match | Percentage of users returning after receiving first match |
| Game filter usage rate | Percentage of discovery sessions using a selected game filter |

#### Monetization KPIs

| KPI | Definition |
|---|---|
| Basic-to-Pro conversion | Percentage of Basic users who upgrade |
| Pro retention | Percentage of Pro subscribers retained month-over-month |
| MRR | Monthly recurring revenue from Pro subscriptions |
| ARPPU | Average revenue per paying user |
| Upgrade modal conversion | Percentage of upgrade modal views that start checkout |
| Coin spend rate | Percentage of granted/earned coins spent on cosmetics |
| Cosmetic ownership rate | Percentage of users owning at least one cosmetic |

#### Quality & Trust KPIs

| KPI | Definition |
|---|---|
| Report rate | Reports per active user or per match |
| Block rate | Blocks per active user or per match |
| Chat abuse report rate | Chat-related reports divided by active chats |
| Fake profile report rate | Fake profile reports divided by active profiles |
| Match satisfaction score | User feedback after match/chat |
| Negative interaction churn | Churn after report, block, or abusive chat event |
| Safety action response time | Time from report creation to moderation review in future workflows |

---

## 8. Product Principles

1. **Gaming-first, not dating-first.** Use squad, duo, party, match & play, rank, role, and game intent language. Avoid romantic framing.
2. **Fast path to value.** Users should reach discovery quickly after completing a useful profile.
3. **Compatibility over volume.** The product should prioritize relevant matches over endless low-quality cards.
4. **Profiles must communicate fit in seconds.** Users should immediately understand game, rank, skill level, looking-for intent, and vibe.
5. **Safety is core, not optional.** Block and report are MVP features. Toxicity prevention must be part of the core loop.
6. **Server owns trust-sensitive state.** The client may request actions, but coins, Pro status, match creation, and AI calls are validated and controlled by backend services.
7. **Monetization should enhance identity and convenience.** Pro and cosmetics should create value without making Basic users feel excluded from the core match-and-chat loop.
8. **AI should assist, not dominate.** Gemini helps users improve profiles and squad strategy but does not replace human matching or social connection.
9. **Hebrew-first, bidirectional experience.** The UI is Hebrew-first (RTL default) with English (LTR) supported via i18n (ADR-035), while stored enum values remain canonical English.

---

## 9. Scope Definition

### 9.1 MVP Scope

MVP includes:

- Mobile-first responsive web app.
- Firebase Authentication with Google OAuth and email/password.
- Session persistence and secure logout.
- Required onboarding.
- Gamer profile creation.
- Game inventory with rank and looking-for intent per game.
- Game-filtered swipe discovery.
- Swipe left/skip and swipe right/like.
- Top HUD match card.
- Double opt-in matching.
- Match states: pending, matched, blocked, archived.
- Real-time text chat for matched users.
- Live voice/video calls between matched users — free for all tiers (ADR-041).
- Recorded video messages in chat — Pro-only (ADR-041).
- Pro-only media/image transfer gating.
- Basic and Pro tier logic.
- Cosmetic shop with granted/earned coins.
- Avatar borders, profile banners, global backgrounds.
- Equip owned cosmetics.
- Gemini AI profile optimization and squad/strategy advice via server-side proxy.
- AI guardrails against cheating, harassment, and exploit requests.
- Block user.
- Report user.
- Basic moderation records.
- Core analytics events.
- Firestore and Storage security rules.
- Cloud Functions for trust-sensitive actions.

### 9.2 V1 Scope

V1 may include full production Pro subscription checkout, advanced Pro entitlements, more shop categories, seasonal cosmetics, real-money coin packs pending legal/payment review, match quality feedback, advanced filters, notifications, image moderation automation, lightweight moderation tools, AI match insight improvements, reputation signals, and improved onboarding personalization.

### 9.3 Future Scope

Future releases may include native iOS/Android apps, voice rooms, group calls, clan/team pages, party scheduling, tournament discovery, game API rank verification, advanced AI compatibility scoring, creator/coach marketplace, full admin dashboard, and advanced trust and safety tooling.

### 9.4 Explicitly Out of Scope for MVP

- Native iOS/Android apps.
- Real-money coin trading.
- Coin cash-out.
- Real-money coin packs.
- Public global chat rooms.
- Voice rooms / group calls (1:1 live calls between matched users ARE in MVP — ADR-041).
- Game-API rank verification.
- Full admin dashboard.
- Gambling, betting, or wagering.
- One-time profile boosts.
- Full Discord replacement.
- Real-money item trading between users.

---

## 10. Core User Journeys

### 10.1 New User Onboarding Journey

1. User lands on Swish & Game.
2. User signs up with Google OAuth or email/password.
3. User reaches onboarding.
4. User enters display name, age, bio, profile image, and skill level.
5. User adds at least one game, rank, and looking-for intent.
6. User completes onboarding and lands in discovery.
7. User selects a game filter.
8. User swipes players.
9. User gets a mutual match when both users like each other.
10. User opens chat and coordinates a gaming session.

### 10.2 Returning User Journey

1. User opens the app.
2. Auth session is restored.
3. User lands on discovery, matches, or last active primary area.
4. User selects or confirms active game filter.
5. User swipes deck, reviews matches, continues chats, and updates profile/cosmetics as needed.

### 10.3 Pro Upgrade Journey

1. Basic user hits a Pro limitation: daily swipe limit, media upload blocked, premium dynamic background locked, or enhanced cosmetic locked.
2. User sees an upgrade prompt.
3. Prompt explains Pro Gamer benefits.
4. User opens subscription screen and starts payment flow.
5. Backend validates subscription activation.
6. Pro status updates and features unlock without logout.

### 10.4 Shop Journey

1. User opens Shop and sees coin balance.
2. User browses cosmetic categories and previews an item.
3. User purchases item using granted/earned coins.
4. Backend validates balance and ownership.
5. Item is added to owned inventory.
6. User equips item and profile/discovery card update visually.

### 10.5 AI Hub Journey

1. User opens AI Hub.
2. User selects profile optimization or squad/strategy advice.
3. User reviews what data will be used.
4. Client sends request to backend.
5. Backend validates auth, rate limits, and safety guardrails.
6. Backend calls Gemini through server-side proxy.
7. User receives actionable output and copies/applies/saves suggestions.

---

## 11. Functional Requirements

### 11.1 Authentication

#### Description

Users must be able to create accounts, log in, maintain sessions, and securely log out using Firebase Authentication. Supported methods are Google OAuth, email/password, session persistence, and secure logout.

#### User Stories

##### AUTH-001: As a new user, I want to sign up with Google so that I can start quickly without creating a separate password.

Acceptance Criteria:

- Google OAuth is available on signup and login screens.
- Successful OAuth creates a Firebase Auth user.
- If no profile exists, user is routed to onboarding.
- If onboarding is complete, user is routed to discovery or last active primary area.
- OAuth cancellation shows a non-blocking error state.

##### AUTH-002: As a new user, I want to sign up with email and password so that I can create an account manually.

Acceptance Criteria:

- Email format is validated.
- Password meets minimum security requirements.
- Existing-email errors are displayed clearly.
- Weak-password errors are displayed clearly.
- Successful signup creates the auth account and routes to onboarding.

##### AUTH-003: As a returning user, I want my session to persist so that I do not need to log in every time.

Acceptance Criteria:

- Auth state persists after refresh.
- App shows a loading state while auth is being resolved.
- Expired or invalid sessions route to login.
- Authenticated users with incomplete onboarding route to onboarding.
- Authenticated users with complete onboarding route to the app.

##### AUTH-004: As a user, I want to securely log out so that my account is not accessible on a shared device.

Acceptance Criteria:

- Logout is available from account/settings.
- Logout clears local user session state.
- User is routed to login after logout.
- Protected routes are inaccessible after logout.

#### Edge Cases

- User closes OAuth popup.
- User loses network during signup.
- Firebase Auth succeeds but profile document creation fails.
- Auth user exists but Firestore profile is missing.
- User signs out in one tab while another tab is open.
- User attempts to access protected routes while unauthenticated.
- User attempts to create duplicate email account.
- Auth provider returns incomplete profile data.

### 11.2 Onboarding & Profile Setup

#### Description

Users must complete onboarding before accessing discovery. Required fields: display name, age, bio, profile image, skill level, and at least one game with rank and looking-for intent.

Canonical `skillLevel` values stored in data: `beginner`, `intermediate`, `pro`, `elite`. Hebrew labels may be displayed in the UI, but stored enum values remain English.

#### User Stories

##### ONB-001: As a new user, I want to create a gamer profile so that other players can understand who I am.

Acceptance Criteria:

- User cannot access discovery before onboarding is complete.
- Required fields show validation errors if missing.
- Display name has minimum and maximum length rules.
- Bio has a defined maximum length.
- Age must pass the product’s minimum age policy.
- Profile image is required or a default avatar must be explicitly selected.
- Completed onboarding creates or updates the user profile in Firestore.
- Onboarding completion is persisted.

##### ONB-002: As a gamer, I want to add the games I play so that I can match with relevant players.

Acceptance Criteria:

- User can add at least one game.
- Game must come from the supported game catalog in MVP.
- Each game includes rank and looking-for intent.
- User cannot complete onboarding without at least one active game.
- User can remove a game as long as at least one active game remains.
- Added games are available in discovery filter.

##### ONB-003: As a gamer, I want to define my rank per game so that I can find players near my level.

Acceptance Criteria:

- Rank is captured per game.
- Rank is visible on the discovery card HUD.
- Rank is visible in full profile.
- Rank may be free text or standardized depending on finalized game catalog decision.
- Rank display does not override canonical skill level.

##### ONB-004: As a gamer, I want to define what I am looking for per game so that matches understand my intent.

Acceptance Criteria:

- Looking-for intent is captured per game.
- User can select from predefined options or provide allowed custom text, depending on finalized product decision.
- Looking-for intent appears in full profile.
- Looking-for intent appears in relevant discovery context where space allows.
- Offensive or unsafe text is rejected or flagged.

#### Edge Cases

- Unsupported image format.
- Image upload succeeds but profile save fails.
- Offensive display name or bio.
- User tries to continue without adding a game.
- User deletes all games.
- User is below minimum allowed age.
- User refreshes during onboarding.
- User leaves onboarding mid-flow.
- Game catalog item becomes inactive during onboarding.
- Network failure while saving onboarding state.

### 11.3 Profile Management

#### Description

Users can edit their gamer profile and equip owned cosmetics after onboarding. Editable fields include display name, bio, age depending on policy, profile image, skill level, games, rank per game, looking-for intent per game, avatar border, profile banner, and global background.

#### User Stories

##### PROF-001: As a user, I want to update my profile so that it stays accurate as my gaming preferences change.

Acceptance Criteria:

- Profile edit is accessible from profile/settings.
- User can edit allowed fields.
- Required fields remain validated.
- Updates are saved to Firestore.
- Updated public fields appear in profile and discovery.
- Sensitive/server-owned fields cannot be edited by the client.
- Invalid updates show actionable errors.

##### PROF-002: As a user, I want to update my games so that discovery reflects what I currently play.

Acceptance Criteria:

- User can add games from the catalog.
- User can update rank and looking-for intent per game.
- User can deactivate or remove games, while keeping at least one active game.
- Discovery filter updates after game changes.
- Public/discovery profile data updates after save.

##### PROF-003: As a user, I want to equip owned cosmetics so that my profile feels personalized.

Acceptance Criteria:

- User can only equip items they own.
- Avatar border appears around profile image.
- Profile banner appears on profile page.
- Global background updates supported app surfaces.
- Equipped cosmetics appear on discovery card where applicable.
- Unequipping returns to default styling.
- Backend validates ownership before equip is applied.

##### PROF-004: As a user, I want to manage my profile image and banner so that my gaming identity looks polished.

Acceptance Criteria:

- Profile image upload supports allowed image formats only.
- Banner image upload supports allowed image formats only.
- File size limits are enforced.
- Uploaded files are stored in Firebase Storage.
- Public profile stores approved file references/URLs.
- Failed uploads show retry options.

#### Edge Cases

- User attempts to equip item not owned.
- User attempts to equip Pro-only item after Pro expires.
- Owned item is removed from active shop catalog.
- Image URL fails to load.
- Storage upload succeeds but Firestore update fails.
- User edits profile from multiple devices.
- User enters invalid age.
- User tries to modify server-owned fields.
- User is suspended while editing profile.

### 11.4 Swipe & Discovery

#### Description

Discovery is the main match-finding experience. Users select a game from their inventory and browse compatible players through a swipe card interface. The discovery card includes a top HUD bar: left view-profile button, center skill level with trophy icon, and right current rank badge. Swipe right is like; swipe left is skip. Buttons must also support like/skip for accessibility.

#### User Stories

##### DISC-001: As a user, I want to filter discovery by a selected game so that I only see relevant players.

Acceptance Criteria:

- User can select a game from their own active game inventory.
- Deck only shows users who also have the selected game.
- Selected game persists during the session.
- User can change selected game.
- If no selected game exists, app prompts user to choose a game.
- If no eligible players exist, empty-deck state is shown.

##### DISC-002: As a user, I want to view key compatibility signals on the card so that I can make quick decisions.

Acceptance Criteria:

- Card shows profile image.
- Card shows display name and age, subject to age visibility policy.
- Top HUD includes view-profile button.
- Top HUD includes skill level and trophy icon.
- Top HUD includes current rank badge for selected game.
- Card shows at least one game/context signal.
- Card supports owned/equipped cosmetic display.

##### DISC-003: As a user, I want to swipe right on a player so that I can express interest in playing together.

Acceptance Criteria:

- Right swipe records a like request.
- Backend validates the swipe.
- If reciprocal like exists, backend creates a match.
- If no reciprocal like exists, like remains pending.
- Profile is removed from current deck after action.
- User cannot like themselves.
- User cannot like a blocked user.

##### DISC-004: As a user, I want to swipe left on a player so that I can skip people who are not a fit.

Acceptance Criteria:

- Left swipe records a skip request.
- Backend or persistence layer records the skip context.
- Skipped profile is removed from current deck.
- Skipped profile does not immediately reappear in the same context.
- User can perform skip via gesture or button.

##### DISC-005: As a user, I want to view the full profile before swiping so that I can make a better decision.

Acceptance Criteria:

- View-profile button opens profile modal or full profile page.
- Full profile includes bio, games, rank, looking-for intent, skill level, cosmetics, and relevant context.
- User can return to discovery without losing deck position.
- User can like or skip from full profile if supported.

##### DISC-006: As a Basic user, I want to understand when I hit my daily swipe limit so that I know why discovery is blocked.

Acceptance Criteria:

- Basic swipe limit is enforced by backend.
- When limit is reached, user sees an upgrade prompt.
- Prompt explains Pro unlimited swipes.
- User can navigate to subscription screen.
- User can dismiss prompt and return later.

#### Edge Cases

- User has no active games.
- Selected game is removed from user inventory.
- Deck loads slowly.
- Empty deck.
- All nearby/relevant users already swiped.
- Rapid repeated swipes.
- Duplicate swipe submission.
- Swipe animation succeeds but backend write fails.
- User loses connection mid-swipe.
- Target user deletes account.
- Target user becomes suspended.
- Blocked user appears due to stale cache.
- Current user is blocked by target.
- User attempts to manipulate client state to bypass swipe limits.

### 11.5 Matching Engine

#### Description

The matching engine creates a match only when both users like each other. All match creation must be backend-authoritative.

Match states: `pending`, `matched`, `blocked`, `archived`.

#### User Stories

##### MATCH-001: As a user, I want a match to be created only when both users like each other so that connections are mutual.

Acceptance Criteria:

- One-sided like creates or maintains pending state.
- Reciprocal like creates matched state.
- Match creation is performed by backend logic.
- Match document includes both user IDs.
- Match document includes game context.
- Chat document is created or activated after match.
- Both users can see the match.

##### MATCH-002: As a user, I want to see my active matches so that I can start conversations.

Acceptance Criteria:

- Matches screen lists active matched connections.
- Each match shows avatar, display name, game context, last message preview, and last activity timestamp.
- Tapping match opens chat.
- Blocked/archived matches are excluded or visually separated according to UX decision.
- Deleted/suspended users are handled gracefully.

##### MATCH-003: As a user, I want a match to stop being active if I block the other user so that I can stay safe.

Acceptance Criteria:

- Blocking updates match state or related visibility.
- Blocked match no longer appears in active match list.
- Chat sending is prevented after block.
- Discovery excludes blocked users in both directions.

##### MATCH-004: As a user, I want to archive old matches so that my active match list stays clean.

Acceptance Criteria:

- Archive action is available if included in MVP UX.
- Archived matches are removed from active list.
- Archiving does not delete message history unless deletion policy says otherwise.
- User can view or restore archived matches only if product decision supports it.

#### Edge Cases

- Both users like each other at the same time.
- Duplicate match creation attempt.
- Match document creation succeeds but chat creation fails.
- One user deletes account after match.
- One user is suspended after match.
- User blocks immediately after match.
- User removes the matched game after match.
- User attempts to create match directly from client.
- Backend transaction fails.
- Match is created while one user is offline.

### 11.6 Real-Time Chat

#### Description

Matched users can communicate in real time. Text messaging is free for all users. Image/media transfer is Pro-only. Basic users attempting media upload see an upgrade prompt.

#### User Stories

##### CHAT-001: As a matched user, I want to send text messages so that I can coordinate gameplay.

Acceptance Criteria:

- Text input is available for matched users.
- Empty messages cannot be sent.
- Message is stored under the chat.
- Message appears in real time for both participants.
- Last-message preview updates.
- Message timestamp is recorded.
- User can only send messages in chats they participate in.

##### CHAT-002: As a user, I want message bubbles to clearly show who sent each message so that the conversation is easy to follow.

Acceptance Criteria:

- Current user messages use “me” styling.
- Other participant messages use “them” styling.
- Bubbles support RTL Hebrew text.
- Long messages wrap correctly.
- Timestamp is visible or accessible.
- Message list scrolls to newest message appropriately.

##### CHAT-003: As a user, I want to see last-message previews so that I can quickly choose which conversation to open.

Acceptance Criteria:

- Matches/chat list shows last message.
- Last message updates after send.
- Last timestamp updates after send.
- Media messages show a media-specific preview label.
- Empty chats show a clear start-conversation prompt.

##### CHAT-004: As a Pro user, I want to share images/media so that I can send screenshots or game-related files.

Acceptance Criteria:

- Media button is available to active Pro users.
- Media uploads enforce type and size limits.
- Uploaded files are stored in Firebase Storage.
- Message includes file reference/URL.
- Recipient can view media.
- Backend validates Pro status before media message creation.

##### CHAT-005: As a Basic user, I want to understand why media sharing is locked so that I can choose whether to upgrade.

Acceptance Criteria:

- Basic users see locked media action or upgrade prompt.
- Prompt clearly explains Pro media transfer.
- Basic users can continue using text chat.
- Client-side UI does not imply that media upload is free.

#### Edge Cases

- User sends empty message.
- User sends very long message.
- User sends messages rapidly.
- User loses connection while sending.
- Message write succeeds but last-message update fails.
- Chat participant was blocked.
- Chat participant deleted account.
- Chat participant is suspended.
- User tries to access chat they are not part of.
- Basic user attempts media upload through manipulated client.
- Media file exceeds size limit.
- Unsupported media type.
- Storage upload succeeds but message creation fails.
- Offensive or abusive content is sent.
- User opens chat while offline.

### 11.7 Shop & Coin Economy

#### Description

The shop allows users to spend granted/earned virtual coins on cosmetic identity items. Coins are not purchased with real money in MVP. Real-money coin packs are deferred to V1.

Cosmetic categories: avatar borders, profile banners, global backgrounds.
Rarity tiers: `common`, `rare`, `epic`, `legendary`.

#### User Stories

##### SHOP-001: As a user, I want to browse cosmetic items so that I can personalize my gaming identity.

Acceptance Criteria:

- Shop displays item cards.
- Item card shows name, category, price, rarity, preview, and ownership state.
- User can filter or browse by category.
- Inactive items are not purchasable.
- Pro-only items show locked state for Basic users.

##### SHOP-002: As a user, I want to preview cosmetics so that I can understand how they will look before spending coins.

Acceptance Criteria:

- Avatar border preview is shown on an avatar sample.
- Banner/global background preview is shown on relevant surface.
- Preview does not equip the item.
- Preview can be dismissed.
- Animated previews respect reduced-motion settings where applicable.

##### SHOP-003: As a user, I want to buy cosmetics with coins so that I can unlock new visual identity options.

Acceptance Criteria:

- Purchase request is sent to backend.
- Backend validates user, item, price, ownership, Pro requirement, and coin balance.
- Purchase deducts coins atomically.
- Owned item record is created.
- Transaction record is created.
- User receives success or failure feedback.
- Owned items cannot be purchased again.

##### SHOP-004: As a user, I want to equip purchased cosmetics so that they appear on my profile and discovery card.

Acceptance Criteria:

- Equip request is validated by backend.
- User can only equip owned items.
- Equipped avatar border appears on profile and discovery card.
- Equipped banner appears on profile.
- Equipped global background appears across supported app areas.
- Previous equipped item in same category is replaced or unequipped.
- Pro-only item behavior after Pro expiration follows finalized policy.

#### Edge Cases

- User double-taps purchase.
- Coin balance changes on another device.
- Item price changes while purchase modal is open.
- Item becomes inactive during purchase.
- User has insufficient coins.
- User attempts to manipulate client-side coin balance.
- User attempts to buy an already owned item.
- Transaction fails midway.
- Animated cosmetic causes performance issues.
- Pro-only cosmetic is equipped when Pro expires.
- Shop catalog fails to load.

### 11.8 Subscription & Pro Tier

#### Description

Swish & Game uses a freemium model.

| Tier | Price | Included |
|---|---:|---|
| Basic | Free | Limited daily swipes, text-only chat, default styling, standard discovery access |
| Pro Gamer | 29.90 ILS/month | Unlimited swipes and matches, media transfer, premium dynamic backgrounds, verified badge, enhanced cosmetics |

Pro/subscription state is server-owned. The client must never directly update Pro status.

#### User Stories

##### SUB-001: As a Basic user, I want to understand my limits so that I know what Pro unlocks.

Acceptance Criteria:

- Basic limits are visible at relevant moments.
- Swipe-limit prompt explains Pro unlimited swipes.
- Media-lock prompt explains Pro media transfer.
- Premium cosmetic lock explains Pro requirement.
- Pricing is shown as 29.90 ILS/month.
- Messaging avoids misleading or aggressive paywalls.

##### SUB-002: As a Basic user, I want to upgrade to Pro so that I can unlock premium features.

Acceptance Criteria:

- User can open subscription screen.
- Subscription screen compares Basic and Pro.
- User can start payment flow.
- Backend receives and validates payment/subscription event.
- Pro status updates only after backend confirmation.
- Pro badge appears after activation.
- Pro features unlock without logout.

##### SUB-003: As a Pro user, I want my subscription benefits to remain active while my subscription is valid so that I can rely on paid features.

Acceptance Criteria:

- Subscription status is checked on app load.
- Backend owns subscription status.
- Expired subscription reverts user to Basic.
- Pro-only UI updates after expiration.
- Pro-only backend actions are denied after expiration.
- Existing purchased cosmetics remain owned unless policy defines active-Pro requirement.

##### SUB-004: As a user, I want clear subscription status and cancellation information so that billing feels transparent.

Acceptance Criteria:

- User can view current tier.
- User can view billing status where available.
- User can access cancellation instructions or provider flow.
- Subscription errors are communicated clearly.
- Refund policy link is available when finalized.

#### Edge Cases

- User cancels checkout.
- Payment succeeds but webhook is delayed.
- Webhook fails.
- Subscription expires mid-session.
- User tries Pro-only action after expiration.
- Duplicate subscription purchase.
- Refund or chargeback.
- User account is suspended while Pro.
- Payment provider outage.
- Pro status appears active client-side but backend says inactive.

### 11.9 AI Hub — Gemini

#### Description

AI Hub provides Gemini-powered profile-bio optimization and squad/strategy advice. Gemini must be accessed only through a server-side proxy. The API key must never be exposed to the client. AI must include server-side guardrails and refuse requests involving cheating, harassment, exploits, doxxing, account theft, ban evasion, or abuse.

#### User Stories

##### AI-001: As a user, I want AI to review my profile bio so that I can improve my match success.

Acceptance Criteria:

- User can request profile review from AI Hub.
- Backend validates authenticated user.
- Backend sends only relevant profile/game context.
- AI returns actionable suggestions.
- AI can suggest improved bio text.
- AI does not overwrite profile content without confirmation.
- User can copy or manually apply suggestions.

##### AI-002: As a competitive player, I want AI squad/strategy advice so that I can coordinate better with teammates.

Acceptance Criteria:

- User can select game context.
- User can provide playstyle, rank, and team context.
- AI returns practical strategy recommendations.
- Advice is framed around fair play and team coordination.
- AI refuses cheating/exploit requests.
- Output is displayed in clear, scannable UI.

##### AI-003: As a user, I want AI to feel personalized but privacy-respecting so that I trust the feature.

Acceptance Criteria:

- UI explains what data is used.
- Sensitive personal data is not sent unnecessarily.
- AI requests are rate-limited.
- AI responses include disclaimers where appropriate.
- AI request history is stored only as needed for product, safety, or debugging policy.

##### AI-004: As the platform, I want AI calls to be backend-controlled so that usage, costs, and safety are manageable.

Acceptance Criteria:

- Client calls backend AI endpoint/function only.
- Gemini API key is stored server-side.
- Backend validates request type.
- Backend enforces rate limits.
- Backend applies safety guardrails.
- Backend logs compact request metadata.

#### Edge Cases

- Gemini API fails.
- Server proxy is unavailable.
- AI response is empty.
- AI response is too generic.
- AI returns unsafe content.
- User submits offensive input.
- User attempts prompt injection.
- User asks for cheating, exploits, harassment, or ban evasion.
- User exceeds rate limit.
- Token limits are exceeded.
- User is suspended.
- AI cost spike or abuse pattern is detected.

### 11.10 Safety, Trust & Moderation

#### Description

Safety is mandatory in MVP because Swish & Game connects users through discovery and chat. MVP safety actions include block user, report user, hide blocked users from discovery, prevent chat after block, and store report records for moderation review.

Report reasons: `harassment`, `hate_speech`, `sexual_content`, `scam_spam`, `underage_concern`, `cheating_exploits`, `fake_profile`, `other`.

#### User Stories

##### SAFE-001: As a user, I want to block another user so that they can no longer contact me or appear in discovery.

Acceptance Criteria:

- Block action is available from profile.
- Block action is available from chat.
- Confirmation is shown before block is finalized.
- Blocked user is removed from discovery.
- Blocked user is removed from active matches or marked unavailable.
- Chat sending is prevented after block.
- Block relationship is persisted securely.
- Block is enforced backend-side.

##### SAFE-002: As a user, I want to report harmful behavior so that the platform can review it.

Acceptance Criteria:

- Report action is available from profile.
- Report action is available from chat.
- User can select one report reason.
- Optional description field is available.
- Report is stored with reporter ID, reported user ID, reason, source, and timestamp.
- User receives confirmation after submitting report.
- Reporting can be followed by block.

##### SAFE-003: As the platform, I want reports to contain enough context so that moderation can review incidents.

Acceptance Criteria:

- Report includes source type: profile, chat, or message where applicable.
- Report includes relevant target identifiers.
- Report status starts as open.
- Report records are not readable by regular users.
- Moderation data is structured for future admin tooling.

##### SAFE-004: As a user, I want blocked/reported interactions to feel safe and private so that I am comfortable using the product.

Acceptance Criteria:

- Blocked user is not notified with explicit blocker identity language.
- Blocked user cannot send new messages to blocker.
- Discovery excludes blocked relationships in both directions.
- User can continue using the app after safety action.

#### Edge Cases

- User reports same user multiple times.
- User blocks immediately after reporting.
- Reported user deletes account.
- Reported user is already suspended.
- Report contains abusive text.
- Coordinated false reports.
- User attempts to bypass block with another account.
- Block state is stale in local cache.
- User tries to message after being blocked.
- Moderation storage write fails.
- User reports a message that was deleted.

---

## 12. Non-Functional Requirements

### 12.1 Performance

- App must be optimized for mobile-first usage.
- Swipe interactions should feel immediate and smooth.
- Discovery deck should preload a small batch of eligible profiles.
- Images must be compressed and lazy-loaded where appropriate.
- Animated backgrounds must not cause severe frame drops.
- App should respect reduced-motion settings.
- Initial load should avoid unnecessary large bundles.

### 12.2 Reliability

- Auth session handling must be resilient to refresh and reconnect.
- Chat should gracefully handle offline/online transitions.
- Swipe actions should recover from backend failures.
- Match creation must be idempotent.
- Coin purchases must be atomic.
- Subscription updates must tolerate webhook delay.
- AI failures should show retry-safe errors.

### 12.3 Scalability

- Discovery queries must be index-friendly.
- Chat messages must scale per chat.
- User public profile data should be denormalized for read performance.
- Shop catalog should support growth in item categories.
- AI calls must be rate-limited server-side.
- Backend functions should prevent duplicate writes under concurrent actions.

### 12.4 Security

- Users can only edit their own user-editable profile fields.
- Users cannot directly modify coins.
- Users cannot directly modify Pro/subscription status.
- Users cannot create matches directly from the client.
- Users can only read chats they participate in.
- Basic users cannot send media messages.
- Gemini API key is never exposed to the client.
- Media uploads must enforce size, type, ownership, and authorization.
- Backend validates trust-sensitive actions.

### 12.5 Privacy

- Email is not publicly visible.
- Sensitive account data is separate from public profile data.
- Users understand which profile fields are visible.
- AI data usage is transparent.
- Blocked users should not have unnecessary visibility into blocker activity.
- Data deletion policy must be defined before launch.

### 12.6 Accessibility

- All icon-only buttons must include accessible labels.
- Swipe actions must also be available through buttons.
- Color contrast must remain sufficient on dark/neon backgrounds.
- UI should support keyboard navigation where practical.
- Text should scale reasonably on mobile.
- Reduced-motion preference must be respected.
- App should not disable browser zoom.

### 12.7 Localization / RTL

- MVP UI is Hebrew-first.
- UI layout must support right-to-left direction.
- Data enum values remain canonical English.
- Display labels may be localized to Hebrew.
- Date/time, currency, and pluralization should be localization-ready.
- Product copy must use gaming language, not dating language.

---

## 13. Discovery Logic Requirements

### 13.1 Eligibility Rules

A user may appear in another user’s discovery deck only if:

- Viewer is authenticated.
- Viewer completed onboarding.
- Target completed onboarding.
- Target is not the viewer.
- Target is discoverable.
- Target is not deleted.
- Target is not suspended.
- Target shares the selected game.
- Viewer has not blocked target.
- Target has not blocked viewer.
- Viewer has not already swiped target for the same selected game context, unless rematch/recycle policy is introduced later.
- Viewer and target are not already actively matched for the same context, unless rematch logic is introduced later.
- Target passes applicable safety and policy filters.

### 13.2 MVP Ranking Logic

MVP ranking should be simple, transparent, and scalable:

1. Shared selected game.
2. Similar skill level.
3. Similar rank where available.
4. Recently active users.
5. Randomized tie-breaker to avoid static deck ordering.

### 13.3 Future Ranking Inputs

Future ranking may consider rank proximity, looking-for compatibility, role preference, communication preference, region/time zone, age preference if policy allows, match feedback, safety/reputation signals, AI compatibility score, and session availability.

---

## 14. Data Requirements

This section defines high-level product data requirements. Exact Firestore schema and rules are covered in technical architecture documents.

### 14.1 User

Fields: `uid`, `displayName`, `email`, `age`, `bio`, `profileImageUrl`, `bannerImageUrl`, `avatarBorderItemId`, `globalBackgroundItemId`, `skillLevel: beginner | intermediate | pro | elite`, `coins`, `subscriptionTier: basic | pro`, `subscriptionStatus`, `onboardingCompleted`, `ownedItemIds`, `isDiscoverable`, `isSuspended`, `isDeleted`, `createdAt`, `updatedAt`, `lastActiveAt`.

### 14.2 Game Profile

Fields: `gameId`, `name`, `iconUrl`, `rank`, `rankNormalized`, `rankScore`, `lookingFor`, `lookingForText`, `preferredMode`, `voicePreference`, `isActive`, `createdAt`, `updatedAt`.

### 14.3 Match

Fields: `matchId`, `users`, `userA`, `userB`, `gameId`, `gameName`, `status: pending | matched | blocked | archived`, `createdAt`, `updatedAt`, `lastInteractionAt`.

### 14.4 Chat

Fields: `chatId`, `matchId`, `participants`, `gameId`, `gameName`, `lastMessage`, `lastMessageType`, `lastMessageSenderId`, `lastTimestamp`, `unreadCounts`, `isActive`, `createdAt`, `updatedAt`.

### 14.5 Message

Fields: `messageId`, `chatId`, `senderId`, `type: text | image | system`, `text`, `fileUrl`, `filePath`, `fileMimeType`, `fileSizeBytes`, `status`, `createdAt`, `updatedAt`, `deletedAt`.

### 14.6 Shop Item

Fields: `itemId`, `name`, `description`, `category: avatar_border | profile_banner | global_background`, `rarity: common | rare | epic | legendary`, `priceCoins`, `previewUrl`, `assetUrl`, `isAnimated`, `requiresPro`, `isActive`, `createdAt`, `updatedAt`.

### 14.7 Owned Item

Fields: `uid`, `itemId`, `category`, `acquiredAt`, `acquisitionType: coin_purchase | grant | reward | subscription | admin`, `pricePaidCoins`, `isEquipped`.

### 14.8 Coin Transaction

Fields: `transactionId`, `uid`, `type: item_purchase | signup_bonus | reward | admin_grant | refund | system_adjustment`, `itemId`, `amountCoins`, `balanceBefore`, `balanceAfter`, `status`, `createdAt`.

### 14.9 Subscription

Fields: `uid`, `tier: basic | pro`, `status`, `provider`, `providerCustomerId`, `providerSubscriptionId`, `startedAt`, `currentPeriodStart`, `currentPeriodEnd`, `cancelledAt`, `priceAmount`, `currency: ILS`, `updatedAt`.

### 14.10 Report

Fields: `reportId`, `reporterUid`, `reportedUid`, `source: profile | chat | message`, `chatId`, `messageId`, `reason: harassment | hate_speech | sexual_content | scam_spam | underage_concern | cheating_exploits | fake_profile | other`, `description`, `status`, `createdAt`, `reviewedAt`, `reviewedBy`.

### 14.11 Block

Fields: `blockerUid`, `blockedUid`, `reason`, `createdAt`.

### 14.12 AI Request

Fields: `requestId`, `uid`, `type: profile_optimization | squad_advice`, `status`, `inputSummary`, `outputSummary`, `model`, `createdAt`, `completedAt`, `errorCode`.

---

## 15. UX Requirements

### 15.1 Navigation

Primary mobile navigation should include Discover, Matches, Chat, Shop, AI Hub, and Profile. Mobile layout should use bottom navigation. Larger screens may use side navigation if responsive behavior remains clean.

### 15.2 Authentication Screens

Must include product branding, Google OAuth option, email/password option, login/signup switch, error states, loading states, and Hebrew-first RTL layout.

### 15.3 Onboarding Screens

Must include step-by-step profile creation, required field validation, profile image upload/select, skill level selection, game selection, rank input, looking-for intent input, progress indication, and completion confirmation.

### 15.4 Discovery Screen

Must include game selector, swipe card, top HUD bar, view-profile action, like/skip buttons, gesture support, empty-deck state, loading state, error/retry state, and swipe-limit upgrade prompt for Basic users.

### 15.5 Full Profile View

Must include profile image, display name, age display if policy allows, bio, games, rank per game, looking-for intent, skill level, equipped cosmetics, like/skip actions if opened from discovery, and block/report actions.

### 15.6 Matches Screen

Must include list of active matches, user avatar, display name, game context, last-message preview, last activity timestamp, empty state, and blocked/archived behavior according to finalized UX.

### 15.7 Chat Screen

Must include chat header with user identity and game context, real-time message list, sender-styled bubbles, text input, send button, Pro media button, upgrade prompt for Basic media attempt, block/report access, and offline/error states.

### 15.8 Shop Screen

Must include coin balance, item category filters, item cards, rarity labels, preview action, buy action, equip action, ownership state, Pro-locked item state, and empty/error states.

### 15.9 Subscription Screen

Must include Basic vs Pro comparison, price 29.90 ILS/month, Pro benefits, current tier indicator, checkout entry point, and billing/cancellation information when available.

### 15.10 AI Hub Screen

Must include profile optimization entry point, squad/strategy advice entry point, data usage explanation, loading state, AI result card, copy/apply actions, safety refusal messages, and rate-limit state.

---

## 16. Design Requirements

### 16.1 Theme

Theme name: **Dark Matter**.

### 16.2 Visual Direction

The product should feel premium, fast, competitive, neon, sharp, animated, safe, and gaming-native.

### 16.3 Core Visual Elements

- Deep slate backgrounds.
- Layered glassmorphism panels.
- Neon glows.
- High-contrast cards.
- Sharp or slightly angled gaming surfaces.
- Large profile imagery.
- Strong rank and skill badges.
- Smooth swipe animations.
- Premium cosmetic effects.
- RTL-first layout support.

### 16.4 Core Colors

| Token | Usage | Value |
|---|---|---:|
| Primary background | App background | `#0F172A` |
| Surface | Cards/panels | `#1E293B` |
| Primary | Main action / brand | `#6366F1` |
| Premium | Pro / paid / rarity | `#F59E0B` |
| Success | Match / active / success | `#10B981` |
| Danger | Skip / block / destructive | `#EF4444` |
| Border | Glass border | `rgba(255,255,255,0.10)` |

### 16.5 Typography

Recommended direction: display font Space Grotesk or similar, body font Inter or similar, data/stat elements JetBrains Mono or similar, and a readable Hebrew-compatible font for Hebrew UI. Headers should be bold, uppercase where appropriate, and gaming-oriented.

> **Superseded by the Design System.** Because Swish & Game is Hebrew-first, the canonical typography is **Rubik** (a Hebrew-supporting font), defined in `docs/design/DESIGN_SYSTEM.md` (§4). The Latin-only fonts above (Space Grotesk / Inter / JetBrains Mono) are not used as the primary Hebrew UI font; `JetBrains Mono` may be used only for isolated technical/numeric data in LTR contexts. See `DESIGN_SYSTEM.md` for the authoritative typography.

### 16.6 Motion

Swipe animations should feel responsive and physical. Match creation should include a celebratory but non-romantic animation. Cosmetic previews may animate. Reduced-motion settings must be respected.

---

## 17. Analytics Requirements

### 17.1 Core Events

Track: `signup_started`, `signup_completed`, `login_completed`, `logout_completed`, `onboarding_started`, `onboarding_completed`, `profile_image_uploaded`, `game_added`, `game_removed`, `profile_updated`, `discovery_opened`, `game_filter_selected`, `profile_viewed`, `swipe_left`, `swipe_right`, `swipe_limit_reached`, `match_created`, `matches_opened`, `chat_opened`, `message_sent`, `media_upload_attempted`, `media_upload_blocked_basic`, `media_message_sent`, `shop_opened`, `item_viewed`, `item_previewed`, `item_purchased`, `item_equipped`, `upgrade_modal_viewed`, `subscription_page_opened`, `subscription_started`, `subscription_activated`, `subscription_cancelled`, `ai_hub_opened`, `ai_profile_review_requested`, `ai_squad_advice_requested`, `ai_request_refused`, `user_reported`, `user_blocked`.

### 17.2 Key Funnels

#### Onboarding Funnel

1. Signup started.
2. Signup completed.
3. Onboarding started.
4. Profile basics completed.
5. Game added.
6. Onboarding completed.
7. Discovery opened.
8. First swipe.

#### Match Funnel

1. Discovery opened.
2. Game filter selected.
3. Profile viewed.
4. Swipe right.
5. Match created.
6. Chat opened.
7. Message sent.

#### Monetization Funnel

1. Upgrade modal viewed.
2. Subscription page opened.
3. Checkout started.
4. Subscription activated.
5. Pro feature used.

#### Shop Funnel

1. Shop opened.
2. Item viewed.
3. Item previewed.
4. Item purchased.
5. Item equipped.

#### AI Funnel

1. AI Hub opened.
2. AI feature selected.
3. AI request submitted.
4. AI response received.
5. Suggestion copied/applied.

#### Safety Funnel

1. Profile/chat safety menu opened.
2. Report submitted.
3. Block submitted.
4. Chat/discovery access restricted.

---

## 18. Monetization Requirements

### 18.1 Business Model

Swish & Game monetizes through Pro Gamer subscription and cosmetic coin shop.

### 18.2 Basic Tier

Basic is free and includes limited daily swipes, text-only chat, standard discovery access, default styling, basic cosmetics where available, no media upload, and no verified badge. Exact daily swipe limit is an open product decision.

### 18.3 Pro Gamer Tier

Pro Gamer costs **29.90 ILS/month** and includes unlimited swipes, unlimited matches, media/image transfer in chat, premium dynamic backgrounds, verified badge, enhanced cosmetics, and access to Pro-only cosmetic items where configured.

### 18.4 Coin Economy

For MVP:

- Coins are granted or earned.
- Coins are not purchased with real money.
- Coins are used for cosmetics.
- Coins have no cash value.
- Coins cannot be traded.
- Coins cannot be withdrawn.
- Client cannot directly modify coin balance.
- Coin transactions are backend-controlled and auditable.

### 18.5 Deferred Monetization

Deferred to V1 or later: real-money coin packs, seasonal paid cosmetic bundles, advanced Pro tiers, team/clan monetization, and creator/coach marketplace.

### 18.6 Monetization Guardrails

- Cosmetics must not affect match fairness in MVP.
- No one-time profile boosts in MVP.
- Free users must still experience the core loop.
- Text chat after match remains free.
- Paywalls should be clear but not hostile.

---

## 19. Admin & Moderation Requirements

### 19.1 MVP Moderation Requirements

MVP does not include a full admin dashboard, but must store structured moderation data for future review. MVP must support internal review of reported user ID, reporter user ID, report reason, report source, report timestamp, optional description, relevant chat/message/profile context where applicable, and report status.

### 19.2 Future Admin Capabilities

Future admin tooling may include report queue, user search, user status controls, suspend user, ban user, remove profile image, remove bio content, review chat evidence, view block/report history, manage game catalog, manage shop catalog, review subscription status, and audit AI abuse patterns.

### 19.3 Moderation Principles

- Reports should be private.
- False reports should be considered in policy.
- Blocking should provide immediate user protection.
- Moderation actions should be auditable.
- Severe abuse workflows require legal/policy review before launch.

---

## 20. Legal, Policy & Compliance Considerations

### 20.1 Minimum Age and Minors

- Minimum allowed user age must be finalized before launch.
- Minor handling policy must be reviewed legally.
- Age visibility and age-based filtering require product and legal decisions.
- Underage concern is an MVP report reason.

### 20.2 Privacy and GDPR

- Privacy policy required before launch.
- Users must understand what profile data is public.
- Email must not be publicly exposed.
- Data deletion process must be defined.
- AI data usage must be disclosed.
- Data retention periods should be defined.
- GDPR/Israeli privacy compliance should be reviewed.

### 20.3 User-Generated Content

UGC includes display name, bio, profile images, banner images, looking-for text, chat messages, and media uploads. Policies required: acceptable use, harassment, hate speech, sexual content, scam/spam, fake profiles, cheating/exploit promotion, moderation, and enforcement.

### 20.4 Subscription Billing and Refunds

Before paid launch, define terms of subscription, renewal language, cancellation process, refund policy, payment provider terms, receipt handling, and tax/VAT review where applicable.

### 20.5 AI Policy

AI policy should define data used for AI requests, refusal categories, user responsibility for applying advice, no cheating/exploit guidance, AI output limitations, logging, and retention.

### 20.6 Data Deletion

Must define account deletion flow, profile deletion, chat/message retention policy, report retention policy, Storage media deletion, and subscription/billing record retention requirements.

---

## 21. Risks & Mitigations

### 21.1 Risk: Empty Discovery Deck

| Risk | Early users may not find enough eligible players |
|---|---|
| Impact | Low activation, weak first impression, lower retention |
| Mitigations | Seed initial profiles, game-based waitlists, invite friends, expand filters, show “notify me when more players join,” prioritize popular games |

### 21.2 Risk: Product Feels Like a Dating App

| Risk | Users may misunderstand the swipe mechanic |
|---|---|
| Impact | Brand confusion, lower trust, wrong user expectations |
| Mitigations | Use gaming language only, emphasize squad/duo/party, show rank/game/intent prominently, avoid romance-oriented copy and visuals |

### 21.3 Risk: Toxic Behavior

| Risk | Users may harass, insult, scam, or abuse others |
|---|---|
| Impact | Churn, safety concerns, brand damage |
| Mitigations | Block/report in MVP, moderation records, community guidelines, chat restrictions after block, future content moderation and reputation signals |

### 21.4 Risk: Pro Paywall Feels Too Aggressive

| Risk | Basic users churn before experiencing value |
|---|---|
| Impact | Lower activation and lower eventual conversion |
| Mitigations | Keep text chat free, allow meaningful discovery, paywall convenience/status/media, clearly explain value |

### 21.5 Risk: Client-Side State Manipulation

| Risk | Users manipulate coins, Pro status, matches, or AI usage |
|---|---|
| Impact | Economy abuse, security issues, trust damage |
| Mitigations | Backend ownership of trust-sensitive state, Firestore rules, Cloud Functions, transaction logs, server-side validation |

### 21.6 Risk: Fake or Low-Quality Profiles

| Risk | Poor profiles reduce match quality and trust |
|---|---|
| Impact | Lower match rate, higher reports |
| Mitigations | Required onboarding, profile image validation, report fake profile, Pro badge, future verification |

### 21.7 Risk: AI Produces Unsafe or Low-Quality Advice

| Risk | AI suggests cheating, harassment, or generic content |
|---|---|
| Impact | Safety risk, poor feature trust |
| Mitigations | Server-side guardrails, structured prompts, refusal policy, rate limits, AI feedback, no direct client Gemini access |

### 21.8 Risk: Animated Cosmetics Hurt Performance

| Risk | Heavy backgrounds or borders degrade mobile performance |
|---|---|
| Impact | Bad UX, battery drain, lower retention |
| Mitigations | Motion limits, reduced-motion support, asset optimization, performance budgets, static fallback |

### 21.9 Risk: Payment/Webhook Failure

| Risk | Pro users pay but do not receive access or access remains after expiry |
|---|---|
| Impact | Support burden, trust loss, revenue leakage |
| Mitigations | Verified webhooks, retry logic, subscription reconciliation, clear billing state, alerts |

---

## 22. MVP Acceptance Criteria

The MVP is ready for private beta when:

1. User can sign up with Google OAuth.
2. User can sign up with email/password.
3. User session persists after refresh.
4. User can securely log out.
5. User cannot access discovery before completing onboarding.
6. User can complete onboarding with required fields.
7. User can add at least one game with rank and looking-for intent.
8. `skillLevel` is stored as one of `beginner`, `intermediate`, `pro`, `elite`.
9. User can edit allowed profile fields.
10. User can upload or select profile image.
11. User can select a game filter in discovery.
12. Discovery deck only shows eligible users for selected game.
13. Discovery card includes top HUD with view-profile, skill level + trophy, and rank badge.
14. User can swipe left to skip.
15. User can swipe right to like.
16. Swipe actions are persisted and validated by backend.
17. Mutual right swipes create exactly one match.
18. Match creation is backend-controlled and idempotent.
19. Active matches appear in matches screen.
20. Matched users can open real-time chat.
21. Text messages send and receive in real time.
22. Basic users can use text chat.
23. Basic users cannot send media.
24. Basic users see upgrade prompt when attempting media upload.
25. Pro users can send media if subscription is active.
26. Shop displays cosmetic items.
27. User can buy cosmetics with granted/earned coins.
28. Coin purchase is backend-controlled and atomic.
29. User can equip owned avatar border.
30. User can equip owned profile banner.
31. User can equip owned global background.
32. Client cannot directly mutate coins.
33. Client cannot directly mutate Pro status.
34. Client cannot directly create matches.
35. Gemini AI is accessed only through server-side proxy.
36. Gemini API key is not exposed to the client.
37. User can request AI profile-bio optimization.
38. User can request AI squad/strategy advice.
39. AI refuses cheating/harassment/exploit requests.
40. User can block another user.
41. Blocked users are removed from discovery.
42. Blocked users cannot continue chat.
43. User can report another user with a valid reason.
44. Reports are stored for moderation review.
45. App is mobile-first and responsive.
46. UI supports Hebrew-first RTL layout.
47. Firestore security rules prevent unauthorized profile/chat/economy access.
48. Storage rules restrict media access and upload constraints.
49. Core analytics events are tracked.
50. Critical QA flows pass.
51. No known P0 security, data integrity, or payment-access issues remain.

---

## 23. Open Product Decisions

1. What is the minimum allowed user age?
2. Will age be publicly visible or only used for safety/filtering?
3. What is the exact daily swipe limit for Basic users?
4. Are Basic users limited by matches, or only by swipes?
5. Which payment provider will handle Pro subscription?
6. What is the subscription cancellation flow?
7. What is the refund policy?
8. How are coins earned or granted in MVP?
9. Are coins only cosmetic, or can they unlock limited non-cosmetic features later?
10. Which games are included in the initial controlled game catalog?
11. Are rank lists free text in MVP or standardized per game?
12. Will users be able to set age preferences in MVP?
13. Will users be able to set region/time-zone preferences in MVP?
14. Will users be able to set role preferences per game in MVP?
15. Will chat support read receipts in MVP?
16. Will online status be real-time or last-active only?
17. What media file types and size limits are allowed for Pro chat?
18. What image moderation approach is required before beta?
19. Does the Pro verified badge mean “paid Pro member” only, or identity/game verification?
20. What happens to Pro-only cosmetics after Pro expires?
21. Are archived matches included in MVP UI?
22. What is the data retention policy for deleted accounts?
23. What is the report review process before a full admin dashboard exists?
24. What countries are included in the initial launch?
25. ~~Is English support included in MVP, or is MVP Hebrew-only?~~ **Resolved (ADR-035):** MVP is bidirectional — Hebrew (RTL, default) + English (LTR).

---

## 24. Release Plan Summary

### Phase 1 — Foundation

- Set up production Vite/React/TypeScript structure.
- Configure Tailwind CSS.
- Configure Firebase project environments.
- Implement Firebase Auth.
- Implement app routing and auth guards.
- Implement user/profile data model.
- Implement onboarding flow.
- Implement controlled game catalog.
- Implement Hebrew-first RTL layout foundation.

### Phase 2 — Discovery & Matching

- Implement discovery profile read model.
- Implement game-filtered deck.
- Implement swipe card UI.
- Implement top HUD bar.
- Implement like/skip buttons and gestures.
- Implement backend-controlled swipe function.
- Implement double opt-in matching.
- Implement match list.

### Phase 3 — Real-Time Chat

- Implement chat data model.
- Implement real-time message listener.
- Implement text message sending.
- Implement last-message preview.
- Implement chat access rules.
- Implement Basic/Pro media gating.
- Implement media upload flow for Pro users.

### Phase 4 — Shop & Cosmetics

- Implement shop catalog.
- Implement coin balance display.
- Implement backend-controlled item purchase.
- Implement owned item inventory.
- Implement equip cosmetic flow.
- Apply avatar border, banner, and global background.
- Add rarity and preview states.

### Phase 5 — Subscription & Pro

- Implement subscription comparison screen.
- Integrate selected payment provider.
- Implement backend webhook handling.
- Implement server-owned Pro status.
- Unlock Pro features after backend confirmation.
- Handle expiration/downgrade states.

### Phase 6 — AI Hub

- Implement server-side Gemini proxy.
- Add AI profile-bio optimization.
- Add AI squad/strategy advice.
- Add rate limiting.
- Add refusal and safety guardrails.
- Add AI analytics events.

### Phase 7 — Safety, Analytics & Private Beta

- Implement block user.
- Implement report user.
- Enforce block in discovery and chat.
- Add moderation records.
- Add analytics tracking.
- Complete Firestore and Storage security rules.
- Complete QA for critical flows.
- Run mobile responsiveness pass.
- Run performance pass.
- Launch private beta.
