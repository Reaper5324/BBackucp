function stars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

export function createReviewCard(review) {
  return `
    <article class="review-card card">
      <div class="card-body">
        <div class="review-header">
          <strong>${review.reviewer_name || review.user_name || 'Buyer'}</strong>
          <span class="stars">${stars(review.rating)}</span>
        </div>
        <p>${review.comment || ''}</p>
        <small>${review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</small>
      </div>
    </article>
  `;
}

