/**
 * GET /api/auth/google
 * Initiates Google OAuth flow — redirects user to Google consent screen.
 */
import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET() {
  const state = randomBytes(16).toString('hex');

  try {
    const url = buildGoogleAuthUrl(state);

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
    return NextResponse.redirect(
      new URL('/admin/login?error=config', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
