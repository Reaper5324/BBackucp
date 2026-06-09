import { auth } from '../utils/auth.js';

export function dashboardPage() {
  const user = auth.getUser();
  const role = user?.role || 'buyer';
  const isSeller = role === 'seller';
  const stats = isSeller
    ? [
        { icon: 'PL', value: '-', label: 'Products Listed' },
        { icon: 'AL', value: '-', label: 'Active Listings' },
        { icon: 'OR', value: '-', label: 'Orders' },
        { icon: 'MS', value: '-', label: 'Messages' }
      ]
    : [
        { icon: 'PL', value: '-', label: 'Products Listed' },
        { icon: 'AL', value: '-', label: 'Active Listings' },
        { icon: 'OR', value: '-', label: 'Orders' },
        { icon: 'WL', value: '-', label: 'Wishlist Items' }
      ];

  const links = isSeller
    ? [
        ['My Products', 'Create, edit, and remove listings.', '#/seller/products'],
        ['Add Product', 'Publish a new marketplace item.', '#/products/create'],
        ['Orders', 'Track incoming orders and dispatches.', '#/seller/orders'],
        ['Sales Analytics', 'Review listing and revenue summaries.', '#/seller/analytics']
      ]
    : [
        ['Browse Products', 'Find products from local sellers.', '#/products'],
        ['Cart', 'Review items ready for checkout.', '#/cart'],
        ['Orders', 'Track your purchases.', '#/orders'],
        ['Messages', 'Talk with sellers.', '#/messages']
      ];

  return `
    <div class="dashboard-page">
      <header class="profile-header-card">
        <div>
          <h1>${isSeller ? 'Seller Dashboard' : 'Buyer Dashboard'}</h1>
          <p>${isSeller ? 'Manage listings, inventory, and buyer activity.' : 'Shop, track orders, and manage your account.'}</p>
        </div>
      </header>

      <section class="stats-grid marketplace-stats">
        ${stats.map((item) => `
          <article class="stat-card">
            <div class="stat-icon">${item.icon}</div>
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
    </div>
  `;
}
