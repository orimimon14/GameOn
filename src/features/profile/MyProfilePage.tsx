import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { AvatarCropModal } from './AvatarCropModal';
import { OwnedCollection } from './OwnedCollection';
import { ProfileCompletenessCard } from './ProfileCompletenessCard';
import { ProfileGallery } from './ProfileGallery';
import { addGameToProfile, loadMyGames, removeGameFromProfile, updateGameRank, updateMyProfile, uploadCroppedProfilePhoto, uploadProfilePhoto } from './profileApi';
import type { CompletenessItem } from './profileCompleteness';

import { useAuthStore } from '@/features/auth/authStore';
import { useCosmetics } from '@/features/shop/useCosmetics';
import { loadGameCatalog } from '@/shared/api/gameCatalog';
import { LOOKING_FOR, LookingFor, Platform, PLATFORMS, SKILL_LEVELS } from '@/shared/enums';
import { useLabels } from '@/shared/labels';
import type { GameCatalogDocument, UserGameDocument } from '@/shared/models';
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
  const { bannerGradient, borderGradient } = useCosmetics();

  const [games, setGames] = useState<UserGameDocument[] | null>(null);
  // Settings' "edit profile" entry deep-links here with ?edit=1.
  const [searchParams, setSearchParams] = useSearchParams();
  // ADR-043 — add/remove games from the profile.
  const [catalog, setCatalog] = useState<GameCatalogDocument[]>([]);
  const [addingGame, setAddingGame] = useState(false);
  const [newGameId, setNewGameId] = useState('');
  const [newGameRank, setNewGameRank] = useState('');
  const [newGameLookingFor, setNewGameLookingFor] = useState<LookingFor>('casual');
  const [gameActionError, setGameActionError] = useState(false);
  const [gameBusy, setGameBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // null = no error; otherwise a short technical detail shown alongside the
  // message so remote debugging from a screenshot is possible.
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Picking a photo opens the circular cropper; the crop result uploads as
  // a ready square JPEG. Undecodable formats fall back to the direct path.
  const [cropFile, setCropFile] = useState<File | null>(null);
  // Completeness card actions: jump straight to the fix.
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const galleryPickerRef = React.useRef<(() => void) | null>(null);
  const gamesSectionRef = React.useRef<HTMLDivElement>(null);
  // Inline rank editing on existing games (also the 'rank' completeness fix).
  const [editingRankId, setEditingRankId] = useState<string | null>(null);
  const [rankDraft, setRankDraft] = useState('');

  const saveRank = async (gameId: string) => {
    if (!user) return;
    const rank = rankDraft.trim();
    setEditingRankId(null);
    if (!rank) return;
    try {
      await updateGameRank(user.uid, gameId, rank);
      setGames((prev) => prev?.map((g) => (g.gameId === gameId ? { ...g, rank } : g)) ?? null);
    } catch {
      setGameActionError(true);
    }
  };

  const handleFix = (item: CompletenessItem) => {
    if (item === 'photo') avatarInputRef.current?.click();
    else if (item === 'bio') startEditing();
    else if (item === 'gallery') galleryPickerRef.current?.();
    else if (item === 'games') {
      setAddingGame(true);
      gamesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (item === 'rank') {
      const rankless = games?.find((g) => !(g.rank ?? '').trim());
      if (rankless) {
        setEditingRankId(rankless.gameId);
        setRankDraft('');
        gamesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const onPickPhoto = (file: File | undefined) => {
    if (!file || !user) return;
    // Camera captures may come with an empty MIME type — let decode decide.
    if (file.type && !file.type.startsWith('image/')) {
      setPhotoError(file.type);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPhotoError(`${Math.round(file.size / 1024 / 1024)}MB`);
      return;
    }
    setPhotoError(null);
    setCropFile(file);
  };

  const uploadDirect = async (file: File) => {
    if (!user) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      await uploadProfilePhoto(user.uid, file);
    } catch (err) {
      setPhotoError(
        (err as { code?: string })?.code ?? (err instanceof Error ? err.message : 'unknown'),
      );
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
    loadGameCatalog().then(setCatalog, () => undefined);
  }, [user]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && userDoc && !isEditing) {
      startEditing();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the doc is ready
  }, [searchParams, userDoc]);

  const gameName = (game: UserGameDocument) =>
    game.name ?? catalog.find((c) => c.gameId === game.gameId)?.name ?? game.gameId;
  const availableGames = catalog.filter((c) => !games?.some((g) => g.gameId === c.gameId));

  const onAddGame = async () => {
    if (!user || !newGameId || gameBusy) return;
    setGameBusy(true);
    setGameActionError(false);
    try {
      await addGameToProfile(user.uid, newGameId, {
        rank: newGameRank.trim() || undefined,
        lookingFor: newGameLookingFor,
      });
      setGames(await loadMyGames(user.uid));
      setAddingGame(false);
      setNewGameId('');
      setNewGameRank('');
    } catch {
      setGameActionError(true);
    } finally {
      setGameBusy(false);
    }
  };

  const onRemoveGame = async (gameId: string) => {
    if (!user || gameBusy) return;
    setGameBusy(true);
    setGameActionError(false);
    try {
      await removeGameFromProfile(user.uid, gameId);
      setGames((prev) => prev?.filter((g) => g.gameId !== gameId) ?? null);
    } catch {
      setGameActionError(true);
    } finally {
      setGameBusy(false);
    }
  };

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
      {cropFile && user && (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onSave={async (blob) => {
            await uploadCroppedProfilePhoto(user.uid, blob);
            setCropFile(null);
          }}
          onDecodeError={() => {
            const file = cropFile;
            setCropFile(null);
            void uploadDirect(file);
          }}
        />
      )}
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {bannerGradient && (
          <div className="w-full h-24 rounded-3xl mb-6" style={{ background: bannerGradient }} />
        )}

        <div className="flex justify-center -mt-2 mb-6">
          <label className="relative cursor-pointer group" aria-label={t('profile.changePhoto')}>
            {/* Equipped avatar-border cosmetic as a gradient ring (P5). */}
            <div
              className="rounded-full p-1 shadow-glow"
              style={{ background: borderGradient ?? 'var(--color-primary, #6d5df6)' }}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-background bg-primary/30 flex items-center justify-center">
                {userDoc?.profileImageUrl ? (
                  <img src={userDoc.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-4xl">{(userDoc?.displayName ?? '?').charAt(0)}</span>
                )}
              </div>
            </div>
            <span className="absolute bottom-0 end-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background group-hover:scale-110 transition-transform">
              {uploadingPhoto ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="fa-solid fa-camera text-sm"></i>
              )}
            </span>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => {
                onPickPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {photoError && (
          <p role="alert" className="text-danger font-bold text-sm mb-4 text-center">
            {t('profile.photoError')}{' '}
            <span dir="ltr" className="opacity-60 text-xs font-normal">({photoError})</span>
          </p>
        )}

        {!isEditing && (
          <>
            <ProfileCompletenessCard userDoc={userDoc} games={games} onFix={handleFix} />

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

            <div ref={gamesSectionRef}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => { setAddingGame((v) => !v); setGameActionError(false); }}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors"
                >
                  <i className="fa-solid fa-plus me-2 text-primary"></i>
                  {t('profile.addGame')}
                </button>
                <h2 className="text-xl font-black italic uppercase text-text text-end">{t('profile.myGames')}</h2>
              </div>

              {addingGame && (
                <div className="bg-surface/60 rounded-2xl border border-primary/30 p-4 mb-3 flex flex-col gap-3">
                  <select
                    aria-label={t('profile.addGamePick')}
                    value={newGameId}
                    onChange={(e) => setNewGameId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('profile.addGamePick')}</option>
                    {availableGames.map((g) => (
                      <option key={g.gameId} value={g.gameId}>{g.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      aria-label={t('onboarding.rank')}
                      list="add-game-ranks"
                      placeholder={t('profile.addGameRank')}
                      value={newGameRank}
                      onChange={(e) => setNewGameRank(e.target.value)}
                      className={inputClass}
                    />
                    <datalist id="add-game-ranks">
                      {catalog.find((c) => c.gameId === newGameId)?.supportedRanks?.map((r) => <option key={r} value={r} />)}
                    </datalist>
                    <select
                      aria-label={t('onboarding.lookingFor')}
                      value={newGameLookingFor}
                      onChange={(e) => setNewGameLookingFor(e.target.value as LookingFor)}
                      className={inputClass}
                    >
                      {LOOKING_FOR.map((value) => (
                        <option key={value} value={value}>{labels.lookingFor[value]}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => void onAddGame()}
                    disabled={!newGameId || gameBusy}
                    className="py-3 rounded-xl font-black italic uppercase bg-primary text-white shadow-glow-primary disabled:opacity-50"
                  >
                    {gameBusy ? t('profile.saving') : t('profile.addGameConfirm')}
                  </button>
                </div>
              )}

              <datalist id="add-game-ranks-inline">
                {(editingRankId ? catalog.find((c) => c.gameId === editingRankId)?.supportedRanks : [])?.map((r) => <option key={r} value={r} />)}
              </datalist>

              {gameActionError && (
                <p role="alert" className="text-danger font-bold text-sm mb-3 text-center">{t('profile.gameActionError')}</p>
              )}

              {games === null && <p className="text-text-muted text-end text-sm">…</p>}
              {games?.length === 0 && <p className="text-text-muted text-end">{t('profile.noGames')}</p>}
              <div className="flex flex-col gap-3">
                {games?.map((game) => (
                  <div key={game.gameId} className="bg-surface/60 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void onRemoveGame(game.gameId)}
                        disabled={gameBusy}
                        aria-label={`${t('profile.removeGame')} — ${gameName(game)}`}
                        className="w-8 h-8 rounded-full text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                      {editingRankId === game.gameId ? (
                        <input
                          autoFocus
                          value={rankDraft}
                          placeholder={t('profile.addGameRank')}
                          list="add-game-ranks-inline"
                          onChange={(e) => setRankDraft(e.target.value)}
                          onBlur={() => void saveRank(game.gameId)}
                          onKeyDown={(e) => e.key === 'Enter' && void saveRank(game.gameId)}
                          className="w-32 bg-surface border border-primary/40 rounded-lg px-2 py-1 text-sm text-text focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingRankId(game.gameId); setRankDraft(game.rank ?? ''); }}
                          aria-label={`${t('profile.editRank')} — ${gameName(game)}`}
                          className={`px-3 py-1 rounded-lg text-sm font-black transition-colors ${(game.rank ?? '').trim() ? 'bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25' : 'border border-dashed border-white/20 text-text-muted hover:border-primary hover:text-primary'}`}
                        >
                          {(game.rank ?? '').trim() || `+ ${t('profile.addGameRank')}`}
                        </button>
                      )}
                    </div>
                    <div className="text-end">
                      <p className="text-text font-bold">{gameName(game)}</p>
                      <p className="text-text-muted text-sm">{labels.lookingFor[game.lookingFor]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ProfileGallery registerOpenPicker={(open) => { galleryPickerRef.current = open; }} />

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
