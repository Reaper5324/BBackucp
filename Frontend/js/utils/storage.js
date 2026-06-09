/**
 * Storage Utility Module
 * Wrapper for localStorage and sessionStorage
 */

import { STORAGE_KEYS } from '../config.js';

class StorageManager {
  /**
   * Get from localStorage
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Set to localStorage
   */
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  /**
   * Remove from localStorage
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }
  
  /**
   * Clear all localStorage
   */
  clear() {
    localStorage.clear();
  }
  
  /**
   * Get cart from localStorage
   */
  getCart() {
    return this.getItem(STORAGE_KEYS.CART) || [];
  }
  
  /**
   * Set cart to localStorage
   */
  setCart(cart) {
    this.setItem(STORAGE_KEYS.CART, cart);
  }
  
  /**
   * Clear cart
   */
  clearCart() {
    this.removeItem(STORAGE_KEYS.CART);
  }
  
  /**
   * Get preferences
   */
  getPreferences() {
    return this.getItem(STORAGE_KEYS.PREFERENCES) || {};
  }
  
  /**
   * Set preferences
   */
  setPreferences(prefs) {
    this.setItem(STORAGE_KEYS.PREFERENCES, prefs);
  }
  
  /**
   * Get filters
   */
  getFilters() {
    return this.getItem(STORAGE_KEYS.FILTERS) || {};
  }
  
  /**
   * Set filters
   */
  setFilters(filters) {
    this.setItem(STORAGE_KEYS.FILTERS, filters);
  }
}

export const storage = new StorageManager();
