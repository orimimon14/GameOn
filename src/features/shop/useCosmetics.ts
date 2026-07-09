import { useEffect, useState } from 'react';

import { loadShopItems } from './shopApi';

import type { ShopItemDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// Resolves the signed-in user's EQUIPPED cosmetics to their visual styles —
// this is what makes purchases actually change the app (border ring, global
// background, profile banner). Catalog is cached module-wide.
let catalogCache: ShopItemDocument[] | null = null;
let catalogPromise: Promise<ShopItemDocument[]> | null = null;

const getCatalog = (): Promise<ShopItemDocument[]> => {
  if (catalogCache) return Promise.resolve(catalogCache);
  catalogPromise =
    catalogPromise ??
    loadShopItems().then((items) => {
      catalogCache = items;
      return items;
    });
  return catalogPromise;
};

export interface EquippedCosmetics {
  borderGradient?: string;
  backgroundGradient?: string;
  bannerGradient?: string;
}

export const useCosmetics = (): EquippedCosmetics => {
  const userDoc = useUserStore((s) => s.userDoc);
  const [catalog, setCatalog] = useState<ShopItemDocument[]>(catalogCache ?? []);

  useEffect(() => {
    if (!userDoc?.uid || catalogCache) return;
    let cancelled = false;
    void getCatalog()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userDoc?.uid]);

  const styleOf = (itemId?: string): string | undefined =>
    itemId ? catalog.find((i) => i.itemId === itemId)?.style?.cssGradient : undefined;

  return {
    borderGradient: styleOf(userDoc?.avatarBorderItemId),
    backgroundGradient: styleOf(userDoc?.globalBackgroundItemId),
    bannerGradient: styleOf(userDoc?.profileBannerItemId),
  };
};
