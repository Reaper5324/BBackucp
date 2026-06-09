/**
 * Seller Orders Page Module
 * Displays seller's orders for management
 */

import { orderService } from '../../services/orderService.js';
import { showNotification } from '../../components/notifications.js';

let currentFilter = 'all';

export async function sellerOrdersPage() {
  try {
    const response = await orderService.getSellerOrders();
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    const orders = response.data || [];
    const filteredOrders = filterOrders(orders, currentFilter);
    
    return `
      <div class="main-layout">
        <div class="seller-orders-container">
          <div class="orders-header">
            <h1>Sales Orders</h1>
            <p>Manage your sales and shipments</p>
          </div>
          
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
              All (${orders.length})
            </button>
            <button class="filter-btn ${currentFilter === 'paid' ? 'active' : ''}" data-filter="paid">
              Ready to Ship (${orders.filter(o => o.status === 'paid').length})
            </button>
            <button class="filter-btn ${currentFilter === 'dispatched' ? 'active' : ''}" data-filter="dispatched">
              Shipped (${orders.filter(o => o.status === 'dispatched').length})
            </button>
            <button class="filter-btn ${currentFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">
              Delivered (${orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
          
          <!-- Orders List -->
          ${filteredOrders.length === 0
            ? `
              <div class="empty-state">
                <p>No orders in this category</p>
              </div>
            `
            : `
              <div class="orders-grid">
                ${filteredOrders.map(order => `
                  <div class="order-card" data-order-id="${order.id}">
                    <div class="card-header">
                      <h3>Order #${order.id}</h3>
                      <span class="badge badge-${getStatusColor(order.status)}">${order.status}</span>
                    </div>
                    
                    <div class="card-body">
                      <div class="info-row">
                        <strong>Buyer:</strong>
                        <span>${order.buyer_name}</span>
                      </div>
                      <div class="info-row">
                        <strong>Total:</strong>
                        <span>R${Number(order.total_amount || 0).toFixed(2)}</span>
                      </div>
                      <div class="info-row">
                        <strong>Items:</strong>
                        <span>${order.item_count} items</span>
                      </div>
                      <div class="info-row">
                        <strong>Date:</strong>
                        <span>${formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    
                    <div class="card-actions">
                      ${order.status === 'paid' ? `
                        <button class="dispatch-btn btn btn-primary btn-sm" data-order-id="${order.id}">
                          Mark as Dispatched
                        </button>
                      ` : ''}
                      
                      <button class="view-btn btn btn-secondary btn-sm" data-order-id="${order.id}">
                        View Details
                      </button>
                    </div>
                  </div>
                `).join('')}
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

export function initSellerOrdersPage() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      currentFilter = e.target.dataset.filter;
      
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const html = await sellerOrdersPage();
      document.getElementById('app').innerHTML = html;
      initSellerOrdersPage();
    });
  });
  
  // Dispatch buttons
  document.querySelectorAll('.dispatch-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.orderId;
      
      try {
        const response = await orderService.markDispatched(orderId);
        if (response.success) {
          showNotification('Order marked as dispatched!', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to update order', 'error');
      }
    });
  });
  
  // View details buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.orderId;
      window.location.hash = `#/orders/${orderId}`;
    });
  });
}

function filterOrders(orders, filter) {
  if (filter === 'all') return orders;
  return orders.filter(o => o.status === filter);
}

function getStatusColor(status) {
  const colors = {
    'paid': 'info',
    'dispatched': 'warning',
    'delivered': 'success',
    'completed': 'success',
    'cancelled': 'danger'
  };
  return colors[status] || 'secondary';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}
