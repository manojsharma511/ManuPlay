export type GameCategory = 
  | 'Racing' 
  | 'Action' 
  | 'Puzzle' 
  | 'Sports' 
  | 'Arcade' 
  | 'Adventure' 
  | 'Strategy' 
  | 'Casual'
  | 'Board'
  | 'Trivia'
  | 'Multiplayer'
  | '2 Player';

export type GameOrientation = 'portrait' | 'landscape' | 'any';

export interface GameFAQ {
  question: string;
  answer: string;
}

export interface GameDefinition {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  tags: string[];
  thumbnailBg: string;
  accentColor: string;
  iconName: string;
  rating: number;
  plays: number;
  orientation: GameOrientation;
  engine: 'canvas' | 'phaser' | 'native';
  loadEngine?: () => Promise<any>;
  featured?: boolean;
  isNew?: boolean;
  trending?: boolean;
  offlineSupported?: boolean;
  multiplayerSupported?: boolean;
  manuCoinsReward?: number;
  sessionLength?: 'Quick (2-5 min)' | 'Medium (5-15 min)' | 'Long (15+ min)';
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  controls: {
    desktop: string[];
    mobile: string[];
  };
  // Extended SEO & Content fields
  seoTitle?: string;
  seoDescription?: string;
  howToPlay?: string[];
  features?: string[];
  faqs?: GameFAQ[];
  relatedGameSlugs?: string[];
  heroImage?: string;
  ogImage?: string;
}
