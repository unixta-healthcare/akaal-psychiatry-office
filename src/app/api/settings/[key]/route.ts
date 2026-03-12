/**
 * GET  /api/admin/settings/[key]  — retrieve a settings block
 * PUT  /api/admin/settings/[key]  — update a settings block (merges)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key } = await params;
  const supabase = getSupabase();
  const { data, error } = await (supabase as any)
    .from('akaal_psychiatry_settings')
    .select('value, updated_at')
    .eq('key', key)
    .single() as { data: { value: unknown; updated_at: string } | null; error: unknown };

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data.value);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admin+ can change settings
  if (session.role === 'staff' || session.role === 'readonly') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await params;
  const body = await request.json();

  const supabase = getSupabase();
  const { data, error } = await (supabase as any)
    .from('akaal_psychiatry_settings')
    .upsert({ key, value: body, updated_by: session.email }, { onConflict: 'key' })
    .select('value')
    .single() as { data: { value: unknown } | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.value ?? body);
}
