import React, { useState, useEffect } from 'react';
import { newsService } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Share2, Loader, AlertCircle } from 'lucide-react';
import type { NewsArticle } from '../types/database';

const CATEGORIES = [
  'All',
  'Trending',
  'Politics',
  'Current Affairs',
  'Sports',
  'Entertainment',
  'Business',
  'Technology',
  'Health',
  'Crime',
  'Education',
];

const REGIONS = ['All', 'Global', 'India', 'Karnataka', 'Local'];

export const NewsFeed: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadArticles();
  }, [category, region]);

  useEffect(() => {
    if (user) {
      loadSavedArticles();
    }
  }, [user]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await newsService.getArticles(
        category === 'All' ? undefined : category,
        region === 'All' ? undefined : region
      );
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedArticles = async () => {
    if (!user) return;
    try {
      const saved = await newsService.getSavedArticles(user.id);
      setSavedArticles(new Set(saved.map((a) => a.id)));
    } catch (err) {
      console.error('Failed to load saved articles:', err);
    }
  };

  const toggleSaveArticle = async (articleId: string) => {
    if (!user) return;

    try {
      if (savedArticles.has(articleId)) {
        await newsService.unsaveArticle(user.id, articleId);
        setSavedArticles((prev) => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
      } else {
        await newsService.saveArticle(user.id, articleId);
        setSavedArticles((prev) => new Set(prev).add(articleId));
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">News Feed</h1>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Category</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Region</h3>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setRegion(reg)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      region === reg
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No articles found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors"
              >
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                      {article.category}
                    </span>
                    {article.is_urgent && (
                      <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                        Urgent
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{article.source}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSaveArticle(article.id)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                        savedArticles.has(article.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      {savedArticles.has(article.id) ? 'Saved' : 'Save'}
                    </button>
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Read
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
