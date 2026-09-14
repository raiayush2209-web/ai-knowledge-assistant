const API_BASE = import.meta.env.VITE_API_BASE || '';

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const apiUrl = (path) => `${API_BASE}${path}`;

/**
 * Register a new user
 */
export const registerUser = async ({ username, email, password }) => {
  const response = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Registration failed');
  }

  return data;
};

/**
 * Log in an existing user with username/email & password
 */
export const login = async (identifier, password) => {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Login failed');
  }

  return data;
};

/**
 * Log out user and clear the HTTP-only session cookie
 */
export const logout = async () => {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
    });
  } catch (err) {
    console.warn('[AUTH] Logout request error:', err);
  }
};

/**
 * Check current authenticated session
 */
export const getCurrentUser = async () => {
  const response = await fetch(apiUrl('/api/auth/me'), {
    method: 'GET',
    headers: jsonHeaders,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unauthenticated');
  }

  return await response.json();
};

export const fetchJson = async (path, { timeoutMs = 90_000, ...options } = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      credentials: 'include',
      headers: {
        ...jsonHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'API request failed');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The request took too long. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const postJson = async (path, body) => {
  return fetchJson(path, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
};

export const uploadFile = async (path, formData) => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: {},
    body: formData,
  });
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      const fileErrors = (errorData?.files || [])
        .filter((file) => !file.success && file.error)
        .map((file) => `${file.filename}: ${file.error}`)
        .join('; ');
      throw new Error(fileErrors || errorData?.error || `Upload failed with status ${response.status}`);
    } catch (e) {
      throw new Error(e.message || `Upload failed with status ${response.status}`);
    }
  }
  
  return await response.json();
};
