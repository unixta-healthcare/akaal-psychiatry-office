/**
 * GET  /api/contacts — list patients from Supabase contacts table
 * POST /api/contacts — create a new contact
 *
 * Markyy/GHL syncs contacts in; this is the read/write source of truth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listContacts, createContact } from '@/lib/modules/crm';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp     = request.nextUrl.searchParams;
  const q      = sp.get('q') ?? '';
  const page   = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit  = Math.min(parseInt(sp.get('limit') ?? '25', 10), 100);
  const offset = (page - 1) * limit;

  try {
    const result = await listContacts({ q, limit, offset });
    return NextResponse.json({ ...result, page, limit, query: q });
  } catch (err) {
    console.error('[api/contacts GET]', err);
    return NextResponse.json({ error: 'Failed to fetch contacts', details: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body   = await request.json();
    const contact = await createContact(body);
    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    console.error('[api/contacts POST]', err);
    return NextResponse.json({ error: 'Failed to create contact', details: String(err) }, { status: 500 });
  }
}
