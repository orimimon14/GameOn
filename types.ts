
export interface GamerProfile {
  id: number;
  name: string;
  age: number;
  image: string;
  bannerImage?: string;
  avatarBorder?: string; // CSS background/gradient for the border
  bio: string;
  games: { name: string; icon: string; lookingFor: string; }[];
  platforms: string[];
  skillLevel: 'קז\'ואל' | 'תחרותי' | 'מקצוען';
  rank?: string;
}

export interface Message {
  id: number;
  text: string;
  senderId: number; // 0 for currentUser, others for other users
  timestamp: string;
}

export interface BackgroundItem {
  id: string;
  name: string;
  price: number;
  previewUrl: string;
  itemType: 'background' | 'avatar-border';
  isAnimated: boolean;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  animationClass?: string;
  category: 'Cyber' | 'Nature' | 'Space' | 'Abstract' | 'Borders';
}

