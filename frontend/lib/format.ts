const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdCompact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: unknown, opts: { compact?: boolean; sign?: boolean } = {}): string {
  const n = toNumber(value);
  const s = opts.compact && Math.abs(n) >= 100_000 ? usdCompact.format(n) : usd.format(n);
  if (opts.sign && n > 0) return `+${s}`;
  return s;
}

/** Crypto quantities: up to 8 decimals, trailing zeros trimmed. */
export function formatCrypto(value: unknown, symbol?: string): string {
  const n = toNumber(value);
  const s = n.toLocaleString("en-US", { maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 8 : 6 });
  return symbol ? `${s} ${symbol.toUpperCase()}` : s;
}

/** Market prices: small prices get more precision. */
export function formatPrice(value: unknown): string {
  const n = toNumber(value);
  if (n !== 0 && Math.abs(n) < 1) {
    return "$" + n.toLocaleString("en-US", { maximumSignificantDigits: 4 });
  }
  return usd.format(n);
}

export function formatPercent(value: unknown, digits = 2): string {
  const n = toNumber(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function formatDate(value: string | Date | null | undefined, style: "short" | "medium" | "long" = "medium"): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { dateStyle: style });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value, "medium");
}

export function maskAccount(accountNumber: string | null | undefined): string {
  if (!accountNumber) return "N/A";
  return `•••• ${accountNumber.slice(-4)}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ACCOUNT_LABEL: Record<string, string> = {
  checking: "Everyday Checking",
  savings: "High Yield Savings",
  business: "Business Account",
  investment: "Investment Account",
};

export function accountLabel(account: { accountName?: string | null; accountType?: string } | null | undefined): string {
  if (!account) return "Account";
  return account.accountName || ACCOUNT_LABEL[account.accountType || ""] || titleCase(account.accountType) || "Account";
}

/** Human description of a ledger entry type. */
export const TX_TYPE_LABEL: Record<string, string> = {
  transfer: "Transfer",
  internal_transfer: "Transfer",
  international_transfer: "International wire",
  bill_payment: "Bill payment",
  investment: "Investment",
  credit: "Credit",
  admin_credit: "Account credit",
  admin_debit: "Account debit",
  loan_disbursement: "Loan disbursement",
  crypto_buy: "Crypto purchase",
  crypto_sell: "Crypto sale",
  crypto_deposit: "Crypto deposit",
  crypto_withdrawal: "Crypto withdrawal",
  deposit: "Deposit",
};
