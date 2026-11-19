/**
 * Loan products and their rates. The server is the source of truth for the
 * rate — whatever rate a client sends is ignored.
 */
export const LOAN_PRODUCTS: Record<string, { label: string; rate: number }> = {
  personal: { label: 'Personal loan', rate: 9.25 },
  business: { label: 'Business financing', rate: 8.5 },
  mortgage: { label: 'Home mortgage', rate: 7.15 },
  auto: { label: 'Auto loan', rate: 7.25 },
  education: { label: 'Education loan', rate: 5.5 },
  crypto: { label: 'Crypto backed loan', rate: 9.5 },
  others: { label: 'Other financing', rate: 10.0 },
};

export const LOAN_TERMS = [6, 12, 24, 36, 48, 60];
export const LOAN_MIN = 500;
export const LOAN_MAX = 1_000_000;

export function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  const f = Math.pow(1 + r, termMonths);
  return (principal * r * f) / (f - 1);
}

/** Keep only the last four digits of an SSN-like input, e.g. "***-**-6789". */
export function maskSsn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `***-**-${digits.slice(-4)}`;
}
