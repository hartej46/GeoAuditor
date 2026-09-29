/**
 * Resolves API URL with optional VITE_API_URL override.
 * Defaults to relative paths (supported by Vite proxy locally & Vercel rewrites in production).
 */
const rawBase = import.meta.env.VITE_API_URL || '';
export const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
