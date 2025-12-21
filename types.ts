
export interface GamerProfile {
  id: number;
  name: string;
  age: number;
  image: string;
  bannerImage?: string;
  bio: string;
  games: { name: string; icon: string; lookingFor: string; }[];
  platforms: string[];
  skillLevel: 'קז\'ואל' | 'תחרותי' | 'מקצוען';
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
  isAnimated: boolean;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  animationClass?: string;
  category: 'Cyber' | 'Nature' | 'Space' | 'Abstract';
}

export interface Persona {
  image: string;
  name: string;
  age: number;
  title: string;
  motivation: string;
  needs: string;
  frustrations: string;
}

export interface Feature {
  epic: string;
  userStory: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
}

export interface GeneratedIdea {
  featureName: string;
  description: string;
  targetPersona: string;
}
