import type { EnumLabels } from './types';

// English labels — ADR-035 bidirectional support.
export const enLabels: EnumLabels = {
  skillLevel: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    pro: 'Pro',
    elite: 'Elite',
  },
  platform: {
    pc: 'PC',
    playstation_5: 'PlayStation 5',
    playstation_4: 'PlayStation 4',
    xbox_series_x: 'Xbox Series X',
    xbox_one: 'Xbox One',
    nintendo_switch: 'Nintendo Switch',
    mobile: 'Mobile',
    vr: 'VR',
    arcade: 'Arcade',
    other: 'Other',
  },
  lookingFor: {
    duo: 'Duo',
    squad: 'Squad',
    ranked_climb: 'Ranked Climb',
    casual: 'Casual',
    voice_chat: 'Voice Chat',
    no_voice_chat: 'No Voice Chat',
    custom: 'Custom',
  },
  voicePreference: {
    required: 'Mic required',
    preferred: 'Mic preferred',
    no_voice: 'No voice chat',
    flexible: 'Flexible',
  },
  shopItemCategory: {
    avatar_border: 'Avatar Border',
    profile_banner: 'Profile Banner',
    global_background: 'Global Background',
  },
  shopItemRarity: {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  },
  reportReason: {
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    sexual_content: 'Sexual Content',
    scam_spam: 'Scam or Spam',
    underage_concern: 'Underage Concern',
    cheating_exploits: 'Cheating or Exploits',
    fake_profile: 'Fake Profile',
    other: 'Other',
  },
};
