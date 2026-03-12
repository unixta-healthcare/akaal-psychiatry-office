/**
 * GET   /api/admin/profile  — return the logged-in admin user's full DB row
 * PATCH /api/admin/profile  — update name (and optionally picture) for the logged-in user
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.adminUsers)
    .select('id, email, name, role, is_active, last_login_at, created_at')
    .eq('email', session.email)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, picture: session.picture });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.adminUsers)
    .update({ name: name.trim() })
    .eq('email', session.email)
    .select('id, email, name, role, is_active, last_login_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
