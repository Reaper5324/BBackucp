/**
 * Buyer Orders Page Module
 * Displays buyer's orders and order history
 */

import { orderService } from '../../services/orderService.js';
import { showNotification } from '../../components/notifications.js';

function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

let currentFilter = 'all';

export async function buyerOrdersPage() {
  try {
    const response = await orderService.getBuyerOrders();
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    const orders = response.data || [];
    const filteredOrders = filterOrders(orders, currentFilter);
    
    return `
      <div class="main-layout">
        <div class="orders-container">
          <div class="orders-header">
            <h1>My Orders</h1>
            <p>Track your purchases</p>
          </div>
          
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
              All Orders (${orders.length})
            </button>
            <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
              Pending (${orders.filter(o => o.status === 'pending').length})
            </button>
            <button class="filter-btn ${currentFilter === 'paid' ? 'active' : ''}" data-filter="paid">
              Paid (${orders.filter(o => o.status === 'paid').length})
            </button>
            <button class="filter-btn ${currentFilter === 'dispatched' ? 'active' : ''}" data-filter="dispatched">
              Dispatched (${orders.filter(o => o.status === 'dispatched').length})
            </button>
            <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
              Completed (${orders.filter(o => o.status === 'completed').length})
            </button>
          </div>
          
          <!-- Orders List -->
          ${filteredOrders.length === 0
            ? `
              <div class="empty-state">
                <p>No orders yet</p>
                <a href="#/products" class="btn btn-primary">Start Shopping</a>
              </div>
            `
            : `
              <div class="buyer-orders-grid">
                ${filteredOrders.map(order => {
                  // Get the first product image if available
                  const productImage = order.items && order.items[0] && order.items[0].product_image 
                    ? order.items[0].product_image 
                    : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';
                  return `
                  <div class="buyer-order-card" data-order-id="${order.id}">
                    <div class="order-card-image">
                      <img src="${productImage}" alt="Product" class="order-product-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'">
                    </div>
                    
                    <div class="order-card-header">
                      <div class="order-id-section">
                        <h3 class="order-id">Order #${order.id}</h3>
                        <span class="order-date">${formatDate(order.created_at)}</span>
                      </div>
                      <span class="status-badge badge-${order.status || 'pending'}">${order.status || 'pending'}</span>
                    </div>
                    
                    <div class="order-card-body">
                      <div class="order-info-row">
                        <span class="label">Total Amount</span>
                        <span class="value">${money(order.total_amount || order.total)}</span>
                      </div>
                      <div class="order-info-row">
                        <span class="label">Status</span>
                        <span class="value text-capitalize">${order.status || 'pending'}</span>
                      </div>
                      <div class="order-info-row">
                        <span class="label">Items</span>
                        <span class="value">${order.item_count || 1} item(s)</span>
                      </div>
                    </div>
                    
                    <div class="order-card-footer">
                      <a href="#/orders/${order.id}" class="btn btn-primary btn-sm">View Details</a>
                    </div>
                  </div>
                `;
                }).join('')}
              </div>
            `
          }
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading orders:', error);
    return `
      <div class="error-container">
        <p>Failed to load orders. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

export function initBuyerOrdersPage() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      currentFilter = e.target.dataset.filter;
      
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Reload
      const html = await buyerOrdersPage();
      document.getElementById('app').innerHTML = html;
      initBuyerOrdersPage();
    });
  });
  
  // Order card click handlers
  document.querySelectorAll('.buyer-order-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Only navigate if clicking on the card itself, not on the button
      if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
        const orderId = card.dataset.orderId;
        window.location.hash = `#/orders/${orderId}`;
      }
    });
  });
}

function filterOrders(orders, filter) {
  if (filter === 'all') return orders;
  return orders.filter(o => o.status === filter);
}
