import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogData';

export const BlogPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 select-none">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Gaming Guides & Tips
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          ManuPlay Gaming Blog
        </h1>
        <p className="text-slate-400 text-sm">
          Discover game strategies, casual gaming trends, top free browser games, and tips to climb the ManuPlay leaderboards.
        </p>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BLOG_POSTS.map(post => (
          <article
            key={post.slug}
            className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 font-bold uppercase">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {post.readTime}
                </span>
              </div>

              <h2 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                <Link to={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500 font-medium">{post.date}</span>
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Read Article <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
