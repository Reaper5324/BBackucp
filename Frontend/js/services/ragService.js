import { apiGet, apiPost } from './api.js';

export const ragService = {
  ask(question) {
    return apiPost('/rag/ask', { question }, { timeout: 60000, skipAuthRedirect: true });
  },

  health() {
    return apiGet('/rag/health', { timeout: 10000, skipAuthRedirect: true });
  }
};