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

// FIX: Add Persona type definition to resolve error in components/PersonaCard.tsx
export interface Persona {
  image: string;
  name: string;
  age: number;
  title: string;
  motivation: string;
  needs: string;
  frustrations: string;
}

// FIX: Add Feature type definition to resolve error in components/FeatureTable.tsx
export interface Feature {
  epic: string;
  userStory: string;
  priority: 'High' | 'Medium' | 'Low';
}

// FIX: Add RoadmapItem type definition to resolve error in components/Roadmap.tsx
export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
}

// FIX: Add GeneratedIdea type definition to resolve error in components/GeminiFeatureIdeation.tsx
export interface GeneratedIdea {
  featureName: string;
  description: string;
  targetPersona: string;
}