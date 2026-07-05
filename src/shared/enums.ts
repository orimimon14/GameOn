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
