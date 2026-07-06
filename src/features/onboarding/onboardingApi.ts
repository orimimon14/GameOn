import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';
import type { LookingFor, Platform, SkillLevel, VoicePreference } from '@/shared/enums';

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

// Catalog loading moved to shared (used by onboarding + discovery).
export { loadGameCatalog } from '@/shared/api/gameCatalog';
