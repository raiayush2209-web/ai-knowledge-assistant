const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const apiUrl = (path) => `${API_BASE}${path}`;

export const fetchJson = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'API request failed');
  }
  return data;
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
    body: formData,
  });
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData?.error || `Upload failed with status ${response.status}`);
    } catch (e) {
      throw new Error(e.message || `Upload failed with status ${response.status}`);
    }
  }
  
  return await response.json();
};