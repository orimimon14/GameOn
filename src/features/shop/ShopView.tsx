import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { equipItem, loadShopItems, purchaseShopItem } from './shopApi';

import type { ShopItemCategory } from '@/shared/enums';
import type { ShopItemDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// P5-T06 — the real shop: catalog from Firestore, purchase/equip through the
// backend (coins are server-owned; userStore's live users/{uid} subscription
// reflects the new balance and inventory automatically).
type ShopStatus = 'loading' | 'ready' | 'error';
type CategoryFilter = 'all' | ShopItemCategory;

const isCallableError = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === `functions/${code}`;

const RARITY_STYLES: Record<string, string> = {
  common: 'bg-gray-400/20 text-gray-300',
  rare: 'bg-cyan-400/20 text-cyan-300',
  epic: 'bg-purple-400/20 text-purple-300',
  legendary: 'bg-yellow-400/20 text-yellow-300',
};

export const ShopView: React.FC = () => {
  const { t } = useTranslation();
  const userDoc = useUserStore((s) => s.userDoc);

  const [status, setStatus] = useState<ShopStatus>('loading');
  const [items, setItems] = useState<ShopItemDocument[]>([]);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadShopItems()
      .then((catalog) => {
        if (cancelled) return;
        setItems(catalog);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const coins = userDoc?.coins ?? 0;
  const owned = useMemo(() => new Set(userDoc?.ownedItemIds ?? []), [userDoc?.ownedItemIds]);
  const equipped = new Set(
    [
      userDoc?.avatarBorderItemId,
      userDoc?.globalBackgroundItemId,
      userDoc?.profileBannerItemId,
    ].filter(Boolean) as string[],
  );

  const visible = items.filter((item) => category === 'all' || item.category === category);

  const handlePurchase = async (item: ShopItemDocument) => {
    if (pendingItemId) return;
    setPendingItemId(item.itemId);
    setActionError(null);
    try {
      await purchaseShopItem(item.itemId);
    } catch (error) {
      if (isCallableError(error, 'resource-exhausted')) setActionError(t('shop.insufficientCoins'));
      else if (isCallableError(error, 'permission-denied')) setActionError(t('shop.proRequired'));
      else setActionError(t('shop.purchaseError'));
    } finally {
      setPendingItemId(null);
    }
  };

  const handleEquip = async (item: ShopItemDocument) => {
    if (pendingItemId) return;
    setPendingItemId(item.itemId);
    setActionError(null);
    try {
      await equipItem(item.itemId);
    } catch {
      setActionError(t('shop.equipError'));
    } finally {
      setPendingItemId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full relative z-10">
        <div
          role="status"
          aria-label={t('shop.loading')}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-triangle-exclamation text-7xl mb-6 text-danger"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('shop.error')}</h3>
      </div>
    );
  }

  const categories: Array<{ key: CategoryFilter; label: string }> = [
    { key: 'all', label: t('shop.filterAll') },
    { key: 'avatar_border', label: t('shop.filterBorders') },
    { key: 'global_background', label: t('shop.filterBackgrounds') },
    { key: 'profile_banner', label: t('shop.filterBanners') },
  ];

  return (
    <div className="p-6 pt-24 pb-32 overflow-y-auto h-full max-w-6xl mx-auto relative z-10 no-scrollbar">
      <div className="flex items-center justify-between mb-8 flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter">
            {t('shop.title')}
          </h2>
          <p className="dark:text-text-muted text-gray-500 font-bold">{t('shop.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/40 rounded-2xl px-5 py-3">
          <i className="fa-solid fa-coins text-yellow-400"></i>
          <span className="font-black text-xl dark:text-white text-text-inverse">{coins.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end mb-8 flex-wrap">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase transition-all ${
              category === key
                ? 'bg-primary text-white shadow-glow'
                : 'bg-white/10 dark:text-white text-text-inverse hover:bg-white/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="text-danger font-bold text-sm mb-6 text-center">
          {actionError}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-20 opacity-40">
          <p className="text-xl font-bold italic uppercase">{t('shop.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visible.map((item) => {
            const isOwned = owned.has(item.itemId);
            const isEquipped = equipped.has(item.itemId);
            const pending = pendingItemId === item.itemId;
            return (
              <div
                key={item.itemId}
                className="relative rounded-[24px] overflow-hidden border dark:border-white/10 border-gray-200 bg-surface/40 backdrop-blur-md p-4 flex flex-col"
              >
                <span
                  className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${RARITY_STYLES[item.rarity] ?? ''}`}
                >
                  {item.rarity}
                </span>
                {item.requiresPro && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-yellow-400 to-amber-500 text-black">
                    Pro
                  </span>
                )}

                <div
                  className="w-full aspect-square rounded-2xl mb-4"
                  style={{ background: item.style?.cssGradient ?? '#334155' }}
                />

                <h3 className="font-black text-lg italic uppercase dark:text-white text-text-inverse text-right">
                  {item.name}
                </h3>
                <p className="text-xs font-bold text-text-muted text-right mb-4">
                  {t(`shop.category.${item.category}`)}
                </p>

                <div className="mt-auto">
                  {isEquipped ? (
                    <div className="w-full py-2.5 rounded-xl bg-green-500/20 text-green-400 text-xs font-black uppercase text-center">
                      <i className="fa-solid fa-check ml-1"></i> {t('shop.equipped')}
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => void handleEquip(item)}
                      disabled={pending}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-primary text-white text-xs font-black uppercase transition-all disabled:opacity-50"
                    >
                      {t('shop.equip')}
                    </button>
                  ) : (
                    <button
                      onClick={() => void handlePurchase(item)}
                      disabled={pending}
                      className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-coins text-yellow-300"></i>
                      {item.priceCoins.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
