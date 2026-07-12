# Swish & Game — Security

## 1. Document Metadata

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Production Security Rules & Security Model |
| Repository Path | `docs/architecture/SECURITY.md` |
| Product | Swish & Game |
| Source of Truth | `docs/architecture/DATA_MODEL.md`, `docs/architecture/API_CONTRACT.md`, `docs/architecture/ARCHITECTURE.md`, `docs/product/DECISIONS.md` |
| Applies To | Cloud Firestore Security Rules, Firebase Storage Rules, Cloud Functions security boundaries, Secrets management |
| Security Principle | Defense-in-depth: Security Rules מגינות על client access; Cloud Functions + server-side validation אוכפות state רגיש; Admin SDK עוקף Rules ולכן כל state רגיש נכתב רק ב-backend |

---

## Table of Contents

- [1. Document Metadata](#1-document-metadata)
- [2. Auth Model](#2-auth-model)
- [3. Helper Functions](#3-helper-functions)
- [4. Full Firestore Security Rules](#4-full-firestore-security-rules)
- [5. Full Firebase Storage Rules](#5-full-firebase-storage-rules)
- [6. Server-Owned Field Protection](#6-server-owned-field-protection)
- [7. Access Control Matrix](#7-access-control-matrix)
- [8. Threat Model](#8-threat-model)
- [9. Security Rules Test Plan Emulator](#9-security-rules-test-plan-emulator)
- [10. Secrets Management](#10-secrets-management)
- [11. Open Items](#11-open-items)

---

## 2. Auth Model

### 2.1 Firebase Auth

Swish & Game משתמש ב-Firebase Auth כמקור הזהות היחיד ל-client access.

Providers ב-MVP:

- Google OAuth
- Email/password

כל document שמכיל user-owned data משתמש ב-`request.auth.uid` כ-UID הקנוני. אין לסמוך על UID שמגיע מה-client body בלבד.

### 2.2 Roles

| Role | זיהוי | תיאור |
|---|---|---|
| `unauthenticated` | `request.auth == null` | משתמש לא מחובר. אין גישה לנתוני אפליקציה. |
| `owner` | `request.auth.uid == uid` | בעל המסמך ב-path. |
| `authenticated` | `request.auth != null` | משתמש מחובר. יכול לקרוא public discovery-safe data. |
| `participant` | `request.auth.uid in chats/{chatId}.participants` | משתתף בצ׳אט/מאץ׳. |
| `admin` | `request.auth.token.admin == true` | חשבון ניהול עם custom claim. מיועד לכלי admin בלבד. |
| `backend` | Cloud Functions Admin SDK | עוקף Rules. חייב לבצע server-side validation לפי `API_CONTRACT.md`. |

### 2.3 Custom Claims

Custom claims נדרשים:

```ts
type AuthClaims = {
  admin?: boolean;
};
```

שימושים:

- Admin catalog management.
- Moderation operations.
- Manual support operations.
- Emergency account actions.

אין להשתמש ב-custom claims עבור `isPro`.  
`isPro` הוא entitlement עסקי שנשמר ב-Firestore ונגזר מ-`subscriptions/{uid}`.

### 2.4 Session Assumptions

- כל request ל-Firestore/Storage מגיע עם Firebase ID token.
- Rules לא מאמתות freshness מעבר למה ש-Firebase Auth מספק.
- פעולות רגישות במיוחד עוברות Cloud Functions.
- אם user suspended או deleted, Rules חוסמות writes של client.

### 2.5 Onboarding Complete

פעולות שמחייבות profile פעיל:

- discovery reads beyond basic public data.
- creating/updating user game data.
- sending messages.
- reporting/blocking.
- uploads.

ב-Rules נשתמש ב-`users/{uid}.onboardingCompleted == true` כאשר הדבר נדרש.  
ב-Cloud Functions נדרשת בדיקה חוזרת לכל action רגיש.

---

## 3. Helper Functions

ה-helper functions הבאות מוגדרות בתוך `service cloud.firestore` ומשמשות את ה-rules המלאות.

### 3.1 Identity Helpers

```rules
function isSignedIn() {
  return request.auth != null;
}

function isOwner(uid) {
  return isSignedIn() && request.auth.uid == uid;
}

function isAdmin() {
  return isSignedIn() && request.auth.token.admin == true;
}
```

### 3.2 User State Helpers

```rules
function userPath(uid) {
  return /databases/$(database)/documents/users/$(uid);
}

function userExists(uid) {
  return exists(userPath(uid));
}

function userData(uid) {
  return get(userPath(uid)).data;
}

function isNotSuspended() {
  return isSignedIn()
    && userExists(request.auth.uid)
    && userData(request.auth.uid).isSuspended != true
    && userData(request.auth.uid).isDeleted != true;
}

function hasCompletedOnboarding() {
  return isNotSuspended()
    && userData(request.auth.uid).onboardingCompleted == true;
}

function isProUser() {
  return isNotSuspended()
    && userData(request.auth.uid).isPro == true
    && userData(request.auth.uid).subscriptionStatus in ["trialing", "active"];
}
```

### 3.3 Chat Helpers

```rules
function chatPath(chatId) {
  return /databases/$(database)/documents/chats/$(chatId);
}

function chatExists(chatId) {
  return exists(chatPath(chatId));
}

function chatData(chatId) {
  return get(chatPath(chatId)).data;
}

function isChatParticipant(chatId) {
  return isSignedIn()
    && chatExists(chatId)
    && request.auth.uid in chatData(chatId).participants;
}

function isActiveChatParticipant(chatId) {
  return isChatParticipant(chatId)
    && chatData(chatId).isActive == true;
}
```

### 3.4 Match Helpers

```rules
function isMatchParticipant() {
  return isSignedIn()
    && request.auth.uid in resource.data.users;
}
```

### 3.5 Validation Helpers

```rules
function isValidSkillLevel(value) {
  return value in ["beginner", "intermediate", "pro", "elite"];
}

function isValidPlatform(value) {
  return value in [
    "pc",
    "playstation_5",
    "playstation_4",
    "xbox_series_x",
    "xbox_one",
    "nintendo_switch",
    "mobile",
    "vr",
    "arcade",
    "other"
  ];
}

function isValidPlatformList(values) {
  return values is list
    && values.size() > 0
    && values.size() <= 10
    && values.hasOnly([
      "pc",
      "playstation_5",
      "playstation_4",
      "xbox_series_x",
      "xbox_one",
      "nintendo_switch",
      "mobile",
      "vr",
      "arcade",
      "other"
    ]);
}

function isValidLookingFor(value) {
  return value in [
    "duo",
    "squad",
    "ranked_climb",
    "casual",
    "voice_chat",
    "no_voice_chat",
    "custom"
  ];
}

function isValidVoicePreference(value) {
  return value in ["required", "preferred", "no_voice", "flexible"];
}

function isValidReportReason(value) {
  return value in [
    "harassment",
    "hate_speech",
    "sexual_content",
    "scam_spam",
    "underage_concern",
    "cheating_exploits",
    "fake_profile",
    "other"
  ];
}
```

### 3.6 `diff().changedKeys()` Helpers

ה-pattern המרכזי להגנה על server-owned fields:

```rules
function changedKeys() {
  return request.resource.data.diff(resource.data).changedKeys();
}

function affectedKeys() {
  return request.resource.data.diff(resource.data).affectedKeys();
}

function onlyChanged(allowedKeys) {
  return affectedKeys().hasOnly(allowedKeys);
}

function didNotChange(serverOwnedKeys) {
  return !affectedKeys().hasAny(serverOwnedKeys);
}
```

### 3.7 Server-Owned Key Lists

```rules
function userClientWritableKeys() {
  return [
    "displayName",
    "age",
    "bio",
    "preferredLocale",
    "skillLevel",
    "platforms",
    "isDiscoverable",
    "profileImageUrl",
    "bannerImageUrl",
    "galleryMedia"
  ];
}

function userServerOwnedKeys() {
  return [
    "uid",
    "email",
    "onboardingCompleted",
    "coins",
    "subscriptionTier",
    "subscriptionStatus",
    "subscriptionExpiresAt",
    "isPro",
    "verifiedBadge",
    "ownedItemIds",
    "avatarBorderItemId",
    "globalBackgroundItemId",
    "isSuspended",
    "isDeleted",
    "createdAt",
    "updatedAt",
    "lastActiveAt"
  ];
}

function privateAccountClientWritableKeys() {
  return ["birthDate", "country", "locale"];
}

function userGameClientWritableKeys() {
  return [
    "rank",
    "lookingFor",
    "lookingForText",
    "preferredMode",
    "voicePreference",
    "isActive"
  ];
}

function textMessageClientCreateKeys() {
  return ["chatId", "senderId", "type", "text", "createdAt"];
}
```

---

## 4. Full Firestore Security Rules

ה-rules הבאות מיועדות להעתקה ל-`firestore.rules`.

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.admin == true;
    }

    function userPath(uid) {
      return /databases/$(database)/documents/users/$(uid);
    }

    function userExists(uid) {
      return exists(userPath(uid));
    }

    function userData(uid) {
      return get(userPath(uid)).data;
    }

    function isNotSuspended() {
      return isSignedIn()
        && userExists(request.auth.uid)
        && userData(request.auth.uid).isSuspended != true
        && userData(request.auth.uid).isDeleted != true;
    }

    function hasCompletedOnboarding() {
      return isNotSuspended()
        && userData(request.auth.uid).onboardingCompleted == true;
    }

    function isProUser() {
      return isNotSuspended()
        && userData(request.auth.uid).isPro == true
        && userData(request.auth.uid).subscriptionStatus in ["trialing", "active"];
    }

    function chatPath(chatId) {
      return /databases/$(database)/documents/chats/$(chatId);
    }

    function chatExists(chatId) {
      return exists(chatPath(chatId));
    }

    function chatData(chatId) {
      return get(chatPath(chatId)).data;
    }

    function isChatParticipant(chatId) {
      return isSignedIn()
        && chatExists(chatId)
        && request.auth.uid in chatData(chatId).participants;
    }

    function isActiveChatParticipant(chatId) {
      return isChatParticipant(chatId)
        && chatData(chatId).isActive == true;
    }

    function isMatchParticipant() {
      return isSignedIn()
        && request.auth.uid in resource.data.users;
    }

    function changedKeys() {
      return request.resource.data.diff(resource.data).changedKeys();
    }

    function affectedKeys() {
      return request.resource.data.diff(resource.data).affectedKeys();
    }

    function onlyChanged(allowedKeys) {
      return affectedKeys().hasOnly(allowedKeys);
    }

    function didNotChange(serverOwnedKeys) {
      return !affectedKeys().hasAny(serverOwnedKeys);
    }

    function isValidSkillLevel(value) {
      return value in ["beginner", "intermediate", "pro", "elite"];
    }

    function isValidPlatformList(values) {
      return values is list
        && values.size() > 0
        && values.size() <= 10
        && values.hasOnly([
          "pc",
          "playstation_5",
          "playstation_4",
          "xbox_series_x",
          "xbox_one",
          "nintendo_switch",
          "mobile",
          "vr",
          "arcade",
          "other"
        ]);
    }

    function isValidLookingFor(value) {
      return value in [
        "duo",
        "squad",
        "ranked_climb",
        "casual",
        "voice_chat",
        "no_voice_chat",
        "custom"
      ];
    }

    function isValidVoicePreference(value) {
      return value in ["required", "preferred", "no_voice", "flexible"];
    }

    function isValidReportReason(value) {
      return value in [
        "harassment",
        "hate_speech",
        "sexual_content",
        "scam_spam",
        "underage_concern",
        "cheating_exploits",
        "fake_profile",
        "other"
      ];
    }

    function userClientWritableKeys() {
      return [
        "displayName",
        "age",
        "bio",
        "preferredLocale",
        "skillLevel",
        "platforms",
        "isDiscoverable",
        "profileImageUrl",
        "bannerImageUrl",
        "galleryMedia"
      ];
    }

    function userServerOwnedKeys() {
      return [
        "uid",
        "email",
        "onboardingCompleted",
        "coins",
        "subscriptionTier",
        "subscriptionStatus",
        "subscriptionExpiresAt",
        "isPro",
        "verifiedBadge",
        "ownedItemIds",
        "avatarBorderItemId",
        "globalBackgroundItemId",
        "isSuspended",
        "isDeleted",
        "createdAt",
        "updatedAt",
        "lastActiveAt"
      ];
    }

    function privateAccountClientWritableKeys() {
      return ["birthDate", "country", "locale"];
    }

    function userGameClientWritableKeys() {
      return [
        "rank",
        "lookingFor",
        "lookingForText",
        "preferredMode",
        "voicePreference",
        "isActive"
      ];
    }

    function textMessageClientCreateKeys() {
      return ["chatId", "senderId", "type", "text", "createdAt"];
    }

    function isValidClientUserProfile(data) {
      return (!("displayName" in data) || data.displayName is string)
        && (!("age" in data) || data.age is int)
        && (!("bio" in data) || data.bio is string)
        && (!("preferredLocale" in data) || data.preferredLocale in ["he", "en"])
        && (!("skillLevel" in data) || isValidSkillLevel(data.skillLevel))
        && (!("platforms" in data) || isValidPlatformList(data.platforms))
        && (!("isDiscoverable" in data) || data.isDiscoverable is bool)
        && (!("profileImageUrl" in data) || data.profileImageUrl is string)
        && (!("bannerImageUrl" in data) || data.bannerImageUrl is string)
        && isValidGalleryMedia(data);
    }

    // ADR-042 — profile media gallery caps by tier (isPro is server-owned on
    // the same doc, so it is trustworthy here). Video uploads themselves are
    // Pro-gated in Storage Rules (profileMedia/{uid}).
    function isValidGalleryMedia(data) {
      return !("galleryMedia" in data)
        || (data.galleryMedia is list
          && data.galleryMedia.size() <= (data.isPro == true ? 9 : 3));
    }

    function isValidUserGameData(data) {
      return (!("rank" in data) || data.rank is string)
        && (!("lookingFor" in data) || isValidLookingFor(data.lookingFor))
        && (!("lookingForText" in data) || data.lookingForText is string)
        && (!("preferredMode" in data) || data.preferredMode is string)
        && (!("voicePreference" in data) || isValidVoicePreference(data.voicePreference))
        && (!("isActive" in data) || data.isActive is bool);
    }

    function isValidTextMessageCreate(chatId) {
      return request.resource.data.keys().hasOnly(textMessageClientCreateKeys())
        && request.resource.data.chatId == chatId
        && request.resource.data.senderId == request.auth.uid
        && request.resource.data.type == "text"
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 2000
        && request.resource.data.createdAt == request.time;
    }

    function callClientCreateKeys() {
      return ["chatId", "callerUid", "calleeUid", "type", "status", "createdAt", "updatedAt"];
    }

    function isValidCallCreate(chatId) {
      return request.resource.data.keys().hasOnly(callClientCreateKeys())
        && request.resource.data.chatId == chatId
        && request.resource.data.callerUid == request.auth.uid
        && request.resource.data.calleeUid in chatData(chatId).participants
        && request.resource.data.calleeUid != request.auth.uid
        && request.resource.data.type in ["video", "voice"]
        && request.resource.data.status == "ringing";
    }

    function isValidCallUpdate() {
      return onlyChanged(["offer", "answer", "status", "updatedAt"])
        && request.resource.data.status in ["ringing", "accepted", "declined", "ended"];
    }

    function isValidReportCreate() {
      return request.resource.data.keys().hasOnly([
          "reporterUid",
          "reportedUid",
          "source",
          "chatId",
          "messageId",
          "reason",
          "description",
          "status",
          "createdAt"
        ])
        && request.resource.data.reporterUid == request.auth.uid
        && request.resource.data.reportedUid is string
        && request.resource.data.reportedUid != request.auth.uid
        && request.resource.data.source in ["profile", "chat", "message"]
        && isValidReportReason(request.resource.data.reason)
        && request.resource.data.status == "open"
        && request.resource.data.createdAt == request.time
        && (!("description" in request.resource.data)
          || (request.resource.data.description is string
            && request.resource.data.description.size() <= 2000));
    }

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();

      allow create: if isOwner(uid)
        && request.resource.data.keys().hasOnly(userClientWritableKeys())
        && isValidClientUserProfile(request.resource.data);

      allow update: if isOwner(uid)
        && isNotSuspended()
        && onlyChanged(userClientWritableKeys())
        && didNotChange(userServerOwnedKeys())
        && isValidClientUserProfile(request.resource.data);

      allow delete: if false;

      match /private/{docId} {
        allow read: if (docId == "account" && isOwner(uid)) || isAdmin();

        allow create: if false;

        allow update: if docId == "account"
          && isOwner(uid)
          && isNotSuspended()
          && onlyChanged(privateAccountClientWritableKeys());

        allow delete: if false;
      }

      match /games/{gameId} {
        allow read: if isOwner(uid) || isAdmin();

        allow create: if isOwner(uid)
          && isNotSuspended()
          && hasCompletedOnboarding()
          && exists(/databases/$(database)/documents/gameCatalog/$(gameId))
          && request.resource.data.keys().hasOnly(userGameClientWritableKeys())
          && isValidUserGameData(request.resource.data);

        allow update: if isOwner(uid)
          && isNotSuspended()
          && onlyChanged(userGameClientWritableKeys())
          && isValidUserGameData(request.resource.data);

        allow delete: if isOwner(uid) && isNotSuspended();
      }

      match /swipes/{swipeId} {
        allow read: if isOwner(uid) || isAdmin();
        allow create: if false;
        allow update: if false;
        allow delete: if false;
      }

      // Push notification tokens (FCM) — owner-managed device registry.
      match /devices/{token} {
        allow read: if isOwner(uid) || isAdmin();
        allow create, update: if isOwner(uid)
          && isNotSuspended()
          && request.resource.data.keys().hasOnly(["token", "platform", "updatedAt"])
          && request.resource.data.token == token;
        allow delete: if isOwner(uid);
      }


      match /blocks/{blockedUid} {
        allow read: if isOwner(uid) || isAdmin();
        allow create: if false;
        allow update: if false;
        allow delete: if false;
      }

      match /ownedItems/{itemId} {
        allow read: if isOwner(uid) || isAdmin();
        allow create: if false;
        allow update: if false;
        allow delete: if false;
      }

      match /transactions/{transactionId} {
        allow read: if isOwner(uid) || isAdmin();
        allow create: if false;
        allow update: if false;
        allow delete: if false;
      }

      match /usage/{date} {
        allow read: if isOwner(uid) || isAdmin();
        allow create: if false;
        allow update: if false;
        allow delete: if false;
      }
    }

    match /publicProfiles/{uid} {
      allow read: if isSignedIn();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /discoveryProfiles/{gameId}/players/{uid} {
      allow read: if isSignedIn();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /matches/{matchId} {
      allow read: if isAdmin() || isMatchParticipant();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    // Likes You (ADR-033, MVP open to all): the target of a like may read
    // inbound like-swipes about them via a collection-group query. Skips stay
    // invisible to the target; writes remain server-only.
    match /{path=**}/swipes/{swipeId} {
      allow read: if isNotSuspended()
        && resource.data.toUid == request.auth.uid
        && resource.data.direction == "like";
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    // Incoming-call listener (ADR-041 proposal): call participants may find
    // their calls via a collection-group query (e.g. calleeUid == me,
    // status == "ringing"). Writes stay path-scoped above.
    match /{path=**}/calls/{callId} {
      allow read: if isNotSuspended()
        && (resource.data.calleeUid == request.auth.uid
          || resource.data.callerUid == request.auth.uid);
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }



    // ADR-043 — user-submitted game suggestions: write-only inbox for admins.
    match /gameSuggestions/{suggestionId} {
      allow read: if isAdmin();

      allow create: if isSignedIn()
        && isNotSuspended()
        && request.resource.data.keys().hasOnly(["uid", "name", "createdAt"])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 60
        && request.resource.data.createdAt == request.time;

      allow update: if false;
      allow delete: if false;
    }

    match /chats/{chatId} {
      // resource.data (not get()) so participants can list their own chats —
      // query-provable form of isChatParticipant for this doc itself.
      allow read: if isAdmin()
        || (isSignedIn() && request.auth.uid in resource.data.participants);
      allow create: if false;

      // Narrow exception to server-owned chats (DATA_MODEL §4.7): a
      // participant may zero their OWN unreadCounts key and stamp their OWN
      // lastReadAt (read receipts) when opening the chat. Everything else
      // stays backend-only.
      allow update: if isSignedIn()
        && request.auth.uid in resource.data.participants
        && isNotSuspended()
        && onlyChanged(["unreadCounts", "lastReadAt", "typing"])
        && (request.resource.data.get("unreadCounts", {}) == resource.data.get("unreadCounts", {})
          || (request.resource.data.unreadCounts
              .diff(resource.data.get("unreadCounts", {}))
              .affectedKeys()
              .hasOnly([request.auth.uid])
            && request.resource.data.unreadCounts[request.auth.uid] == 0))
        && (request.resource.data.get("lastReadAt", {}) == resource.data.get("lastReadAt", {})
          || (request.resource.data.lastReadAt
              .diff(resource.data.get("lastReadAt", {}))
              .affectedKeys()
              .hasOnly([request.auth.uid])
            && request.resource.data.lastReadAt[request.auth.uid] == request.time))
        && (request.resource.data.get("typing", {}) == resource.data.get("typing", {})
          || (request.resource.data.get("typing", {})
              .diff(resource.data.get("typing", {}))
              .affectedKeys()
              .hasOnly([request.auth.uid])
            && (!(request.auth.uid in request.resource.data.get("typing", {}))
              || request.resource.data.typing[request.auth.uid] == request.time)));

      allow delete: if false;

      match /messages/{messageId} {
        allow read: if isAdmin() || isChatParticipant(chatId);

        allow create: if isSignedIn()
          && isNotSuspended()
          && isActiveChatParticipant(chatId)
          && isValidTextMessageCreate(chatId);

        allow update: if false;
        allow delete: if false;
      }

      // Live voice/video calls (ADR-041 proposal) — WebRTC signaling docs.
      // Chat participants only; caller creates as "ringing", both sides may
      // publish offer/answer and end the call. History is immutable otherwise.
      match /calls/{callId} {
        allow read: if isAdmin() || isChatParticipant(chatId);

        allow create: if isSignedIn()
          && isNotSuspended()
          && isActiveChatParticipant(chatId)
          && isValidCallCreate(chatId);

        allow update: if isSignedIn()
          && isNotSuspended()
          && isChatParticipant(chatId)
          && isValidCallUpdate();

        allow delete: if false;

        match /callerCandidates/{candidateId} {
          allow read: if isChatParticipant(chatId);
          allow create: if isNotSuspended() && isChatParticipant(chatId);
          allow update: if false;
          allow delete: if false;
        }

        match /calleeCandidates/{candidateId} {
          allow read: if isChatParticipant(chatId);
          allow create: if isNotSuspended() && isChatParticipant(chatId);
          allow update: if false;
          allow delete: if false;
        }
      }
    }

    match /shopItems/{itemId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /gameCatalog/{gameId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /subscriptions/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /billingEvents/{eventId} {
      allow read: if isAdmin();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /aiRequests/{requestId} {
      allow read: if isSignedIn()
        && (resource.data.uid == request.auth.uid || isAdmin());
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /reports/{reportId} {
      allow read: if isAdmin();

      allow create: if isSignedIn()
        && isNotSuspended()
        && isValidReportCreate();

      allow update: if false;
      allow delete: if false;
    }

    match /moderationActions/{actionId} {
      allow read: if isAdmin();
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /system/{docId} {
      allow read: if docId == "config" && isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4.1 הערות Implementation

- `matches`, `swipes`, `transactions`, `ownedItems`, `aiRequests`, `subscriptions` חסומים ל-client writes לחלוטין.
- `messages` מאפשרים client create רק עבור `type == "text"`.
- `image` messages נוצרים רק דרך `sendChatMediaMessage` ב-Cloud Functions.
- `reports` ניתנים ל-create מוגבל כדי לאפשר דיווח גם אם function זמנית לא זמינה; backend יכול לעבור ל-function-only על ידי שינוי rule ל-`allow create: if false`.
- `blocks` נכתבים רק דרך `blockUser` כדי להבטיח side effects על `matches` ו-`chats`.

---

## 5. Full Firebase Storage Rules

ה-rules הבאות מיועדות להעתקה ל-`storage.rules`.

```rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.admin == true;
    }

    function userDoc(uid) {
      return firestore.get(/databases/(default)/documents/users/$(uid));
    }

    function userExists(uid) {
      return firestore.exists(/databases/(default)/documents/users/$(uid));
    }

    function isNotSuspended() {
      return isSignedIn()
        && userExists(request.auth.uid)
        && userDoc(request.auth.uid).data.isSuspended != true
        && userDoc(request.auth.uid).data.isDeleted != true;
    }

    function isProUser() {
      return isNotSuspended()
        && userDoc(request.auth.uid).data.isPro == true
        && userDoc(request.auth.uid).data.subscriptionStatus in ["trialing", "active"];
    }

    function chatDoc(chatId) {
      return firestore.get(/databases/(default)/documents/chats/$(chatId));
    }

    function chatExists(chatId) {
      return firestore.exists(/databases/(default)/documents/chats/$(chatId));
    }

    function isChatParticipant(chatId) {
      return isSignedIn()
        && chatExists(chatId)
        && request.auth.uid in chatDoc(chatId).data.participants;
    }

    function isValidImage() {
      return request.resource != null
        && request.resource.contentType.matches("image/.*");
    }

    function isValidChatMedia() {
      return request.resource != null
        && (request.resource.contentType.matches("image/.*")
          || request.resource.contentType in ["video/webm", "video/mp4"]);
    }

    function isMaxSize(bytes) {
      return request.resource != null
        && request.resource.size <= bytes;
    }

    match /profileImages/{uid}/{fileId} {
      allow read: if isSignedIn();

      allow write: if isOwner(uid)
        && isNotSuspended()
        && isValidImage()
        && isMaxSize(5 * 1024 * 1024);

      allow delete: if isOwner(uid) || isAdmin();
    }

    // ADR-042 — profile media gallery: images for everyone, gameplay
    // videos Pro-only. Item caps per tier live in Firestore rules (users doc).
    match /profileMedia/{uid}/{fileId} {
      allow read: if isSignedIn();

      allow write: if isOwner(uid)
        && isNotSuspended()
        && ((isValidImage() && isMaxSize(10 * 1024 * 1024))
          || (request.resource.contentType in ["video/webm", "video/mp4", "video/quicktime"]
            && isMaxSize(50 * 1024 * 1024)
            && isProUser()));

      allow delete: if isOwner(uid) || isAdmin();
    }

    match /bannerImages/{uid}/{fileId} {
      allow read: if isSignedIn();

      allow write: if isOwner(uid)
        && isNotSuspended()
        && isValidImage()
        && isMaxSize(5 * 1024 * 1024);

      allow delete: if isOwner(uid) || isAdmin();
    }

    match /chatMedia/{chatId}/{uid}/{fileId} {
      allow read: if isChatParticipant(chatId) || isAdmin();

      // Images and recorded video messages (ADR-041) — Pro-only either way.
      allow write: if isOwner(uid)
        && isProUser()
        && isChatParticipant(chatId)
        && isValidChatMedia()
        && isMaxSize(25 * 1024 * 1024);

      allow delete: if isOwner(uid) || isAdmin();
    }

    match /shopAssets/{itemId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
      allow delete: if isAdmin();
    }

    match /tempUploads/{uid}/{fileId} {
      allow read: if isOwner(uid) || isAdmin();

      allow write: if isOwner(uid)
        && isNotSuspended()
        && isValidImage()
        && isMaxSize(10 * 1024 * 1024);

      allow delete: if isOwner(uid) || isAdmin();
    }

    match /moderationEvidence/{reportId}/{fileId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow delete: if false;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 5.1 Storage Security Notes

- Upload ל-`chatMedia` אינו יוצר message. ה-message נוצר רק ב-`sendChatMediaMessage`.
- Basic user לא יכול להעלות ל-`chatMedia`.
- `shopAssets` ו-`moderationEvidence` הם admin-only writes.
- `profileImages` ו-`bannerImages` מוגבלים ל-5MB.
- `profileMedia` (ADR-042): תמונות ≤10MB לכולם; וידאו (`webm/mp4/quicktime`) ≤50MB ל-Pro בלבד. מכסות פריטים לפי tier נאכפות ב-Firestore Rules.
- `chatMedia` מוגבל ל-10MB.
- כל הנתיבים image-only למעט `shopAssets`, שבו admin אחראי ל-upload.

---

## 6. Server-Owned Field Protection

### 6.1 User Server-Owned Fields

ה-fields הבאים ב-`users/{uid}` לעולם לא נכתבים על ידי client:

| Field | סיבה |
|---|---|
| `uid` | נגזר מ-Firebase Auth. |
| `email` | מגיע מ-auth provider. |
| `onboardingCompleted` | נקבע על ידי backend לאחר validation. |
| `coins` | Economy state רגיש. |
| `subscriptionTier` | נגזר מ-payment backend. |
| `subscriptionStatus` | נגזר מ-payment backend. |
| `subscriptionExpiresAt` | נגזר מ-payment backend. |
| `isPro` | Pro entitlement. |
| `verifiedBadge` | נגזר מ-Pro ב-MVP. |
| `ownedItemIds` | ownership state. |
| `avatarBorderItemId` | נקבע דרך `equipItem`. |
| `globalBackgroundItemId` | נקבע דרך `equipItem`. |
| `isSuspended` | moderation/admin only. |
| `isDeleted` | account lifecycle/admin only. |
| `createdAt` | server timestamp. |
| `updatedAt` | server timestamp/backend controlled. |
| `lastActiveAt` | throttled backend update. |

> **Account deletion (ADR-038):** משתמש לא יכול למחוק `users/{uid}` או מסמכים משויכים ישירות. מחיקת חשבון רצה רק דרך `deleteAccount` Cloud Function (backend-authoritative), שמוחקת/מאנונימיזציה נתונים ומגדירה `isDeleted = true` לפי retention/legal. client deletes של user/server-owned collections נדחים כברירת מחדל.

### 6.2 Pattern

```rules
allow update: if isOwner(uid)
  && isNotSuspended()
  && onlyChanged(userClientWritableKeys())
  && didNotChange(userServerOwnedKeys())
  && isValidClientUserProfile(request.resource.data);
```

ההגנה מבוססת על:

- `affectedKeys().hasOnly(userClientWritableKeys())`
- `!affectedKeys().hasAny(userServerOwnedKeys())`

### 6.3 Collections שהן Backend-Only

| Collection | Client read | Client write |
|---|---:|---:|
| `users/{uid}/swipes/{swipeId}` | owner; like target via collection-group (`toUid == auth.uid && direction == "like"`, ADR-033) | never |
| `users/{uid}/ownedItems/{itemId}` | owner | never |
| `users/{uid}/transactions/{transactionId}` | owner | never |
| `users/{uid}/usage/{date}` | owner | never |
| `matches/{matchId}` | participant | never |
| `chats/{chatId}` | participant | never |
| `subscriptions/{uid}` | owner | never |
| `billingEvents/{eventId}` | admin | never |
| `aiRequests/{requestId}` | owner/admin | never |
| `moderationActions/{actionId}` | admin | never |

### 6.4 Message Media Protection

Client create ל-message מוגבל ל:

```rules
request.resource.data.type == "text"
```

ולכן גם Pro client לא יכול ליצור:

```ts
type: "image"
fileUrl
filePath
fileMimeType
fileSizeBytes
```

Image messages נוצרים רק על ידי backend דרך `sendChatMediaMessage`.

---

## 7. Access Control Matrix

| Collection / Path | Owner Read | Owner Write | Authenticated Read | Participant Read | Admin Read/Write | Backend Write |
|---|---:|---:|---:|---:|---:|---:|
| `users/{uid}` | Yes | Limited profile fields | No | No | Yes | Yes |
| `users/{uid}/private/account` | Yes | Limited account fields | No | No | Yes | Yes |
| `users/{uid}/games/{gameId}` | Yes | Limited gameplay fields | No | No | Yes | Yes |
| `users/{uid}/swipes/{swipeId}` | Yes | No | No | No | Yes | Yes |
| `users/{uid}/blocks/{blockedUid}` | Yes | No | No | No | Yes | Yes |
| `users/{uid}/ownedItems/{itemId}` | Yes | No | No | No | Yes | Yes |
| `users/{uid}/transactions/{transactionId}` | Yes | No | No | No | Yes | Yes |
| `users/{uid}/usage/{date}` | Yes | No | No | No | Yes | Yes |
| `publicProfiles/{uid}` | Yes | No | Yes | No | Yes | Yes |
| `discoveryProfiles/{gameId}/players/{uid}` | Yes | No | Yes | No | Yes | Yes |
| `matches/{matchId}` | If participant | No | No | Yes | Yes | Yes |
| `chats/{chatId}` | If participant | No | No | Yes | Yes | Yes |
| `chats/{chatId}/messages/{messageId}` | If participant | Text create only if participant | No | Yes | Yes | Yes |
| `shopItems/{itemId}` | Read only | No | Yes | No | Yes | Yes |
| `gameCatalog/{gameId}` | Read only | No | Yes | No | Yes | Yes |
| `subscriptions/{uid}` | Yes | No | No | No | Yes | Yes |
| `billingEvents/{eventId}` | No | No | No | No | Yes | Yes |
| `aiRequests/{requestId}` | Own only | No | No | No | Yes | Yes |
| `reports/{reportId}` | No | Create constrained | No | No | Yes | Yes |
| `moderationActions/{actionId}` | No | No | No | No | Yes | Yes |
| `system/config` | Read only | No | Yes | No | Yes | Yes |

---

## 8. Threat Model

| Threat | Risk | Mitigation |
|---|---|---|
| Self-grant Pro | משתמש משנה `isPro`, `subscriptionTier`, או `subscriptionStatus` לעצמו. | `users/{uid}` update חוסם server-owned fields; `subscriptions/{uid}` client write denied; Pro sync רק מ-`paymentWebhook`/backend. |
| Coin tampering | משתמש מגדיל `coins` או משנה `ownedItemIds`. | `coins` ו-`ownedItemIds` חסומים ב-`diff().affectedKeys()`; mutations רק דרך `purchaseShopItem`/`grantCoins`; `transactions` MVP audit. |
| Fake matches | משתמש יוצר `matches/{matchId}` או `chats/{chatId}` ישירות. | client create/update/delete ל-`matches` ו-`chats` denied; יצירה רק ב-`submitSwipe` עם deterministic IDs ו-transaction. |
| Fake swipes | משתמש כותב `users/{uid}/swipes` ידנית כדי לעקוף limit. | swipes write denied; `submitSwipe` אוכף Basic daily limit ו-block checks. |
| Reading private profile | משתמש קורא `users/{otherUid}` או `private/account` של אחר. | read רק owner/admin. Public discovery data נמצא ב-`publicProfiles`. |
| Reading non-participant chat | משתמש קורא chat או messages שאינו participant בהם. | `isChatParticipant(chatId)` בכל read של `chats` ו-`messages`. |
| Sending message as another user | משתמש יוצר message עם `senderId` של מישהו אחר. | `senderId == request.auth.uid` נדרש ב-create. |
| Basic sending media | Basic user יוצר `type = image` או מעלה `chatMedia`. | Firestore messages create מאפשר רק `type == "text"`; Storage `chatMedia` דורש `isProUser()`; backend `sendChatMediaMessage` מאמת Pro. |
| Gemini key leak | Gemini API key נחשף ב-client. | אין key ב-client; Gemini key ב-Secret Manager; AI רק דרך Cloud Function. |
| Prompt injection | משתמש מנסה לגרום ל-AI לחשוף prompts או לייצר תוכן אסור. | server-side prompt construction, guardrails, refusal policy, audit ב-`aiRequests`. |
| Storage abuse | העלאת קבצים גדולים/לא תמונות/לנתיב של משתמש אחר. | Storage Rules בודקות owner, content type, size; chatMedia דורש participant + Pro. |
| Block bypass | משתמש חסום ממשיך לשלוח messages או להופיע ב-discovery. | `blockUser` ו-`onBlockCreated` מעדכנים chat/match; `isActiveChatParticipant`; discovery excludes via backend. |
| Webhook spoofing | גורם חיצוני מזייף payment webhook. | `paymentWebhook` דורש signature verification עם secret מ-Secret Manager; raw body verification; idempotency by provider event ID. |
| Enum tampering | client כותב enum לא חוקי, לדוגמה skill בעברית. | Rules ו-Zod מאמתים enum באנגלית בלבד; label maps ב-UI בלבד. |
| Suspended-user actions | משתמש suspended ממשיך לעדכן profile, לשלוח הודעות או לדווח. | `isNotSuspended()` ב-writes; Cloud Functions בודקות user state; reads רגישים מוגבלים. |
| Public profile poisoning | client מעדכן `publicProfiles` ישירות כדי להציג false badge או gameIds. | `publicProfiles` write denied; sync רק backend/trigger. |
| Shop catalog tampering | client משנה מחיר או `requiresPro`. | `shopItems` write admin-only; purchases קוראות catalog server-side. |
| Game catalog tampering | client מוסיף game מזויף או משנה ranks. | `gameCatalog` write admin-only. |
| Report abuse | משתמש יוצר reports מזויפים בכמות גבוהה. | create report constrained ל-reporter; rate limit עתידי; admin review; no automatic punishment. |
| Replay/double purchase | double-click על purchase מוריד coins פעמיים. | `purchaseShopItem` transaction + ownership check + optional idempotencyKey. |

---

## 9. Security Rules Test Plan Emulator

כל הבדיקות חייבות לרוץ ב-Firebase Emulator Suite לפני deploy.

### 9.1 Auth / User Rules

#### Allow

- [ ] owner can read `users/{uid}`.
- [ ] owner can update `displayName`.
- [ ] owner can update `bio`.
- [ ] owner can update `skillLevel` לערך `beginner`.
- [ ] owner can update `platforms` עם ערכי enum תקינים.
- [ ] owner can read `users/{uid}/private/account`.
- [ ] owner can update `birthDate`, `country`, `locale`.

#### Deny

- [ ] unauthenticated cannot read `users/{uid}`.
- [ ] user cannot read another user's `users/{uid}`.
- [ ] user cannot read another user's `private/account`.
- [ ] user cannot update own `coins`.
- [ ] user cannot update own `isPro`.
- [ ] user cannot update own `subscriptionTier`.
- [ ] user cannot update own `subscriptionStatus`.
- [ ] user cannot update own `subscriptionExpiresAt`.
- [ ] user cannot update own `isSuspended`.
- [ ] user cannot update own `ownedItemIds`.
- [ ] user cannot write Hebrew `skillLevel`.
- [ ] suspended user cannot update profile.

### 9.2 User Games

#### Allow

- [ ] owner can read own `users/{uid}/games/{gameId}`.
- [ ] owner can update own `rank`.
- [ ] owner can update own `lookingFor` לערך תקין.
- [ ] owner can update own `voicePreference`.

#### Deny

- [ ] user cannot read another user's private game docs.
- [ ] user cannot set invalid `lookingFor`.
- [ ] user cannot change server-owned `rankScore`.
- [ ] user cannot change `gameId`, `name`, `iconUrl` if present.

### 9.3 Swipes / Matches

#### Deny

- [ ] user cannot create `users/{uid}/swipes/{swipeId}` directly.
- [ ] user cannot update `users/{uid}/swipes/{swipeId}` directly.
- [ ] user cannot create `matches/{matchId}` directly.
- [ ] user cannot update `matches/{matchId}` directly.
- [ ] user cannot create `chats/{chatId}` directly.

### 9.4 Chats / Messages

#### Allow

- [ ] participant can read `chats/{chatId}`.
- [ ] participant can read `chats/{chatId}/messages/{messageId}`.
- [ ] participant can create text message with `senderId == request.auth.uid`.
- [ ] participant can create text message with `type == "text"`.

#### Deny

- [ ] non-participant cannot read `chats/{chatId}`.
- [ ] non-participant cannot read messages.
- [ ] user cannot send message as another user.
- [ ] user cannot create message with `type == "image"`.
- [ ] Pro user still cannot create image message directly.
- [ ] Basic user cannot create image message directly.
- [ ] user cannot include `fileUrl` in client-created message.
- [ ] user cannot update or delete message after create.
- [ ] user cannot send message to inactive chat.

### 9.5 Shop / Economy

#### Allow

- [ ] authenticated user can read `shopItems`.
- [ ] owner can read own `transactions`.
- [ ] owner can read own `ownedItems`.

#### Deny

- [ ] regular user cannot create/update/delete `shopItems`.
- [ ] regular user cannot create/update/delete `ownedItems`.
- [ ] regular user cannot create/update/delete `transactions`.
- [ ] regular user cannot modify `users/{uid}.coins`.
- [ ] regular user cannot modify `users/{uid}.avatarBorderItemId` directly.

### 9.6 Subscription / Billing

#### Allow

- [ ] owner can read own `subscriptions/{uid}`.
- [ ] admin can read `billingEvents`.

#### Deny

- [ ] user cannot create/update/delete `subscriptions/{uid}`.
- [ ] user cannot read another user's subscription.
- [ ] user cannot create/update/delete `billingEvents`.

### 9.7 AI

#### Allow

- [ ] owner can read own `aiRequests`.

#### Deny

- [ ] user cannot create `aiRequests` directly.
- [ ] user cannot update `aiRequests`.
- [ ] user cannot read another user's `aiRequests`.

### 9.8 Reports / Moderation

#### Allow

- [ ] authenticated user can create report with `reporterUid == request.auth.uid`.
- [ ] admin can read reports.
- [ ] admin can read moderation actions.

#### Deny

- [ ] user cannot create report with another `reporterUid`.
- [ ] user cannot report self.
- [ ] user cannot set `status != "open"` on create.
- [ ] user cannot update report after create.
- [ ] user cannot read reports.
- [ ] user cannot read/write `moderationActions`.

### 9.9 Public Profiles / Discovery

#### Allow

- [ ] authenticated user can read `publicProfiles`.
- [ ] authenticated user can read `discoveryProfiles`.

#### Deny

- [ ] unauthenticated user cannot read `publicProfiles`.
- [ ] client cannot create/update/delete `publicProfiles`.
- [ ] client cannot create/update/delete `discoveryProfiles`.

### 9.10 Storage

#### Allow

- [ ] owner can upload image to `profileImages/{uid}` up to 5MB.
- [ ] owner can upload image to `bannerImages/{uid}` up to 5MB.
- [ ] Pro participant can upload image to `chatMedia/{chatId}/{uid}` up to 10MB.
- [ ] participant can read `chatMedia/{chatId}`.
- [ ] authenticated user can read `shopAssets`.

#### Deny

- [ ] unauthenticated cannot upload.
- [ ] user cannot upload to another user's `profileImages`.
- [ ] user cannot upload non-image file.
- [ ] user cannot upload profile image > 5MB.
- [ ] Basic user cannot upload to `chatMedia`.
- [ ] non-participant cannot read `chatMedia`.
- [ ] regular user cannot write `shopAssets`.
- [ ] regular user cannot read/write `moderationEvidence`.

---

## 10. Secrets Management

### 10.1 Secrets שחייבים להיות ב-Secret Manager

| Secret | שימוש |
|---|---|
| `GEMINI_API_KEY` | קריאות Gemini server-side proxy בלבד. |
| `PAYMENT_WEBHOOK_SECRET` | אימות signature ב-`paymentWebhook`. |
| `PAYMENT_API_SECRET` | יצירת checkout sessions וקריאות provider API. |
| `PAYMENT_API_KEY` | אם provider דורש key נפרד. |
| `ADMIN_INTERNAL_SECRET` | רק אם נדרש ל-internal admin tooling; עדיף IAM/custom claims. |
| `SENTRY_DSN` | יכול להיות public ל-frontend אם נדרש, אך server secrets לא. |

### 10.2 אסור ב-client

אסור לחשוף ב-client bundle:

- Gemini API key.
- Payment provider secret.
- Webhook secret.
- Admin SDK credentials.
- Service account JSON.
- Internal moderation secrets.
- Any private signing key.

### 10.3 מותר ב-client

Firebase web config מותר ב-client:

- Firebase `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

הם אינם secrets, אך חייבים להיות מוגנים על ידי Security Rules.

### 10.4 Operational Requirements

- rotation policy לכל secret production.
- הפרדה בין dev/staging/prod.
- מינימום הרשאות service account.
- אין secrets ב-logs.
- אין raw payment payload מלא ב-logs.
- אין prompt/system prompt מלא ב-client.

---

## 11. Open Items

| נושא | Status | השפעה אבטחתית |
|---|---|---|
| Exact Basic daily swipe limit | Proposed via ADR-015 | משפיע על rate limit ב-`submitSwipe` ו-`users/{uid}/usage`. |
| AI request limits by tier | Open via ADR-027 | משפיע על abuse/cost protection ל-`sendAIProfileReview` ו-`sendAISquadAdvice`. |
| Chat abuse threshold | Open via ADR-028 | משפיע על message rate limiting ו-abuse detection. |
| Daily limit reset timezone | Open via ADR-029 | משפיע על `users/{uid}/usage/{yyyy-mm-dd}` ועל emulator tests. |
| Final `Platform` vocabulary | Open via ADR-030 | משפיע על validation ב-profile/discovery filters. |
| Maximum `bio` length | Open via ADR-031 | משפיע על Firestore Rules, Zod schemas ו-AI input validation. |
| Pro-required cosmetics after Pro expiration | Open via ADR-032 | משפיע על `equipItem`, `onSubscriptionUpdated`, ו-UI fallback. |
| Whether reports are function-only or rules-allowed create | Open / recommended function-only | במסמך זה allow create constrained; אפשר להקשיח ל-function-only בהמשך. |
| Image moderation automation provider | Open / V1 | משפיע על Storage approval flow, report queues ו-risk level. |
| Payment provider final selection | Proposed via ADR-017 | משפיע על webhook signature implementation ו-secret naming. |
| Account deletion retention policy | Open | משפיע על `onUserDeleted`, chat retention, reports retention ו-privacy compliance. |
