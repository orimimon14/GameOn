import { render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useAuthStore } from './authStore';
import { RequireAuth } from './RequireAuth';

const testUser = { uid: 'test-uid' } as unknown as User;

const renderGuarded = () =>
  render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/secret" element={<div>secret-content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('RequireAuth', () => {
  it('shows a loader while auth state is resolving', () => {
    useAuthStore.setState({ user: null, status: 'loading' });
    renderGuarded();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
    expect(screen.queryByText('secret-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    renderGuarded();
    expect(screen.getByText('login-page')).toBeInTheDocument();
    expect(screen.queryByText('secret-content')).not.toBeInTheDocument();
  });

  it('renders the protected content for authenticated users', () => {
    useAuthStore.setState({ user: testUser, status: 'authenticated' });
    renderGuarded();
    expect(screen.getByText('secret-content')).toBeInTheDocument();
  });
});
