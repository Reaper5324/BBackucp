import { auth } from '../utils/auth.js';
import { orderService } from '../services/orderService.js';
import { productService } from '../services/productService.js';
import { userService } from '../services/services.js';

function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

export async function dashboardPage() {
  const user = auth.getUser();
  const role = user?.role || 'buyer';
  const isSeller = role === 'seller';

  if (isSeller) {
    return buildSellerDashboard();
  } else {
    return buildBuyerDashboard();
  }
}

async function buildSellerDashboard() {
  try {
    const [ordersRes, productsRes] = await Promise.all([
      orderService.getSellerOrders(),
      productService.getMine(),
    ]);

    const orders = ordersRes.success ? ordersRes.data : [];
    const products = productsRes.success ? productsRes.data : [];

    const activeListings = products.filter(p => Number(p.stock) > 0).length;
    const pendingOrders = orders.filter(o => o.status === 'paid').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => ['completed', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const stats = [
      { icon: '', value: products.length, label: 'Products Listed' },
      { icon: '', value: activeListings, label: 'Active Listings' },
      { icon: '', value: pendingOrders, label: 'Ready to Ship' },
      { icon: '', value: money(totalRevenue), label: 'Total Revenue' },
    ];

    const links = [
      ['My Products', 'Create, edit, and remove listings.', '#/seller/products'],
      ['Add Product', 'Publish a new marketplace item.', '#/products/create'],
      ['Orders', 'Track incoming orders and dispatches.', '#/seller/orders'],
      ['Inventory', 'Monitor stock levels.', '#/seller/inventory'],
    ];

    const recentOrders = orders.slice(0, 5);

    return `
      <div class="dashboard-page">
        <header class="profile-header-card">
          <div>
            <h1>Seller Dashboard</h1>
            <p>Manage listings, inventory, and buyer activity.</p>
          </div>
        </header>

        <section class="stats-grid marketplace-stats">
          ${stats.map(item => `
            <article class="stat-card">
              <div class="stat-content">
                <div class="stat-value">${item.value}</div>
                <div class="stat-label">${item.label}</div>
              </div>
            </article>
          `).join('')}
        </section>

        <section class="settings-grid">
          ${links.map(([title, text, href]) => `
            <a class="settings-card" href="${href}">
              <h2>${title}</h2>
              <p>${text}</p>
            </a>
          `).join('')}
        </section>

        ${recentOrders.length > 0 ? `
          <section class="dashboard-recent">
            <div class="orders-header">
              <h2>Recent Orders</h2>
              <a href="#/seller/orders" class="btn btn-secondary btn-sm">View All</a>
            </div>
            <div class="product-grid">
              ${recentOrders.map(order => `
                <div class="order-card" onclick="window.location.hash='#/orders/${order.id}'">
                  <div class="card-header">
                    <h3>Order #${order.id}</h3>
                    <span class="badge badge-${getStatusColor(order.status)}">${order.status}</span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row"><strong>Buyer:</strong><span>${order.buyer_name || 'Unknown'}</span></div>
                    <div class="orders-info-row"><strong>Total:</strong><span>${money(order.total_amount)}</span></div>
                    <div class="orders-info-row"><strong>Items:</strong><span>${order.item_count || 0} items</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return `<div class="error-container"><p>Failed to load dashboard. Please try again.</p></div>`;
  }
}

async function buildBuyerDashboard() {
  try {
    const [ordersRes, profileRes] = await Promise.all([
      orderService.getBuyerOrders(),
      userService.getProfile(),
    ]);

    const orders = ordersRes.success ? ordersRes.data : [];
    const profile = profileRes.success ? profileRes.data : {};

    const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const stats = [
      { icon: '', value: orders.length, label: 'Total Orders' },
      { icon: '', value: activeOrders, label: 'Active Orders' },
      { icon: '', value: completedOrders, label: 'Completed' },
      { icon: '', value: money(totalSpent), label: 'Total Spent' },
    ];

    const links = [
      ['Browse Products', 'Find products from local sellers.', '#/products'],
      ['Cart', 'Review items ready for checkout.', '#/cart'],
      ['Orders', 'Track your purchases.', '#/orders'],
      ['Messages', 'Talk with sellers.', '#/messages'],
    ];

    const recentOrders = orders.slice(0, 5);

    return `
      <div class="dashboard-page">
        <header class="profile-header-card">
          <div>
            <h1>Welcome back, ${profile.name || 'Shopper'}</h1>
            <p>Shop, track orders, and manage your account.</p>
          </div>
        </header>

        <section class="stats-grid marketplace-stats">
          ${stats.map(item => `
            <article class="stat-card">
              <div class="stat-content">
                <div class="stat-value">${item.value}</div>
                <div class="stat-label">${item.label}</div>
              </div>
            </article>
          `).join('')}
        </section>

        <section class="settings-grid">
          ${links.map(([title, text, href]) => `
            <a class="settings-card" href="${href}">
              <h2>${title}</h2>
              <p>${text}</p>
            </a>
          `).join('')}
        </section>

        ${recentOrders.length > 0 ? `
          <section class="dashboard-recent">
            <div class="orders-header">
              <h2>Recent Orders</h2>
              <a href="#/orders" class="btn btn-secondary btn-sm">View All</a>
            </div>
            <div class="product-grid">
              ${recentOrders.map(order => `
                <div class="order-card" onclick="window.location.hash='#/orders/${order.id}'">
                  <div class="card-header">
                    <h3>Order #${order.id}</h3>
                    <span class="status-badge-${getStatusColor(order.status)}">${order.status}</span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row"><strong>Seller:</strong><span>${order.seller_name || 'Unknown'}</span></div>
                    <div class="orders-info-row"><strong>Total:</strong><span>${money(order.total_amount)}</span></div>
                    <div class="orders-info-row"><strong>Items:</strong><span>${order.item_count || 0} items</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    return `<div class="error-container"><p>Failed to load dashboard. Please try again.</p></div>`;
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'secondary',
    paid: 'info',
    dispatched: 'warning',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
  };
  return colors[status] || 'secondary';
}