import type { EnumLabels } from './types';

// Canonical Hebrew labels — docs/design/LOCALIZATION.md §4.
export const heLabels: EnumLabels = {
  skillLevel: {
    beginner: 'מתחיל',
    intermediate: 'בינוני',
    pro: 'מקצוען',
    elite: 'עילית',
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
    other: 'אחר',
  },
  lookingFor: {
    duo: 'Duo',
    squad: 'Squad',
    ranked_climb: 'עלייה בדירוג',
    casual: 'משחק רגוע',
    voice_chat: 'עם צ׳אט קולי',
    no_voice_chat: 'בלי צ׳אט קולי',
    custom: 'מותאם אישית',
  },
  voicePreference: {
    required: 'חובה מיקרופון',
    preferred: 'עדיף מיקרופון',
    no_voice: 'בלי צ׳אט קולי',
    flexible: 'גמיש',
  },
  shopItemCategory: {
    avatar_border: 'מסגרת לאווטאר',
    profile_banner: 'באנר לפרופיל',
    global_background: 'רקע גלובלי',
  },
  shopItemRarity: {
    common: 'רגיל',
    rare: 'נדיר',
    epic: 'אפי',
    legendary: 'אגדי',
  },
  reportReason: {
    harassment: 'הטרדה',
    hate_speech: 'שיח שנאה',
    sexual_content: 'תוכן מיני',
    scam_spam: 'הונאה או ספאם',
    underage_concern: 'חשש לקטין',
    cheating_exploits: 'צ׳יטים או ניצול פרצות',
    fake_profile: 'פרופיל מזויף',
    other: 'אחר',
  },
};
