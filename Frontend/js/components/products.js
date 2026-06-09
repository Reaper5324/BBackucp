function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createProductCard(product) {
  const image = assetUrl(product.image_path);
  const stock = Number(product.stock || 0);
  const rating = Number(product.rating || product.average_rating || 0);
  const seller = product.seller_name || product.seller || 'Seller';

  return `
    <article class="product-card card" data-product-id="${product.id}">
      <div class="product-card-image">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" loading="lazy" onerror="this.onerror=null;this.src='images/Images.png';">
      </div>
      <div class="card-body product-card-body">
        <div class="product-card-meta">
          <span class="badge badge-light">${escapeHtml(product.category_name || product.category || 'General')}</span>
          <span class="text-muted">${stock > 0 ? `${stock} left` : 'Out of stock'}</span>
        </div>
        <h3 class="product-card-title">${escapeHtml(product.title)}</h3>
        <p class="product-card-seller">Sold by ${escapeHtml(seller)}</p>
        <p class="product-card-description">${escapeHtml(product.description || '').slice(0, 110)}</p>
        <div class="product-card-rating">${rating > 0 ? `${rating.toFixed(1)} / 5` : 'No rating yet'}</div>
        <div class="product-card-footer">
          <strong class="product-card-price">${money(product.price)}</strong>
          <a href="#/products/${product.id}" class="btn btn-secondary btn-sm view-details-btn">View Details</a>
          <button class="btn btn-primary btn-sm add-to-cart-btn" ${stock <= 0 ? 'disabled' : ''}>Add</button>
        </div>
      </div>
    </article>
  `;
}

export function createProductFilters(filters = {}, categories = []) {
  const selectedCategory = filters.categoryId ? Number(filters.categoryId) : null;

  return `
    <form id="filter-form" class="filter-form card">
      <div class="card-body">
        <h2 class="filter-title">Find Products</h2>
        <div class="form-group">
          <label for="search" class="form-label">Search</label>
          <div class="search-input-group">
            <input id="search" name="search" type="search" class="form-control" value="${escapeHtml(filters.search || '')}" placeholder="Search items">
            <button type="button" id="search-btn" class="btn btn-primary btn-search">Search</button>
          </div>
        </div>
        <div class="form-group">
          <label for="category" class="form-label">Category</label>
          <select id="category" name="category" class="form-control">
            <option value="" ${selectedCategory === null ? 'selected' : ''}>All categories</option>
            ${categories.map(category => `
              <option value="${category.id}" ${selectedCategory === category.id ? 'selected' : ''}>
                ${escapeHtml(category.name)}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </form>
  `;
}
import { assetUrl } from '../utils/assets.js';
