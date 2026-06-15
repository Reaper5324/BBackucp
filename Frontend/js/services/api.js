/**
 * API Fetch Wrapper
 * Central HTTP client for all API calls
 */

import { API_BASE_URL } from '../config.js';
import { auth } from '../utils/auth.js';
import { showNotification } from '../components/notifications.js';

/**
 * Make HTTP request
 */
export async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 30000,
    skipAuthRedirect = false // Add this new option flag
  } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include' 
  };
  
  if (body) {
    if (body instanceof FormData) {
      delete fetchOptions.headers['Content-Type'];
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (!skipAuthRedirect) { // Only clear auth if we explicitly want to
        auth.clear();
        window.location.hash = '#/login';
        throw new Error('Session expired. Please login again.');
      } else {
        // Return a structural failure object instead of wiping the user session
        return { success: false, status: 401, error: 'Unauthorized background call' };
      }
    }
    
    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(raw?.slice(0, 160) || 'Server returned an invalid response');
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timeout');
    throw error;
  }
}


/**
 * GET request
 */
export function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function apiPost(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request
 */
export function apiPut(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE request
 */
export function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH request
 */
export function apiPatch(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: 'PATCH', body });
}
