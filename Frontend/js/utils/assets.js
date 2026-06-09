import { API_BASE_URL } from '../config.js';

export function assetUrl(path, fallback = 'images/Images.png') {
  if (!path) return fallback;

  const value = String(path);
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const normalized = value
    .replace(/^public[\\/]/, '/')
    .replace(/\\/g, '/');

  if (normalized.startsWith('/uploads/')) {
    return `${API_BASE_URL}${normalized}`;
  }

  return normalized;
}
