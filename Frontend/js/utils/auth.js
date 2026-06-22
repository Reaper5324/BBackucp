

import { API_BASE_URL, STORAGE_KEYS, ROLES } from '../config.js';

class AuthManager {
 
  isAuthenticated() {
    return !!this.getUser();
  }
  
 
  getUser() {
    const userJson = sessionStorage.getItem(STORAGE_KEYS.USER);
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }
  
  
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
  
 
  hasAnyRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }
  
  
  isBuyer() {
    return this.hasRole(ROLES.BUYER);
  }
  
  
  isSeller() {
    return this.hasRole(ROLES.SELLER);
  }
  
  
  isAdmin() {
    return this.hasRole(ROLES.ADMIN);
  }
  
  
  getUserId() {
    return this.getUser()?.id;
  }
  
  /**
   * Get authentication token
   */
  getToken() {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
 
  setToken(token) {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }
  
 
  clear() {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
 
  logout() {
    this.clear();
    window.location.hash = '#/login';
  }
}

export const auth = new AuthManager();
