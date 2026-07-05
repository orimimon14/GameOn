import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Placeholder — the real onboarding flow lands in Phase 2 (P2-T04).
export const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-text gap-6 p-8 text-center">
      <h1 className="text-3xl font-black italic uppercase tracking-tighter">{t('onboarding.welcome')}</h1>
      <p className="text-text-muted font-bold max-w-sm">{t('onboarding.note')}</p>
      <Link
        to="/discover"
        className="px-10 py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-105 transition-all"
      >
        {t('onboarding.continueCta')}
      </Link>
    </div>
  );
};
