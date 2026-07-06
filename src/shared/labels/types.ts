import type {
  LookingFor,
  Platform,
  ReportReason,
  ShopItemCategory,
  ShopItemRarity,
  SkillLevel,
  VoicePreference,
} from '@/shared/enums';

// Record<Enum, string> per field guarantees compile-time coverage of every enum value
// (LOCALIZATION §4.19). A missing key fails typecheck.
export interface EnumLabels {
  skillLevel: Record<SkillLevel, string>;
  platform: Record<Platform, string>;
  lookingFor: Record<LookingFor, string>;
  voicePreference: Record<VoicePreference, string>;
  shopItemCategory: Record<ShopItemCategory, string>;
  shopItemRarity: Record<ShopItemRarity, string>;
  reportReason: Record<ReportReason, string>;
}
