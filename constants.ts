
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
    bannerImage: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=2532&auto=format&fit=crop',
    bio: 'גיימר בנשמה, מחפש אנשים טובים למשחקים בערב.',
    games: [
      { name: 'Call of Duty: Warzone', icon: 'fa-crosshairs', lookingFor: 'משחק בעיקר בסופ"שים.' },
    ],
    platforms: ['PC', 'PlayStation 5'],
    skillLevel: 'תחרותי',
};

export const backgroundShopItems: BackgroundItem[] = [
  // --- CYBER ---
  {
    id: 'cyber-1',
    name: 'Cyber Neon City',
    price: 850,
    previewUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Cyber'
  },
  {
    id: 'cyber-2',
    name: 'Glitch Matrix',
    price: 1500,
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'animate-pulse-slow',
    category: 'Cyber'
  },
  {
    id: 'cyber-3',
    name: 'Cyber Alleyway',
    price: 400,
    previewUrl: 'https://images.unsplash.com/photo-1514467953516-778898144f7d?q=80&w=1932&auto=format&fit=crop',
    isAnimated: false,
    rarity: 'Common',
    category: 'Cyber'
  },

  // --- SPACE ---
  {
    id: 'space-1',
    name: 'Infinite Galaxy',
    price: 950,
    previewUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Space'
  },
  {
    id: 'space-2',
    name: 'Starship Bridge',
    price: 2200,
    previewUrl: 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=1974&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Epic',
    animationClass: 'bg-moving',
    category: 'Space'
  },
  {
    id: 'space-3',
    name: 'Mars Horizon',
    price: 350,
    previewUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1974&auto=format&fit=crop',
    isAnimated: false,
    rarity: 'Common',
    category: 'Space'
  },

  // --- ABSTRACT ---
  {
    id: 'abstract-1',
    name: 'Liquid Gold',
    price: 1200,
    previewUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Abstract'
  },
  {
    id: 'abstract-2',
    name: 'Vaporwave Sunset',
    price: 600,
    previewUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    isAnimated: false,
    rarity: 'Rare',
    category: 'Abstract'
  },
  {
    id: 'abstract-3',
    name: 'Prism Geometry',
    price: 800,
    previewUrl: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Epic',
    animationClass: 'animate-pulse-slow',
    category: 'Abstract'
  },

  // --- NATURE ---
  {
    id: 'nature-1',
    name: 'Cherry Blossom Rain',
    price: 1800,
    previewUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Nature'
  },
  {
    id: 'nature-2',
    name: 'Northern Lights',
    price: 1300,
    previewUrl: 'https://images.unsplash.com/photo-1531366930477-4f20958149b1?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Epic',
    animationClass: 'bg-moving',
    category: 'Nature'
  },
  {
    id: 'nature-3',
    name: 'Deep Forest',
    price: 300,
    previewUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop',
    isAnimated: false,
    rarity: 'Common',
    category: 'Nature'
  },
  {
    id: 'nature-4',
    name: 'Enchanted Waterfall',
    price: 2500,
    previewUrl: 'https://images.unsplash.com/photo-1433086566547-82d55d24a3f1?q=80&w=1974&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Nature'
  },

  // --- MORE ---
  {
    id: 'extra-1',
    name: 'Retro Arcade',
    price: 1100,
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Epic',
    animationClass: 'animate-pulse-slow',
    category: 'Cyber'
  },
  {
    id: 'extra-2',
    name: 'Steam Engine',
    price: 550,
    previewUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
    isAnimated: false,
    rarity: 'Rare',
    category: 'Abstract'
  },
  {
    id: 'extra-3',
    name: 'Dragon Lair',
    price: 3000,
    previewUrl: 'https://images.unsplash.com/photo-1577493379412-17724e3f126c?q=80&w=1964&auto=format&fit=crop',
    isAnimated: true,
    rarity: 'Legendary',
    animationClass: 'bg-moving',
    category: 'Abstract'
  }
];

// Seed some data for testing
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
