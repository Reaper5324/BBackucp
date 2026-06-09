/**
 * Reviews Page Module
 * Submit and view product reviews
 */

import { reviewService } from '../../services/reviewService.js';
import { showNotification } from '../../components/notifications.js';

export async function reviewsPage(productId) {
  try {
    const response = await reviewService.getByProduct(productId);
    const reviews = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="reviews-container">
          <h1>Product Reviews</h1>
          
          <form id="review-form" class="review-form">
            <div class="form-group">
              <label for="rating">Rating:</label>
              <select id="rating" name="rating" class="form-control" required>
                <option value="">Select rating</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="comment">Comment:</label>
              <textarea id="comment" name="comment" class="form-control" maxlength="500"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">Submit Review</button>
          </form>
          
          <div class="reviews-list">
            ${reviews.length === 0 ? '<p>No reviews yet</p>' : reviews.map(r => `
              <div class="review-item">
                <strong>${r.buyer_name}</strong>
                <span class="stars">${'★'.repeat(r.rating)}</span>
                <p>${r.comment}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load reviews</p></div>`;
  }
}

export function initReviewsPage() {
  const form = document.getElementById('review-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const rating = document.getElementById('rating').value;
        const comment = document.getElementById('comment').value;
        const productId = window.location.hash.split('/')[2];
        
        const response = await reviewService.create({
          product_id: productId,
          rating,
          comment
        });
        
        if (response.success) {
          showNotification('Review submitted!', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to submit review', 'error');
      }
    });
  }
}
