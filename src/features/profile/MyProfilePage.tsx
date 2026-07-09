import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OwnedCollection } from './OwnedCollection';
import { loadMyGames, updateMyProfile, uploadProfilePhoto } from './profileApi';

import { useAuthStore } from '@/features/auth/authStore';
import { useCosmetics } from '@/features/shop/useCosmetics';
import { Platform, PLATFORMS, SKILL_LEVELS } from '@/shared/enums';
import { useLabels } from '@/shared/labels';
import type { UserGameDocument } from '@/shared/models';
import { profileBasicsSchema, ProfileBasicsInput } from '@/shared/schemas/profileForm';
import { useUserStore } from '@/shared/store/userStore';


const inputClass =
  'w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors';
const chipClass = (active: boolean) =>
  `px-4 py-2 rounded-xl font-bold text-sm transition-all ${active ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface text-text-muted border border-white/10 hover:bg-surface-elevated'}`;

// Own-profile screen on canonical Firestore data (P2-T06).
// Edits go straight to users/{uid} (rules allow client-writable keys only);
// the onUserProfileUpdated trigger resyncs publicProfiles automatically.
export const MyProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const labels = useLabels();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserStore((s) => s.userDoc);
  const { bannerGradient } = useCosmetics();

  const [games, setGames] = useState<UserGameDocument[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const onPickPhoto = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!file.type.startsWith('image/') || file.size > 25 * 1024 * 1024) {
      setPhotoError(true);
      return;
    }
    setUploadingPhoto(true);
    setPhotoError(false);
    try {
      await uploadProfilePhoto(user.uid, file);
    } catch {
      setPhotoError(true);
    } finally {
      setUploadingPhoto(false);
    }
  };
  const [saveError, setSaveError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileBasicsInput>({ resolver: zodResolver(profileBasicsSchema) });
  const selectedPlatforms = watch('platforms') ?? [];
  const selectedSkill = watch('skillLevel');

  useEffect(() => {
    if (user) loadMyGames(user.uid).then(setGames, () => setGames([]));
  }, [user]);

  if (!userDoc) {
    return (
      <div className="h-full flex items-center justify-center">
        <i className="fa-solid fa-gamepad text-4xl text-primary animate-pulse" aria-label="loading"></i>
      </div>
    );
  }

  const startEditing = () => {
    reset({
      displayName: userDoc.displayName,
      age: userDoc.age,
      bio: userDoc.bio,
      skillLevel: userDoc.skillLevel,
      platforms: userDoc.platforms,
    });
    setSaveError(false);
    setIsEditing(true);
  };

  const togglePlatform = (platform: Platform) => {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    setValue('platforms', next, { shouldValidate: true });
  };

  const onSave = async (values: ProfileBasicsInput) => {
    if (!user) return;
    setSaving(true);
    setSaveError(false);
    try {
      await updateMyProfile(user.uid, values);
      setIsEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32 pt-24 px-6 relative z-10 no-scrollbar">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {bannerGradient && (
          <div className="w-full h-24 rounded-3xl mb-6" style={{ background: bannerGradient }} />
        )}

        <div className="flex justify-center -mt-2 mb-6">
          <label className="relative cursor-pointer group" aria-label={t('profile.changePhoto')}>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-glow bg-primary/30 flex items-center justify-center">
              {userDoc?.profileImageUrl ? (
                <img src={userDoc.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-4xl">{(userDoc?.displayName ?? '?').charAt(0)}</span>
              )}
            </div>
            <span className="absolute bottom-0 end-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background group-hover:scale-110 transition-transform">
              {uploadingPhoto ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="fa-solid fa-camera text-sm"></i>
              )}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => void onPickPhoto(e.target.files?.[0])}
            />
          </label>
        </div>
        {photoError && (
          <p role="alert" className="text-danger font-bold text-sm mb-4 text-center">{t('profile.photoError')}</p>
        )}

        {!isEditing && (
          <>
            <div className="flex items-start justify-between">
              <button
                onClick={startEditing}
                className="px-5 py-2.5 rounded-xl font-bold bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors"
              >
                <i className="fa-solid fa-pen me-2 text-primary"></i>
                {t('profile.edit')}
              </button>
              <div className="text-end">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-text">{userDoc.displayName}</h1>
                <p className="text-primary text-lg font-bold">{userDoc.age}</p>
              </div>
            </div>

            {userDoc.bio && <p className="text-text-muted text-lg text-end leading-relaxed">{userDoc.bio}</p>}

            <div className="flex flex-wrap gap-2 justify-end">
              <span className={chipClass(true)}>{labels.skillLevel[userDoc.skillLevel]}</span>
              {userDoc.platforms?.map((p) => (
                <span key={p} className={chipClass(false)}>{labels.platform[p]}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/60 rounded-2xl border border-white/10 p-5 text-center">
                <p className="text-text-muted text-xs font-bold uppercase mb-1">{t('profile.coins')}</p>
                <p className="text-premium text-2xl font-black">
                  <i className="fa-solid fa-coins me-2"></i>
                  {userDoc.coins}
                </p>
              </div>
              <div className="bg-surface/60 rounded-2xl border border-white/10 p-5 text-center">
                <p className="text-text-muted text-xs font-bold uppercase mb-1">{userDoc.email}</p>
                <p className={`text-2xl font-black ${userDoc.isPro ? 'text-premium' : 'text-text'}`}>
                  {userDoc.isPro ? t('profile.tierPro') : t('profile.tierBasic')}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black italic uppercase text-text text-end mb-3">{t('profile.myGames')}</h2>
              {games === null && <p className="text-text-muted text-end text-sm">…</p>}
              {games?.length === 0 && <p className="text-text-muted text-end">{t('profile.noGames')}</p>}
              <div className="flex flex-col gap-3">
                {games?.map((game) => (
                  <div key={game.gameId} className="bg-surface/60 rounded-2xl border border-white/10 p-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-black">{game.rank}</span>
                    <div className="text-end">
                      <p className="text-text font-bold">{game.name}</p>
                      <p className="text-text-muted text-sm">{labels.lookingFor[game.lookingFor]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <OwnedCollection />
          </>
        )}

        {isEditing && (
          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-5" noValidate>
            <h1 className="text-2xl font-black italic uppercase text-text text-end">{t('profile.edit')}</h1>

            <div>
              <label htmlFor="p-displayName" className="block text-sm font-bold text-text-muted mb-1.5">{t('onboarding.displayName')}</label>
              <input id="p-displayName" {...register('displayName')} className={inputClass} />
              {errors.displayName?.message && <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.displayName.message)}</p>}
            </div>

            <div>
              <label htmlFor="p-age" className="block text-sm font-bold text-text-muted mb-1.5">{t('onboarding.age')}</label>
              <input id="p-age" type="number" inputMode="numeric" {...register('age', { valueAsNumber: true })} className={`${inputClass} w-28`} />
              {errors.age?.message && <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.age.message)}</p>}
            </div>

            <div>
              <label htmlFor="p-bio" className="block text-sm font-bold text-text-muted mb-1.5">{t('onboarding.bio')}</label>
              <textarea id="p-bio" rows={3} {...register('bio')} className={inputClass} />
              {errors.bio?.message && <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.bio.message)}</p>}
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
              {errors.platforms?.message && <p role="alert" className="text-text-danger text-sm mt-1">{t(errors.platforms.message)}</p>}
            </div>

            {saveError && <p role="alert" className="text-text-danger text-sm font-bold bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{t('profile.saveError')}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-4 rounded-2xl font-bold bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors">
                {t('profile.cancel')}
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-[1.02] transition-all disabled:opacity-50">
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
