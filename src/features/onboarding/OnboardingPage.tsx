import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder — the real onboarding flow lands in Phase 2 (P2-T04).
export const OnboardingPage: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-text gap-6 p-8 text-center">
      <h1 className="text-3xl font-black italic uppercase tracking-tighter">ברוכים הבאים!</h1>
      <p className="text-text-muted font-bold max-w-sm">תהליך ה-onboarding (פרטים אישיים + בחירת משחקים) ייבנה בשלב 2.</p>
      <Link
        to="/discover"
        className="px-10 py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-105 transition-all"
      >
        המשך ל-Discovery
      </Link>
    </div>
  );
};
