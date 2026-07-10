import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import React, { useMemo, useState } from 'react';

import { SwipeHud } from './SwipeHud';

import { useItemGradient } from '@/features/shop/useCosmetics';
import { useLabels } from '@/shared/labels';
import type { PublicProfileDocument } from '@/shared/models';
import type { SwipeDirection } from '@/shared/enums';

// P3-T04 — the animated deck card. Drag right = like, drag left = skip
// (physical directions, independent of RTL). With prefers-reduced-motion the
// card is static and only the action buttons drive swipes (MOTION_AND_FX §7.1).
const DRAG_SWIPE_THRESHOLD_PX = 120;

interface SwipeCardProps {
  profile: PublicProfileDocument;
  exitDirection: SwipeDirection | null;
  disabled: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenProfile?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ profile, exitDirection, disabled, onSwipe, onOpenProfile }) => {
  const labels = useLabels();
  const borderGradient = useItemGradient(profile.avatarBorderItemId);
  const reducedMotion = useReducedMotion() ?? false;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const likeHintOpacity = useTransform(x, [40, DRAG_SWIPE_THRESHOLD_PX], [0, 1]);
  const skipHintOpacity = useTransform(x, [-DRAG_SWIPE_THRESHOLD_PX, -40], [1, 0]);

  const exitX = exitDirection === 'like' ? 480 : -480;

  // ADR-042 — media carousel: main photo first, then the gallery (photos +
  // gameplay videos). Stories-style: tap the right half for next, left for
  // previous (motion onTap, so drags never trigger it).
  const media = useMemo(() => {
    const gallery = profile.galleryMedia ?? [];
    return profile.profileImageUrl
      ? [{ id: 'main', type: 'image' as const, url: profile.profileImageUrl }, ...gallery]
      : gallery;
  }, [profile.profileImageUrl, profile.galleryMedia]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const active = media[Math.min(mediaIndex, media.length - 1)];
  // Suppress the click that fires after a real drag release — only near-zero
  // movement counts as a tap.
  const isTap = () => Math.abs(x.get()) < 6;

  return (
    <motion.div
      className="absolute inset-0 rounded-[40px] overflow-hidden shadow-2xl border-2 dark:border-white/10 border-gray-200 group bg-surface/20 backdrop-blur-md"
      style={reducedMotion ? undefined : { x, rotate }}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: exitX, rotate: exitX / 40 }}
      transition={reducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 28 }}
      drag={reducedMotion || disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > DRAG_SWIPE_THRESHOLD_PX) onSwipe('like');
        else if (info.offset.x < -DRAG_SWIPE_THRESHOLD_PX) onSwipe('skip');
      }}
    >
      {active ? (
        active.type === 'video' ? (
          <video
            key={active.id}
            src={active.url}
            muted
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={active.id}
            src={active.url}
            alt={profile.displayName}
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/60 via-surface to-background flex items-center justify-center">
          <span className="text-8xl font-black text-white/80">{profile.displayName.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

      {media.length > 1 && (
        <>
          <div className="absolute top-1.5 inset-x-8 z-30 flex gap-1.5 pointer-events-none" dir="ltr">
            {media.map((m, i) => (
              <span
                key={m.id}
                className={`h-1 flex-1 rounded-full transition-colors ${i === mediaIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-20"
            onClick={() => isTap() && setMediaIndex((i) => Math.max(0, i - 1))}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-20"
            onClick={() => isTap() && setMediaIndex((i) => Math.min(media.length - 1, i + 1))}
          />
        </>
      )}

      {!reducedMotion && (
        <>
          <motion.div
            style={{ opacity: likeHintOpacity }}
            className="absolute top-8 left-8 z-30 px-4 py-2 rounded-xl border-4 border-green-400 text-green-400 text-2xl font-black uppercase -rotate-12 pointer-events-none"
          >
            <i className="fa-solid fa-check"></i>
          </motion.div>
          <motion.div
            style={{ opacity: skipHintOpacity }}
            className="absolute top-8 right-8 z-30 px-4 py-2 rounded-xl border-4 border-danger text-danger text-2xl font-black uppercase rotate-12 pointer-events-none"
          >
            <i className="fa-solid fa-xmark"></i>
          </motion.div>
        </>
      )}

      {borderGradient && (
        <div
          className="absolute inset-0 rounded-[40px] pointer-events-none z-10"
          style={{
            padding: 3,
            background: borderGradient,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      <SwipeHud profile={profile} />

      {onOpenProfile && (
        <button
          onClick={() => isTap() && onOpenProfile()}
          aria-label={profile.displayName}
          className="absolute bottom-24 end-4 z-30 w-11 h-11 rounded-full bg-black/55 backdrop-blur text-white border border-white/20 hover:bg-primary transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-circle-info text-lg"></i>
        </button>
      )}

      <div className="absolute inset-0 p-8 flex flex-col justify-end text-right pointer-events-none">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center justify-end gap-2">
          {profile.verifiedBadge && (
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center shrink-0" title="Pro">
              <i className="fa-solid fa-check"></i>
            </span>
          )}
          <span>{profile.displayName}, {profile.age}</span>
        </h2>
        <p className="text-white/80 font-bold mb-6 line-clamp-2">{profile.bio}</p>

        <div className="flex flex-wrap gap-2 justify-end">
          {profile.platforms.map((platform) => (
            <span
              key={platform}
              className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase italic border border-white/10"
            >
              {labels.platform[platform]}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
