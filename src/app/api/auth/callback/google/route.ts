/**
 * GET /api/auth/callback/google
 * Handles Google OAuth callback:
 *   1. Verify state param (CSRF)
 *   2. Exchange code for access token (using same-origin redirect_uri)
 *   3. Get user info from Google
 *   4. Check user exists in akaal_psychiatry_admin_users (is_active = true)
 *   5. Update last_login_at + google_id
 *   6. Create JWT session cookie
 *   7. Redirect to /admin
 *
 * The redirect_uri is derived from the incoming request origin so that
 * both the Vercel domain and any custom domain work interchangeably.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  createSessionToken,
  type AdminSession,
} from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Derive both the site URL and the redirect_uri from the incoming request.
  // This makes any registered domain (Vercel or custom) work identically.
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/google`;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Google denied access
  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
  }

  // Verify CSRF state
  const savedState = request.cookies.get('google_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid_state`);
  }

  try {
    // Exchange code for user info — pass the same redirect_uri used during initiation
    const googleUser = await exchangeGoogleCode(code, redirectUri);
    if (!googleUser) {
      return NextResponse.redirect(`${origin}/admin/login?error=google_failed`);
    }

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${origin}/admin/login?error=unverified_email`);
    }

    // Check allowlist: user must exist in admin_users table AND be active
    const supabase = getSupabase();
    const { data: adminUser, error: dbError } = await supabase
      .from(TABLES.adminUsers)
      .select('email, name, role, is_active')
      .eq('email', googleUser.email.toLowerCase())
      .single();

    if (dbError || !adminUser) {
      console.warn(`[auth/callback] Unauthorized login attempt: ${googleUser.email}`);
      return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
    }

    if (!adminUser.is_active) {
      return NextResponse.redirect(`${origin}/admin/login?error=account_disabled`);
    }

    // Update last_login_at and google_id
    await supabase
      .from(TABLES.adminUsers)
      .update({
        last_login_at: new Date().toISOString(),
        google_id: googleUser.sub,
        picture: googleUser.picture,
        name: adminUser.name || googleUser.name,
      })
      .eq('email', googleUser.email.toLowerCase());

    // Create session
    const session: Omit<AdminSession, 'iat' | 'exp'> = {
      email: googleUser.email.toLowerCase(),
      name: adminUser.name || googleUser.name,
      picture: googleUser.picture || null,
      role: adminUser.role as AdminSession['role'],
      googleId: googleUser.sub,
    };

    const token = await createSessionToken(session);

    // Redirect to admin dashboard on the same domain the user came from
    const response = NextResponse.redirect(`${origin}/admin`);

    response.cookies.set('akaal_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 3600, // 12 hours
      path: '/',
    });

    // Clear the OAuth state cookie
    response.cookies.delete('google_oauth_state');

    return response;
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    return NextResponse.redirect(`${origin}/admin/login?error=server_error`);
  }
}
