import type { GameDefinition } from './types';

export const GAMES_CATALOG: GameDefinition[] = [
  {
    id: 'neon-drift',
    slug: 'neon-drift',
    title: 'Neon Drift',
    tagline: 'High-speed cyberpunk highway racing with instant nitro boosts.',
    description: 'Hit the neon-drenched highway at night! Dodge speeding traffic, collect energy power-ups, boost through speed traps, and see how long you can survive the endless drift.',
    category: 'Racing',
    tags: ['Cyberpunk', 'High Speed', 'Nitro', 'Highway', 'Landscape'],
    thumbnailBg: 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)',
    accentColor: '#00f0ff',
    iconName: 'Zap',
    rating: 4.9,
    plays: 142500,
    orientation: 'landscape',
    engine: 'canvas',
    featured: true,
    trending: true,
    isNew: false,
    controls: {
      desktop: ['A / Left Arrow: Turn Left', 'D / Right Arrow: Turn Right', 'Space / W: Nitro Boost', 'S / Down: Brake'],
      mobile: ['Left Touch Button: Turn Left', 'Right Touch Button: Turn Right', 'BOOST Button: Nitro Speed', 'BRAKE Button: Slow down']
    }
  },
  {
    id: 'sky-runner',
    slug: 'sky-runner',
    title: 'Sky Runner',
    tagline: 'Leap across cyber platforms high above the clouds.',
    description: 'Precision endless platform runner set in a glowing futuristic skyline. Time your jumps and double jumps to scale floating platforms, collect plasma orbs, and avoid laser spikes!',
    category: 'Action',
    tags: ['Endless Runner', 'Platforms', 'Double Jump', 'Cyberpunk', 'Portrait'],
    thumbnailBg: 'linear-gradient(135deg, #ff007f 0%, #7928ca 100%)',
    accentColor: '#ff007f',
    iconName: 'Sparkles',
    rating: 4.8,
    plays: 98400,
    orientation: 'portrait',
    engine: 'canvas',
    featured: true,
    trending: true,
    isNew: true,
    controls: {
      desktop: ['Space / W / Up Arrow: Jump (Press again for Double Jump)'],
      mobile: ['Tap Screen / JUMP Button: Jump & Double Jump']
    }
  },
  {
    id: 'zombie-survival',
    slug: 'zombie-survival',
    title: 'Zombie Survival',
    tagline: 'Top-down neon wave survival shooter.',
    description: 'Survive relentless waves of neon cyber-zombies in a localized arena! Move swiftly, manage your ammunition, collect health medkits, and clear every wave before you get overwhelmed.',
    category: 'Action',
    tags: ['Survival', 'Shooter', 'Zombie Waves', 'Arena', 'Landscape'],
    thumbnailBg: 'linear-gradient(135deg, #ffaa00 0%, #ff0055 100%)',
    accentColor: '#ffaa00',
    iconName: 'ShieldAlert',
    rating: 4.7,
    plays: 112000,
    orientation: 'landscape',
    engine: 'canvas',
    featured: false,
    trending: true,
    isNew: false,
    controls: {
      desktop: ['W, A, S, D / Arrows: Move character', 'Space / Left Click: Fire Laser Weapon'],
      mobile: ['Left Virtual Joystick / DPAD: Move', 'FIRE Touch Button: Shoot Laser']
    }
  },
  {
    id: 'block-puzzle',
    slug: 'block-puzzle',
    title: 'Block Puzzle',
    tagline: 'Addictive grid block placement & line clears.',
    description: 'Place geometric neon blocks on an 8x8 grid to complete full horizontal rows and vertical columns. Clear multiple lines simultaneously for massive combo multipliers!',
    category: 'Puzzle',
    tags: ['Grid Puzzle', 'Brain Teaser', 'Combo Clear', 'Relaxing', 'Portrait'],
    thumbnailBg: 'linear-gradient(135deg, #00ff88 0%, #0088ff 100%)',
    accentColor: '#00ff88',
    iconName: 'Grid',
    rating: 4.9,
    plays: 210000,
    orientation: 'portrait',
    engine: 'canvas',
    featured: true,
    trending: true,
    isNew: false,
    controls: {
      desktop: ['Click & Drag Block: Place on Grid'],
      mobile: ['Touch Drag Block: Place on Grid cell']
    }
  },
  {
    id: 'space-shooter',
    slug: 'space-shooter',
    title: 'Space Shooter',
    tagline: 'Classic horizontal arcade galaxy defender.',
    description: 'Take command of the starship Alpha-1! Pilot through asteroid belts, destroy alien fighter squadrons, grab weapon upgrade power-ups, and defeat colossal mothership bosses.',
    category: 'Arcade',
    tags: ['Space Combat', 'Shmup', 'Boss Battles', 'Powerups', 'Landscape'],
    thumbnailBg: 'linear-gradient(135deg, #9900ff 0%, #00e5ff 100%)',
    accentColor: '#00e5ff',
    iconName: 'Rocket',
    rating: 4.8,
    plays: 165000,
    orientation: 'landscape',
    engine: 'canvas',
    featured: false,
    trending: false,
    isNew: true,
    controls: {
      desktop: ['W, A, S, D / Arrow Keys: Move Ship', 'Space Key: Auto/Manual Laser Fire'],
      mobile: ['Touch & Drag Ship / Virtual Stick: Move & Shoot']
    }
  }
];

export const CATEGORIES_LIST: Array<{ name: string; slug: string; iconName: string; count: number; bgGradient: string }> = [
  { name: 'Racing', slug: 'racing', iconName: 'Flame', count: 1, bgGradient: 'from-cyan-500 to-blue-600' },
  { name: 'Action', slug: 'action', iconName: 'Swords', count: 2, bgGradient: 'from-pink-500 to-purple-600' },
  { name: 'Puzzle', slug: 'puzzle', iconName: 'Puzzle', count: 1, bgGradient: 'from-emerald-400 to-teal-600' },
  { name: 'Arcade', slug: 'arcade', iconName: 'Gamepad2', count: 1, bgGradient: 'from-violet-500 to-indigo-600' },
  { name: 'Sports', slug: 'sports', iconName: 'Trophy', count: 0, bgGradient: 'from-amber-400 to-orange-600' },
  { name: 'Adventure', slug: 'adventure', iconName: 'Compass', count: 0, bgGradient: 'from-red-500 to-rose-700' },
  { name: 'Strategy', slug: 'strategy', iconName: 'Brain', count: 0, bgGradient: 'from-blue-500 to-cyan-700' },
  { name: 'Casual', slug: 'casual', iconName: 'Smile', count: 0, bgGradient: 'from-fuchsia-500 to-pink-600' }
];
