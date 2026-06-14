/**
 * Buyer Orders Page Module
 * Displays buyer's orders and order history
 */

import { orderService } from '../../services/orderService.js';

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
                <a href="#/products" class="btn btn-primary">
                  Start Shopping
                </a>
              </div>
            `
            : `
              <div class="orders-grid">
                ${filteredOrders.map(order => `
                  <div class="order-card" data-order-id="${order.id}">

                    <div class="card-header">
                      <h3>Order #${order.id}</h3>

                      <span class="badge badge-${order.status || 'secondary'}">
                        ${order.status || 'pending'}
                      </span>
                    </div>

                    <div class="card-body">

                      <div class="info-row">
                        <strong>Seller:</strong>
                        <span>${order.seller_name || 'Unknown Seller'}</span>
                      </div>

                      <div class="info-row">
                        <strong>Total:</strong>
                        <span>${money(order.total_amount || order.total)}</span>
                      </div>

                      <div class="info-row">
                        <strong>Items:</strong>
                        <span>${order.item_count || 0} items</span>
                      </div>

                      <div class="info-row">
                        <strong>Date:</strong>
                        <span>${formatDate(order.created_at)}</span>
                      </div>

                    </div>

                    <div class="card-actions">
                      <button
                        class="view-btn btn btn-primary btn-sm"
                        data-order-id="${order.id}">
                        View Details
                      </button>
                    </div>
                  
                    <div class="card-actions">
                      ${order.status === 'dispatched' ? `
                        <button class="dispatch-btn btn btn-primary btn-sm" data-order-id="${order.id}">
                          mark as delivered
                        </button>
                      ` : ''}

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
        <button class="btn btn-primary" onclick="window.location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

export function initBuyerOrdersPage() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      currentFilter = e.target.dataset.filter;

      document.querySelectorAll('.filter-btn')
        .forEach(b => b.classList.remove('active'));

      e.target.classList.add('active');

      const html = await buyerOrdersPage();
      document.getElementById('app').innerHTML = html;

      initBuyerOrdersPage();
    });
  });

  // View Details buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      const orderId = btn.dataset.orderId;
      window.location.hash = `#/orders/${orderId}`;
    });
  });

   document.querySelectorAll('.dispatch-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.orderId;
        
        try {
          const response = await orderService.markDelivered(orderId);
          if (response.success) {
            showNotification('Order marked as delivered!', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to update order', 'error');
        }
      });
    });

  // Card click navigation
  document.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.dataset.orderId;
      window.location.hash = `#/orders/${orderId}`;
    });
  });
}

function filterOrders(orders, filter) {
  if (filter === 'all') return orders;
  return orders.filter(o => o.status === filter);
}