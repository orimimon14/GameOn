# Design System - Swish & Game (Dark Matter Aesthetic)

## 1. Visual Philosophy
השפה העיצובית נקראת "Dark Matter". היא משלבת עומק של חלל (Dark Backgrounds) עם אלמנטים של אור ניאון (Glow) וטיפוגרפיה עוצמתית שמתאימה לספורט תחרותי.

- **Contrast**: שימוש בניגודיות גבוהה בין רקעים כהים לטקסט לבן בוהק.
- **Glassmorphism**: שימוש בשקיפות (Blur) על גבי רקעים זזים ליצירת שכבות.
- **Motion**: אנימציות חדות ומהירות (Pop, Slide) לחיזוק תחושת ה"גיימינג".

## 2. Color Palette

### 2.1 Core Colors
- **BG**: `#0F172A` (Slate 900) - עומק עיקרי.
- **Surface**: `#1E293B` (Slate 800) - כרטיסים ואלמנטים צפים.
- **Primary**: `#6366F1` (Indigo 500) - צבע הפעולה העיקרי.
- **Accent**: `#F59E0B` (Amber 500) - זהב (Premium/Rare).
- **Danger**: `#EF4444` (Red 500) - ביטול/Dislike.
- **Success**: `#10B981` (Emerald 500) - התאמות/לייקים.

### 2.2 Gradients
- **Gamer Pro**: `linear-gradient(to-br, #F59E0B, #D97706)` (Amber to Brown).
- **Match Glow**: `radial-gradient(circle, #6366F1, transparent)`.

## 3. Typography
נשתמש בפונטים שמרגישים מודרניים ומהירים:
- **Display (Headings)**: `font-black italic uppercase` - ליצירת מראה של כותרות ספורט/חדשות.
- **Sans (UI)**: `Inter` או `Outfit` - לקריאות מקסימלית בממשקי צ'אט.
- **Mono (Tech data)**: `JetBrains Mono` - לנתוני Rank וסטטיסטיקה.

## 4. Components Layout

### 4.1 Card System
- `rounded-[32px]` או `rounded-[40px]` - פינות מעוגלות מאוד למראה מודרני.
- `border border-white/10` - קווי מתאר עדינים מאוד.
- `shadow-glow`: צללים שמשתמשים בצבע ה-Primary כדי ליצור אפקט תאורה.

### 4.2 Buttons
- **Action Buttons**: גדולים, עם צללים חזקים ו-Hover states שמשנים את ה-scale ב-2-5%.

## 5. Animation Guidelines (Motion)
- **Entrance**: Staggered children animation (למשל: רשימת צ'אטים נטענת אחד אחרי השני).
- **Interactions**: Hover, Tap, Swipe actions חייבים להיות מלווים בפידבק ויזואלי מיידי.
- **Transitions**: שימוש ב-`AnimatePresence` למעבר בין מסכים.
