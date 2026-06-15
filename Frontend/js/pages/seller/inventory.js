import { productService } from '../../services/productService.js';
import { showNotification } from '../../components/notifications.js';
import { assetUrl } from '../../utils/assets.js';

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

function createSellerProductCard(product) {
  const image = assetUrl(product.image_path);
  const stock = Number(product.stock || 0);
  const rating = Number(product.rating || product.average_rating || 0);

  return `
    <article class="product-card card" data-product-id="${product.id}">
      <div class="product-card-image">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" loading="lazy" onerror="this.onerror=null;this.src='images/Images.png';">
      </div>
      <div class="card-body product-card-body">
        <div class="product-card-meta">
          <span class="badge badge-light">${escapeHtml(product.category_name || 'General')}</span>
          <span class="badge ${stock > 0 ? 'badge-success' : 'badge-warning'}">${stock > 0 ? `${stock} left` : 'Out of stock'}</span>
        </div>
        <h3 class="product-card-title">${escapeHtml(product.title)}</h3>
        <p class="product-card-description">${escapeHtml(product.description || '').slice(0, 110)}</p>
        <div class="product-card-rating">${rating > 0 ? `${rating.toFixed(1)} / 5` : 'No rating yet'}</div>
        <div class="product-card-footer">
          <strong class="product-card-price">${money(product.price)}</strong>
          <a href="#/products/${product.id}" class="btn btn-secondary btn-sm">View</a>
          <a href="#/products/${product.id}/edit" class="btn btn-primary btn-sm">Edit</a>
        </div>
      </div>
    </article>
  `;
}

function createInventoryFilters(filters = {}, categories = []) {
  const selectedCategory = filters.categoryId ? Number(filters.categoryId) : null;

  return `
    <form id="filter-form" class="filter-form card">
      <div class="card-body">
        <h2 class="filter-title">Filter Stock</h2>
        <div class="form-group">
          <label for="search" class="form-label">Search</label>
          <div class="search-input-group">
            <input id="search" name="search" type="search" class="form-control" value="${escapeHtml(filters.search || '')}" placeholder="Search products">
            <button type="button" id="search-btn" class="btn btn-primary btn-search">Search</button>
          </div>
        </div>
        <div class="form-group">
          <label for="stock-filter" class="form-label">Stock Status</label>
          <select id="stock-filter" name="stock" class="form-control">
            <option value="" ${!filters.stockStatus ? 'selected' : ''}>All</option>
            <option value="instock" ${filters.stockStatus === 'instock' ? 'selected' : ''}>In Stock</option>
            <option value="outofstock" ${filters.stockStatus === 'outofstock' ? 'selected' : ''}>Out of Stock</option>
          </select>
        </div>
        <div class="form-group">
          <label for="category" class="form-label">Category</label>
          <select id="category" name="category" class="form-control">
            <option value="" ${selectedCategory === null ? 'selected' : ''}>All Categories</option>
            ${categories.map(c => `
              <option value="${c.id}" ${selectedCategory === c.id ? 'selected' : ''}>
                ${escapeHtml(c.name)}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <a href="#/products/create" class="btn btn-primary" style="width:100%">+ Add Product</a>
        </div>
      </div>
    </form>
  `;
}

let currentFilters = {
  search: '',
  categoryId: null,
  stockStatus: '',
};

let allProducts = [];

export async function sellerInventoryPage() {
  try {
    const [response, categoriesResponse] = await Promise.all([
      productService.getMine(),
      productService.getCategories(),
    ]);

    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }

    allProducts = response.data || [];
    const categories = categoriesResponse.success ? categoriesResponse.data : [];
    const filtered = applyFilters(allProducts, currentFilters);

    return `
      <div class="main-layout">
        <aside class="sidebar">
          ${createInventoryFilters(currentFilters, categories)}
        </aside>

        <main class="main-content">
          <div class="profile-header-card">
            <h1>Inventory</h1>
            <p>${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} listed</p>
          </div>

          ${filtered.length === 0
            ? `
              <div class="empty-state">
                <div class="empty-icon">No Items</div>
                <h2>No products found</h2>
                <p>Try adjusting your filters or <a href="#/products/create">add a product</a></p>
              </div>
            `
            : `
              <div class="product-grid">
                ${filtered.map(p => createSellerProductCard(p)).join('')}
              </div>
            `
          }
        </main>
      </div>
    `;
  } catch (error) {
    console.error('Error loading inventory:', error);
    return `
      <div class="error-container">
        <p>Failed to load inventory. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

export function initSellerInventoryPage() {
  const filterForm = document.getElementById('filter-form');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search');

  async function reload() {
    const html = await sellerInventoryPage();
    document.getElementById('app').innerHTML = html;
    initSellerInventoryPage();
  }

  if (filterForm) {
    filterForm.addEventListener('change', async (e) => {
      if (e.target.name === 'category') {
        currentFilters.categoryId = e.target.value ? parseInt(e.target.value) : null;
      }
      if (e.target.name === 'stock') {
        currentFilters.stockStatus = e.target.value;
      }
      await reload();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      currentFilters.search = (searchInput?.value || '').trim();
      await reload();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentFilters.search = (searchInput.value || '').trim();
        await reload();
      }
    });
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const productId = card.dataset.productId;
      window.location.hash = `#/products/${productId}`;
    });
  });
}

function applyFilters(products, filters) {
  return products.filter(p => {
    const matchesSearch = !filters.search ||
      p.title.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = !filters.categoryId ||
      Number(p.category_id) === Number(filters.categoryId);

    const stock = Number(p.stock || 0);
    const matchesStock = !filters.stockStatus ||
      (filters.stockStatus === 'instock' && stock > 0) ||
      (filters.stockStatus === 'outofstock' && stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });
}