/**
 * Support Service
 * Client-side support ticket management
 */

import { apiGet, apiPost } from './api.js';

export const supportService = {
  async submitTicket(data) {
    return apiPost('/support', data);
  },

  async getMyTickets() {
    return apiGet('/support/my-tickets');
  }
};
