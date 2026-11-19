/**
 * Central place for JWT secrets and token lifetimes.
 *
 * Access and refresh tokens are signed with different secrets and carry a
 * `typ` claim, so a refresh token (or a 2FA challenge token) can never be
 * used as an access token.
 */

const DEV_FALLBACK_SECRET = 'local-dev-only-jwt-secret-do-not-use-in-production';

export const ACCESS_TOKEN_TTL = '30m';
export const REFRESH_TOKEN_TTL = '7d';
export const TWO_FA_TOKEN_TTL = '5m';

export const ACCESS_COOKIE_MAX_AGE_MS = 30 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type TokenType = 'access' | 'refresh' | '2fa';

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
}

function clean(value: string | undefined): string {
  return (value || '').trim();
}

export function getAccessSecret(): string {
  const secret = clean(process.env.JWT_SECRET);
  if (secret) return secret;
  if (isProductionRuntime()) {
    throw new Error('JWT_SECRET must be set in production. Refusing to sign or verify tokens with a default secret.');
  }
  return DEV_FALLBACK_SECRET;
}

/** Refresh tokens use JWT_REFRESH_SECRET when configured, otherwise a value derived from JWT_SECRET. */
export function getRefreshSecret(): string {
  const secret = clean(process.env.JWT_REFRESH_SECRET);
  if (secret) return secret;
  return `${getAccessSecret()}::refresh`;
}
