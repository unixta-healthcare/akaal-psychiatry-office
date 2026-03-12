import { createClient } from '@supabase/supabase-js';

/** Server-side Supabase client — bypasses RLS. Server components / API routes only. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Alias — preferred name in module code */
export const serverClient = createServiceClient;
