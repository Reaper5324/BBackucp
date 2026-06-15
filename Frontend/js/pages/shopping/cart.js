/**
 * Shopping Cart Page Module
 * Displays items in cart with options to modify
 */

import { cartService } from '../../services/cartService.js';
import { storage } from '../../utils/storage.js';
import { createCartItem } from '../../components/cart.js';
import { showNotification } from '../../components/notifications.js';

export async function cartPage() {
  try {
    // Fetch cart
    const response = await cartService.getCart();
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    const cart = response.data || { items: [], total: 0 };
    const items = cart.items || [];
    
    return `
      <div class="main-layout">
        <div class="cart-container">
          <div class="profile-header-card">
            <h1>Shopping Cart</h1>
            <p>${items.length} ${items.length === 1 ? 'item' : 'items'}</p>
          </div>
          
          ${items.length === 0
            ? `
              <div class="empty-cart">
                
                <h2>Your cart is empty</h2>
                <p>Start shopping to add items to your cart</p>
                <a href="#/products" class="btn btn-primary">Continue Shopping</a>
              </div>
            `
            : `
              <div class="cart-content">
                <!-- Cart Items -->
                <div class="cart-items">
                  <div class="items-header">
                    <div class="col-product">Product</div>
                    <div class="col-price">Price</div>
                    <div class="col-quantity">Quantity</div>
                    <div class="col-subtotal">Subtotal</div>
                    <div class="col-actions">Actions</div>
                  </div>
                  
                  <div class="items-list">
                    ${items.map(item => createCartItem(item)).join('')}
                  </div>
                </div>
                
                <!-- Cart Summary -->
                <div class="cart-summary">
                  <div class="summary-card">
                    <h3>Order Summary</h3>
                    
                    <div class="summary-row">
                      <span>Subtotal</span>
                      <span>R${calculateSubtotal(items).toFixed(2)}</span>
                    </div>
                    
                    <div class="summary-row">
                      <span>Shipping</span>
                      <span>R0.00</span>
                    </div>
                    
                    <div class="summary-row">
                      <span>Tax</span>
                      <span>R0.00</span>
                    </div>
                    
                    <div class="summary-row total">
                      <span>Total</span>
                      <span>R${Number(cart.total || 0).toFixed(2)}</span>
                    </div>
                    
                    <button id="checkout-btn" class="btn btn-primary btn-block">
                      Proceed to Checkout
                    </button>
                    
                    <a href="#/products" class="btn btn-secondary btn-block">
                      Continue Shopping
                    </a>
                    
                    <button id="clear-cart-btn" class="btn btn-danger btn-sm">
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            `
          }
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading cart:', error);
    return `
      <div class="error-container">
        <p>Failed to load cart. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

export function initCartPage() {
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearBtn = document.getElementById('clear-cart-btn');
  
  if (!checkoutBtn) return;
  
  // Checkout button
  checkoutBtn.addEventListener('click', () => {
    window.location.hash = '#/checkout';
  });
  
  // Clear cart button
  clearBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        const response = await cartService.clearCart();
        if (response.success) {
          showNotification('Cart cleared', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to clear cart', 'error');
      }
    }
  });
  
  // Attach quantity and remove handlers
  document.querySelectorAll('.cart-item').forEach(item => {
    const quantityInput = item.querySelector('.quantity-input');
    const removeBtn = item.querySelector('.remove-btn');
    const productId = item.dataset.productId;
    
    if (quantityInput) {
      quantityInput.addEventListener('change', async (e) => {
        const quantity = parseInt(e.target.value) || 1;
        try {
          const response = await cartService.updateItem(productId, quantity);
          if (response.success) {
            showNotification('Cart updated', 'success');
            setTimeout(() => window.location.reload(), 300);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to update', 'error');
          window.location.reload();
        }
      });
    }
    
    if (removeBtn) {
      removeBtn.addEventListener('click', async () => {
        try {
          const response = await cartService.removeItem(productId);
          if (response.success) {
            showNotification('Item removed', 'success');
            setTimeout(() => window.location.reload(), 300);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to remove', 'error');
        }
      });
    }
  });
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
}
