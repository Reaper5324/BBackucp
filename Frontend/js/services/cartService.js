/**
 * Cart Service
 * Handle shopping cart operations
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.js';
import { storage } from '../utils/storage.js';

export const cartService = {
  /**
   * Get cart
   */
  async getCart() {
    return apiGet('/cart', { skipAuthRedirect: true });
  },
  
  /**
   * Add item to cart
   */
  async addItem(productId, quantity = 1) {
    return apiPost('/cart', { product_id: productId, quantity });
  },
  
  /**
   * Update cart item quantity
   */
  async updateItem(productId, quantity) {
    return apiPut(`/cart/${productId}`, { quantity });
  },
  
  /**
   * Remove item from cart
   */
  async removeItem(productId) {
    return apiDelete(`/cart/${productId}`);
  },
  
  /**
   * Clear entire cart
   */
  async clearCart() {
    return apiDelete('/cart');
  },
  
  /**
   * Get cart summary
   */
  async getCartSummary() {
    const response = await this.getCart();
    if (!response.success) return { items: [], subtotal: 0 };
    
    const items = response.data.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return { items, subtotal };
  }
};
