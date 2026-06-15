/**
 * Product Detail Page Module
 * Displays detailed product information with professional layout
 */

import { productService } from '../../services/productService.js';
import { cartService } from '../../services/cartService.js';
import { reviewService } from '../../services/reviewService.js';
import { messageService } from '../../services/messageService.js';
import { createReviewCard } from '../../components/reviews.js';
import { showNotification } from '../../components/notifications.js';
import { auth } from '../../utils/auth.js';
import { assetUrl } from '../../utils/assets.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadRelatedProducts(product) {
  try {
    const response = await productService.getByCategory(product.category_id, 4);
    if (response.success) {
      return response.data.filter(p => p.id !== product.id).slice(0, 4);
    }
  } catch (error) {
    console.error('Error loading related products:', error);
  }
  return [];
}

export async function productDetailPage(productId) {
  try {
    const response = await productService.getById(productId);

    if (!response.success) {
      return `<div class="error-container"><p>${escapeHtml(response.error)}</p></div>`;
    }

    const product = response.data;
    const reviewsResponse = await reviewService.getByProduct(productId);
    const reviews = reviewsResponse.success ? reviewsResponse.data : [];
    const related = await loadRelatedProducts(product);
    const user = auth.getUser();
    const isSeller = user && user.id === product.seller_id;
    const image = assetUrl(product.image_path);
    const rating = Number(product.rating || product.average_rating || 0);
    const inStock = Number(product.stock || 0) > 0;

    return `
      <div class="product-detail-page">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a href="#/products">Products</a>
          <span>/</span>
          <a href="#/products?category=${product.category_id}">${escapeHtml(product.category_name || 'Products')}</a>
          <span>/</span>
          <span>${escapeHtml(product.title)}</span>
        </div>

        <!-- Main Product Section -->
        <div class="product-detail-container">
          <!-- Image Gallery -->
          <section class="product-gallery card">
            <div class="main-image">
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.title)}"
                id="main-image"
                onerror="this.onerror=null;this.src='images/Images.png';"
              >
            </div>
            <div class="thumbnail-row">
              <button class="thumbnail is-active" type="button" title="Main image">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)} thumbnail" onerror="this.onerror=null;this.src='images/Images.png';">
              </button>
            </div>
          </section>

          <!-- Product Info -->
          <section class="product-info card">
            <div class="product-header">
              <span class="badge badge-lg">${escapeHtml(product.category_name || 'General')}</span>
              <h1 class="product-title">${escapeHtml(product.title)}</h1>
              
              <!-- Rating -->
              <div class="rating-display">
                <div class="stars"> ${rating > 0 ? rating.toFixed(1) : 'No'} / 5</div>
                <span class="review-count">(${product.review_count || 0} ${product.review_count === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>

            <!-- Description -->
            <div class="product-description">
              <h3>Description</h3>
              <p>${escapeHtml(product.description || 'No description provided.')}</p>
            </div>

            <!-- Product Details -->
            <div class="product-details" style="display: grid; gap: 0.8rem;">
              <div class="detail" style="display: flex; justify-content: space-between; padding: 0.8rem; background: #F9FAFB; border-radius: 6px;">
                <strong>Category</strong>
                <span>${escapeHtml(product.category_name || 'N/A')}</span>
              </div>
              <div class="detail" style="display: flex; justify-content: space-between; padding: 0.8rem; background: #F9FAFB; border-radius: 6px;">
                <strong>Stock Available</strong>
                <span>${Number(product.stock || 0)} units</span>
              </div>
              ${product.condition ? `
                <div class="detail" style="display: flex; justify-content: space-between; padding: 0.8rem; background: #F9FAFB; border-radius: 6px;">
                  <strong>Condition</strong>
                  <span>${escapeHtml(product.condition)}</span>
                </div>
              ` : ''}
            </div>
          </section>

          <!-- Purchase Panel -->
          <aside class="purchase-panel">
            <!-- Price Card -->
            <section class="price-card card">
              <div class="price-section">
                <div class="price">
                  <span class="currency">R</span>
                  <span class="amount">${Number(product.price || 0).toFixed(2)}</span>
                </div>
                <span class="badge ${inStock ? 'badge-success' : 'badge-danger'}">
                  ${inStock ? 'In Stock' : ' Out of Stock'}
                </span>
              </div>

              ${!isSeller ? `
                <div class="quantity-selector">
                  <label for="quantity">Quantity</label>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      max="${Number(product.stock || 0)}"
                      value="1"
                      class="form-control"
                      style="width: 70px; text-align: center;"
                    >
                    <span class="text-muted" style="font-size: 0.9rem;">/ ${Number(product.stock || 0)} available</span>
                  </div>
                </div>

                <button
                  id="add-to-cart-btn"
                  class="btn btn-primary btn-block"
                  ${inStock ? '' : 'disabled'}
                  style="margin-top: 1rem;"
                >
                  ${inStock ? ' Add to Cart' : 'Out of Stock'}
                </button>
                
              ` : `
                
              `}
            </section>

            <!-- Seller Card -->
            <section class="seller-card card">
              <h3 style="margin-top: 0;">Seller Information</h3>
              <div class="seller-summary">
                <div class="seller-avatar">${escapeHtml(String(product.seller_name || 'S').charAt(0).toUpperCase())}</div>
                <div>
                  <strong>${escapeHtml(product.seller_name || 'Marketplace Seller')}</strong>
                  <p style="margin: 0.2rem 0 0; color: var(--color-muted); font-size: 0.9rem;">Community seller</p>
                </div>
              </div>
              ${!isSeller ? `
                <button
                  id="message-seller-btn"
                  data-seller-id="${product.seller_id}"
                  class="btn btn-secondary btn-block"
                  style="margin-top: 1rem;"
                >
                  Message Seller
                </button>
              ` : ''}
            </section>
          </aside>
        </div>

        <!-- Related Products -->
        ${related.length > 0 ? `
          <section class="related-products-section card">
            <div class="section-header">
              <h2>Related Products</h2>
              <a href="#/products" class="btn btn-secondary btn-sm">Browse All</a>
            </div>
            <div class="related-product-grid">
              ${related.map((item) => `
                <a class="related-product-card" href="#/products/${item.id}" title="${escapeHtml(item.title)}">
                  <img src="${escapeHtml(assetUrl(item.image_path))}" alt="${escapeHtml(item.title)}" onerror="this.onerror=null;this.src='images/Images.png';">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span class="price-tag">R${Number(item.price || 0).toFixed(2)}</span>
                </a>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Reviews Section -->
        <section class="reviews-section card">
          <div class="section-header">
            <h2>Reviews & Ratings</h2>
            ${user && user.role !== 'admin' ? `
              <button id="write-review-btn" class="btn btn-primary btn-sm">Write a Review</button>
            ` : ''}
          </div>

          ${reviews.length === 0
            ? '<div class="empty-state compact-empty"><div class="settings-card"></div><h3>No reviews yet</h3><p>Be the first to review this product and help others!</p></div>'
            : `<div class="reviews-list">${reviews.map(r => createReviewCard(r)).join('')}</div>`
          }
        </section>
      </div>
    `;
  } catch (error) {
    console.error('Error loading product:', error);
    return `
      <div class="error-container">
        <p>Failed to load product. Please try again.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/products'">← Back to Products</button>
      </div>
    `;
  }
}

export function initProductDetailPage() {
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const messageSellerbtn = document.getElementById('message-seller-btn');
  const writeReviewBtn = document.getElementById('write-review-btn');
  const quantityInput = document.getElementById('quantity');
  const wishlistBtn = document.getElementById('wishlist-btn');

  const productId = window.location.hash.replace('#/', '').split('/')[1];

  addToCartBtn?.addEventListener('click', async () => {
    const quantity = parseInt(quantityInput.value) || 1;

    try {
      const response = await cartService.addItem(productId, quantity);
      if (response.success) {
        showNotification('Added to cart!', 'success');
      }
    } catch (error) {
      showNotification(error.message || 'Failed to add to cart', 'error');
    }
  });

  messageSellerbtn?.addEventListener('click', () => {
    window.location.hash = `#/messages/${productId}?user_id=${messageSellerbtn.dataset.sellerId}`;
  });

  writeReviewBtn?.addEventListener('click', () => {
    window.location.hash = `#/reviews/${productId}`;
  });
}
