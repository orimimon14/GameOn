import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

import { completeOnboarding, loadGameCatalog } from './onboardingApi';

import { useAuthStore } from '@/features/auth/authStore';
import { AvatarCropModal } from '@/features/profile/AvatarCropModal';
import { updateMyBirthDate, uploadCroppedProfilePhoto, uploadProfilePhoto } from '@/features/profile/profileApi';
import { computeAgeFromBirthDate } from '@/shared/api/birthDate';
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
  const user = useAuthStore((s) => s.user);

  // Optional profile photo right in onboarding — new users otherwise land
  // in decks as letter avatars. Reuses the circular cropper.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  // Birth date replaces the raw age question — the public profile still
  // carries the derived age; the date itself is stored privately.
  const [birthDate, setBirthDate] = useState('');

  const onPickPhoto = (file: File | undefined) => {
    if (!file || !user || photoBusy) return;
    if (file.type && !file.type.startsWith('image/')) return setPhotoError(true);
    setPhotoError(false);
    setCropFile(file);
  };

  const uploadDirect = async (file: File) => {
    if (!user) return;
    setPhotoBusy(true);
    try {
      setPhotoUrl(await uploadProfilePhoto(user.uid, file));
    } catch {
      setPhotoError(true);
    } finally {
      setPhotoBusy(false);
    }
  };

  const [step, setStep] = useState<1 | 2>(1);
  const [catalog, setCatalog] = useState<GameCatalogDocument[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [basics, setBasics] = useState<BasicsInput | null>(null);

  // ADR-043 — pick as many games as you want; rank per game is optional.
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [ranks, setRanks] = useState<Record<string, string>>({});
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

  const toggleGame = (id: string) =>
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const onFinish = async () => {
    if (!basics) return;
    if (selectedGameIds.length === 0) return setStepTwoError('onboarding.errors.game');
    if (selectedGameIds.some((id) => (ranks[id] ?? '').trim().length > 50)) {
      return setStepTwoError('onboarding.errors.rank');
    }
    setStepTwoError(null);
    setSubmitError(false);
    setSubmitting(true);
    try {
      await completeOnboarding({
        profile: basics,
        games: selectedGameIds.map((id) => ({
          gameId: id,
          ...((ranks[id] ?? '').trim() ? { rank: ranks[id].trim() } : {}),
          lookingFor,
          ...(voicePreference ? { voicePreference } : {}),
        })),
      });
      // Best effort — the private account doc stores the exact date.
      if (user && birthDate) {
        void updateMyBirthDate(user.uid, birthDate).catch(() => undefined);
      }
      navigate('/discover');
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-text flex flex-col items-center p-6 overflow-y-auto overscroll-contain">
      <div className="w-full max-w-lg py-8">
        <p className="text-primary font-black text-sm uppercase tracking-widest mb-1">
          {t('onboarding.step', { current: step, total: 2 })}
        </p>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8">{t('onboarding.title')}</h1>

        {cropFile && user && (
          <AvatarCropModal
            file={cropFile}
            onCancel={() => setCropFile(null)}
            onSave={async (blob) => {
              const url = await uploadCroppedProfilePhoto(user.uid, blob);
              setPhotoUrl(url);
              setCropFile(null);
            }}
            onDecodeError={() => {
              const file = cropFile;
              setCropFile(null);
              if (file) void uploadDirect(file);
            }}
          />
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit(onBasicsSubmit)} className="flex flex-col gap-5" noValidate>
            <h2 className="text-xl font-bold text-text-muted">{t('onboarding.basicsTitle')}</h2>

            <div className="flex flex-col items-center gap-2">
              <label className="relative cursor-pointer group" aria-label={t('onboarding.addPhoto')}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/60 group-hover:border-primary transition-colors bg-surface flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : photoBusy ? (
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="fa-solid fa-camera text-2xl text-text-muted group-hover:text-primary transition-colors"></i>
                  )}
                </div>
                <span className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background">
                  <i className={`fa-solid ${photoUrl ? 'fa-pen' : 'fa-plus'} text-xs`}></i>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoBusy}
                  onChange={(e) => {
                    onPickPhoto(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              <p className="text-text-muted text-xs font-bold">{t('onboarding.photoHint')}</p>
              {photoError && (
                <p role="alert" className="text-text-danger text-sm">{t('onboarding.photoError')}</p>
              )}
            </div>

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
              <label htmlFor="birthDate" className="block text-sm font-bold text-text-muted mb-1.5">
                {t('onboarding.birthDate')}
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  const age = computeAgeFromBirthDate(e.target.value);
                  setValue('age', age ?? Number.NaN, { shouldValidate: true });
                }}
                className={`${inputClass} w-48`}
                dir="ltr"
              />
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
              <span className="block text-sm font-bold text-text-muted mb-2">{t('onboarding.chooseGames')}</span>
              {catalogError && <p role="alert" className="text-text-danger text-sm">{t('onboarding.catalogError')}</p>}
              {!catalog && !catalogError && <p className="text-text-muted text-sm">{t('onboarding.loadingCatalog')}</p>}
              {catalog && (
                <div className="grid grid-cols-3 gap-2">
                  {catalog.map((game) => {
                    const selected = selectedGameIds.includes(game.gameId);
                    return (
                      <button
                        key={game.gameId}
                        type="button"
                        onClick={() => toggleGame(game.gameId)}
                        className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-primary shadow-glow-primary' : 'border-white/10 hover:border-white/30'}`}
                      >
                        {game.coverUrl ? (
                          <img src={game.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-surface to-background" />
                        )}
                        <div className={`absolute inset-0 ${selected ? 'bg-primary/40' : 'bg-black/55'}`} />
                        <span className="relative z-10 text-white text-xs font-black px-1 leading-tight drop-shadow">{game.name}</span>
                        {selected && (
                          <span className="absolute top-1 end-1 z-10 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                            <i className="fa-solid fa-check"></i>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedGameIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="block text-sm font-bold text-text-muted">{t('onboarding.ranksTitle')}</span>
                {selectedGameIds.map((id) => {
                  const game = catalog?.find((g) => g.gameId === id);
                  return (
                    <div key={id} className="flex items-center gap-3 bg-surface/60 border border-white/10 rounded-xl px-3 py-2">
                      <input
                        aria-label={`${t('onboarding.rank')} — ${game?.name ?? id}`}
                        list={`rank-options-${id}`}
                        placeholder={t('onboarding.rankOptional')}
                        value={ranks[id] ?? ''}
                        onChange={(e) => setRanks((prev) => ({ ...prev, [id]: e.target.value }))}
                        className="flex-1 bg-transparent border-0 text-text focus:outline-none text-sm"
                      />
                      <datalist id={`rank-options-${id}`}>
                        {game?.supportedRanks?.map((r) => <option key={r} value={r} />)}
                      </datalist>
                      <span className="text-sm font-bold text-text shrink-0">{game?.name ?? id}</span>
                    </div>
                  );
                })}
              </div>
            )}

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
