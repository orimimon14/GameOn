import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { signInWithEmail } from './authService';
import { useAuthStore } from './authStore';
import { LoginPage } from './LoginPage';

vi.mock('./authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./authService')>();
  return {
    ...actual,
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
  };
});

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    vi.clearAllMocks();
  });

  it('renders the login form in Hebrew by default', () => {
    renderLogin();
    expect(screen.getByText('התחברות')).toBeInTheDocument();
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחבר' })).toBeInTheDocument();
  });

  it('switches to signup mode', () => {
    renderLogin();
    fireEvent.click(screen.getByText('אין לך חשבון? הירשם'));
    expect(screen.getByText('הרשמה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הירשם' })).toBeInTheDocument();
  });

  it('shows Hebrew validation errors for invalid input (TC-AUTH-007)', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחבר' }));

    expect(await screen.findByText('כתובת אימייל לא תקינה')).toBeInTheDocument();
    expect(await screen.findByText('הסיסמה חייבת להכיל לפחות 6 תווים')).toBeInTheDocument();
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it('shows a safe Hebrew error when credentials are wrong (TC-AUTH-006 style)', async () => {
    (signInWithEmail as Mock).mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחבר' }));

    expect(await screen.findByText('אימייל או סיסמה שגויים')).toBeInTheDocument();
    expect(signInWithEmail).toHaveBeenCalledWith('user@test.com', 'secret123');
  });
});
