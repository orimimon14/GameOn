import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { RequireOnboarding } from './RequireOnboarding';

import type { UserDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';


const completedUser = { onboardingCompleted: true } as UserDocument;
const incompleteUser = { onboardingCompleted: false } as UserDocument;

const renderGuarded = () =>
  render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/onboarding" element={<div>onboarding-page</div>} />
        <Route element={<RequireOnboarding />}>
          <Route path="/app" element={<div>app-shell</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('RequireOnboarding', () => {
  it('shows a loader while the user doc is loading', () => {
    useUserStore.setState({ userDoc: null, status: 'loading' });
    renderGuarded();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('redirects to /onboarding when onboarding is incomplete', () => {
    useUserStore.setState({ userDoc: incompleteUser, status: 'ready' });
    renderGuarded();
    expect(screen.getByText('onboarding-page')).toBeInTheDocument();
    expect(screen.queryByText('app-shell')).not.toBeInTheDocument();
  });

  it('renders the shell when onboarding is complete', () => {
    useUserStore.setState({ userDoc: completedUser, status: 'ready' });
    renderGuarded();
    expect(screen.getByText('app-shell')).toBeInTheDocument();
  });
});
