/**
 * Payment Status Page Module
 * Shows payment result from PayFast
 * NOTE: Demo mode — marks order paid directly on return, bypassing ITN
 */

import { orderService } from '../../services/orderService.js';

// ─── Page render ─────────────────────────────────────────────────────────────

export async function paymentStatusPage(status) {
  if (status !== 'success') {
    return `
      <div class="payment-status-container">
        <div class="error-message">
          <div class="icon">✕</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment was not completed.</p>
          <a href="#/cart" class="btn btn-primary">Back to Cart</a>
        </div>
      </div>
    `;
  }

  // Render a holding state — initPaymentStatusPage() takes over after DOM is set
  return `
    <div class="payment-status-container">
      <div id="payment-result">
        <div class="confirming-message">
          <div class="spinner"></div>
          <h1>Confirming Payment...</h1>
          <p>Please wait...</p>
        </div>
      </div>
    </div>
  `;
}

// ─── Init (called by router after innerHTML is set) ───────────────────────────

export async function initPaymentStatusPage(status) {
  if (status !== 'success') return;

  const orderId = getOrderIdFromUrl();

  if (!orderId) {
    renderResult('error', 'Could not determine your order. Please check your <a href="#/orders">orders page</a>.');
    return;
  }

  try {
    const response = await orderService.markPaid(orderId);

    if (response.success) {
      renderResult('success');
    } else {
      renderResult('error', response.error || 'Failed to confirm payment.');
    }
  } catch (err) {
    console.error('markPaid failed:', err);
    renderResult('error', 'Something went wrong. Check your <a href="#/orders">orders page</a>.');
  }
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function renderResult(type, customMessage = '') {
  const container = document.getElementById('payment-result');
  if (!container) return;

  if (type === 'success') {
    container.innerHTML = `
      <div class="success-message">
        <div class="icon">Successful</div>
        <h1>Payment Successful</h1>
        <p>Your order has been placed and confirmed.</p>
        <a href="#/orders" class="btn btn-primary">View Orders</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="error-message">
      <div class="icon"> error </div>
      <h1>Something Went Wrong</h1>
      <p>${customMessage || 'Please check your <a href="#/orders">orders page</a>.'}</p>
    </div>
  `;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function getOrderIdFromUrl() {
  // Hash format: #/payment/status/success?order_id=123
  // window.location.hash → "#/payment/status/success?order_id=123"
  // Split on '?' → ["#/payment/status/success", "order_id=123"]
  const hashQuery = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(hashQuery).get('order_id');
}