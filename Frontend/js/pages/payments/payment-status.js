/**
 * Payment Status Page Module
 * Shows payment result from PayFast
 */

export async function paymentStatusPage(status) {
  
  return `
    <div class="payment-status-container">
      ${status === 'success'
        ? `
          <div class="success-message">
            <div class="icon">✓</div>
            <h1>Payment Successful</h1>
            <p>Your order has been placed successfully</p>
            <a href="#/orders" class="btn btn-primary">View Orders</a>
          </div>
        `
        : `
          <div class="error-message">
            <div class="icon">✕</div>
            <h1>Payment Failed</h1>
            <p>There was an issue processing your payment</p>
            <a href="#/cart" class="btn btn-primary">Back to Cart</a>
          </div>
        `
      }
    </div>
  `;
}
