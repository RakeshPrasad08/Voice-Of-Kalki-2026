import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socialMediaService } from '../services/socialMediaService';
import { newsService } from '../services/newsService';
import { Loader, AlertCircle, Facebook, Twitter, Trash2, Plus } from 'lucide-react';
import type { SocialMediaAccount, SocialMediaPost, NewsArticle } from '../types/database';

export const SocialMediaManager: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [formData, setFormData] = useState({
    articleId: '',
    accountId: '',
    content: '',
    scheduledAt: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const [accs, psts, arts] = await Promise.all([
        socialMediaService.getConnectedAccounts(user.id),
        socialMediaService.getPosts(user.id),
        newsService.getArticles(undefined, undefined, 10),
      ]);
      setAccounts(accs);
      setPosts(psts);
      setArticles(arts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.articleId || !formData.accountId || !formData.content) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await socialMediaService.createPost(
        user.id,
        formData.articleId,
        formData.accountId,
        'twitter',
        formData.content,
        formData.scheduledAt || undefined
      );
      setFormData({ articleId: '', accountId: '', content: '', scheduledAt: '' });
      setShowNewPostForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await socialMediaService.deletePost(postId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Social Media Manager</h1>
          <p className="text-slate-400">Schedule and manage your social media posts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
              </div>

              {accounts.length === 0 ? (
                <p className="text-slate-400">No connected accounts yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {account.platform === 'twitter' ? (
                          <Twitter className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Facebook className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="font-medium text-white">{account.account_name}</span>
                      </div>
                      <p className="text-xs text-slate-400">@{account.account_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Posts</h2>
                <button
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              </div>

              {showNewPostForm && (
                <form onSubmit={handleCreatePost} className="bg-slate-700 rounded-lg p-4 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Article
                      </label>
                      <select
                        value={formData.articleId}
                        onChange={(e) =>
                          setFormData({ ...formData, articleId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select an article</option>
                        {articles.map((article) => (
                          <option key={article.id} value={article.id}>
                            {article.title.substring(0, 50)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Account
                      </label>
                      <select
                        value={formData.accountId}
                        onChange={(e) =>
                          setFormData({ ...formData, accountId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select an account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Post Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        maxLength={280}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none h-20"
                        placeholder="Write your post..."
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        {formData.content.length}/280 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Schedule (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledAt: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Create Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewPostForm(false)}
                        className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {posts.length === 0 ? (
                <p className="text-slate-400">No posts yet</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const article = articles.find((a) => a.id === post.article_id);
                    return (
                      <div key={post.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-medium text-white text-sm">{article?.title}</p>
                            <span
                              className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                                post.status === 'published'
                                  ? 'bg-green-500/20 text-green-400'
                                  : post.status === 'scheduled'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-slate-600 text-slate-300'
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{post.post_content}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString()} •{' '}
                          {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
            <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Connected Accounts</p>
                <p className="text-3xl font-bold text-blue-400">{accounts.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Posts</p>
                <p className="text-3xl font-bold text-blue-400">{posts.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Scheduled</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {posts.filter((p) => p.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
