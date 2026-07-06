import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';
import type { LookingFor, Platform, SkillLevel, VoicePreference } from '@/shared/enums';
import type { GameCatalogDocument } from '@/shared/models';

// Client wrapper for the onboarding backend (API_CONTRACT §3.15).
export interface CompleteOnboardingPayload {
  profile: {
    displayName: string;
    age: number;
    bio: string;
    skillLevel: SkillLevel;
    platforms: Platform[];
  };
  game: {
    gameId: string;
    rank: string;
    lookingFor: LookingFor;
    lookingForText?: string;
    voicePreference?: VoicePreference;
  };
}

export const completeOnboarding = async (payload: CompleteOnboardingPayload): Promise<void> => {
  const { functions } = getFirebase();
  await httpsCallable(functions, 'completeOnboarding')(payload);
};

export const loadGameCatalog = async (): Promise<GameCatalogDocument[]> => {
  const { db } = getFirebase();
  const snapshot = await getDocs(
    query(collection(db, 'gameCatalog'), where('isActive', '==', true), orderBy('name')),
  );
  return snapshot.docs.map((d) => d.data() as GameCatalogDocument);
};
