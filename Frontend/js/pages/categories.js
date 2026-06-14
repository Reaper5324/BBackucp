import { productService } from '../services/productService.js';

export async function categoriesPage() {
  let categories = [];
  try {
    const response = await productService.getCategories();
    categories = response.success ? response.data : [];
  } catch {
    categories = [];
  }

  return `
    <div class="dashboard-page">
      <header class="profile-header-card"><div><h1>Categories</h1><p>Browse the marketplace by product category.</p></div></header>
      <section class="settings-grid">
        ${categories.map((category) => `
          <a class="settings-card" href="#/products?category_id=${category.id}">
            <h2>${category.name}</h2>
            <p>${category.description || 'View products in this category.'}</p>
          </a>
        `).join('') || '<div class="empty-state"><p>No categories are available yet.</p></div>'}
      </section>
    </div>
  `;
}
