import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { mapAuthErrorToI18nKey, signInWithEmail, signInWithGoogle, signUpWithEmail } from './authService';
import { useAuthStore } from './authStore';
import { LoginInput, loginSchema } from './loginSchema';

type Mode = 'login' | 'signup';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const [mode, setMode] = useState<Mode>('login');
  const [serverErrorKey, setServerErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (status === 'authenticated') {
    return <Navigate to="/discover" replace />;
  }

  const runAuthAction = async (action: () => Promise<unknown>) => {
    setServerErrorKey(null);
    setSubmitting(true);
    try {
      await action();
      // Redirect happens via the auth listener → status becomes 'authenticated'.
    } catch (error) {
      setServerErrorKey(mapAuthErrorToI18nKey(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (values: LoginInput) =>
    runAuthAction(() =>
      mode === 'login'
        ? signInWithEmail(values.email, values.password)
        : signUpWithEmail(values.email, values.password),
    );

  return (
    <div className="h-screen-dynamic w-full flex flex-col items-center justify-center bg-background text-text p-6 overflow-y-auto overscroll-contain">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-center mb-2">
          {t('common.appName')}
        </h1>
        <h2 className="text-xl font-bold text-text-muted text-center mb-8">
          {mode === 'login' ? t('auth.title') : t('auth.signupTitle')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-text-muted mb-1.5">
              {t('auth.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              {...register('email')}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary transition-colors"
            />
            {errors.email?.message && (
              <p role="alert" className="text-text-danger text-sm mt-1.5">
                {t(errors.email.message)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-text-muted mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              dir="ltr"
              {...register('password')}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary transition-colors"
            />
            {errors.password?.message && (
              <p role="alert" className="text-text-danger text-sm mt-1.5">
                {t(errors.password.message)}
              </p>
            )}
          </div>

          {serverErrorKey && (
            <p role="alert" className="text-text-danger text-sm font-bold bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              {t(serverErrorKey)}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : mode === 'login' ? (
              t('auth.submitLogin')
            ) : (
              t('auth.submitSignup')
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-text-subtle text-sm">{t('auth.or')}</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => runAuthAction(signInWithGoogle)}
          className="w-full py-4 rounded-2xl font-bold bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <i className="fa-brands fa-google text-premium"></i>
          {t('auth.googleCta')}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setServerErrorKey(null);
          }}
          className="w-full mt-6 text-text-muted hover:text-text font-bold text-sm transition-colors"
        >
          {mode === 'login' ? t('auth.switchToSignup') : t('auth.switchToLogin')}
        </button>
      </div>
    </div>
  );
};
