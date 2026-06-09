/**
 * Order Service
 * Handle order operations
 */

import { apiGet, apiPost, apiPut } from './api.js';

export const orderService = {
  /**
   * Create order from cart
   */
  async createFromCart(data) {
    return apiPost('/orders', data);
  },
  
  /**
   * Get buyer's orders
   */
  async getBuyerOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/orders/buyer${params ? '?' + params : ''}`);
  },
  
  /**
   * Get seller's orders
   */
  async getSellerOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/orders/seller${params ? '?' + params : ''}`);
  },
  
  /**
   * Get order by ID
   */
  async getOrderById(id) {
    return apiGet(`/orders/${id}`);
  },
  
  /**
   * Cancel order
   */
  async cancelOrder(id) {
    return apiPost(`/orders/${id}/cancel`, {});
  },
  
  /**
   * Mark order as dispatched
   */
  async markDispatched(id) {
    return apiPost(`/orders/${id}/dispatch`, {});
  },
  
  /**
   * Mark order as delivered
   */
  async markDelivered(id) {
    return apiPost(`/orders/${id}/delivered`, {});
  },

  async markPaid(id) {
    return apiPost(`/orders/${id}/paid`, {});
  },
  
  /**
   * Mark order as completed
   */
  async completeOrder(id) {
    return apiPost(`/orders/${id}/complete`, {});
  }
};
