/**
 * Admin Products Moderation Page Module
 * Moderate products and manage listings
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

export async function productsPage() {
  try {
    const response = await adminService.getProducts();
    const products = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="admin-products">
          <h1>Product Moderation</h1>
          
          <div class="profile-header-card">
           
            
            <div class="profile-header-card">
              ${products.map(p => `
                <div class="settings-card" data-product-id="${p.id}">
                  <div class="settings-card">${p.title}</div>
                  <div class="col-seller">${p.seller_name}</div>
                  <div class="col-price">R${Number(p.price || 0).toFixed(2)}</div>
                  <div class="col-status">
                    <span class="badge badge-${p.status === 'active' ? 'success' : 'warning'}">
                      ${p.status || 'active'}
                    </span>
                  </div>
                  <div class="col-actions">
                    <button class="remove-product-btn btn btn-danger btn-sm">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load products</p></div>`;
  }
}

export function initProductsPage() {
  document.querySelectorAll('.remove-product-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Remove this product?')) {
        const productId = btn.closest('[data-product-id]').dataset.productId;
        try {
          const response = await adminService.removeProduct(productId);
          if (response.success) {
            showNotification('Product removed', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to remove', 'error');
        }
      }
    });
  });
}
