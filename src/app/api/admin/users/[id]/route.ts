/**
 * PATCH  /api/admin/users/[id]  — update role or active status
 * DELETE /api/admin/users/[id]  — remove a staff account
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

function canManageUsers(role: string) {
  return role === 'super_admin' || role === 'admin';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.role !== undefined) {
    const validRoles = ['super_admin', 'admin', 'staff', 'readonly'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (body.role === 'super_admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can assign super_admin role' }, { status: 403 });
    }
    updates.role = body.role;
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.name !== undefined) updates.name = String(body.name).trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.adminUsers)
    .update(updates)
    .eq('id', Number(id))
    .select('id, email, name, role, is_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  // Prevent self-deletion
  const supabase = getSupabase();
  const { data: target } = await supabase
    .from(TABLES.adminUsers)
    .select('email, role')
    .eq('id', Number(id))
    .single();

  if (target?.email === session.email) {
    return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 });
  }
  if (target?.role === 'super_admin' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can remove super admin accounts' }, { status: 403 });
  }

  const { error } = await supabase
    .from(TABLES.adminUsers)
    .delete()
    .eq('id', Number(id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
