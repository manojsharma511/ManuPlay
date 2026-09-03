import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { TrendingPage } from './pages/TrendingPage';
import { CategoryPage } from './pages/CategoryPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { LandingPage } from './pages/LandingPage';
import { InfoPage } from './pages/InfoPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentPage } from './pages/RecentPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function LegacyGameRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/games/${slug}`} replace />;
}

function LegacyPlayRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/games/${slug}/play`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          
          {/* Canonical SEO Routes */}
          <Route path="games" element={<GamesPage />} />
          <Route path="games/:slug" element={<GameDetailPage />} />
          <Route path="games/:slug/play" element={<GamePlayPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          
          {/* High-Intent SEO Landing Pages */}
          <Route path="online-games" element={<LandingPage />} />
          <Route path="free-games" element={<LandingPage />} />
          <Route path="multiplayer-games" element={<LandingPage />} />
          <Route path="2-player-games" element={<LandingPage />} />
          <Route path="mobile-games" element={<LandingPage />} />
          <Route path="browser-games" element={<LandingPage />} />

          {/* Platform Trust & Legal Pages */}
          <Route path="about" element={<InfoPage />} />
          <Route path="contact" element={<InfoPage />} />
          <Route path="privacy" element={<InfoPage />} />
          <Route path="terms" element={<InfoPage />} />

          {/* Legacy URL Redirects */}
          <Route path="game/:slug" element={<LegacyGameRedirect />} />
          <Route path="game/:slug/play" element={<LegacyPlayRedirect />} />

          {/* Utility & Private User Pages */}
          <Route path="trending" element={<TrendingPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="recent" element={<RecentPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="leaderboards" element={<LeaderboardsPage />} />

          {/* 404 Catch All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
