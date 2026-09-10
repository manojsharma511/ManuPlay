import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Gamepad2 } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogData';
import { GAMES_CATALOG } from '../games/registry';
import { GameCard } from '../components/game-ui/GameCard';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Article Not Found</h1>
        <p className="text-slate-400 text-sm">The blog article you are looking for does not exist or has been moved.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase">
          Back to Blog
        </Link>
      </div>
    );
  }

  const relatedGames = GAMES_CATALOG.filter(g => post.relatedGameSlugs.includes(g.slug));

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 space-y-8 select-none">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-cyan-400">Home</Link>
        <span>&gt;</span>
        <Link to="/blog" className="hover:text-cyan-400">Blog</Link>
        <span>&gt;</span>
        <span className="text-slate-200 truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Post Header */}
      <div className="space-y-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold uppercase">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" /> {post.readTime}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" /> {post.date}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-slate-300 text-base leading-relaxed font-medium">
          {post.excerpt}
        </p>
      </div>

      {/* Article Body Content */}
      <div
        className="prose prose-invert prose-cyan max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Related Games Embedded Section */}
      {relatedGames.length > 0 && (
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" /> Play Featured Games
            </h2>
            <Link to="/games" className="text-xs font-bold text-cyan-400 hover:underline">
              View All Games &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Back Link */}
      <div className="pt-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Articles
        </Link>
      </div>
    </article>
  );
};
