# Development Plan & Roadmap - Swish & Game

> ⚠️ **Superseded by `docs/product/ROADMAP.md`.**
> Do not use this document as the source of truth.

## 1. Current Status Analysis
האפליקציה נמצאת כרגע בשלב ה-Prototype. רוב ה-Views קיימים ברמת ה-UI, אך המידע הוא סטטי (Mock Data) ואין בסיס נתונים חי שמחבר בין משתמשים שונים.

## 2. Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] **Firebase Setup**: הגדרת פרויקט Firebase, Firestore ו-Storage.
- [ ] **Authentication**: מימוש הרשמה/התחברות (Google Login) ושמירת משתמש ב-Firestore.
- [ ] **Profile Completion**: תהליך (Onboarding) שבו המשתמש מגדיר את המשחקים וה-BIO שלו.

## 3. Phase 2: Discovery & Interaction (Weeks 3-4)
- [ ] **Real Swiping**: העברת ה-SwipeView לשימוש בנתונים חיים מה-DB.
- [ ] **Matching Engine**: יצירת לוגיקה שיוצרת מסמך `Match` ברגע שיש לייק הדדי.
- [ ] **Likes Tracking**: תצוגה של "מי עשה לי לייק" (למנויי Pro).

## 4. Phase 3: Real-Time Chat (Weeks 5-6)
- [ ] **Chat Logic**: חיבור ה-ChatView ל-Firestore כך שהודעות יישלחו ויתקבלו בזמן אמת.
- [ ] **File Sharing**: העלאת תמונות/קבצים בצ'אט דרך Firebase Storage.
- [ ] **Notifications**: הוספת מערכת התראות (In-app) על הודעות חדשות ומאצ'ים.

## 5. Phase 4: Economy & Shop (Weeks 7-8)
- [ ] **Coin System**: ניהול יתרת מטבעות בשרת.
- [ ] **Virtual Inventory**: לוגיקה של רכישת פריטים (Borders, Backgrounds) ושינוי המראה בזמן אמת.
- [ ] **Stripe/Paypal Integration**: חיבור מערכת תשלומים אמיתית (או בגרסה מופשטת להשקה).

## 6. Phase 5: AI & Polishing (Weeks 9-10)
- [ ] **Gemini Squad Engine**: אינטגרציה מלאה של ה-AI למתן טיפים וניתוח משחקים.
- [ ] **UI/UX Polish**: מעבר על כל ה-Animations וה-Glassmorphism לפי ה-Design System.
- [ ] **Beta Testing**: בדיקות משתמשים ותיקוני באגים (QA).

## 7. Next Steps Checklist (Immediate)
1. חיבור האפליקציה ל-Firebase (שימוש בכלי `set_up_firebase`).
2. המרת `userProfiles` מקובץ קבוע (Constants) לשליפה מ-Firestore.
3. בניית ה-Login Flow.
