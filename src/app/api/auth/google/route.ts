/**
 * GET /api/auth/google
 * Initiates Google OAuth flow — redirects user to Google consent screen.
 * The redirect_uri is derived from the incoming request origin so that
 * both the Vercel domain and any custom domain work interchangeably.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthUrl } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const state = randomBytes(16).toString('hex');
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/google`;

  try {
    const url = buildGoogleAuthUrl(state, redirectUri);

    const response = NextResponse.redirect(url);
    // Store state in a short-lived HttpOnly cookie to prevent CSRF
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[auth/google] Error building OAuth URL:', err);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(new URL('/admin/login?error=config', origin));
  }
}
