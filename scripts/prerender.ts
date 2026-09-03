import fs from 'fs';
import path from 'path';

// Define Site Configuration
const SITE_DOMAIN = 'https://manuplay.vercel.app/';
const SITE_NAME = 'ManuPlay';
const DEFAULT_OG_IMAGE = `${SITE_DOMAIN}/og-image.png`;

// Raw Games Data for static build rendering
const GAMES = [
  {
    slug: 'manu-kart',
    title: 'Manu Kart',
    tagline: 'Flagship 2D/3D highway kart racing with drift & powerups.',
    description: 'ManuPlay flagship racer! Outmaneuver rival AI karts, hit speed boosters, collect nitro cans, trigger powerups, and set record lap times across futuristic neon tracks.',
    category: 'Racing',
    plays: 285000,
    rating: 5.0
  },
  {
    slug: 'chess',
    title: 'Chess Master',
    tagline: 'Classic chess with smart AI & local 2-player modes.',
    description: 'Challenge your mind with grandmaster strategy! Play against adaptive AI or duel a friend on the same screen with full move validation, blitz timers, and puzzle challenges.',
    category: 'Board',
    plays: 195000,
    rating: 4.9
  },
  {
    slug: '8ball-pool',
    title: '8 Ball Pool',
    tagline: 'Realistic physics cue ball pocketing challenge.',
    description: 'Master cue ball trajectory and spin! Drag back to aim, adjust power, and sink target balls into 6 pockets with realistic cushion reflection physics.',
    category: 'Sports',
    plays: 230000,
    rating: 4.9
  },
  {
    slug: 'trivia-battle',
    title: 'Trivia Battle',
    tagline: 'Real-time quiz across Gaming, Science, Tech & Sports.',
    description: 'Test your knowledge against the clock! Answer questions across popular categories, build answer streak multipliers, and earn massive XP rewards.',
    category: 'Trivia',
    plays: 162000,
    rating: 4.8
  },
  {
    slug: 'neon-drift',
    title: 'Neon Drift',
    tagline: 'High-speed cyberpunk highway racing with instant nitro boosts.',
    description: 'Hit the neon-drenched highway at night! Dodge speeding traffic, collect energy power-ups, boost through speed traps, and see how long you can survive the endless drift.',
    category: 'Racing',
    plays: 142500,
    rating: 4.9
  },
  {
    slug: 'sky-runner',
    title: 'Sky Runner',
    tagline: 'Leap across cyber platforms high above the clouds.',
    description: 'Precision endless platform runner set in a glowing futuristic skyline. Time your jumps and double jumps to scale floating platforms, collect plasma orbs, and avoid laser spikes!',
    category: 'Action',
    plays: 98400,
    rating: 4.8
  },
  {
    slug: 'zombie-survival',
    title: 'Zombie Survival',
    tagline: 'Top-down neon wave survival shooter.',
    description: 'Survive relentless waves of neon cyber-zombies in a localized arena! Move swiftly, manage your ammunition, collect health medkits, and clear every wave before you get overwhelmed.',
    category: 'Action',
    plays: 112000,
    rating: 4.7
  },
  {
    slug: 'cricket-smash',
    title: 'Cricket Smash',
    tagline: 'Fast-paced T20 cricket batting challenge.',
    description: 'Step up to the crease and smash Sixes! Time your shots against fast bowlers and spinners, hit target zones, and build massive inning totals.',
    category: 'Sports',
    plays: 210000,
    rating: 4.9
  },
  {
    slug: 'penalty-shootout',
    title: 'Penalty Shootout',
    tagline: 'Precision soccer penalty kick duel.',
    description: 'Flick shoot past the keeper! Swipe to curve your shots, hit top-corner targets, and score golden goal penalties.',
    category: 'Sports',
    plays: 185000,
    rating: 4.8
  },
  {
    slug: 'color-sort',
    title: 'Color Sort',
    tagline: 'Relaxing liquid color tube sorting puzzle.',
    description: 'Pour and match colored liquids into matching test tubes. Plan your moves carefully to solve hundreds of brain-teasing levels.',
    category: 'Puzzle',
    plays: 155000,
    rating: 4.7
  },
  {
    slug: 'block-puzzle',
    title: 'Block Puzzle',
    tagline: 'Addictive grid block placement challenge.',
    description: 'Fit neon polyomino blocks into the 8x8 grid to clear full lines and triggers combos.',
    category: 'Puzzle',
    plays: 175000,
    rating: 4.8
  },
  {
    slug: 'cyber-memory',
    title: 'Cyber Memory',
    tagline: 'Futuristic card flip brain training.',
    description: 'Match pairs of cyber icons before time runs out. Test and improve your short-term visual memory.',
    category: 'Puzzle',
    plays: 89000,
    rating: 4.6
  },
  {
    slug: 'hoop-master',
    title: 'Hoop Master',
    tagline: 'Arcade basketball shooting challenge.',
    description: 'Swipe to shoot hoops against moving backboards. Build streak multipliers and unlock fire balls.',
    category: 'Sports',
    plays: 130000,
    rating: 4.8
  },
  {
    slug: 'space-shooter',
    title: 'Space Shooter',
    tagline: 'Classic vertical arcade space galaxy defender.',
    description: 'Pilot your starship through alien armadas. Upgrade lasers, collect shields, and defeat giant bosses.',
    category: 'Arcade',
    plays: 140000,
    rating: 4.8
  },
  {
    slug: 'traffic-rush',
    title: 'Traffic Rush',
    tagline: 'Control highway signals to prevent crashes.',
    description: 'Tap vehicles and traffic lights to guide busy intersection traffic safely without collisions.',
    category: 'Casual',
    plays: 95000,
    rating: 4.6
  },
  {
    slug: 'dual-arena',
    title: 'Dual Arena',
    tagline: 'Local 2-player tank battle duel.',
    description: 'Outmaneuver your friend in a top-down maze arena. Bounce shots off walls to destroy the rival tank.',
    category: '2 Player',
    plays: 105000,
    rating: 4.8
  },
  {
    slug: 'neon-wings',
    title: 'Neon Wings',
    tagline: 'Flappy-style cyber bird cave runner.',
    description: 'Tap to flap through neon laser pillars and narrow cavern gaps. How far can you fly?',
    category: 'Arcade',
    plays: 118000,
    rating: 4.7
  },
  {
    slug: 'tower-defense',
    title: 'Tower Defense',
    tagline: 'Tactical turret deployment strategy.',
    description: 'Place laser, plasma, and frost towers along the path to stop waves of enemy bots.',
    category: 'Strategy',
    plays: 125000,
    rating: 4.8
  },
  {
    slug: 'mini-golf',
    title: 'Mini Golf',
    tagline: 'Precision 3D/2D putting green physics.',
    description: 'Bank shots around obstacles, ramps, and wind traps to sink hole-in-one putts.',
    category: 'Sports',
    plays: 110000,
    rating: 4.7
  }
];

