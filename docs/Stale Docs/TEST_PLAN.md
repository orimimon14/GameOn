# QA & Test Plan - Swish & Game

## 1. Introduction
מטרת מסמך זה היא להגדיר את אסטרטגיית הבדיקות עבור Swish & Game כדי להבטיח חוויית משתמש חלקה, יציבות העברת נתונים ואבטחת מידע.

## 2. Test Scopes

### 2.1 Functional Testing
- **Auth Flow**: בדיקת הרשמה, התחברות וניתוק (Logout).
- **Matching Logic**: וידוא ש-Match נוצר רק במידה ויש לייק הדדי.
- **Chat Real-time**: בדיקת שליחה וקבלה של הודעות ללא רענון מסך.
- **Economics**: בדיקת רכישת מטבעות ורכישת פריטים בחנות (וידוא חיסור יתרה נכון).

### 2.2 UI/UX (Visual Regression)
- בדיקת רספונסיביות במספר גדלי מסך (iPhone SE, Pixel 5, Desktop 1080p).
- בדיקת תקינות אנימציות (Framer Motion) ומניעת "קפיצות" ב-UI.
- וידוא נגישות (Contrast, Tab navigation).

### 2.3 Security Testing
- **Firestore Rules**: בדיקת ניסיונות גישה למסמכי צ'אט של משתמשים אחרים.
- **Data Validation**: וידוא שלא ניתן להזין נתונים לא תקינים (כמו גיל שלילי).

## 3. Environment & Tools
- **Framework**: Vitest (Unit Testing for logic).
- **E2E**: Cypress או Playwright (UI flows).
- **Device Lab**: Chrome DevTools & Physical devices.

## 4. Acceptance Criteria (Definition of Done)
1. כל ה-Functional Requirements ב-PRD ממומשים ועובדים.
2. אין באגים מסוג "Blocker" או "Critical" פתוחים.
3. האפליקציה נטענת תחת 2 שניות בחיבור 4G ממוצע.
