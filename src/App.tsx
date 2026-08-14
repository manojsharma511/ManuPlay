import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { TrendingPage } from './pages/TrendingPage';
import { CategoryPage } from './pages/CategoryPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentPage } from './pages/RecentPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="trending" element={<TrendingPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="game/:slug" element={<GameDetailPage />} />
          <Route path="game/:slug/play" element={<GamePlayPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="recent" element={<RecentPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="leaderboards" element={<LeaderboardsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
