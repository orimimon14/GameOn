import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

import { completeOnboarding, loadGameCatalog } from './onboardingApi';

import { LOOKING_FOR, LookingFor, Platform, PLATFORMS, SKILL_LEVELS, VOICE_PREFERENCES, VoicePreference } from '@/shared/enums';
import { useLabels } from '@/shared/labels';
import type { GameCatalogDocument } from '@/shared/models';
// Step 1 uses the shared client-writable basics schema (also used by profile editing).
import { profileBasicsSchema as basicsSchema, ProfileBasicsInput as BasicsInput } from '@/shared/schemas/profileForm';
import { useUserStore } from '@/shared/store/userStore';

const inputClass =
  'w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors';
const chipClass = (active: boolean) =>
  `px-4 py-2 rounded-xl font-bold text-sm transition-all ${active ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface text-text-muted border border-white/10 hover:bg-surface-elevated'}`;

export const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const labels = useLabels();
  const userDoc = useUserStore((s) => s.userDoc);

  const [step, setStep] = useState<1 | 2>(1);
  const [catalog, setCatalog] = useState<GameCatalogDocument[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [basics, setBasics] = useState<BasicsInput | null>(null);

  const [gameId, setGameId] = useState('');
  const [rank, setRank] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor>('casual');
  const [voicePreference, setVoicePreference] = useState<VoicePreference | ''>('');
  const [stepTwoError, setStepTwoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: { displayName: '', bio: '', skillLevel: 'intermediate', platforms: [] },
  });
  const selectedPlatforms = watch('platforms');
  const selectedSkill = watch('skillLevel');

  useEffect(() => {
    loadGameCatalog().then(setCatalog, () => setCatalogError(true));
  }, []);

  if (userDoc?.onboardingCompleted) {
    return <Navigate to="/discover" replace />;
  }

  const togglePlatform = (platform: Platform) => {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    setValue('platforms', next, { shouldValidate: true });
  };

  const onBasicsSubmit = (values: BasicsInput) => {
    setBasics(values);
    setStep(2);
  };

  const selectedGame = catalog?.find((g) => g.gameId === gameId);

  const onFinish = async () => {
    if (!basics) return;
    if (!gameId) return setStepTwoError('onboarding.errors.game');
    if (!rank.trim() || rank.trim().length > 50) return setStepTwoError('onboarding.errors.rank');
    setStepTwoError(null);
    setSubmitError(false);
    setSubmitting(true);
    try {
      await completeOnboarding({
        profile: basics,
        game: {
          gameId,
          rank: rank.trim(),
          lookingFor,
          ...(voicePreference ? { voicePreference } : {}),
        },
      });
      navigate('/discover');
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-text flex flex-col items-center p-6 overflow-y-auto">
      <div className="w-full max-w-lg py-8">
        <p className="text-primary font-black text-sm uppercase tracking-widest mb-1">
          {t('onboarding.step', { current: step, total: 2 })}
        </p>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8">{t('onboarding.title')}</h1>

        {step === 1 && (
          <form onSubmit={handleSubmit(onBasicsSubmit)} className="flex flex-col gap-5" noValidate>
            <h2 className="text-xl font-bold text-text-muted">{t('onboarding.basicsTitle')}</h2>

            <div>
              <label htmlFor="displayName" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.displayName')}
              </label>
              <input id="displayName" {...register('displayName')} className={inputClass} />
              {errors.displayName?.message && (
                <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.displayName.message)}</p>
              )}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.age')}
              </label>
              <input id="age" type="number" inputMode="numeric" {...register('age', { valueAsNumber: true })} className={`${inputClass} w-28`} />
              {errors.age?.message && (
                <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.age.message)}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.bio')}
              </label>
              <textarea id="bio" rows={3} placeholder={t('onboarding.bioPlaceholder')} {...register('bio')} className={inputClass} />
              {errors.bio?.message && (
                <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.bio.message)}</p>
              )}
            </div>

            <div>
              <span className="block text-sm font-bold text-text-muted mb-2">{t('onboarding.skillLevel')}</span>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map((level) => (
                  <button key={level} type="button" onClick={() => setValue('skillLevel', level)} className={chipClass(selectedSkill === level)}>
                    {labels.skillLevel[level]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-bold text-text-muted mb-2">{t('onboarding.platforms')}</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <button key={platform} type="button" onClick={() => togglePlatform(platform)} className={chipClass(selectedPlatforms.includes(platform))}>
                    {labels.platform[platform]}
                  </button>
                ))}
              </div>
              {errors.platforms?.message && (
                <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.platforms.message)}</p>
              )}
            </div>

            <button type="submit" className="w-full py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-[1.02] transition-all mt-2">
              {t('onboarding.next')}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-text-muted">{t('onboarding.gameTitle')}</h2>

            <div>
              <span className="block text-sm font-bold text-text-muted mb-2">{t('onboarding.chooseGame')}</span>
              {catalogError && <p role="alert" className="text-text-danger text-sm">{t('onboarding.catalogError')}</p>}
              {!catalog && !catalogError && <p className="text-text-muted text-sm">{t('onboarding.loadingCatalog')}</p>}
              {catalog && (
                <div className="grid grid-cols-2 gap-2">
                  {catalog.map((game) => (
                    <button key={game.gameId} type="button" onClick={() => setGameId(game.gameId)} className={chipClass(gameId === game.gameId)}>
                      {game.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="rank" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.rank')}
              </label>
              <input id="rank" list="rank-options" placeholder={t('onboarding.rankPlaceholder')} value={rank} onChange={(e) => setRank(e.target.value)} className={inputClass} />
              <datalist id="rank-options">
                {selectedGame?.supportedRanks?.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>

            <div>
              <label htmlFor="lookingFor" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.lookingFor')}
              </label>
              <select id="lookingFor" value={lookingFor} onChange={(e) => setLookingFor(e.target.value as LookingFor)} className={inputClass}>
                {LOOKING_FOR.map((value) => (
                  <option key={value} value={value}>{labels.lookingFor[value]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="voice" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.voicePreference')}
              </label>
              <select id="voice" value={voicePreference} onChange={(e) => setVoicePreference(e.target.value as VoicePreference | '')} className={inputClass}>
                <option value="">{t('onboarding.noSelection')}</option>
                {VOICE_PREFERENCES.map((value) => (
                  <option key={value} value={value}>{labels.voicePreference[value]}</option>
                ))}
              </select>
            </div>

            {stepTwoError && <p role="alert" className="text-text-danger text-sm font-bold">{t(stepTwoError)}</p>}
            {submitError && <p role="alert" className="text-text-danger text-sm font-bold bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{t('onboarding.submitError')}</p>}

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl font-bold bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors">
                {t('onboarding.back')}
              </button>
              <button type="button" disabled={submitting} onClick={() => void onFinish()} className="flex-1 py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-[1.02] transition-all disabled:opacity-50">
                {submitting ? t('onboarding.submitting') : t('onboarding.finish')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
