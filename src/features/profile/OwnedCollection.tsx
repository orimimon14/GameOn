import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { equipItem, loadShopItems } from '@/features/shop/shopApi';
import type { ShopItemDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// "My collection" on the profile — every purchased cosmetic, grouped by
// category, with one-tap switching. Equipping stays backend-authoritative
// (equipItem callable); the live users doc reflects the change instantly.
export const OwnedCollection: React.FC = () => {
  const { t } = useTranslation();
  const userDoc = useUserStore((s) => s.userDoc);

  const [catalog, setCatalog] = useState<ShopItemDocument[]>([]);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadShopItems()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const ownedIds = useMemo(() => new Set(userDoc?.ownedItemIds ?? []), [userDoc?.ownedItemIds]);
  const owned = catalog.filter((item) => ownedIds.has(item.itemId));
  const equippedIds = new Set(
    [
      userDoc?.avatarBorderItemId,
      userDoc?.globalBackgroundItemId,
      userDoc?.profileBannerItemId,
    ].filter(Boolean) as string[],
  );

  const handleEquip = async (item: ShopItemDocument) => {
    if (pendingItemId || equippedIds.has(item.itemId)) return;
    setPendingItemId(item.itemId);
    setError(false);
    try {
      await equipItem(item.itemId);
    } catch {
      setError(true);
    } finally {
      setPendingItemId(null);
    }
  };

  if (owned.length === 0) return null;

  const categories: Array<{ key: string; label: string }> = [
    { key: 'avatar_border', label: t('shop.category.avatar_border') },
    { key: 'global_background', label: t('shop.category.global_background') },
    { key: 'profile_banner', label: t('shop.category.profile_banner') },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-black italic uppercase text-text text-end mb-3">
        {t('profile.collection')}
      </h2>

      {error && (
        <p role="alert" className="text-danger font-bold text-sm mb-3 text-center">
          {t('shop.equipError')}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {categories.map(({ key, label }) => {
          const items = owned.filter((item) => item.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <p className="text-xs font-black uppercase text-text-muted text-end mb-2">{label}</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 justify-end flex-wrap">
                {items.map((item) => {
                  const isEquipped = equippedIds.has(item.itemId);
                  const pending = pendingItemId === item.itemId;
                  return (
                    <button
                      key={item.itemId}
                      onClick={() => void handleEquip(item)}
                      disabled={pending}
                      aria-label={item.name}
                      className={`relative w-20 shrink-0 rounded-2xl p-2 border transition-all ${
                        isEquipped
                          ? 'border-primary shadow-glow bg-primary/10'
                          : 'dark:border-white/10 border-gray-200 hover:border-primary/50 bg-surface/40'
                      } ${pending ? 'opacity-50' : ''}`}
                    >
                      <div
                        className="w-full aspect-square rounded-xl mb-1.5"
                        style={{ background: item.style?.cssGradient ?? '#334155' }}
                      />
                      <p className="text-[9px] font-black text-center dark:text-white text-text-inverse truncate">
                        {item.name}
                      </p>
                      {isEquipped && (
                        <span className="absolute -top-1.5 -start-1.5 w-5 h-5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center shadow-glow">
                          <i className="fa-solid fa-check"></i>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
