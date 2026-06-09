import { productService } from '../../services/productService.js';

export async function sellerAnalyticsPage() {
  let products = [];
  try {
    const response = await productService.getMine();
    products = response.success ? response.data : [];
  } catch {
    products = [];
  }

  const active = products.filter((product) => product.status === 'active').length;
  const stock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const value = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);

  return `
    <div class="admin-dashboard">
      <header class="profile-header-card"><div><h1>Sales Analytics</h1><p>Snapshot of your current listings.</p></div></header>
      <section class="stats-grid">
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${products.length}</div><div class="stat-label">Listings</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${active}</div><div class="stat-label">Active Products</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${stock}</div><div class="stat-label">Units In Stock</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">R${value.toFixed(2)}</div><div class="stat-label">Inventory Value</div></div></div>
      </section>
    </div>
  `;
}
