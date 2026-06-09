/**
 * Checkout Page Module
 * Handles order creation and payment initiation
 */

import { orderService } from '../../services/orderService.js';
import { paymentService } from '../../services/paymentService.js';
import { cartService } from '../../services/cartService.js';
import { showNotification } from '../../components/notifications.js';

export async function checkoutPage() {
  try {
    // Fetch cart data
    const cartResponse = await cartService.getCart();
    if (!cartResponse.success || cartResponse.data.items.length === 0) {
      return `
        <div class="error-container">
          <p>Your cart is empty. Add items before checking out.</p>
          <a href="#/products" class="btn btn-primary">Browse Products</a>
        </div>
      `;
    }
    
    const cart = cartResponse.data;
    
    return `
      <div class="main-layout">
        <div class="checkout-container">
          <div class="checkout-header">
            <h1>Checkout</h1>
            <p>Review and confirm your order</p>
          </div>
          
          <div class="checkout-content">
            <!-- Order Review -->
            <div class="checkout-section">
              <h2>Order Review</h2>
              
              <div class="order-items">
                ${cart.items.map(item => `
                  <div class="order-item">
                    <div class="item-image">
                      <img src="${item.product.image_path || 'images/placeholder.png'}" alt="${item.product.title}">
                    </div>
                    <div class="item-details">
                      <h3>${item.product.title}</h3>
                      <p>Quantity: ${item.quantity}</p>
                      <p>Price: R${Number(item.product.price || 0).toFixed(2)}</p>
                    </div>
                    <div class="item-subtotal">
                      <strong>R${Number(item.subtotal || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Shipping Address -->
            <div class="checkout-section">
              <h2>Shipping Address</h2>
              <form id="shipping-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="street" class="form-label">Street Address</label>
                    <input type="text" id="street" name="street" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label for="city" class="form-label">City</label>
                    <input type="text" id="city" name="city" class="form-control" required>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="province" class="form-label">Province</label>
                    <select id="province" name="province" class="form-control" required>
                      <option value="">Select Province</option>
                      <option value="EC">Eastern Cape</option>
                      <option value="FS">Free State</option>
                      <option value="GP">Gauteng</option>
                      <option value="KZN">KwaZulu-Natal</option>
                      <option value="LP">Limpopo</option>
                      <option value="MP">Mpumalanga</option>
                      <option value="NC">Northern Cape</option>
                      <option value="NW">North West</option>
                      <option value="WC">Western Cape</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="postal" class="form-label">Postal Code</label>
                    <input type="text" id="postal" name="postal" class="form-control" required>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- Order Summary -->
            <div class="checkout-summary">
              <div class="summary-card">
                <h3>Order Summary</h3>
                
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>R${Number(cart.total || 0).toFixed(2)}</span>
                </div>
                
                <div class="summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                
                <div class="summary-row">
                  <span>Tax</span>
                  <span>R0.00</span>
                </div>
                
                <div class="summary-row total">
                  <span>Total Amount</span>
                  <span>R${Number(cart.total || 0).toFixed(2)}</span>
                </div>
                
                <button id="place-order-btn" class="btn btn-primary btn-block">
                  <span id="btn-text">Place Order & Pay</span>
                  <span id="spinner" class="spinner-inline hidden"></span>
                </button>
                
                <a href="#/cart" class="btn btn-secondary btn-block">Back to Cart</a>
              </div>
            </div>
          </div>
          
          <!-- Terms & Conditions -->
          <div class="checkout-footer">
            <p class="terms-text">
              By placing an order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading checkout:', error);
    return `
      <div class="error-container">
        <p>Failed to load checkout. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/cart'">Back to Cart</button>
      </div>
    `;
  }
}

export function initCheckoutPage() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  const shippingForm = document.getElementById('shipping-form');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  
  if (!placeOrderBtn) return;
  
  placeOrderBtn.addEventListener('click', async () => {
    // Validate shipping form
    if (!shippingForm.checkValidity()) {
      showNotification('Please fill in all shipping details', 'error');
      return;
    }
    
    // Show loading
    placeOrderBtn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');
    
    try {
      // Create order
      const orderResponse = await orderService.createFromCart();
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }
      
      const orderId = orderResponse.data.order_id;
      
      showNotification('Order created! Processing payment...', 'success');
      
      // Initiate payment
      const paymentResponse = await paymentService.initiatePayment(orderId);
      
      if (paymentResponse.success) {
        // Redirect to payment redirect endpoint which will auto-submit to PayFast
        window.location.href = paymentResponse.data.payment_url;
      } else {
        throw new Error(paymentResponse.error || 'Payment initiation failed');
      }
    } catch (error) {
      showNotification(error.message || 'Failed to place order', 'error');
      btnText.textContent = 'Place Order & Pay';
      spinner.classList.add('hidden');
      placeOrderBtn.disabled = false;
    }
  });
}
