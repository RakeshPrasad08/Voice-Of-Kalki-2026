import { supabase } from '../lib/supabase';
import type { SocialMediaAccount, SocialMediaPost } from '../types/database';

export const socialMediaService = {
  async getConnectedAccounts(userId: string): Promise<SocialMediaAccount[]> {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_connected', true);

    if (error) throw error;
    return data || [];
  },

  async connectAccount(
    userId: string,
    platform: string,
    accountName: string,
    accountId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<SocialMediaAccount> {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .insert({
        user_id: userId,
        platform,
        account_name: accountName,
        account_id: accountId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async disconnectAccount(accountId: string) {
    const { error } = await supabase
      .from('social_media_accounts')
      .update({ is_connected: false })
      .eq('id', accountId);

    if (error) throw error;
  },

  async createPost(
    userId: string,
    articleId: string,
    socialAccountId: string,
    platform: string,
    postContent: string,
    scheduledAt?: string
  ): Promise<SocialMediaPost> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .insert({
        user_id: userId,
        article_id: articleId,
        social_account_id: socialAccountId,
        platform,
        post_content: postContent,
        scheduled_at: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPosts(userId: string, status?: string): Promise<SocialMediaPost[]> {
    let query = supabase
      .from('social_media_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updatePostStatus(
    postId: string,
    status: 'draft' | 'scheduled' | 'published' | 'failed',
    externalPostId?: string
  ): Promise<SocialMediaPost> {
    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    if (externalPostId) {
      updateData.external_post_id = externalPostId;
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  async getScheduledPosts(): Promise<SocialMediaPost[]> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  },

  async publishPost(
    postId: string,
    externalPostId: string
  ): Promise<SocialMediaPost> {
    return this.updatePostStatus(postId, 'published', externalPostId);
  },
};
