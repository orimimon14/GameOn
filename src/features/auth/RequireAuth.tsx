import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from './authStore';

// Route guard — unauthenticated users are sent to /login.
// Onboarding-completion gating is added in P2-T04.
export const RequireAuth: React.FC = () => {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-background">
        <i className="fa-solid fa-gamepad text-5xl text-primary animate-pulse" aria-label="loading"></i>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
