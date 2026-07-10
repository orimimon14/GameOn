import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  GALLERY_MAX_BASIC,
  GALLERY_MAX_PRO,
  galleryRejection,
  removeGalleryMedia,
  uploadGalleryMedia,
  type GalleryRejection,
} from './profileApi';

import { MediaLightbox } from '@/shared/components/MediaLightbox';
import type { GalleryMediaItem } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// ADR-042 — own-profile media gallery editor. Basic: up to 3 photos;
// Pro: up to 9 items including gameplay videos. Caps and the video Pro-gate
// are enforced by rules; this UI mirrors them for friendly errors.
const REJECTION_KEYS: Record<GalleryRejection, string> = {
  full: 'profile.gallery.full',
  video_pro_only: 'profile.gallery.videoProOnly',
  video_too_big: 'profile.gallery.videoTooBig',
  bad_type: 'profile.gallery.badType',
};

export const ProfileGallery: React.FC = () => {
  const { t } = useTranslation();
  const userDoc = useUserStore((s) => s.userDoc);
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [viewing, setViewing] = useState<GalleryMediaItem | null>(null);

  if (!userDoc) return null;
  const uid = userDoc.uid;
  const isPro = userDoc.isPro === true;
  const items: GalleryMediaItem[] = userDoc.galleryMedia ?? [];
  const max = isPro ? GALLERY_MAX_PRO : GALLERY_MAX_BASIC;

  const onPick = async (file: File | undefined) => {
    if (!file || busy) return;
    setErrorKey(null);
    setErrorDetail(null);
    const rejection = galleryRejection(file, items.length, isPro);
    if (rejection) {
      setErrorKey(REJECTION_KEYS[rejection]);
      return;
    }
    setBusy(true);
    try {
      await uploadGalleryMedia(uid, file, items);
    } catch (err) {
      setErrorKey('profile.gallery.uploadError');
      setErrorDetail(
        (err as { code?: string })?.code ?? (err instanceof Error ? err.message : 'unknown'),
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async (item: GalleryMediaItem) => {
    if (busy) return;
    setErrorKey(null);
    setBusy(true);
    try {
      await removeGalleryMedia(uid, item, items);
    } catch {
      setErrorKey('profile.gallery.uploadError');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {viewing && (
        <MediaLightbox type={viewing.type} url={viewing.url} onClose={() => setViewing(null)} />
      )}
      <div className="text-end mb-3">
        <h2 className="text-xl font-black italic uppercase text-text">
          {t('profile.gallery.title')}
          <span className="text-text-muted text-sm font-bold ms-3 not-italic normal-case">
            {t('profile.gallery.counter', { count: items.length, max })}
          </span>
        </h2>
        <p className="text-text-muted text-sm">{t('profile.gallery.subtitle')}</p>
      </div>

      {errorKey && (
        <p role="alert" className="text-danger font-bold text-sm mb-3 text-center">
          {t(errorKey)}
          {errorDetail && (
            <span dir="ltr" className="opacity-60 text-xs font-normal"> ({errorDetail})</span>
          )}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3" dir="rtl">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-surface/60"
          >
            <button
              onClick={() => setViewing(item)}
              aria-label={t('media.expand')}
              className="absolute inset-0 w-full h-full"
            >
              {item.type === 'video' ? (
                <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
            {item.type === 'video' && (
              <span className="absolute bottom-1.5 start-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center pointer-events-none">
                <i className="fa-solid fa-play"></i>
              </span>
            )}
            <button
              onClick={() => void onRemove(item)}
              disabled={busy}
              aria-label={t('profile.gallery.remove')}
              className="absolute top-1.5 end-1.5 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-danger transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        ))}

        {items.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label={t('profile.gallery.add')}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/20 text-text-muted hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <i className="fa-solid fa-plus text-2xl"></i>
            )}
            <span className="text-xs font-bold uppercase">{t('profile.gallery.add')}</span>
          </button>
        )}
      </div>

      {!isPro && (
        <p className="text-premium text-sm font-bold text-center mt-3">
          {t('profile.gallery.proHint')}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={isPro ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'}
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
    </div>
  );
};
