export function wishlistPage() {
  return `
    <div class="dashboard-page">
      <header class="settings-header"><div><h1>Wishlist</h1><p>Saved products will appear here.</p></div></header>
      <div class="empty-state">
        <p>Your wishlist is empty.</p>
        <a href="#/products" class="btn btn-primary">Browse Products</a>
      </div>
    </div>
  `;
}
