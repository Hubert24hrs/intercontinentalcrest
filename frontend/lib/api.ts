/**
 * API client. All calls go to this site's own origin (/api/*), which Next.js
 * proxies to the backend, so authentication rides on first-party httpOnly
 * cookies. No tokens are stored in localStorage.
 */
const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const NO_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/2fa/authenticate",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "same-origin" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => (refreshing = null), 0);
      });
  }
  return refreshing;
}

function messageFrom(data: any, status: number): string {
  const m = data?.message;
  if (Array.isArray(m)) return m.join(". ");
  if (typeof m === "string" && m) return m;
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return `Request failed (${status})`;
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; redirectOn401?: boolean };

async function rawFetch(path: string, options: RequestOptions) {
  const { body, ...rest } = options;
  delete rest.redirectOn401;
  const init: RequestInit = rest;
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "same-origin",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }
}

export function goToLogin() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("ic.user");
  } catch {
    /* storage unavailable */
  }
  const here = window.location.pathname + window.location.search;
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?next=${encodeURIComponent(here)}`;
  }
}

export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawFetch(path, options);

  if (res.status === 401 && !NO_REFRESH.has(path)) {
    const ok = await refreshSession();
    if (ok) res = await rawFetch(path, options);
    if (res.status === 401) {
      if (options.redirectOn401 !== false) goToLogin();
      throw new ApiError("Your session has ended. Please sign in again.", 401);
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(messageFrom(data, res.status), res.status);
  return data as T;
}

const get = <T = any>(p: string, o?: RequestOptions) => request<T>(p, { ...o, method: "GET" });
const post = <T = any>(p: string, body?: unknown, o?: RequestOptions) => request<T>(p, { ...o, method: "POST", body });
const patch = <T = any>(p: string, body?: unknown) => request<T>(p, { method: "PATCH", body });
const del = <T = any>(p: string) => request<T>(p, { method: "DELETE" });

function qs(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const authApi = {
  register: (data: { fullName: string; email: string; password: string; phone?: string; dateOfBirth?: string }) =>
    post("/auth/register", data),
  login: (data: { email: string; password: string }) => post("/auth/login", data),
  authenticate2Fa: (tempToken: string, code: string) => post("/auth/2fa/authenticate", { tempToken, code }),
  generate2Fa: () => post("/auth/2fa/generate"),
  verify2Fa: (code: string) => post("/auth/2fa/verify", { code }),
  disable2Fa: (code: string) => post("/auth/2fa/disable", { code }),
  logout: () => post("/auth/logout"),
  me: (opts?: { redirectOn401?: boolean }) => get("/auth/me", opts),
  updateProfile: (data: { fullName?: string; phone?: string }) => patch("/auth/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => patch("/auth/password", data),
  forgotPassword: (email: string) => post("/auth/forgot-password", { email }),
  resetPassword: (data: { token: string; newPassword: string }) => post("/auth/reset-password", data),
};

export const accountsApi = {
  getAccounts: () => get("/accounts"),
  getAccountDetails: (id: string) => get(`/accounts/${id}`),
  updateAccountName: (id: string, accountName: string) => patch(`/accounts/${id}`, { accountName }),
  getMonthlyStatements: (id: string) => get(`/accounts/${id}/statements`),
  downloadStatementPdf: async (id: string, year: number, month: number, accountNumber?: string) => {
    let res = await fetch(`${API_BASE}/accounts/${id}/statement/pdf${qs({ year, month })}`, { credentials: "same-origin" });
    if (res.status === 401 && (await refreshSession())) {
      res = await fetch(`${API_BASE}/accounts/${id}/statement/pdf${qs({ year, month })}`, { credentials: "same-origin" });
    }
    if (!res.ok) throw new ApiError("We couldn't generate that statement. Please try again.", res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${accountNumber || id}-${year}-${String(month).padStart(2, "0")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const transactionsApi = {
  getTransactions: (f: { accountId?: string; page?: number; limit?: number; type?: string; status?: string } = {}) =>
    get(`/transactions${qs(f)}`),
  getTransactionDetails: (id: string) => get(`/transactions/${id}`),
  initiateTransfer: (data: {
    fromAccountId: string;
    toAccountNumber: string;
    amount: number;
    description?: string;
    type?: "transfer" | "international_transfer" | "bill_payment";
  }) => post("/transactions/transfer", data),
};

export const beneficiariesApi = {
  getBeneficiaries: () => get("/beneficiaries"),
  createBeneficiary: (data: {
    beneficiaryName: string;
    accountNumber: string;
    bankName?: string;
    swiftCode?: string;
    iban?: string;
    currency?: string;
    country?: string;
    isInternational?: boolean;
  }) => post("/beneficiaries", data),
  deleteBeneficiary: (id: string) => del(`/beneficiaries/${id}`),
};

export const kycApi = {
  getKyc: () => get("/kyc/me"),
  submitKyc: (data: { documentType: string; documentFrontUrl?: string; documentBackUrl?: string; selfieUrl?: string; proofOfAddressUrl?: string }) =>
    post("/kyc/submit", data),
  getAllKyc: (f: { page?: number; limit?: number; status?: string } = {}) => get(`/kyc/admin/all${qs(f)}`),
  reviewKyc: (id: string, data: { status: "approved" | "rejected"; reviewerNotes?: string }) => patch(`/kyc/admin/${id}/review`, data),
};

export const loansApi = {
  getMyLoans: () => get("/loans/me"),
  applyLoan: (data: {
    loanType: string;
    principalAmount: number;
    termMonths: number;
    accountId?: string;
    ssnLast4: string;
    selectedCrypto?: string;
    disbursementType?: "bank" | "crypto_wallet" | "external_bank";
    disbursementDestination?: string;
  }) => post("/loans/apply", data),
  getAllLoans: (f: { page?: number; limit?: number; status?: string } = {}) => get(`/loans/admin/all${qs(f)}`),
  approveLoan: (id: string) => patch(`/loans/admin/${id}/approve`),
  rejectLoan: (id: string) => patch(`/loans/admin/${id}/reject`),
};

export const investmentsApi = {
  getMyInvestments: () => get("/investments/me"),
  createInvestment: (data: { planName: string; principalAmount: number; interestRate?: number; termMonths?: number; accountId: string }) =>
    post("/investments", data),
  closeInvestment: (id: string) => post(`/investments/${id}/close`),
  getAllInvestments: (f: { page?: number; limit?: number; status?: string } = {}) => get(`/investments/admin/all${qs(f)}`),
  updateValue: (id: string, data: { currentValue: number; status?: string }) => patch(`/investments/admin/${id}/value`, data),
};

export const cryptoApi = {
  getMarkets: () => get("/crypto/markets"),
  getPublicMarkets: () => get("/public/markets", { redirectOn401: false }),
  getCoinDetail: (coinId: string) => get(`/crypto/markets/${coinId}`),
  getHistoricalChart: (coinId: string, days = 7) => get(`/crypto/markets/${coinId}/chart${qs({ days })}`),
  getPortfolio: () => get("/crypto/portfolio"),
  buyCrypto: (data: { coinId: string; usdAmount: number; fromAccountId: string }) => post("/crypto/buy", data),
  sellCrypto: (data: { coinId: string; quantity: number; toAccountId: string }) => post("/crypto/sell", data),
  getMyOrders: (page = 1, limit = 20) => get(`/crypto/orders/me${qs({ page, limit })}`),
  getAllOrders: (page = 1, limit = 50) => get(`/crypto/admin/orders${qs({ page, limit })}`),
  getVolume: () => get("/crypto/admin/volume"),
};

export const marketApi = {
  getQuotes: () => get("/public/market-quotes", { redirectOn401: false }),
};

export const walletsApi = {
  getWallets: () => get("/wallets"),
  getHistory: (coinId?: string) => get(`/wallets/history${qs({ coinId })}`),
  depositCrypto: (data: { coinId: string; amount: number }) => post("/wallets/deposit", data),
  withdrawCrypto: (data: { coinId: string; amount: number; destinationAddress: string }) => post("/wallets/withdraw", data),
};

export const notificationsApi = {
  getMyNotifications: () => get("/notifications/me"),
  markAsRead: (id: string) => patch(`/notifications/${id}/read`),
  markAllAsRead: () => post("/notifications/read-all"),
  deleteNotification: (id: string) => del(`/notifications/${id}`),
};

export const supportApi = {
  getOrCreateConversation: () => post("/support/conversations"),
  getMessages: (conversationId: string, limit = 100) => get(`/support/conversations/${conversationId}/messages${qs({ limit })}`),
  sendMessage: (conversationId: string, content: string) => post(`/support/conversations/${conversationId}/messages`, { content }),
};

export const adminSupportApi = {
  getConversations: (page = 1, limit = 30) => get(`/admin/support/conversations${qs({ page, limit })}`),
  getMessages: (conversationId: string, limit = 100) => get(`/admin/support/conversations/${conversationId}/messages${qs({ limit })}`),
  sendMessage: (conversationId: string, content: string) => post(`/admin/support/conversations/${conversationId}/messages`, { content }),
  closeConversation: (conversationId: string) => patch(`/admin/support/conversations/${conversationId}/close`),
};

export const adminApi = {
  getStats: () => get("/admin/stats"),
  getUsers: (f: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}) => get(`/admin/users${qs(f)}`),
  getUserDetail: (id: string) => get(`/admin/users/${id}`),
  updateUserStatus: (id: string, status: string) => patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: string, role: string) => patch(`/admin/users/${id}/role`, { role }),
  toggleAccountFreeze: (accountId: string, isFrozen: boolean) => patch(`/admin/accounts/${accountId}/freeze`, { isFrozen }),
  getTransactions: (f: { page?: number; limit?: number; status?: string; search?: string } = {}) => get(`/admin/transactions${qs(f)}`),
  getAuditLogs: (page = 1, limit = 50) => get(`/admin/audit${qs({ page, limit })}`),
  deleteUser: (id: string) => del(`/admin/users/${id}`),
  creditCrypto: (userId: string, data: { coinId: string; quantity: number; reason?: string }) => post(`/admin/users/${userId}/credit-crypto`, data),
  adjustBalance: (customerId: string, data: { type: "credit" | "debit"; amount: number; accountId: string; reason: string; reference?: string }) =>
    post(`/admin/customers/${customerId}/adjust-balance`, data),
};
