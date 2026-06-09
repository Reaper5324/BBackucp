import { productService } from '../../services/productService.js';

export async function adminCategoriesPage() {
  let categories = [];
  try {
    const response = await productService.getCategories();
    categories = response.success ? response.data : [];
  } catch {
    categories = [];
  }

  return `
    <div class="admin-products">
      <header class="profile-header-card"><div><h1>Categories</h1><p>Current marketplace category taxonomy.</p></div></header>
      <section class="settings-grid">
        ${categories.map((category) => `
          <article class="settings-card">
            <h2>${category.name}</h2>
            <p>${category.description || 'No description provided.'}</p>
          </article>
        `).join('') || '<div class="empty-state"><p>No categories found.</p></div>'}
      </section>
    </div>
  `;
}
