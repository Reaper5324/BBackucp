/**
 * Admin Products Moderation Page Module
 * Moderate products and manage listings
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';
import { assetUrl } from '../../utils/assets.js';

//for price information
function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

export async function productsPage() {
  try {
    const response = await adminService.getProducts();
    const products = response.success ? response.data : [];
    
    return `
      <div class="admin-container">
        <div class="admin-header">
          <h1>Product Moderation</h1>
          <p>Review and moderate marketplace products</p>
        </div>

        ${products.length === 0
          ? `<div class="empty-state"><p>No products to moderate</p></div>`
          : `
            <div class="product-grid">
              ${products.map(p => `
                <div class="product-card" data-product-id="${p.id}">
                  <div class="card-header">
                    <h3>${p.title}</h3>
                    <span class="status-badge badge-${p.status === 'active' ? 'success' : 'warning'}">
                      ${p.status || 'active'}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row">
                      <strong>Seller:</strong>
                      <span>${p.seller_name}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Price:</strong>
                      <span>${money(p.price)}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Category:</strong>
                      <span>${p.category_name}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Posted:</strong>
                      <span>${new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="view-product-btn btn btn-secondary btn-sm">View</button>
                    <button class="remove-product-btn btn btn-danger btn-sm">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load products</p></div>`;
  }
}

export function initProductsPage() {
  // View product button
  document.querySelectorAll('.view-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.closest('[data-product-id]').dataset.productId;
      window.location.hash = `#/products/${productId}`;
    });
  });

  // Remove product button
  document.querySelectorAll('.remove-product-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productTitle = btn.closest('.product-card').querySelector('h3').textContent;
      if (confirm(`Remove product "${productTitle}"?`)) {
        const productId = btn.closest('[data-product-id]').dataset.productId;
        try {
          const response = await adminService.removeProduct(productId);
          if (response.success) {
            showNotification('Product removed', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to remove product', 'error');
        }
      }
    });
  });
}
