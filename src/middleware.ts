/**
 * Next.js middleware — protects /admin routes.
 * Redirects unauthenticated users to /admin/login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

const SESSION_COOKIE = 'akaal_admin_session';

/**
 * Check DB to confirm the user is still active — JWT alone is not enough.
 * Fails open on network/DB errors so a Supabase blip doesn't lock everyone out.
 */
async function isUserActiveInDB(email: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return true; // not configured — fail open

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/akaal_psychiatry_admin_users?email=eq.${encodeURIComponent(email)}&select=is_active&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!res.ok) return true;
    const rows = await res.json() as { is_active: boolean }[];
    return Array.isArray(rows) && rows.length > 0 && rows[0].is_active === true;
  } catch {
    return true; // network error — fail open
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Login page is always accessible
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const session = await verifySessionToken(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Revocation check — user may have been deactivated since the JWT was issued
  const activeInDB = await isUserActiveInDB(session.email);
  if (!activeInDB) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' });
    return response;
  }

  // Inject session data into request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-email', session.email);
  requestHeaders.set('x-admin-role', session.role);
  requestHeaders.set('x-admin-name', session.name);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/admin/:path*'],
};
