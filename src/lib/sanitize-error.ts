/**
 * sanitizeError
 *
 * The ONLY place in the codebase that is allowed to touch error messages
 * before they are sent to any client (browser, mobile, API consumer).
 *
 * Rule: zero vendor names, zero internal tool names, zero internal URLs
 * ever reach a user. CRM is a black box to them.
 *
 * Add to this list whenever a new integration is added.
 */

// Terms that must never appear in a user-facing message.
// "markyy" is allowed — it is our white-label product name visible to clients.
// GHL, GoHighLevel, leadconnector must NEVER appear anywhere.
const BLOCKED_TERMS: RegExp[] = [
  /ghl/gi,
  /go\s*high\s*level/gi,
  /leadconnectorhq/gi,
  /lead\s*connector/gi,
  /highlevel/gi,
  /services\.leadconnectorhq\.com/gi,
  /\bpit\b/gi,
];

const SAFE_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Returns a sanitized error message safe to send to the client.
 * Strips all vendor identifiers.
 */
export function sanitizeError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : SAFE_MESSAGE;

  const containsVendorTerm = BLOCKED_TERMS.some(re => re.test(raw));
  if (containsVendorTerm) return SAFE_MESSAGE;

  const stripped = raw.replace(/https?:\/\/[^\s"')]+/g, '[internal]');
  return stripped || SAFE_MESSAGE;
}

/**
 * Wraps a Next.js API route handler and guarantees:
 *  1. No vendor name leaks in error responses
 *  2. Consistent error shape: { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

export function crmRoute(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err: unknown) {
      const message = sanitizeError(err);
      console.error('[CRM]', err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
