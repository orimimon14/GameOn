
import { GamerProfile, Message, BackgroundItem } from './types';

export const gamerProfiles: GamerProfile[] = [
  {
    id: 1,
    name: 'אורן',
    age: 22,
    image: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=1964&auto=format&fit=crop',
    bio: 'מחפש סקוואד רגוע לערב. בעיקר משחק Warzone אבל זורם גם על דברים אחרים.',
    games: [
      { name: 'Call of Duty: Warzone', icon: 'fa-crosshairs', lookingFor: 'מחפש סקוואד רגוע לערב, בעיקר Rebirth.' },
      { name: 'FIFA', icon: 'fa-futbol', lookingFor: 'מחפש יריבים למשחקי Pro Clubs.' },
    ],
    platforms: ['PlayStation 5', 'PC'],
    skillLevel: 'תחרותי',
  },
  {
    id: 2,
    name: 'יעל',
    age: 25,
    image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?q=80&w=2053&auto=format&fit=crop',
    bio: 'גיימרית קז\'ואל שאוהבת משחקי אינדי ו-co-op.',
    games: [
      { name: 'Minecraft', icon: 'fa-cube', lookingFor: 'מחברת שותפים לבניית עולם Survival ארוך טווח.' },
    ],
    platforms: ['PC', 'Nintendo Switch'],
    skillLevel: 'קז\'ואל',
  }
];

export const currentUserProfile: GamerProfile = {
    id: 0,
    name: 'ישראל ישראלי',
    age: 26,
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop',
    bannerImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    avatarBorder: 'linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)',
    bio: 'גיימר בנשמה, מחפש אנשים טובים למשחקים בערב.',
    games: [
      { name: 'Call of Duty: Warzone', icon: 'fa-crosshairs', lookingFor: 'משחק בעיקר בסופ"שים.' },
    ],
    platforms: ['PC', 'PlayStation 5'],
    skillLevel: 'תחרותי',
};

export const backgroundShopItems: BackgroundItem[] = [
  // --- BACKGROUNDS ---
  {
    id: 'color-1',
    name: 'Cyber Purple Neon',
    price: 850,
    previewUrl: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    itemType: 'background',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Cyber'
  },
  {
    id: 'color-2',
    name: 'Electric Cyan',
    price: 1500,
    previewUrl: 'linear-gradient(135deg, #22D3EE 0%, #0EA5E9 100%)',
    itemType: 'background',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'animate-pulse-slow',
    category: 'Cyber'
  },
  {
    id: 'color-3',
    name: 'Dark Matter',
    price: 400,
    previewUrl: '#0F172A',
    itemType: 'background',
    isAnimated: false,
    rarity: 'Common',
    category: 'Cyber'
  },
  {
    id: 'color-4',
    name: 'Deep Space Violet',
    price: 950,
    previewUrl: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    itemType: 'background',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Space'
  },

  // --- AVATAR BORDERS ---
  {
    id: 'border-1',
    name: 'Gold Royal Ring',
    price: 2500,
    previewUrl: 'linear-gradient(135deg, #F59E0B 0%, #78350F 100%)',
    itemType: 'avatar-border',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Borders'
  },
  {
    id: 'border-2',
    name: 'Neon Pulse Rose',
    price: 1200,
    previewUrl: 'linear-gradient(135deg, #F43F5E 0%, #881337 100%)',
    itemType: 'avatar-border',
    isAnimated: true,
    rarity: 'Epic',
    animationClass: 'animate-pulse-slow',
    category: 'Borders'
  },
  {
    id: 'border-3',
    name: 'Cyber Cyan Core',
    price: 900,
    previewUrl: 'linear-gradient(135deg, #22D3EE 0%, #0369A1 100%)',
    itemType: 'avatar-border',
    isAnimated: false,
    rarity: 'Rare',
    category: 'Borders'
  },
  {
    id: 'border-4',
    name: 'Poison Ivy Green',
    price: 600,
    previewUrl: 'linear-gradient(135deg, #10B981 0%, #064E3B 100%)',
    itemType: 'avatar-border',
    isAnimated: false,
    rarity: 'Rare',
    category: 'Borders'
  },
  {
    id: 'border-5',
    name: 'Common Gray Rim',
    price: 200,
    previewUrl: '#475569',
    itemType: 'avatar-border',
    isAnimated: false,
    rarity: 'Common',
    category: 'Borders'
  }
];

export const profilesWhoLikedUser: GamerProfile[] = [
    {...gamerProfiles[0], id: 101, name: 'רוני'},
    {...gamerProfiles[1], id: 102, name: 'שני'}
];
export const matchedProfiles: GamerProfile[] = [gamerProfiles[1]];
export const mockConversations: Record<number, Message[]> = {
  2: [
    { id: 1, text: "היי! רוצה לשחק?", senderId: 0, timestamp: "10:00" },
    { id: 2, text: "בטח, מתי?", senderId: 2, timestamp: "10:05" }
  ]
};
