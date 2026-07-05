import type { Timestamp } from 'firebase/firestore';

import type {
  AuthProvider,
  LookingFor,
  ModerationState,
  Platform,
  SkillLevel,
  SubscriptionStatus,
  SubscriptionTier,
  VoicePreference,
} from '@/shared/enums';

// Canonical Firestore document types (client side) — derived 1:1 from
// docs/architecture/DATA_MODEL.md §4 (ADR-003). Server-owned fields are
// never written by the client (SECURITY §6); they appear here for reads.

// users/{uid} — DATA_MODEL §4.1
export interface UserDocument {
  uid: string;

  displayName: string;
  email: string;

  age: number;
  bio: string;
  preferredLocale?: 'he' | 'en';
  skillLevel: SkillLevel;
  platforms: Platform[];

  onboardingCompleted: boolean;
  isDiscoverable: boolean;

  profileImageUrl?: string;
  bannerImageUrl?: string;

  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  coins: number;

  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: Timestamp;
  isPro: boolean;

  ownedItemIds?: string[];

  isSuspended: boolean;
  isDeleted: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}

// users/{uid}/private/account — DATA_MODEL §4.2
export interface PrivateAccountDocument {
  email: string;
  authProvider: AuthProvider;

  paymentCustomerId?: string;

  birthDate?: string;
  country?: string;
  locale?: string;

  moderationState: ModerationState;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// publicProfiles/{uid} — DATA_MODEL §4.3 (server-owned read model for discovery)
export interface PublicProfileDocument {
  uid: string;

  displayName: string;
  age: number;
  bio: string;
  skillLevel: SkillLevel;
  platforms: Platform[];

  profileImageUrl?: string;
  bannerImageUrl?: string;

  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;

  isPro: boolean;
  verifiedBadge: boolean;

  gameIds: string[];
  primaryGameId?: string;
  primaryRank?: string;

  isDiscoverable: boolean;
  isSuspended: boolean;
  isDeleted: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}

// users/{uid}/games/{gameId} — DATA_MODEL §4.4
export interface UserGameDocument {
  gameId: string;

  name: string;
  iconUrl?: string;

  rank: string;
  rankNormalized?: string;
  rankScore?: number;

  lookingFor: LookingFor;
  lookingForText?: string;

  preferredMode?: string;
  voicePreference?: VoicePreference;

  isActive: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// gameCatalog/{gameId} — DATA_MODEL §4.8 (curated, admin/server writes only — ADR-019)
export interface GameCatalogDocument {
  gameId: string;

  name: string;
  slug: string;

  iconUrl?: string;
  coverUrl?: string;

  supportedRanks?: string[];
  rankOrder?: Record<string, number>;

  isActive: boolean;
  isFeatured: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
