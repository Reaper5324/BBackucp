/**
 * Auth Utility Module
 * Handle authentication state and user information
 */

import { API_BASE_URL, STORAGE_KEYS, ROLES } from '../config.js';

class AuthManager {
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getUser();
  }
  
  /**
   * Get current user
   */
  getUser() {
    const userJson = sessionStorage.getItem(STORAGE_KEYS.USER);
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Set user data
   */
  setUser(userData) {
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }
  
  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getUser();
    return user?.role === role;
  }
  
  /**
   * Check if user has any of the given roles
   */
  hasAnyRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }
  
  /**
   * Check if user is a buyer
   */
  isBuyer() {
    return this.hasRole(ROLES.BUYER);
  }
  
  /**
   * Check if user is a seller
   */
  isSeller() {
    return this.hasRole(ROLES.SELLER);
  }
  
  /**
   * Check if user is an admin
   */
  isAdmin() {
    return this.hasRole(ROLES.ADMIN);
  }
  
  /**
   * Get user ID
   */
  getUserId() {
    return this.getUser()?.id;
  }
  
  /**
   * Get authentication token
   */
  getToken() {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
  /**
   * Set authentication token
   */
  setToken(token) {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }
  
  /**
   * Clear authentication
   */
  clear() {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
  /**
   * Logout user
   */
  logout() {
    this.clear();
    window.location.hash = '#/login';
  }
}

export const auth = new AuthManager();
