# ManuPlay Implementation & Developer Documentation

## Overview

ManuPlay is a modern, mobile-first, high-performance instant HTML5 browser gaming platform. It features **31 fully playable games**, deep **100-level progression systems**, centralized metadata architecture, and a pre-rendered static SEO engine targeting `https://manuplay.vercel.app/`.

---

## 1. Central Game Registry Architecture

All game metadata is maintained in a single source of truth:
- **`src/games/registry.ts`**: Central catalog (`GAMES_CATALOG`) containing definitions, dynamic engine loaders (`loadEngine`), SEO titles, descriptions, categories, tags, and level metadata.
- **`src/games/types.ts`**: TypeScript definitions for `GameDefinition`, `GameCategory`, and progression interfaces.

Both the client application and the static SEO build engine (`scripts/prerender.ts`) consume `GAMES_CATALOG` directly to eliminate metadata duplication and ensure 100% SEO consistency.

---

## 2. Catalog of 31 Playable Games

### Original & Classic Games (19 Existing + 12 New Original Games)
1. **Manu Kart** (`Racing`): Flagship 2D/3D kart racer with drift & nitro boost.
2. **Chess Master** (`Board`): Smart AI & local 2-player chess.
3. **8 Ball Pool** (`Sports`): Trajectory aiming cue billiards physics.
4. **Trivia Battle** (`Trivia`): Category quiz with streak multipliers.
5. **Neon Drift** (`Racing`): Cyberpunk highway drift survival.
6. **Sky Runner** (`Action`): Cyber platform precision runner.
7. **Zombie Survival** (`Action`): Top-down wave survival shooter.
8. **Cricket Smash** (`Sports`): Mobile-first T20 cricket batting.
9. **Penalty Shootout** (`Sports`): Swipe & curve penalty kick duel.
10. **Color Sort** (`Puzzle`): Tube liquid sorting puzzle.
11. **Block Puzzle** (`Puzzle`): 8x8 polyomino grid placement.
12. **Cyber Memory** (`Puzzle`): Card flip visual brain training.
13. **Hoop Master** (`Sports`): Basketball shooting swish streak challenge.
14. **Space Shooter** (`Arcade`): Classic vertical galaxy arcade defender.
15. **Traffic Rush** (`Casual`): Intersection traffic light management.
16. **Dual Arena** (`2 Player`): Local 2-player tank battle duel.
17. **Neon Wings** (`Arcade`): Flappy-style cyber cavern runner.
18. **Tower Defense** (`Strategy`): Tactical turret deployment.
19. **Neon Mini Golf** (`Sports`): Precision drag-to-aim putting green.
20. **Number Merge 2048** (`Puzzle`) — **[NEW]**: 2048-style grid tile merge puzzle across 100 levels.
21. **Stack Tower** (`Arcade`) — **[NEW]**: Precision timing block stacker with slicing physics.
22. **Blade Master** (`Arcade`) — **[NEW]**: Rotating target knife throw arcade challenge.
23. **Tile Match 3D** (`Puzzle`) — **[NEW]**: Triple mahjong tile matching puzzle across 100 levels.
24. **Color Switch** (`Arcade`) — **[NEW]**: Color-matching obstacle bounce arcade game.
25. **Word Connect** (`Puzzle`) — **[NEW]**: Swipe letter wheel word search spelling puzzle.
26. **Brick Breaker Neon** (`Arcade`) — **[NEW]**: Neon paddle brick crusher with multi-ball powerups.
27. **Fruit Carver Arcade** (`Arcade`) — **[NEW]**: Reflex fruit slicing arcade game with combos.
28. **Bubble Shooter** (`Puzzle`) — **[NEW]**: Match-3 bubble cannon cluster pop puzzle.
29. **Maze Escape** (`Puzzle`) — **[NEW]**: Procedural neon maze runner puzzle with light energy.
30. **Traffic Car Dodge** (`Racing`) — **[NEW]**: Multi-lane highway vehicle dodge race.
31. **Reflex Tap Challenge** (`Casual`) — **[NEW]**: Fast neon node sequence reaction game.

---

## 3. 100-Level Progression & Persistent Save State

Level-based games feature parameterized level scaling (1 to 100+ levels):
- **Level Scaling**: Grid sizes, obstacle densities, moving velocities, target goals, and timers scale smoothly across levels.
- **Persistence**: Player level unlocks and high scores are saved locally using `storageService` (`IndexedDB` with fallback to `localStorage`).
- **GameShell HUD**: Header displays Level badges, active score, sound toggles, fullscreen button, and non-overlapping Pause / Exit buttons with exit confirmation modals.

---

## 4. Technical SEO Engine & Canonical Domain

- **Canonical Domain**: Strict enforcement of `https://manuplay.vercel.app/` across all canonical meta tags, OpenGraph URLs, JSON-LD schemas, `sitemap.xml`, and `robots.txt`.
- **Pre-rendered SSG Output**: `scripts/prerender.ts` pre-renders static HTML for all indexable pages (`/`, `/games`, `/games/:slug`, `/category/:slug`, `/online-games`, `/free-games`, `/blog`, `/blog/:slug`, etc.) into `dist/`.
- **Structured Data**: JSON-LD `VideoGame`, `BreadcrumbList`, and `WebSite` schemas embedded in pre-rendered HTML.

---

## 5. Build, Test & Deployment Instructions

### Build Command
```bash
npm run build
```
This executes `tsc -b`, compiles Vite bundles with dynamic game code-splitting, and runs `scripts/prerender.ts`.

### Linting
```bash
npm run lint
```

### Vercel Deployment
Deploy to Vercel targeting the production root directory. `vercel.json` contains rewrites and header configurations for XML sitemaps and text robots.

---

## 6. Google Search Console Setup Checklist

1. **Sitemap Submission**: Submit `https://manuplay.vercel.app/sitemap.xml` in Search Console.
2. **URL Inspection**: Inspect `https://manuplay.vercel.app/` and sample game URLs (e.g. `https://manuplay.vercel.app/games/manu-kart`).
3. **Index Request**: Request indexing for core landing pages and category pages.
4. **Mobile Usability & Core Web Vitals**: Monitor mobile performance metrics in Search Console.
