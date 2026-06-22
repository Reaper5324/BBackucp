//local storage

import { STORAGE_KEYS } from '../config.js';

class StorageManager {
 //get from LS
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  
//set to LS
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  removeItem(key) {
    localStorage.removeItem(key);
  }
  

  clear() {
    localStorage.clear();
  }
  
 
  getCart() {
    return this.getItem(STORAGE_KEYS.CART) || [];
  }
  
  setCart(cart) {
    this.setItem(STORAGE_KEYS.CART, cart);
  }
  

  clearCart() {
    this.removeItem(STORAGE_KEYS.CART);
  }
  

  getPreferences() {
    return this.getItem(STORAGE_KEYS.PREFERENCES) || {};
  }
  
  
  setPreferences(prefs) {
    this.setItem(STORAGE_KEYS.PREFERENCES, prefs);
  }
  

  getFilters() {
    return this.getItem(STORAGE_KEYS.FILTERS) || {};
  }
  

  setFilters(filters) {
    this.setItem(STORAGE_KEYS.FILTERS, filters);
  }
}

export const storage = new StorageManager();
