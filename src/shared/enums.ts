// Canonical enums — mirrors docs/architecture/DATA_MODEL.md §3 (ADR-003, ADR-004, ADR-010, ADR-011).
// English values only; UI labels live in src/shared/labels (per locale).
// Runtime value arrays are exported for Zod schemas and label-coverage tests (TC-X-002).

export const SKILL_LEVELS = ['beginner', 'intermediate', 'pro', 'elite'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const PLATFORMS = [
  'pc',
  'playstation_5',
  'playstation_4',
  'xbox_series_x',
  'xbox_one',
  'nintendo_switch',
  'mobile',
  'vr',
  'arcade',
  'other',
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const LOOKING_FOR = [
  'duo',
  'squad',
  'ranked_climb',
  'casual',
  'voice_chat',
  'no_voice_chat',
  'custom',
] as const;
export type LookingFor = (typeof LOOKING_FOR)[number];

export const SHOP_ITEM_CATEGORIES = ['avatar_border', 'profile_banner', 'global_background'] as const;
export type ShopItemCategory = (typeof SHOP_ITEM_CATEGORIES)[number];

export const SHOP_ITEM_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type ShopItemRarity = (typeof SHOP_ITEM_RARITIES)[number];

export const REPORT_REASONS = [
  'harassment',
  'hate_speech',
  'sexual_content',
  'scam_spam',
  'underage_concern',
  'cheating_exploits',
  'fake_profile',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const SUBSCRIPTION_TIERS = ['basic', 'pro'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const SUBSCRIPTION_STATUSES = [
  'none',
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const MATCH_STATUSES = ['pending', 'matched', 'blocked', 'archived'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MESSAGE_TYPES = ['text', 'image', 'system'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_STATUSES = ['sent', 'failed', 'deleted'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const VOICE_PREFERENCES = ['required', 'preferred', 'no_voice', 'flexible'] as const;
export type VoicePreference = (typeof VOICE_PREFERENCES)[number];

export const SWIPE_DIRECTIONS = ['like', 'skip'] as const;
export type SwipeDirection = (typeof SWIPE_DIRECTIONS)[number];

export const COIN_TRANSACTION_TYPES = [
  'item_purchase',
  'admin_grant',
  'signup_bonus',
  'refund',
  'system_adjustment',
] as const;
export type CoinTransactionType = (typeof COIN_TRANSACTION_TYPES)[number];

export const OWNED_ITEM_ACQUISITION_TYPES = ['coin_purchase', 'grant', 'subscription', 'admin'] as const;
export type OwnedItemAcquisitionType = (typeof OWNED_ITEM_ACQUISITION_TYPES)[number];

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const AI_REQUEST_TYPES = ['profile_optimization', 'squad_advice', 'match_insight'] as const;
export type AIRequestType = (typeof AI_REQUEST_TYPES)[number];

export const AI_REQUEST_STATUSES = ['pending', 'completed', 'failed', 'blocked'] as const;
export type AIRequestStatus = (typeof AI_REQUEST_STATUSES)[number];

export const MODERATION_STATES = ['clean', 'warned', 'restricted', 'suspended', 'banned'] as const;
export type ModerationState = (typeof MODERATION_STATES)[number];

export const BILLING_PROVIDERS = ['stripe', 'cardcom', 'meshulam', 'other'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const AUTH_PROVIDERS = ['google', 'password'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const COSMETIC_RENDER_TYPES = [
  'static_image',
  'lottie',
  'rive',
  'particle',
  'video',
  'sprite',
] as const;
export type CosmeticRenderType = (typeof COSMETIC_RENDER_TYPES)[number];