const CATEGORIES = [
  { slug: 'racing', name: 'Racing' },
  { slug: 'sports', name: 'Sports' },
  { slug: 'puzzle', name: 'Puzzle' },
  { slug: 'action', name: 'Action' },
  { slug: 'arcade', name: 'Arcade' },
  { slug: 'strategy', name: 'Strategy' },
  { slug: 'board', name: 'Board' },
  { slug: 'trivia', name: 'Trivia' },
  { slug: 'casual', name: 'Casual' },
  { slug: 'multiplayer', name: 'Multiplayer' },
  { slug: '2-player', name: '2 Player' }
];

const LANDING_PAGES = [
  { path: '/online-games', title: 'Play Free Online Games Instantly — No Downloads | ManuPlay', desc: 'Play top free online games instantly on ManuPlay. No downloads, zero ads, instant action.' },
  { path: '/free-games', title: 'Free Web Games — Play 100+ Instant Games | ManuPlay', desc: 'Discover free web games on ManuPlay. Play top-rated browser games with zero downloads.' },
  { path: '/multiplayer-games', title: 'Free Multiplayer Browser Games — Play Online With Friends | ManuPlay', desc: 'Play free multiplayer browser games online on ManuPlay. Challenge friends in Chess, 8 Ball Pool, and Kart Racing.' },
  { path: '/2-player-games', title: '2 Player Games — Play 2 Player Web Games Free | ManuPlay', desc: 'Play the best free 2 player games online on ManuPlay. Challenge a friend on the same device.' },
  { path: '/mobile-games', title: 'Free Mobile Browser Games — Play Instant Touch Games | ManuPlay', desc: 'Play free mobile web games on iOS and Android with ManuPlay. Touch-optimized instant HTML5 games.' },
  { path: '/browser-games', title: 'Free Browser Games — Play Instant HTML5 Games | ManuPlay', desc: 'Play high-performance browser games on ManuPlay. Enjoy immediate load times and zero downloads.' }
];

