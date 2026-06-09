/**
 * Configuration Module
 * Central configuration for the frontend application
 */

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.__BATER_API_BASE_URL__) {
      return window.__BATER_API_BASE_URL__.replace(/\/+$/, '');
    }
    return 'https://bbackucp-production.up.railway.app';
  }
 return 'https://bbackucp-production.up.railway.app';
}



const CONFIG = {
  // API Configuration
  API_BASE_URL: resolveApiBaseUrl(),
  API_TIMEOUT: 30000, // 30 seconds
  
  // Application Settings
  APP_NAME: 'Bater',
  APP_VERSION: '1.0.0',
  
  // Storage Keys
  STORAGE_KEYS: {
    USER: 'bater_user',
    AUTH_TOKEN: 'bater_auth_token',
    CART: 'bater_cart',
    PREFERENCES: 'bater_preferences',
    FILTERS: 'bater_filters'
  },
  
  // Pagination
  ITEMS_PER_PAGE: 12,
  
  // Role Constants
  ROLES: {
    BUYER: 'buyer',
    SELLER: 'seller',
    ADMIN: 'admin'
  },
  
  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    DISPATCHED: 'dispatched',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETE: 'complete',
    FAILED: 'failed'
  },
  
  // Review Ratings
  RATINGS: [1, 2, 3, 4, 5],
  
  // Categories (to be fetched from API)
  CATEGORIES: [],
  
  // Notifications
  NOTIFICATION_DURATION: 3000, // 3 seconds
  
  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  
  // Validation Rules
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PRODUCT_TITLE: 200,
    MAX_PRODUCT_DESCRIPTION: 2000,
    MAX_REVIEW_LENGTH: 500,
    MAX_MESSAGE_LENGTH: 1000
  },
  
  // Pagination
  DEFAULT_LIMIT: 20,
  DEFAULT_OFFSET: 0
};

export const API_BASE_URL = CONFIG.API_BASE_URL;
export const API_TIMEOUT = CONFIG.API_TIMEOUT;
export const APP_NAME = CONFIG.APP_NAME;
export const APP_VERSION = CONFIG.APP_VERSION;
export const STORAGE_KEYS = CONFIG.STORAGE_KEYS;
export const ITEMS_PER_PAGE = CONFIG.ITEMS_PER_PAGE;
export const ROLES = CONFIG.ROLES;
export const ORDER_STATUS = CONFIG.ORDER_STATUS;
export const PAYMENT_STATUS = CONFIG.PAYMENT_STATUS;
export const RATINGS = CONFIG.RATINGS;
export const CATEGORIES = CONFIG.CATEGORIES;
export const NOTIFICATION_DURATION = CONFIG.NOTIFICATION_DURATION;
export const MAX_FILE_SIZE = CONFIG.MAX_FILE_SIZE;
export const ALLOWED_IMAGE_TYPES = CONFIG.ALLOWED_IMAGE_TYPES;
export const VALIDATION = CONFIG.VALIDATION;
export const DEFAULT_LIMIT = CONFIG.DEFAULT_LIMIT;
export const DEFAULT_OFFSET = CONFIG.DEFAULT_OFFSET;

// Export for ES6 modules
export default CONFIG;
