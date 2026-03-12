/**
 * GET /api/admin/contacts
 * Returns patient contacts from CRM.
 *
 * Query params:
 *   q      — search query
 *   page   — page number (default 1)
 *   limit  — per page (default 25)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getContacts } from '@/lib/ghl';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);

  try {
    const result = await getContacts(query, page, limit);
    return NextResponse.json({ ...result, page, limit, query });
  } catch (err) {
    console.error('[api/admin/contacts]', err);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: String(err) },
      { status: 500 }
    );
  }
}