const LEGAL_PAGES = [
  { path: '/about', title: 'About ManuPlay — Web Gaming Platform', desc: 'Learn about ManuPlay, the high-performance instant HTML5 browser gaming platform.' },
  { path: '/contact', title: 'Contact ManuPlay Support', desc: 'Contact the ManuPlay team for support, feedback, and publishing inquiries.' },
  { path: '/privacy', title: 'Privacy Policy — ManuPlay', desc: 'Privacy policy and data protection information for users of ManuPlay.' },
  { path: '/terms', title: 'Terms of Service — ManuPlay', desc: 'Terms of service and acceptable usage guidelines for ManuPlay.' }
];

function getCanonical(routePath: string): string {
  const clean = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const trimmed = clean === '/' ? '' : clean.replace(/\/+$/, '');
  return `${SITE_DOMAIN}${trimmed}`;
}

async function runPrerender() {
  console.log('🚀 Running ManuPlay Technical SEO Build Prerender Engine...');
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory does not exist! Run vite build first.');
    process.exit(1);
  }

  const indexHtmlPath = path.join(distDir, 'index.html');
  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Generate robots.txt
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_DOMAIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
  console.log('  ✓ Generated dist/robots.txt');

  // 2. Prepare Indexable Routes for Sitemap & SSG Pre-rendering
  const routes: Array<{
    path: string;
    title: string;
    description: string;
    changefreq: string;
    priority: string;
    h1: string;
    contentHtml: string;
    jsonLd?: object[];
  }> = [];

  // Root
  routes.push({
    path: '/',
    title: 'ManuPlay — Free Online Games to Play Instantly',
    description: 'Discover and play 100+ top free online browser games instantly on ManuPlay. No downloads, zero ads, instant action on mobile and desktop.',
    changefreq: 'daily',
    priority: '1.0',
    h1: 'ManuPlay — Free Instant Mobile & Browser Games',
    contentHtml: `<header><h1>ManuPlay — Free Instant Mobile & Browser Games</h1><p>Play 100+ free instant online browser games on ManuPlay.</p></header>`
  });

  // Catalog /games
  routes.push({
    path: '/games',
    title: 'All Instant Games — Play Free Online Browser Games | ManuPlay',
    description: 'Browse and play ManuPlay\'s complete catalog of free online browser games. Play Racing, Action, Puzzle, Sports, Arcade, Chess and Multiplayer games.',
    changefreq: 'daily',
    priority: '0.9',
    h1: 'All Instant Games Catalog',
    contentHtml: `<header><h1>All Instant Games Catalog</h1><p>Browse all free instant web games on ManuPlay.</p></header>`
  });

  // Trending /trending
  routes.push({
    path: '/trending',
    title: 'Trending Games — Top Played Online Games | ManuPlay',
    description: 'Discover the most played and trending free online games on ManuPlay today.',
    changefreq: 'daily',
    priority: '0.8',
    h1: 'Trending Games on ManuPlay',
    contentHtml: `<header><h1>Trending Games on ManuPlay</h1><p>Top played instant games right now.</p></header>`
  });

  // Category Pages
  CATEGORIES.forEach(cat => {
    routes.push({
      path: `/category/${cat.slug}`,
      title: `${cat.name} Games — Play Free Online | ManuPlay`,
      description: `Play the best free online ${cat.name.toLowerCase()} games on ManuPlay. Enjoy fast instant-play browser games with high score saving on mobile and desktop.`,
      changefreq: 'weekly',
      priority: '0.8',
      h1: `Free ${cat.name} Games`,
      contentHtml: `<article><h1>Free ${cat.name} Games</h1><p>Discover top free ${cat.name.toLowerCase()} browser games ready to play on ManuPlay.</p></article>`
    });
  });

  // Individual Games
  GAMES.forEach(game => {
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        'name': game.title,
        'description': game.description,
        'url': getCanonical(`/games/${game.slug}`),
        'image': DEFAULT_OG_IMAGE,
        'genre': game.category,
        'gamePlatform': ['Web Browser', 'Mobile Browser', 'Desktop Browser'],
        'applicationCategory': 'Game',
        'operatingSystem': 'Any',
        'author': {
          '@type': 'Organization',
          'name': SITE_NAME,
          'url': SITE_DOMAIN
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        }
      }
    ];

    routes.push({
      path: `/games/${game.slug}`,
      title: `Play ${game.title} Online Free | ManuPlay`,
      description: `Play ${game.title} online for free on ManuPlay. ${game.description} Play instantly in your mobile or desktop web browser with zero downloads.`,
      changefreq: 'weekly',
      priority: '0.8',
      h1: game.title,
      contentHtml: `
        <article>
          <header>
            <nav><a href="/">Home</a> &gt; <a href="/games">Games</a> &gt; <a href="/category/${game.category.toLowerCase()}">${game.category}</a> &gt; <span>${game.title}</span></nav>
            <h1>${game.title}</h1>
            <p>${game.tagline}</p>
          </header>
          <section>
            <h2>About ${game.title}</h2>
            <p>${game.description}</p>
          </section>
          <section>
            <h2>How to Play</h2>
            <p>Click START GAME to launch the game directly in your browser. Use touch controls on mobile or keyboard on desktop.</p>
          </section>
        </article>
      `,
      jsonLd
    });
  });

  // Landing Pages
  LANDING_PAGES.forEach(lp => {
    routes.push({
      path: lp.path,
      title: lp.title,
      description: lp.desc,
      changefreq: 'weekly',
      priority: '0.9',
      h1: lp.title.split('—')[0].trim(),
      contentHtml: `<article><h1>${lp.title.split('—')[0].trim()}</h1><p>${lp.desc}</p></article>`
    });
  });

  // Legal / Trust Pages
  LEGAL_PAGES.forEach(lp => {
    routes.push({
      path: lp.path,
      title: lp.title,
      description: lp.desc,
      changefreq: 'monthly',
      priority: '0.4',
      h1: lp.title.split('—')[0].trim(),
      contentHtml: `<article><h1>${lp.title.split('—')[0].trim()}</h1><p>${lp.desc}</p></article>`
    });
  });

  // 3. Generate sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${getCanonical(r.path)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`  ✓ Generated dist/sitemap.xml with ${routes.length} canonical URLs`);

  // 4. Generate Pre-rendered Static HTML Files for every route
  let generatedCount = 0;
  for (const route of routes) {
    const canonicalUrl = getCanonical(route.path);

    // Modify HTML template tags
    let html = templateHtml;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${route.title}</title>`);
    html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, `<meta name="title" content="${route.title}" />`);

    // Replace Description
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${route.description}" />`);

    // Inject Canonical URL
    if (!html.includes('<link rel="canonical"')) {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
    } else {
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${canonicalUrl}" />`);
    }

    // Inject OpenGraph Tags
    html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${route.title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${route.description}" />`);

    // Inject Twitter Tags
    html = html.replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:title" content="${route.title}" />`);
    html = html.replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:description" content="${route.description}" />`);

    // Inject JSON-LD Schema
    if (route.jsonLd) {
      const jsonLdString = `<script id="json-ld-schema" type="application/ld+json">\n${JSON.stringify(route.jsonLd, null, 2)}\n</script>`;
      html = html.replace('</head>', `  ${jsonLdString}\n</head>`);
    }

    // Inject Pre-rendered Body Content inside #root for Search Engine Crawlers
    const renderedBody = `<div id="root">${route.contentHtml}</div>`;
    html = html.replace('<div id="root"></div>', renderedBody);

    // Save to target path inside dist/
    if (route.path === '/') {
      fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
    } else {
      const targetSubDir = path.join(distDir, route.path.replace(/^\//, ''));
      fs.mkdirSync(targetSubDir, { recursive: true });
      fs.writeFileSync(path.join(targetSubDir, 'index.html'), html, 'utf8');
    }

    generatedCount++;
  }

  console.log(`  ✓ Pre-rendered ${generatedCount} static HTML SEO route entrypoints inside dist/`);
  console.log('🎉 Technical SEO Build Complete!');
}

runPrerender().catch(err => {
  console.error('❌ Prerender script failed:', err);
  process.exit(1);
});
