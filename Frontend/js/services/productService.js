/**
 * Product Service
 * Handle product operations
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const productService = {
  /**
   * Get all products with filters
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(normalizeProductFilters(filters)).toString();
    return apiGet(`/products${params ? '?' + params : ''}`);
  },
  
  /**
   * Get product by ID
   */
  async getById(id) {
    return apiGet(`/products/${id}`);
  },
  
  /**
   * Get featured products
   */
  async getFeatured() {
    return apiGet('/products?featured=true');
  },
  
  /**
   * Get seller's products
   */
  async getMine() {
    return apiGet('/products/mine');
  },
  
  /**
   * Create product
   */
  async create(formData) {
    return apiPost('/products', formData, {
      headers: {} // Let browser handle FormData headers
    });
  },
  
  /**
   * Update product
   */
  async update(id, data) {
    if (data instanceof FormData) {
      return apiPost(`/products/${id}`, data, { headers: {} });
    }

    return apiPut(`/products/${id}`, data);
  },
  
  /**
   * Delete product
   */
  async delete(id) {
    return apiDelete(`/products/${id}`);
  },
  
  /**
   * Search products
   */
  async search(query) {
    return apiGet(`/products/search?q=${encodeURIComponent(query)}`);
  },
  
  /**
   * Get categories
   */
  async getCategories() {
    return apiGet('/categories');
  }
};

function normalizeProductFilters(filters = {}) {
  const normalized = { ...filters };
  if (normalized.categoryId) {
    normalized.category_id = normalized.categoryId;
    delete normalized.categoryId;
  }
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === null || normalized[key] === undefined || normalized[key] === '') {
      delete normalized[key];
    }
  });
  return normalized;
}
