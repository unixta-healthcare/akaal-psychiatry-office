/**
 * GET /api/admin/inquiries
 * Returns contact form submissions.
 *
 * Query params:
 *   formId  — form ID (defaults to MARKYY_CONTACT_FORM_ID env)
 *   page    — page number (default 1)
 *   limit   — per page (default 25)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFormSubmissions, getAllForms } from '@/lib/ghl';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const formId = searchParams.get('formId') || process.env.MARKYY_CONTACT_FORM_ID || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);

  if (!formId) {
    // If no form ID, return available forms for the user to select
    try {
      const forms = await getAllForms();
      return NextResponse.json({ forms, submissions: [], total: 0, page, limit });
    } catch (err) {
      return NextResponse.json(
        { error: 'Contact form integration not configured', details: String(err) },
        { status: 500 }
      );
    }
  }

  try {
    const result = await getFormSubmissions(formId, page, limit);
    return NextResponse.json({ ...result, page, limit, formId });
  } catch (err) {
    console.error('[api/admin/inquiries]', err);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: String(err) },
      { status: 500 }
    );
  }
}
