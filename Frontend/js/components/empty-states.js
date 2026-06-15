/**
 * Empty State Component
 * Reusable empty state cards with consistent styling
 */

/**
 * Create an empty state card
 * @param {string} icon - Text label for the empty state
 * @param {string} title - Main title text
 * @param {string} message - Description text
 * @param {Object} action - Optional action button
 * @param {string} action.label - Button label
 * @param {string} action.href - Navigation link
 * @param {string} action.onclick - Click handler (if no href)
 * @returns {string} HTML for empty state
 */
export function createEmptyState( title, message, action = null) {
  const actionHtml = action
    ? `<a href="${action.href || '#'}" class="btn btn-primary btn-sm" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.label}</a>`
    : '';

  return `
    <div class="empty-state">
     
      <h3>${title}</h3>
      <p>${message}</p>
      ${actionHtml}
    </div>
  `;
}

export function emptyProductsState() {
  return createEmptyState(
    
    'No Products Found',
    'There are no products matching your search. Try adjusting your filters or browse all products.',
    { label: 'Browse All Products', href: '#/products' }
  );
}

export function emptyCartState() {
  return createEmptyState(
    
    'Your Cart is Empty',
    'Start shopping to add items to your cart. Browse our marketplace for great deals!',
    { label: 'Start Shopping', href: '#/products' }
  );
}

export function emptyOrdersState() {
  return createEmptyState(
    
    'No Orders Yet',
    'You haven\'t placed any orders yet. Explore products and make your first purchase!',
    { label: 'Browse Products', href: '#/products' }
  );
}

export function emptyWishlistState() {
  return createEmptyState(
    
    'Wishlist is Empty',
    'Add products to your wishlist to save them for later. Start exploring the marketplace!',
    { label: 'Browse Products', href: '#/products' }
  );
}

export function emptyMessagesState() {
  return createEmptyState(
    
    'No Messages',
    'You don\'t have any messages yet. Start messaging with sellers or buyers!',
    { label: 'Browse Products', href: '#/products' }
  );
}

export function emptyReviewsState() {
  return createEmptyState(
    
    'No Reviews Yet',
    'Be the first to review this product! Share your experience with the community.',
    null
  );
}

export function emptyListingsState() {
  return createEmptyState(
    'Listings',
    'No Products Listed',
    'You haven\'t listed any products yet. Start selling on Bater today!',
    { label: 'Create Your First Listing', href: '#/products/create' }
  );
}

export function noResultsState(query = '') {
  const msg = query
    ? `No results found for "${query}". Try a different search term.`
    : 'No results found. Try adjusting your search or filters.';

  return createEmptyState(
    'Search',
    'No Results',
    msg,
    null
  );
}

export function errorState(message = 'Something went wrong. Please try again.') {
  return `
    <div class="empty-state">
      <div class="empty-icon" style="background: linear-gradient(135deg, #FEE2E2, #FEF3C7); color: #991B1B; border-color: #FECACA;">Error</div>
      <h3>Error Loading Content</h3>
      <p>${message}</p>
    </div>
  `;
}
