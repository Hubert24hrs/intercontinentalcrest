/** Parse an optional query-string integer and clamp it into [min, max]. */
export function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function newReference(prefix: string): string {
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `${prefix}-${Date.now()}-${rand}`;
}

/** Transaction types that move crypto only; they never change a USD account balance. */
export const NON_CASH_TRANSACTION_TYPES = ['crypto_deposit', 'crypto_withdrawal'];
