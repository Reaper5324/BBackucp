/**
 * Order Detail Page Module
 * Displays complete order information and status
 */

import { orderService } from '../../services/orderService.js';
import { auth } from '../../utils/auth.js';
import { showNotification } from '../../components/notifications.js';

export async function orderDetailPage(orderId) {
  try {
    const response = await orderService.getOrderById(orderId);
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    const order = response.data;
    const items = Array.isArray(order.items) ? order.items : [];
    const user = auth.getUser();
    const isBuyer = user?.id === order.buyer_id;
    const isSeller = user?.id === order.seller_id;
    
    return `
      <div class="product-grid">
        <div class="order-detail-container">
          <div class="detail-header">
            <h1>Order #${order.id}</h1>
            <span class="status-badge badge-${order.status}">${order.status}</span>
          </div>
          
          <div class="detail-grid">
            <!-- Order Information -->
            <div class="detail-section">
              <h2>Order Information</h2>
              <div class="info-table">
                <div class="info-row">
                  <strong>Order Date:</strong>
                  <span>${formatDate(order.created_at)}</span>
                </div>
                <div class="info-row">
                  <strong>Total Amount:</strong>
                  <span>R${Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <strong>Status:</strong>
                  <span class="text-capitalize">${order.status}</span>
                </div>
              </div>
            </div>
            
            <!-- Buyer/Seller Information -->
            <div class="detail-section">
              <h2>Buyer Information</h2>
              <div class="order-card" data-order-id="${order.id}">
                <div class="orders-info-row">
                  <strong>Name:</strong>
                  <span>${order.buyer_name}</span>
                </div>
                <div class="orders-info-row">
                  <strong>Email:</strong>
                  <span>${order.buyer_email}</span>
                </div>
              </div>
            </div>
            
            <!-- Items -->
            <div class="detail-section full-width">
              <h2>Order Items</h2>
              <div class="order-items-grid">
                ${items.map(item => `
                  <div class="order-item-card">
                    <div class="item-card-header">
                      <h3 class="item-title">${item.product_title}</h3>
                      <span class="item-qty-badge">${item.quantity}x</span>
                    </div>
                    
                    <div class="item-card-body">
                      <div class="item-detail-row">
                        <span class="label">Unit Price</span>
                        <span class="value">R${Number(item.price || item.unit_price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div class="item-total">
                      <span class="item-total-label">Subtotal</span>
                      <span class="item-total-price">R${Number(item.total || (item.unit_price || item.price || 0) * item.quantity || 0).toFixed(2)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Timeline/Status -->
            <div class="detail-section full-width">
              <h2>Order Timeline</h2>
              <div class="timeline">
                ${createTimeline(order)}
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="detail-actions">
            ${isBuyer && order.status === 'pending' ? `
              <button id="cancel-order-btn" class="btn btn-danger">Cancel Order</button>
            ` : ''}
            ${isSeller && order.status === 'paid' ? `
              <button id="mark-dispatched-btn" class="btn btn-primary">Mark as Dispatched</button>
            ` : ''}
            <a href="${isBuyer ? '#/orders' : '#/seller/orders'}" class="btn btn-secondary">Back</a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="error-container">
        <p>Failed to load order. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/orders'">Back to Orders</button>
      </div>
    `;
  }
}

export function initOrderDetailPage() {
  const cancelBtn = document.getElementById('cancel-order-btn');
  const dispatchBtn = document.getElementById('mark-dispatched-btn');
  const orderId = window.location.hash.split('/').pop();
  
  cancelBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await orderService.cancelOrder(orderId);
        if (response.success) {
          showNotification('Order cancelled', 'success');
          setTimeout(() => window.location.hash = '#/orders', 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to cancel', 'error');
      }
    }
  });
  
  dispatchBtn?.addEventListener('click', async () => {
    try {
      const response = await orderService.markDispatched(orderId);
      if (response.success) {
        showNotification('Order updated', 'success');
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      showNotification(error.message || 'Failed to update', 'error');
    }
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function createTimeline(order) {
  const statuses = ['pending', 'paid', 'dispatched', 'delivered', 'completed'];
  const currentIndex = statuses.indexOf(order.status);
  
  return statuses.map((status, index) => `
    <div class="timeline-item ${index <= currentIndex ? 'completed' : ''}">
      <div class="timeline-dot"></div>
      <div class="timeline-label">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
    </div>
  `).join('');
}
