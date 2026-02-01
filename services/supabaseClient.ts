
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

// Project Credentials
const supabaseUrl = 'https://slkpdzfaeiqfbxauvvdb.supabase.co';
const supabaseAnonKey = 'sb_publishable_7ql0y6APaf2RqFE6SiVAeQ_5_fyu31x';

/**
 * The Supabase client instance. 
 * Initialized with the provided credentials to enable persistent storage.
 * Safe fallback to null if keys are missing.
 */
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Helper to check if Supabase is correctly configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

/**
 * Utility to get or create a persistent anonymous user ID for tracking preferences 
 * without a full authentication flow.
 */
export const getAnonymousUserId = () => {
  let id = localStorage.getItem('vok_anon_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('vok_anon_id', id);
  }
  return id;
};
