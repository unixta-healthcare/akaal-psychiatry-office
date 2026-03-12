/**
 * Supabase server-side client for Akaal Psychiatry admin panel.
 * Uses service role key — NEVER expose on client.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  _client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}

// Table name constants
export const TABLES = {
  adminUsers: 'akaal_psychiatry_admin_users',
  blogPosts: 'akaal_psychiatry_blog_posts',
} as const;
