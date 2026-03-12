/**
 * GET /api/auth/callback/google
 * Handles Google OAuth callback:
 *   1. Verify state param (CSRF)
 *   2. Exchange code for access token
 *   3. Get user info from Google
 *   4. Check user exists in akaal_psychiatry_admin_users (is_active = true)
 *   5. Update last_login_at + google_id
 *   6. Create JWT session cookie
 *   7. Redirect to /admin
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  createSessionToken,
  type AdminSession,
} from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Google denied access
  if (error) {
    return NextResponse.redirect(`${SITE_URL}/admin/login?error=denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/admin/login?error=no_code`);
  }

  // Verify CSRF state
  const savedState = request.cookies.get('google_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${SITE_URL}/admin/login?error=invalid_state`);
  }

  try {
    // Exchange code for user info
    const googleUser = await exchangeGoogleCode(code);
    if (!googleUser) {
      return NextResponse.redirect(`${SITE_URL}/admin/login?error=google_failed`);
    }

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${SITE_URL}/admin/login?error=unverified_email`);
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
      return NextResponse.redirect(`${SITE_URL}/admin/login?error=unauthorized`);
    }

    if (!adminUser.is_active) {
      return NextResponse.redirect(`${SITE_URL}/admin/login?error=account_disabled`);
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

    // Redirect to admin dashboard with session cookie
    const response = NextResponse.redirect(`${SITE_URL}/admin`);

    // Set session cookie using Next.js cookies API (reliable on redirect responses)
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
    return NextResponse.redirect(`${SITE_URL}/admin/login?error=server_error`);
  }
}
