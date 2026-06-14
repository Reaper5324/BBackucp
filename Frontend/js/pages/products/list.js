/**
 * Product List Page Module
 * Displays all products with filters and search
 */

import { productService } from '../../services/productService.js';
import { cartService } from '../../services/cartService.js';
import { createProductCard } from '../../components/products.js';
import { createProductFilters } from '../../components/products.js';
import { showNotification } from '../../components/notifications.js';

let currentFilters = {
  search: '',
  categoryId: null,
  page: 1
};

let currentProducts = [];

export async function productListPage() {
  try {
    // Load products and categories for the filters
    const [response, categoriesResponse] = await Promise.all([
      productService.getAll(currentFilters),
      productService.getCategories()
    ]);
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    currentProducts = response.data || [];
    const categories = categoriesResponse.success ? categoriesResponse.data : [];
    
    return `
      <div class="main-layout">
        <aside class="sidebar">
          ${createProductFilters(currentFilters, categories)}
        </aside>
        
        <main class="main-content">
          <div class="profile-header-card">
            <h1>All Products</h1>
            ${currentFilters.search ? `<p>Results for: <strong>${currentFilters.search}</strong></p>` : ''}
          </div>
          
          ${currentProducts.length === 0 
            ? `
              <div class="empty-state">
                <div class="empty-icon">No Items</div>
                <h2>No products found</h2>
                <p>Try adjusting your filters or search terms</p>
              </div>
            `
            : `
              <div class="product-grid">
                ${currentProducts.map(p => createProductCard(p)).join('')}
              </div>
            `
          }
        </main>
      </div>
    `;
  } catch (error) {
    console.error('Error loading products:', error);
    return `
      <div class="error-container">
        <p>Failed to load products. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

export function initProductListPage() {
  // Attach filter event listeners
  const filterForm = document.getElementById('filter-form');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search');
  
  if (filterForm) {
    filterForm.addEventListener('change', async (e) => {
      if (e.target.name === 'category') {
        currentFilters.categoryId = e.target.value ? parseInt(e.target.value) : null;
        currentFilters.page = 1;
        
        // Reload products
        const html = await productListPage();
        document.getElementById('app').innerHTML = html;
        initProductListPage();
      }
    });
  }
  
  // Search button handler
  if (searchBtn) {
    searchBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      currentFilters.search = (searchInput?.value || '').trim();
      currentFilters.page = 1;
      
      // Reload products
      const html = await productListPage();
      document.getElementById('app').innerHTML = html;
      initProductListPage();
    });
  }
  
  // Search on Enter key
  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentFilters.search = (searchInput.value || '').trim();
        currentFilters.page = 1;
        
        // Reload products
        const html = await productListPage();
        document.getElementById('app').innerHTML = html;
        initProductListPage();
      }
    });
  }
  
  // Attach product card click handlers
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn')) {
        const productId = card.dataset.productId;
        handleAddToCart(productId);
        return;
      }
      
      const productId = card.dataset.productId;
      window.location.hash = `#/products/${productId}`;
    });
  });
}

async function handleAddToCart(productId) {
  try {
    const response = await cartService.addItem(productId, 1);
    if (response.success) {
      showNotification('Added to cart!', 'success');
      // Update cart count in navbar
      updateCartCount();
    }
  } catch (error) {
    showNotification(error.message || 'Failed to add to cart', 'error');
  }
}

function updateCartCount() {
  // TODO: Implement cart count update
  const cartBtn = document.querySelector('[data-cart-count]');
  if (cartBtn) {
    // Fetch cart and update count
  }
}
