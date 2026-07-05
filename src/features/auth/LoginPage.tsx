import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder — real Firebase Auth screens land in Phase 2 (P2-T02).
export const LoginPage: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-text gap-6 p-8 text-center">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter">Swish & Game</h1>
      <p className="text-text-muted font-bold max-w-sm">מסך ההתחברות ייבנה בשלב 2 (Firebase Auth). בינתיים אפשר להיכנס ישירות לאפליקציה.</p>
      <Link
        to="/discover"
        className="px-10 py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-105 transition-all"
      >
        כניסה לאפליקציה
      </Link>
    </div>
  );
};
