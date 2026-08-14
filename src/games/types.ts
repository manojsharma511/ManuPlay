export type GameCategory = 
  | 'Racing' 
  | 'Action' 
  | 'Puzzle' 
  | 'Sports' 
  | 'Arcade' 
  | 'Adventure' 
  | 'Strategy' 
  | 'Casual';

export type GameOrientation = 'portrait' | 'landscape' | 'any';

export interface GameDefinition {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  tags: string[];
  thumbnailBg: string; // Gradient style for card artwork
  accentColor: string;
  iconName: string;
  rating: number;
  plays: number;
  orientation: GameOrientation;
  engine: 'canvas' | 'phaser' | 'native';
  featured?: boolean;
  isNew?: boolean;
  trending?: boolean;
  controls: {
    desktop: string[];
    mobile: string[];
  };
}
