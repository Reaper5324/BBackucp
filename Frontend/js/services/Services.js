/**
 * Review Service
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const reviewService = {
  async create(data) {
    return apiPost('/reviews', data);
  },
  
  async getByProduct(productId) {
    return apiGet(`/reviews/product/${productId}`);
  },
  
  async delete(id) {
    return apiDelete(`/reviews/${id}`);
  }
};

/**
 * Message Service
 */
export const messageService = {
  async getThreads(userId) {
    // Fetch all message threads for a specific user
    // Returns all conversations where user is sender or receiver
    if (!userId) {
      return { success: false, data: [], error: 'User ID required' };
    }
    // Note: Backend endpoint needs to be implemented to filter messages by user
    // For now this endpoint is not available - used by seller dashboard when built
    return apiGet(`/messages/threads?user_id=${userId}`);
  },
  
  async getThread(productId, userId) {
    const params = new URLSearchParams({ product_id: productId, user_id: userId }).toString();
    return apiGet(`/messages?${params}`);
  },
  
  async send(receiverId, productId, body) {
    return apiPost('/messages', { receiver_id: receiverId, product_id: productId, body });
  }
};

/**
 * Payment Service
 */
export const paymentService = {
  async initiatePayment(orderId, data) {
    return apiPost(`/payments/initiate`, { order_id: orderId, ...data });
  },
  
  
  async getPaymentForOrder(orderId) {
    return apiGet(`/payments/orders/${orderId}`);
  }
};

/**
 * User Service
 */
export const userService = {
  async getProfile() {
    return apiGet('/profile');
  },

  async update(data) {
    return apiPut('/profile', data);
  },
  
  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('picture', file);
    return apiPost('/profile/picture', formData);
  },
  
  async changePassword(oldPassword, newPassword) {
    return apiPost('/profile/password', { current_password: oldPassword, new_password: newPassword });
  }
};

/**
 * Verification Service
 */
export const verificationService = {
  async submit(formData) {
    return apiPost('/verification', formData);
  },
  
  async getStatus() {
    return apiGet('/verification/status');
  },
  
  async getDocuments() {
    return apiGet('/verification/status');
  }
};

/**
 * Admin Service
 */
export const adminService = {
  async getDashboard() {
    return apiGet('/admin/dashboard');
  },
  
  async getUsers() {
    return apiGet('/admin/users');
  },

  async getSellers() {
    return apiGet('/admin/sellers');
  },
  
  async getVerifications() {
    return apiGet('/admin/verifications');
  },
  
  async getLogs() {
    return apiGet('/admin/logs');
  },

  async getReports() {
    return apiGet('/admin/reports');
  },

  async getSettings() {
    return apiGet('/admin/settings');
  },
  
  async suspendUser(userId) {
    return apiPost(`/admin/users/${userId}/suspend`, {});
  },

  async reinstateUser(userId) {
    return apiPost(`/admin/users/${userId}/reinstate`, {});
  },
  
  async toggleUserStatus(userId, isActive = true) {
    return isActive ? this.suspendUser(userId) : this.reinstateUser(userId);
  },

  async getProducts() {
    return apiGet('/admin/products');
  },

  async removeProduct(productId) {
    return apiPost(`/admin/products/${productId}/remove`, {});
  },

  async approveVerification(verificationId) {
    return apiPost(`/admin/verifications/${verificationId}/approve`, {});
  },
  
  async rejectVerification(verificationId) {
    return apiPost(`/admin/verifications/${verificationId}/reject`, {});
  },

  async getSupportTickets() {
    return apiGet('/admin/support');
  },

  async getSupportTicketsByStatus(status) {
    return apiGet(`/admin/support/status/${status}`);
  },

  async getSupportTicketDetail(ticketId) {
    // Note: This endpoint is not yet implemented in backend
    // Requires adding a GET /admin/support/{id} endpoint
    // For now, we'll fetch all and filter client-side
    const response = await this.getSupportTickets();
    if (response.success) {
      const ticket = response.data.find(t => t.id == ticketId);
      return ticket ? { success: true, data: ticket } : { success: false, error: 'Ticket not found' };
    }
    return response;
  },

  async resolveSupportTicket(ticketId) {
    return apiPost(`/admin/support/${ticketId}/resolve`, {});
  }
};
