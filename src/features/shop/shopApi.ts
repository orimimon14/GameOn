import { collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';
import type { ShopItemDocument } from '@/shared/models';

// P5 — shop data layer: catalog is read-only for clients (rules); purchase
// and equip are backend-authoritative callables (API_CONTRACT §3.2/§3.3).
export const loadShopItems = async (): Promise<ShopItemDocument[]> => {
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, 'shopItems'), where('isActive', '==', true)));
  return snap.docs
    .map((d) => d.data() as ShopItemDocument)
    .sort((a, b) => a.priceCoins - b.priceCoins);
};

export interface PurchaseResult {
  success: true;
  itemId: string;
  newCoinBalance: number;
  ownedItemIds: string[];
  transactionId: string;
}

export const purchaseShopItem = async (itemId: string): Promise<PurchaseResult> => {
  const { functions } = getFirebase();
  const response = await httpsCallable<{ itemId: string }, PurchaseResult>(
    functions,
    'purchaseShopItem',
  )({ itemId });
  return response.data;
};

export interface EquipResult {
  success: true;
  itemId: string;
  category: string;
  updatedCosmetics: Record<string, string>;
}

export const equipItem = async (itemId: string): Promise<EquipResult> => {
  const { functions } = getFirebase();
  const response = await httpsCallable<{ itemId: string }, EquipResult>(
    functions,
    'equipItem',
  )({ itemId });
  return response.data;
};
