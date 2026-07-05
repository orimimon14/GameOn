import React from 'react';
import { Outlet } from 'react-router-dom';

// Route guard placeholder — real Firebase Auth enforcement lands in Phase 2 (P2-T02).
// Until then every visitor is treated as authenticated so the prototype stays usable.
export const RequireAuth: React.FC = () => {
  return <Outlet />;
};
