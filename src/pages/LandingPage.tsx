import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Gamepad2, Sparkles, Users, Smartphone, Globe, ShieldCheck, HelpCircle } from 'lucide-react';
import { gameService } from '../services/GameService';
import { CATEGORIES_LIST } from '../games/registry';
import { GameGrid } from '../components/game-ui/GameGrid';
import { CategoryCard } from '../components/game-ui/CategoryCard';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface LandingPageConfig {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subtitle: string;
  icon: React.ElementType;
  introText: string;
  benefits: string[];
  filterFn: (g: ReturnType<typeof gameService.getAllGames>[0]) => boolean;
  faqs: Array<{ question: string; answer: string }>;
}

const LANDING_PAGES_CONFIG: Record<string, LandingPageConfig> = {
  '/online-games': {
    slug: '/online-games',
    title: 'Online Games',
    seoTitle: 'Play Free Online Games Instantly — No Downloads | ManuPlay',
    seoDescription: 'Play top free online games instantly on ManuPlay. No downloads, zero ads, no installation required. Enjoy 100+ racing, sports, puzzle, and arcade games on mobile and desktop.',
    h1: 'Best Free Online Games to Play Instantly',
    subtitle: 'High-performance HTML5 browser games ready to play in seconds.',
    icon: Globe,
    introText: 'Welcome to ManuPlay, your destination for premium online browser gaming. All games run directly inside your mobile or desktop web browser using lightweight HTML5 and Canvas technology.',
    benefits: [
      'Zero download or app store installation required',
      'Instant saved high scores and player profile progression',
      'Fully responsive touch controls for mobile & tablet',
      '100% free with clean, ad-free gaming interfaces'
    ],
    filterFn: () => true,
    faqs: [
      {
        question: 'Are all online games on ManuPlay free to play?',
        answer: 'Yes! Every game in the ManuPlay catalog is completely free to play directly in your web browser with no hidden costs.'
      },
      {
        question: 'Do I need to download software or install an app?',
        answer: 'No downloads are necessary. Simply open your web browser on your phone, tablet, or PC and click START GAME to play instantly.'
      }
    ]
  },
  '/free-games': {
    slug: '/free-games',
    title: 'Free Games',
    seoTitle: 'Free Web Games — Play 100+ Instant Games | ManuPlay',
    seoDescription: 'Discover free web games on ManuPlay. Play top-rated browser games with zero downloads or subscriptions across mobile and desktop.',
    h1: '100% Free Web Games to Play Now',
    subtitle: 'No payments, no hidden fees, instant high-speed browser gaming.',
    icon: Sparkles,
    introText: 'ManuPlay offers a curated collection of 100% free web games across popular categories like Kart Racing, Chess, 8 Ball Pool, Trivia, and Cyberpunk Shooters.',
    benefits: [
      'Unlimited instant gameplay sessions',
      'Earn ManuCoins to level up your player account',
      'Daily rewards and streak challenges',
      'Compatible with Chrome, Safari, Firefox, and Edge'
    ],
    filterFn: (g) => g.rating >= 4.8,
    faqs: [
      {
        question: 'How does ManuPlay offer free games?',
        answer: 'ManuPlay is designed as an open web gaming platform for web technology enthusiasts, focusing on lightweight, high-performance HTML5 games.'
      }
    ]
  },
  '/multiplayer-games': {
    slug: '/multiplayer-games',
    title: 'Multiplayer Games',
    seoTitle: 'Free Multiplayer Browser Games — Play Online With Friends | ManuPlay',
    seoDescription: 'Play free multiplayer browser games online on ManuPlay. Challenge friends in Chess, 8 Ball Pool, and Kart Racing on mobile or desktop.',
    h1: 'Multiplayer & 2-Player Browser Games',
    subtitle: 'Duel friends and test your skills in real-time online and local 2-player modes.',
    icon: Users,
    introText: 'Experience competitive multiplayer gaming directly in your web browser! Play 2-player chess, pool, kart racing, and trivia duels without requiring separate controllers.',
    benefits: [
      'Same-screen and turn-based local 2-player support',
      'Real-time matchmaking & challenge rooms',
      'Cross-platform mobile and desktop multiplayer',
      'Competitive leaderboards and player statistics'
    ],
    filterFn: (g) => Boolean(g.multiplayerSupported || g.tags.includes('2 Player')),
    faqs: [
      {
        question: 'Can I play multiplayer games on the same phone or tablet?',
        answer: 'Yes! Games like Chess Master and 8 Ball Pool include full local 2-player pass-and-play and split touch controls.'
      }
    ]
  },
  '/2-player-games': {
    slug: '/2-player-games',
    title: '2 Player Games',
    seoTitle: '2 Player Games — Play 2 Player Web Games Free | ManuPlay',
    seoDescription: 'Play the best free 2 player games online on ManuPlay. Challenge a friend on the same device with responsive touch or keyboard controls.',
    h1: 'Best 2 Player Games Online',
    subtitle: 'Fun head-to-head games designed for two players on one device or online.',
    icon: Users,
    introText: 'Gather a friend and jump into instant 2-player games! Whether you want strategic board duels in Chess or physics-based 8 Ball Pool, play together instantly.',
    benefits: [
      'Optimized dual-side touch controls for mobile screens',
      'Versus AI and head-to-head friend modes',
      'No registration needed for instant match play',
      'Fast round resets and competitive stat tracking'
    ],
    filterFn: (g) => Boolean(g.tags.includes('2 Player') || g.multiplayerSupported),
    faqs: [
      {
        question: 'Do both players need separate devices for 2 player games?',
        answer: 'No! Many of our 2 player games support pass-and-play or dual touch inputs on a single smartphone, tablet, or computer keyboard.'
      }
    ]
  },
  '/mobile-games': {
    slug: '/mobile-games',
    title: 'Mobile Games',
    seoTitle: 'Free Mobile Browser Games — Play Instant Touch Games | ManuPlay',
    seoDescription: 'Play free mobile web games on iOS and Android with ManuPlay. Touch-optimized instant HTML5 games with zero app store downloads.',
    h1: 'Instant Mobile Web Games',
    subtitle: 'Mobile-first browser games optimized for iOS, Android, and tablets.',
    icon: Smartphone,
    introText: 'ManuPlay is built from the ground up for mobile browsers. Experience 60 FPS touch-responsive games with haptic feedback and PWA offline support.',
    benefits: [
      'Built specifically for portrait & landscape smartphones',
      'Smooth 60 FPS graphics powered by HTML5 Canvas & Phaser',
      'Low battery consumption and minimal data usage',
      'Save to home screen as a Progressive Web App (PWA)'
    ],
    filterFn: () => true,
    faqs: [
      {
        question: 'Can I install ManuPlay on my phone home screen?',
        answer: 'Yes! ManuPlay is a Progressive Web App (PWA). Tap "Add to Home Screen" in Safari or Chrome to launch it like a native mobile app.'
      }
    ]
  },
  '/browser-games': {
    slug: '/browser-games',
    title: 'Browser Games',
    seoTitle: 'Free Browser Games — Play Instant HTML5 Games | ManuPlay',
    seoDescription: 'Play high-performance browser games on ManuPlay. Enjoy immediate load times, rich sound effects, and zero downloads on any web browser.',
    h1: 'Best HTML5 Browser Games',
    subtitle: 'Instant action games running natively in modern web browsers.',
    icon: Gamepad2,
    introText: 'Discover the future of modern browser games on ManuPlay. Powered by modern JavaScript, WebAssembly, and HTML5 WebGL engines for crisp, latency-free gameplay.',
    benefits: [
      'No Flash or legacy plugins required',
      'Instant loading speeds with smart code splitting',
      'Cross-platform synchronization across all devices',
      'Full keyboard and touchscreen controller bindings'
    ],
    filterFn: () => true,
    faqs: [
      {
        question: 'What browsers are supported?',
        answer: 'ManuPlay works on modern versions of Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge, and mobile WebKit browsers.'
      }
    ]
  }
};

export const LandingPage: React.FC = () => {
  const location = useLocation();
  const config = LANDING_PAGES_CONFIG[location.pathname] || LANDING_PAGES_CONFIG['/online-games'];

  const games = gameService.getAllGames().filter(config.filterFn);
  const Icon = config.icon;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const breadcrumbs = [{ label: config.title }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Landing Page SEO */}
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        path={config.slug}
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{config.h1}</h1>
            <p className="text-xs sm:text-sm text-cyan-400 font-bold mt-0.5">{config.subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
          {config.introText}
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {config.benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Games Catalog Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white">Featured {config.title} ({games.length})</h2>
          <Link to="/games" className="text-xs font-bold text-cyan-400 hover:underline">
            View All Games →
          </Link>
        </div>
        <GameGrid games={games} />
      </section>

      {/* Category Links Section */}
      <section className="pt-6 border-t border-slate-800 space-y-4">
        <h3 className="text-lg font-extrabold text-white">Browse Games by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES_LIST.slice(0, 4).map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      {config.faqs && config.faqs.length > 0 && (
        <section className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className="space-y-3">
            {config.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                <h4 className="text-sm font-bold text-white">{faq.question}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
