/**
 * POST /api/auth/signout
 * Clears the admin session cookie and redirects to /admin/login.
 */
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'akaal_admin_session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

// Also handle GET for simple link-based signout
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = NextResponse.redirect(`${siteUrl}/admin/login`);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
