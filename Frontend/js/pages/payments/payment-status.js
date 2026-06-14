/**
 * Payment Status Page Module
 * Shows payment result from PayFast and polls for confirmed status via ITN
 */

import { orderService } from '../../services/orderService.js';

const MAX_ATTEMPTS   = 10;
const POLL_INTERVAL  = 2000; // ms

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
          <p>Please wait while we verify your payment with PayFast.</p>
        </div>
      </div>
    </div>
  `;
}

// ─── Init (called by router after innerHTML is set) ───────────────────────────

export function initPaymentStatusPage(status) {
  // Nothing to poll on cancel — page is already in its final state
  if (status !== 'success') return;

  const orderId = getOrderIdFromUrl();

  if (!orderId) {
    renderResult('error', 'Could not determine your order. Please check your <a href="#/orders">orders page</a>.');
    return;
  }

  pollOrderStatus(orderId, 0);
}

// ─── Polling ──────────────────────────────────────────────────────────────────

async function pollOrderStatus(orderId, attempts) {
  if (attempts >= MAX_ATTEMPTS) {
    renderResult(
      'pending',
      `We're still confirming your payment. Check your <a href="#/orders">orders page</a> in a moment.`
    );
    return;
  }

  try {
    const response = await orderService.getOrderById(orderId);

    if (!response.success) {
      // Fetch failed — retry
      scheduleNext(orderId, attempts);
      return;
    }

    const orderStatus = response.data?.status;

    // Any post-payment status counts as confirmed
    if (['paid', 'dispatched', 'delivered', 'completed'].includes(orderStatus)) {
      renderResult('success');
      return;
    }

    if (orderStatus === 'cancelled') {
      renderResult('error', 'Your order was cancelled.');
      return;
    }

    // Still pending — ITN hasn't arrived yet
    scheduleNext(orderId, attempts);

  } catch (err) {
    scheduleNext(orderId, attempts);
  }
}

function scheduleNext(orderId, attempts) {
  setTimeout(() => pollOrderStatus(orderId, attempts + 1), POLL_INTERVAL);
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function renderResult(type, customMessage = '') {
  const container = document.getElementById('payment-result');
  if (!container) return;

  if (type === 'success') {
    container.innerHTML = `
      <div class="success-message">
        <div class="icon">✓</div>
        <h1>Payment Successful</h1>
        <p>Your order has been placed and confirmed.</p>
        <a href="#/orders" class="btn btn-primary">View Orders</a>
      </div>
    `;
    return;
  }

  if (type === 'pending') {
    container.innerHTML = `
      <div class="warning-message">
        <div class="icon">⏳</div>
        <h1>Payment Submitted</h1>
        <p>${customMessage}</p>
      </div>
    `;
    return;
  }

  // error
  container.innerHTML = `
    <div class="error-message">
      <div class="icon">✕</div>
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