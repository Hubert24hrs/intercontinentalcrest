const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Silent token refresh state — shared across all concurrent requests
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function drainRefreshQueue(token: string | null) {
  refreshQueue.forEach(resolve => resolve(token));
  refreshQueue = [];
}

async function doTokenRefresh(): Promise<string | null> {
  try {
    // Send the stored refresh token in the body as a fallback for iOS Safari,
    // which blocks cross-site HTTP-only cookies (ITP). Cookies are also sent
    // via credentials:'include' for browsers that support them.
    const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: storedRefreshToken ? { 'Content-Type': 'application/json' } : undefined,
      body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const newToken = data?.accessToken ?? null;
    if (newToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', newToken);
      if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    }
    return newToken;
  } catch {
    return null;
  }
}

function buildHeaders(options: RequestInit, token?: string | null): Headers {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (t) headers.set('Authorization', `Bearer ${t}`);
  return headers;
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options),
      credentials: 'include',
    });
  } catch (netErr: any) {
    // Network failure (connection refused, offline, CORS block, browser-extension interference)
    const msg: string = netErr?.message || '';
    if (msg === 'Failed to fetch' || msg === 'Load failed' || msg.startsWith('Cannot read properties') || msg.startsWith('NetworkError')) {
      throw new Error('Unable to reach the server. Please check your connection and try again.');
    }
    throw new Error(msg || 'Network error. Please try again.');
  }

  // Guard against browser-extension interference returning a non-Response
  if (!response || typeof response.status !== 'number') {
    throw new Error('Unexpected network response. Please try again.');
  }

  // On 401, silently refresh the access token and retry once
  // Only skip refresh for the refresh and logout endpoints to avoid infinite loops
  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/logout') {
    let newToken: string | null;

    if (isRefreshing) {
      // Another request is already refreshing — wait for it
      newToken = await new Promise<string | null>(resolve => {
        refreshQueue.push(resolve);
      });
    } else {
      isRefreshing = true;
      newToken = await doTokenRefresh();
      isRefreshing = false;
      drainRefreshQueue(newToken);
    }

    if (!newToken) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('cachedUser');
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Retry original request with the fresh token
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options, newToken),
      credentials: 'include',
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.message || `Request failed with status ${response.status}`);
  }

  if (typeof window !== 'undefined') {
    if (resData && resData.accessToken) {
      localStorage.setItem('accessToken', resData.accessToken);
    }
    if (resData && resData.refreshToken) {
      localStorage.setItem('refreshToken', resData.refreshToken);
    }
    if (path.startsWith('/auth/logout')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  return resData;
}

export const authApi = {
  register: (data: any) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: (data: any) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generate2Fa: () => {
    return request('/auth/2fa/generate', {
      method: 'POST',
    });
  },

  verify2Fa: (code: string) => {
    return request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  authenticate2Fa: (tempToken: string, code: string) => {
    return request('/auth/2fa/authenticate', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
  },

  disable2Fa: (code: string) => {
    return request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  logout: () => {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  me: () => {
    return request('/auth/me');
  },

  updateProfile: (data: { fullName?: string; phone?: string }) => {
    return request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changePassword: (data: { currentPassword: string; newPassword: string }) => {
    return request('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  forgotPassword: (email: string) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: (data: { token: string; newPassword: string }) => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const accountsApi = {
  getAccounts: () => {
    return request('/accounts');
  },

  getAccountDetails: (accountId: string) => {
    return request(`/accounts/${accountId}`);
  },

  updateAccountName: (accountId: string, accountName: string) => {
    return request(`/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify({ accountName }),
    });
  },

  getMonthlyStatements: (accountId: string) => {
    return request(`/accounts/${accountId}/statements`);
  },

  downloadStatementPdf: async (accountId: string, year: number, month: number) => {
    const url = `${API_BASE}/accounts/${accountId}/statement/pdf?year=${year}&month=${month}`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to download PDF statement');
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `statement-${accountId}-${year}-${month}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};

export const transactionsApi = {
  getTransactions: (filters: { accountId?: string; page?: number; limit?: number; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.accountId) query.set('accountId', filters.accountId);
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.type) query.set('type', filters.type);
    
    return request(`/transactions?${query.toString()}`);
  },

  getTransactionDetails: (transactionId: string) => {
    return request(`/transactions/${transactionId}`);
  },

  initiateTransfer: (data: {
    senderAccountId: string;
    receiverAccountNumber: string;
    amount: number;
    description?: string;
    type?: string;
  }) => {
    return request('/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const beneficiariesApi = {
  getBeneficiaries: () => {
    return request('/beneficiaries');
  },

  createBeneficiary: (data: {
    beneficiaryName: string;
    accountNumber: string;
    bankName?: string;
    bankCode?: string;
    swiftCode?: string;
    iban?: string;
    currency?: string;
    country?: string;
    isInternational?: boolean;
  }) => {
    return request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteBeneficiary: (id: string) => {
    return request(`/beneficiaries/${id}`, {
      method: 'DELETE',
    });
  },
};

export const kycApi = {
  getKyc: () => {
    return request('/kyc/me');
  },

  submitKyc: (data: {
    documentType: string;
    documentFrontUrl?: string;
    documentBackUrl?: string;
    selfieUrl?: string;
    proofOfAddressUrl?: string;
  }) => {
    return request('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin KYC
  getAllKyc: (filters: { page?: number; limit?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.status) query.set('status', filters.status);
    return request(`/kyc/admin/all?${query.toString()}`);
  },

  reviewKyc: (id: string, data: { status: 'approved' | 'rejected'; reviewerNotes?: string }) => {
    return request(`/kyc/admin/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const loansApi = {
  getMyLoans: () => {
    return request('/loans/me');
  },

  applyLoan: (data: {
    loanType: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    accountId?: string;
    ssn?: string;
    selectedCrypto?: string;
    cryptoAmount?: number;
    disbursementType?: string;
    disbursementDestination?: string;
  }) => {
    return request('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin Loans
  getAllLoans: (filters: { page?: number; limit?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.status) query.set('status', filters.status);
    return request(`/loans/admin/all?${query.toString()}`);
  },

  approveLoan: (id: string) => {
    return request(`/loans/admin/${id}/approve`, {
      method: 'PATCH',
    });
  },

  rejectLoan: (id: string) => {
    return request(`/loans/admin/${id}/reject`, {
      method: 'PATCH',
    });
  },
};

export const investmentsApi = {
  getMyInvestments: () => {
    return request('/investments/me');
  },

  createInvestment: (data: {
    planName: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    accountId: string;
  }) => {
    return request('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  closeInvestment: (id: string) => {
    return request(`/investments/${id}/close`, {
      method: 'POST',
    });
  },
};

export const cryptoApi = {
  getMarkets: () => {
    return request('/crypto/markets');
  },

  getCoinDetail: (coinId: string) => {
    return request(`/crypto/markets/${coinId}`);
  },

  getHistoricalChart: (coinId: string, days: number = 7) => {
    return request(`/crypto/markets/${coinId}/chart?days=${days}`);
  },

  getPortfolio: () => {
    return request('/crypto/portfolio');
  },

  buyCrypto: (data: {
    coinId: string;
    coinSymbol: string;
    coinName: string;
    usdAmount: number;
    fromAccountId: string;
  }) => {
    return request('/crypto/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sellCrypto: (data: {
    coinId: string;
    coinSymbol: string;
    coinName: string;
    quantity: number;
    toAccountId: string;
  }) => {
    return request('/crypto/sell', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyOrders: (page: number = 1, limit: number = 20) => {
    return request(`/crypto/orders/me?page=${page}&limit=${limit}`);
  },

  // Admin Crypto
  getAllOrders: (page: number = 1, limit: number = 50) => {
    return request(`/crypto/admin/orders?page=${page}&limit=${limit}`);
  },

  getVolume: () => {
    return request('/crypto/admin/volume');
  },
};

export const notificationsApi = {
  getMyNotifications: () => {
    return request('/notifications/me');
  },

  markAsRead: (id: string) => {
    return request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: () => {
    return request('/notifications/read-all', {
      method: 'POST',
    });
  },

  deleteNotification: (id: string) => {
    return request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

export const adminApi = {
  getStats: () => {
    return request('/admin/stats');
  },

  getUsers: (filters: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.search) query.set('search', filters.search);
    if (filters.role) query.set('role', filters.role);
    if (filters.status) query.set('status', filters.status);
    return request(`/admin/users?${query.toString()}`);
  },

  getUserDetail: (userId: string) => {
    return request(`/admin/users/${userId}`);
  },

  updateUserStatus: (userId: string, status: string) => {
    return request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  updateUserRole: (userId: string, role: string) => {
    return request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  toggleAccountFreeze: (accountId: string, isFrozen: boolean) => {
    return request(`/admin/accounts/${accountId}/freeze`, {
      method: 'PATCH',
      body: JSON.stringify({ isFrozen }),
    });
  },

  creditAccount: (accountId: string, data: { amount: number; description?: string }) => {
    return request(`/admin/accounts/${accountId}/credit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  creditCrypto: (userId: string, data: { coinId: string; coinSymbol: string; coinName: string; quantity: number }) => {
    return request(`/admin/users/${userId}/credit-crypto`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTransactions: (filters: { page?: number; limit?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.status) query.set('status', filters.status);
    return request(`/admin/transactions?${query.toString()}`);
  },

  getAuditLogs: (page: number = 1, limit: number = 50) => {
    return request(`/admin/audit?page=${page}&limit=${limit}`);
  },

  deleteUser: (userId: string) => {
    return request(`/admin/users/${userId}`, { method: 'DELETE' });
  },
};

export const walletsApi = {
  getWallets: () => {
    return request('/wallets');
  },

  depositCrypto: (data: { coinId: string; amount: number }) => {
    return request('/wallets/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  withdrawCrypto: (data: { coinId: string; amount: number; destinationAddress: string }) => {
    return request('/wallets/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const marketApi = {
  getQuotes: () => request('/crypto/market-quotes'),
};

