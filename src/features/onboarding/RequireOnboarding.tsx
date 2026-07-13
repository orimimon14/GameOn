import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useUserStore } from '@/shared/store/userStore';

// Blocks the app shell until onboarding is completed (MIGRATION_PLAN §2.3).
// Sits inside RequireAuth, so the user is already authenticated here.
export const RequireOnboarding: React.FC = () => {
  const status = useUserStore((s) => s.status);
  const userDoc = useUserStore((s) => s.userDoc);

  if (status !== 'ready') {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-background">
        <i className="fa-solid fa-gamepad text-5xl text-primary animate-pulse" aria-label="loading"></i>
      </div>
    );
  }

  if (!userDoc?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
