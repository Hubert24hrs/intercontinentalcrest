const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important to send/receive cookies
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
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
};
