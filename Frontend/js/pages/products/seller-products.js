/**
 * Seller Products Page Module
 * Allows sellers to manage their products
 */

import { productService } from '../../services/productService.js';
import { showNotification } from '../../components/notifications.js';
import { assetUrl } from '../../utils/assets.js';

export async function sellerProductsPage() {
  try {
    const response = await productService.getMine();
    
    if (!response.success) {
      return `<div class="error-container"><p>${response.error}</p></div>`;
    }
    
    const products = response.data || [];
    
    return `
      <div class="settings-card">
        <div class="settings-card">
          <div class="header-with-action">
            <h1>My Products</h1>
            <a href="#/products/create" class="btn btn-primary">+ Add Product</a>
          </div>
          
          ${products.length === 0
            ? `
              <div class="empty-state">
                <p>You haven't listed any products yet</p>
                <a href="#/products/create" class="btn btn-primary">Create First Product</a>
              </div>
            `
           : `
  <section class="featured-section">
    <div class="products-grid">
      ${products.map(p => `
        <div class="product-card" data-product-id="${p.id}">
          <img src="${assetUrl(p.image_path)}" alt="${p.title}">
          
          <div class="product-card-content">
            <h3>${p.title}</h3>

            <p class="product-price">
              R${Number(p.price || 0).toFixed(2)}
            </p>

            <div class="product-meta">
              <span><strong>Stock:</strong> ${p.stock}</span>
              <span><strong>Sales:</strong> ${p.sales_count || 0}</span>
            </div>

            <div class="product-actions">
              <a href="#/products/${p.id}" class="btn btn-secondary btn-sm">
                View
              </a>

              <button class="edit-btn btn btn-secondary btn-sm">
                Edit
              </button>

              <button class="delete-btn btn btn-danger btn-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`
          }
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="error-container">
        <p>Failed to load products. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

export function initSellerProductsPage() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.closest('.table-row').dataset.productId;
      window.location.hash = `#/products/${productId}/edit`;
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this product?')) {
        const productId = btn.closest('.table-row').dataset.productId;
        try {
          const response = await productService.delete(productId);
          if (response.success) {
            showNotification('Product deleted', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to delete', 'error');
        }
      }
    });
  });
}
