import fs from 'fs';
import path from 'path';
import { GAMES_CATALOG, CATEGORIES_LIST } from '../src/games/registry.js';
import { BLOG_POSTS } from '../src/data/blogData.js';

// Define Site Configuration (Strict single Vercel domain without trailing slash to prevent double slash //)
const SITE_DOMAIN = 'https://manuplay.vercel.app';
const SITE_NAME = 'ManuPlay';
const DEFAULT_OG_IMAGE = `${SITE_DOMAIN}/og-image.png`;

const LANDING_PAGES = [
  { path: '/online-games', title: 'Play Free Online Games Instantly — No Downloads | ManuPlay', desc: 'Play top free online games instantly on ManuPlay. No downloads, zero ads, instant action on mobile and desktop.' },
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
  const trimmed = clean === '/' ? '/' : clean.replace(/\/+$/, '');
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
    title: 'Free Online Games – Play Browser Games Instantly | ManuPlay',
    description: 'Discover and play 100+ top free online browser games instantly on ManuPlay. No downloads, zero ads, instant action on mobile and desktop.',
    changefreq: 'daily',
    priority: '1.0',
    h1: 'Free Online Games',
    contentHtml: `<header><h1>Free Online Games</h1><p>Play 100+ free instant online browser games on ManuPlay.</p></header>`
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
  CATEGORIES_LIST.forEach(cat => {
    const catCanonical = getCanonical(`/category/${cat.slug}`);
    const categoryGames = GAMES_CATALOG.filter(g => g.category.toLowerCase() === cat.name.toLowerCase() || g.tags.some(t => t.toLowerCase() === cat.slug));
    const gameLinks = categoryGames.map(g => `<li><a href="/games/${g.slug}"><strong>${g.title}</strong></a> - ${g.tagline}</li>`).join('');

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${SITE_DOMAIN}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Games', 'item': `${SITE_DOMAIN}/games` },
          { '@type': 'ListItem', 'position': 3, 'name': `${cat.name} Games`, 'item': catCanonical }
        ]
      }
    ];

    routes.push({
      path: `/category/${cat.slug}`,
      title: `${cat.name} Games Online – Play Free | ManuPlay`,
      description: `Play the best free online ${cat.name.toLowerCase()} games on ManuPlay. Enjoy fast instant-play browser games with high score saving on mobile and desktop.`,
      changefreq: 'weekly',
      priority: '0.8',
      h1: `Free ${cat.name} Games`,
      contentHtml: `
        <article>
          <header>
            <nav><a href="/">Home</a> &gt; <a href="/games">Games</a> &gt; <span>${cat.name} Games</span></nav>
            <h1>Free ${cat.name} Games</h1>
            <p>Discover top free ${cat.name.toLowerCase()} browser games ready to play on ManuPlay.</p>
          </header>
          <section>
            <h2>Popular ${cat.name} Games (${categoryGames.length})</h2>
            <ul>${gameLinks}</ul>
          </section>
          <section>
            <h2>Why Play ${cat.name} Games on ManuPlay?</h2>
            <p>ManuPlay provides zero-friction instant browser gaming for ${cat.name.toLowerCase()} enthusiasts worldwide. All games are lightweight, optimized for high FPS performance across smartphones, tablets, and desktop browsers, and save your progress automatically.</p>
          </section>
        </article>
      `,
      jsonLd
    });
  });

  // Individual Games (Consuming single source of truth GAMES_CATALOG with full rich content)
  GAMES_CATALOG.forEach(game => {
    const gameCanonical = getCanonical(`/games/${game.slug}`);
    
    const howToPlayList = game.howToPlay && game.howToPlay.length > 0 ? game.howToPlay : [
      `Launch ${game.title} directly in your browser by clicking START GAME.`,
      `Review the controls: Desktop uses keyboard/mouse, Mobile uses responsive touch buttons.`,
      `Score points, complete objectives, beat your local high score, and earn ManuCoins!`
    ];

    const featuresList = game.features && game.features.length > 0 ? game.features : [
      'Instant free browser play with zero install',
      'Responsive touch & keyboard control scheme',
      'Local high score and progress save system',
      'Earn ManuCoins and level up your player profile',
      'High performance lightweight HTML5 engine'
    ];

    const faqsList = game.faqs && game.faqs.length > 0 ? game.faqs : [
      {
        question: `Is ${game.title} free to play online?`,
        answer: `Yes! ${game.title} is 100% free to play directly on ManuPlay without any downloads or mandatory registration.`
      },
      {
        question: `Can I play ${game.title} on my phone or tablet?`,
        answer: `Yes, ${game.title} is fully optimized for mobile touchscreens (iOS and Android) as well as desktop browsers.`
      },
      {
        question: `Does ${game.title} save my progress and high score?`,
        answer: `Yes, ManuPlay automatically saves your personal best score, coin earnings, and progression locally.`
      }
    ];

    const relatedGames = GAMES_CATALOG
      .filter(g => g.id !== game.id)
      .sort((a, b) => (b.category === game.category ? 2 : 0) - (a.category === game.category ? 2 : 0) || (b.rating - a.rating))
      .slice(0, 4);

    const controlsMobileHtml = game.controls.mobile.map(c => `<li>${c}</li>`).join('');
    const controlsDesktopHtml = game.controls.desktop.map(c => `<li>${c}</li>`).join('');
    const howToPlayHtml = howToPlayList.map(step => `<li>${step}</li>`).join('');
    const featuresHtml = featuresList.map(feat => `<li>${feat}</li>`).join('');
    const faqsHtml = faqsList.map(faq => `<article><h3>${faq.question}</h3><p>${faq.answer}</p></article>`).join('');
    const relatedGamesHtml = relatedGames.map(g => `<li><a href="/games/${g.slug}">${g.title}</a> - Free online ${g.category.toLowerCase()} game.</li>`).join('');

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        'name': game.title,
        'description': game.description,
        'url': gameCanonical,
        'image': DEFAULT_OG_IMAGE,
        'genre': game.category,
        'gamePlatform': ['Web Browser', 'Mobile Browser', 'Desktop Browser'],
        'applicationCategory': 'Game',
        'operatingSystem': 'Any',
        'author': {
          '@type': 'Organization',
          'name': SITE_NAME,
          'url': `${SITE_DOMAIN}/`
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${SITE_DOMAIN}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Games', 'item': `${SITE_DOMAIN}/games` },
          { '@type': 'ListItem', 'position': 3, 'name': game.category, 'item': `${SITE_DOMAIN}/category/${game.category.toLowerCase()}` },
          { '@type': 'ListItem', 'position': 4, 'name': game.title, 'item': gameCanonical }
        ]
      }
    ];

    routes.push({
      path: `/games/${game.slug}`,
      title: `${game.title} – Play Online Free | ManuPlay`,
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
            <h2>How to Play ${game.title}</h2>
            <ol>${howToPlayHtml}</ol>
          </section>
          <section>
            <h2>Game Controls</h2>
            <div>
              <h3>Touch Controls (Mobile & Tablet)</h3>
              <ul>${controlsMobileHtml}</ul>
            </div>
            <div>
              <h3>Keyboard & Mouse Controls (Desktop)</h3>
              <ul>${controlsDesktopHtml}</ul>
            </div>
          </section>
          <section>
            <h2>Key Features</h2>
            <ul>${featuresHtml}</ul>
          </section>
          <section>
            <h2>Frequently Asked Questions</h2>
            ${faqsHtml}
          </section>
          <section>
            <h2>More Free ${game.category} Games</h2>
            <ul>${relatedGamesHtml}</ul>
          </section>
        </article>
      `,
      jsonLd
    });
  });

  // Landing Pages
  LANDING_PAGES.forEach(lp => {
    const lpCanonical = getCanonical(lp.path);
    const gamesListHtml = GAMES_CATALOG.slice(0, 10).map(g => `<li><a href="/games/${g.slug}"><strong>${g.title}</strong></a> (${g.category}) - ${g.tagline}</li>`).join('');

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${SITE_DOMAIN}/` },
          { '@type': 'ListItem', 'position': 2, 'name': lp.title.split('—')[0].trim(), 'item': lpCanonical }
        ]
      }
    ];

    routes.push({
      path: lp.path,
      title: lp.title,
      description: lp.desc,
      changefreq: 'weekly',
      priority: '0.9',
      h1: lp.title.split('—')[0].trim(),
      contentHtml: `
        <article>
          <header>
            <nav><a href="/">Home</a> &gt; <span>${lp.title.split('—')[0].trim()}</span></nav>
            <h1>${lp.title.split('—')[0].trim()}</h1>
            <p>${lp.desc}</p>
          </header>
          <section>
            <h2>Top Recommended Web Games</h2>
            <ul>${gamesListHtml}</ul>
          </section>
        </article>
      `,
      jsonLd
    });
  });

  // Blog Pages & Articles
  routes.push({
    path: '/blog',
    title: 'Gaming Guides, Tips & News | ManuPlay Blog',
    description: 'Read the latest gaming guides, tips, high-score strategies, and browser gaming news on ManuPlay.',
    changefreq: 'weekly',
    priority: '0.7',
    h1: 'ManuPlay Gaming Blog',
    contentHtml: `<article><h1>ManuPlay Gaming Blog</h1><p>Gaming guides and tips for online browser games.</p></article>`
  });

  BLOG_POSTS.forEach(post => {
    routes.push({
      path: `/blog/${post.slug}`,
      title: `${post.title} | ManuPlay Blog`,
      description: post.excerpt,
      changefreq: 'monthly',
      priority: '0.7',
      h1: post.title,
      contentHtml: `<article><h1>${post.title}</h1><p>${post.excerpt}</p></article>`
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
