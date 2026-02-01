export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  full_description: string | null;
  source: string;
  source_url: string;
  category: string;
  region: string;
  image_url: string | null;
  is_urgent: boolean;
  is_verified: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  category: string;
  region: string;
  created_at: string;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
}

export interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform: string;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaPost {
  id: string;
  user_id: string;
  article_id: string;
  social_account_id: string;
  platform: string;
  post_content: string;
  scheduled_at: string | null;
  published_at: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  external_post_id: string | null;
  created_at: string;
  updated_at: string;
}
