import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { newsService } from '../services/newsService';
import { Loader, AlertCircle, Share2, Trash2 } from 'lucide-react';
import type { NewsArticle } from '../types/database';

export const SavedArticles: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadSavedArticles();
    }
  }, [user]);

  const loadSavedArticles = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const data = await newsService.getSavedArticles(user.id, 50);
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved articles');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (articleId: string) => {
    if (!user) return;
    try {
      await newsService.unsaveArticle(user.id, articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsave article');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Saved Articles</h1>

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
            <p className="text-slate-400">No saved articles yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors p-6 flex gap-4"
              >
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                        {article.category}
                      </span>
                      {article.is_urgent && (
                        <span className="ml-2 inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{article.title}</h3>

                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span>{article.source}</span> •{' '}
                      <span>{new Date(article.published_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        Read
                      </a>
                      <button
                        onClick={() => handleUnsave(article.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Unsave
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
