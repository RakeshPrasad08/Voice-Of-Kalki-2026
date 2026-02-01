import { supabase } from '../lib/supabase';
import type { NewsArticle, SavedArticle, UserInterest } from '../types/database';

export const newsService = {
  async getArticles(
    category?: string,
    region?: string,
    limit = 20,
    offset = 0
  ): Promise<NewsArticle[]> {
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (region && region !== 'All') {
      query = query.eq('region', region);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getArticleById(id: string): Promise<NewsArticle | null> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getTrendingArticles(limit = 10): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('is_urgent', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getArticlesByInterests(userId: string, limit = 20): Promise<NewsArticle[]> {
    const { data: interests, error: interestsError } = await supabase
      .from('user_interests')
      .select('category, region')
      .eq('user_id', userId);

    if (interestsError) throw interestsError;

    if (!interests || interests.length === 0) {
      return this.getArticles(undefined, undefined, limit);
    }

    const queries = interests.map((interest) =>
      supabase
        .from('news_articles')
        .select('*')
        .eq('category', interest.category)
        .eq('region', interest.region)
        .order('published_at', { ascending: false })
        .limit(5)
    );

    const results = await Promise.all(queries);
    const articles = results
      .flatMap((result) => result.data || [])
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit);

    return articles;
  },

  async saveArticle(userId: string, articleId: string): Promise<SavedArticle> {
    const { data, error } = await supabase
      .from('saved_articles')
      .insert({ user_id: userId, article_id: articleId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unsaveArticle(userId: string, articleId: string) {
    const { error } = await supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) throw error;
  },

  async getSavedArticles(userId: string, limit = 20, offset = 0): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('saved_articles')
      .select('article_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    const articleIds = data.map((item) => item.article_id);
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('*')
      .in('id', articleIds);

    if (articlesError) throw articlesError;
    return articles || [];
  },

  async isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_articles')
      .select('id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async addInterest(userId: string, category: string, region: string): Promise<UserInterest> {
    const { data, error } = await supabase
      .from('user_interests')
      .insert({ user_id: userId, category, region })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeInterest(userId: string, category: string, region: string) {
    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
      .eq('category', category)
      .eq('region', region);

    if (error) throw error;
  },

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    const { data, error } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },
};
