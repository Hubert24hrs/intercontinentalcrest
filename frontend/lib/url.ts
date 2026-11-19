/** Read a query-string parameter on the client (null during server rendering). */
export function queryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Pick an account: the requested one if it exists, else the first of the preferred type, else the first. */
export function pickAccount<T extends { id: string; accountType?: string }>(accounts: T[], requested?: string | null, preferType = "checking"): T | undefined {
  return accounts.find((a) => a.id === requested) || accounts.find((a) => a.accountType === preferType) || accounts[0];
}
