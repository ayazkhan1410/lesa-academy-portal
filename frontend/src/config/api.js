/**
 * Central API configuration for local Docker and production (Vercel + remote backend).
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

export const apiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};

export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return apiUrl(path.startsWith('/') ? path : `/${path}`);
};
