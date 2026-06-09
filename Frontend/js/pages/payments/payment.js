/**
 * Payment Page Module
 * Handles PayFast payment redirect
 */

export async function paymentPage() {
  return `
    <div class="payment-container">
      <div class="payment-content">
        <h1>Processing Payment...</h1>
        <p>You are being redirected to PayFast for payment.</p>
        <p class="text-muted">Please wait, do not refresh or close this page.</p>
      </div>
    </div>
  `;
}

export function initPaymentPage() {
  // Payment is typically handled by PayFast redirect
  // This page shows while user is redirected
}
