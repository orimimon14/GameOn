import type { Timestamp } from 'firebase/firestore';

import type {
  AuthProvider,
  CallStatus,
  CallType,
  CosmeticRenderType,
  LookingFor,
  MessageStatus,
  MessageType,
  ModerationState,
  Platform,
  SkillLevel,
  ShopItemCategory,
  ShopItemRarity,
  SubscriptionStatus,
  SubscriptionTier,
  SwipeDirection,
  VoicePreference,
} from '@/shared/enums';

// Canonical Firestore document types (client side) — derived 1:1 from
// docs/architecture/DATA_MODEL.md §4 (ADR-003). Server-owned fields are
// never written by the client (SECURITY §6); they appear here for reads.

// ADR-042 — profile media gallery item (users.galleryMedia, mirrored to
// publicProfiles). Files live at profileMedia/{uid}/{fileId}.
export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  filePath: string;
}

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
  galleryMedia?: GalleryMediaItem[];

  avatarBorderItemId?: string;
  globalBackgroundItemId?: string;
  profileBannerItemId?: string;

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
  galleryMedia?: GalleryMediaItem[];

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

// users/{uid}/swipes/{targetUid_gameId} — DATA_MODEL §4.5 (server-owned via submitSwipe)
export interface SwipeDocument {
  fromUid: string;
  toUid: string;
  gameId: string;

  direction: SwipeDirection;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// chats/{chatId} — DATA_MODEL §4.7 (metadata; created by submitSwipe with the match)
export interface ChatDocument {
  chatId: string;
  matchId: string;

  participants: [string, string];
  userA: string;
  userB: string;

  gameId: string;
  gameName: string;

  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageSenderId?: string;
  lastTimestamp?: Timestamp;

  unreadCounts?: Record<string, number>;
  lastReadAt?: Record<string, Timestamp>;

  isActive: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// chats/{chatId}/messages/{messageId} — DATA_MODEL §4.8 (text client-writable under rules)
export interface MessageDocument {
  messageId: string;
  chatId: string;

  senderId: string;

  type: MessageType;

  text?: string;

  fileUrl?: string;
  filePath?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;

  status: MessageStatus;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}

// chats/{chatId}/calls/{callId} — DATA_MODEL §4.23 (WebRTC signaling, participants-only)
export interface CallDocument {
  callId: string;
  chatId: string;

  callerUid: string;
  calleeUid: string;

  type: CallType;
  status: CallStatus;

  offer?: { type: string; sdp: string };
  answer?: { type: string; sdp: string };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// shopItems/{itemId} — DATA_MODEL §4.9 (admin/server writes only)
export interface ShopItemDocument {
  itemId: string;

  name: string;
  description?: string;

  category: ShopItemCategory;
  rarity: ShopItemRarity;

  themeTag?: string;

  priceCoins: number;

  previewUrl: string;
  assetUrl: string;

  style?: {
    cssGradient?: string;
    className?: string;
    animationClass?: string;
  };

  isAnimated: boolean;
  renderType: CosmeticRenderType;

  requiresPro?: boolean;
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
