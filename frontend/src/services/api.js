const API_BASE = import.meta.env.VITE_API_BASE || '';

export const getAuthToken = () => window.localStorage.getItem('rag_auth_token');
export const setAuthToken = (token) => window.localStorage.setItem('rag_auth_token', token);
export const clearAuthToken = () => window.localStorage.removeItem('rag_auth_token');

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

export const apiUrl = (path) => `${API_BASE}${path}`;

export const login = async (username, password) => {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Login failed');
  setAuthToken(data.token);
  return data;
};

export const fetchJson = async (path, { timeoutMs = 90_000, ...options } = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: { ...jsonHeaders, ...options.headers, Authorization: `Bearer ${getAuthToken() || ''}` },
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'API request failed');
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
    headers: { Authorization: `Bearer ${getAuthToken() || ''}` },
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
