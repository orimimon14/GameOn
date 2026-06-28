# Architecture & Database Schema - Swish & Game

## 1. High-Level Architecture
האפליקציה בנויה כ-Single Page Application (SPA) מודרנית עם שילוב של Backend-as-a-Service.

- **Frontend**: React 18+ (TS) | Vite.
- **Styling**: Tailwind CSS (Postmodern Dark UI).
- **State Management**: React Hooks (Context API for Auth/Global state).
- **Backend / Database**: Google Firebase.
  - **Authentication**: Google Login / Email & Password.
  - **Database**: Cloud Firestore (Real-time).
  - **Storage**: Firebase Storage (User images/Assets).
- **AI Engine**: Gemini Pro API (via @google/genai).

## 2. Firestore Database Schema (Collections)

### 2.1 `users` (Collection)
מכיל את המידע האישי והגדרות הגיימינג של כל משתמש.
- `uid`: string (ID)
- `name`: string
- `email`: string
- `age`: number
- `bio`: string
- `image`: string (URL)
- `bannerImage`: string (URL)
- `avatarBorder`: string (URL)
- `skillLevel`: string (enum: Beginner, Intermediate, Pro, Elite)
- `rank`: string
- `games`: Array<{ name: string, icon: string, lookingFor: string }>
- `coins`: number
- `subscription`: 'basic' | 'pro'
- `ownedItems`: Array<string> (IDs from shop)
- `createdAt`: timestamp

### 2.2 `matches` (Collection)
ניהול ה"לייקים" וההתאמות.
- `id`: string (docId)
- `users`: Array<string> (Both user UIDs)
- `status`: 'pending' | 'matched'
- `createdAt`: timestamp

### 2.3 `chats` (Collection)
כל התאמה פותחת מסמך צ'אט.
- `id`: string (matchId)
- `lastMessage`: string
- `lastTimestamp`: timestamp
- `participants`: Array<string> (User UIDs)

### 2.4 `messages` (Sub-collection under `chats/{chatId}/messages`)
- `senderId`: string
- `text`: string
- `fileUrl`: string (optional)
- `timestamp`: timestamp

### 2.5 `shopItems` (Collection)
פריטים הזמינים לרכישה.
- `id`: string
- `name`: string
- `price`: number
- `previewUrl`: string
- `category`: string
- `rarity`: 'Common' | 'Rare' | 'Epic' | 'Legendary'
- `isAnimated`: boolean

### 2.6 `transactions` (Collection)
תיעוד רכישות של מטבעות ופריטים.
- `userId`: string
- `itemId`: string (optional)
- `amount`: number
- `type`: 'purchase' | 'coin_refill'
- `timestamp`: timestamp

## 3. Security Model (Zero Trust)
- שימוש ב-Firebase Security Rules לווידוא שמשתמש יכול לקרוא רק את הצ'אטים שלו.
- חסימת עדכון שדות רגישים (כמו מטבעות) ישירות מהצד לקוח (יבוצע דרך Cloud Functions בעתיד או אימות חזק).
