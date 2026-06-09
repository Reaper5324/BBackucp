/**
 * Auth Service
 * Handle authentication operations
 */

import { apiPost, apiGet } from './api.js';
import { auth } from '../utils/auth.js';
import { storage } from '../utils/storage.js';

export const authService = {
  /**
   * Login user
   */
  async login(email, password) {
    const response = await apiPost('/auth/login', { email, password });
    if (response.success) {
      auth.setUser(normalizeUser(response.data));
    }
    return response;
  },
  
  /**
   * Register new user
   */
  async register(nameOrData, email, password, role) {
    const payload = typeof nameOrData === 'object'
      ? nameOrData
      : { name: nameOrData, email, password, role };
    const response = await apiPost('/auth/register', payload);
    if (response.success) {
      auth.setUser(normalizeUser({ ...response.data, name: payload.name, email: payload.email }));
    }
    return response;
  },
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    return apiGet('/auth/me');
  },
  
  /**
   * Logout user
   */
  async logout() {
    await apiPost('/auth/logout', {});
    auth.clear();
    storage.clearCart();
  }
};

function normalizeUser(data = {}) {
  return {
    ...data,
    id: data.id || data.user_id
  };
}
