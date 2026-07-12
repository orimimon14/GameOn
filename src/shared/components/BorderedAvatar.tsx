import React from 'react';

import { useItemGradient } from '@/features/shop/useCosmetics';

// Avatar with the user's equipped avatar-border cosmetic rendered as a
// gradient ring (P5 — purchases must be visible everywhere, not just the
// deck). Falls back to the primary color when nothing is equipped.
interface BorderedAvatarProps {
  imageUrl?: string;
  displayName: string;
  borderItemId?: string;
  sizeClass?: string; // tailwind w-/h- for the inner avatar
}

export const BorderedAvatar: React.FC<BorderedAvatarProps> = ({
  imageUrl,
  displayName,
  borderItemId,
  sizeClass = 'w-12 h-12',
}) => {
  const gradient = useItemGradient(borderItemId);

  return (
    <div
      className="rounded-full p-[3px] shrink-0"
      style={{ background: gradient ?? 'var(--color-primary, #6d5df6)' }}
    >
      <div
        className={`${sizeClass} rounded-full overflow-hidden border-2 border-background bg-primary/30 flex items-center justify-center`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-black text-lg">{displayName.charAt(0) || '?'}</span>
        )}
      </div>
    </div>
  );
};
