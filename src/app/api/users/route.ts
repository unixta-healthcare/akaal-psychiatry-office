/**
 * GET  /api/admin/users  — list all staff accounts
 * POST /api/admin/users  — add a new staff account
 * Only super_admin and admin roles can manage users.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

function canManageUsers(role: string) {
  return role === 'super_admin' || role === 'admin';
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.adminUsers)
    .select('id, email, name, role, is_active, last_login_at, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { email, name, role } = body;

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'email, name, and role are required' }, { status: 400 });
  }

  const validRoles = ['admin', 'staff', 'readonly'];
  // Only super_admin can create other admins
  if (role === 'super_admin' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can create super admins' }, { status: 403 });
  }
  if (!validRoles.includes(role) && role !== 'super_admin') {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.adminUsers)
    .insert({ email: email.toLowerCase().trim(), name: name.trim(), role, is_active: true })
    .select('id, email, name, role, is_active, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
