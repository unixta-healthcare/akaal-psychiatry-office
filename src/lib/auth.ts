/**
 * Auth utilities for Akaal Psychiatry admin panel.
 *
 * Google OAuth2 + JWT session management.
 * Follows @unixta/auth package patterns using jose directly.
 *
 * Flow:
 *   /admin/login → Google OAuth → /api/auth/callback/google
 *   → verify user in akaal_psychiatry_admin_users table
 *   → set session cookie → redirect /admin
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getSupabase, TABLES } from '@/lib/supabase';

export interface AdminSession {
  email: string;
  name: string;
  picture: string | null;
  role: 'super_admin' | 'admin' | 'staff' | 'readonly';
  googleId: string;
  iat?: number;
  exp?: number;
}

const SESSION_COOKIE = 'akaal_admin_session';
const SESSION_DURATION_HOURS = 12;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return new TextEncoder().encode(secret);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function createSessionToken(session: Omit<AdminSession, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(session as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

// ─── Cookie helpers (server-side) ────────────────────────────────────────────

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Revocation check — confirm user is still active in the DB.
  // A valid JWT is not enough: the admin may have been removed since login.
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from(TABLES.adminUsers)
      .select('is_active')
      .eq('email', session.email)
      .maybeSingle();
    if (!data || !data.is_active) return null;
  } catch {
    // Fail open on DB errors — don't lock everyone out if Supabase is unreachable
  }

  return session;
}

export function buildSessionCookieHeader(token: string): string {
  const maxAge = SESSION_DURATION_HOURS * 3600;
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${SESSION_COOKIE}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function buildClearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export interface GoogleUserInfo {
  sub: string;          // Google user ID
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export function buildGoogleAuthUrl(state: string, redirectUri?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const resolvedRedirectUri = redirectUri ?? process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !resolvedRedirectUri) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI are required');
  }
  const redirectUri = resolvedRedirectUri;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_BASE}?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials not configured');
  }

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    console.error('Google token exchange failed:', await tokenRes.text());
    return null;
  }

  const { access_token } = await tokenRes.json() as { access_token: string };

  // Get user info
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) return null;

  return userRes.json() as Promise<GoogleUserInfo>;
}
