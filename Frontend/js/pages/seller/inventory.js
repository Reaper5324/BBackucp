import { productService } from '../../services/productService.js';

export async function sellerInventoryPage() {
  let products = [];
  try {
    const response = await productService.getMine();
    products = response.success ? response.data : [];
  } catch {
    products = [];
  }

  return `
    <div class="seller-products-container">
      <header class="profile-header-card"><div><h1>Inventory</h1><p>Monitor stock across your listings.</p></div><a href="#/products/create" class="btn btn-primary">Add Product</a></header>
      <div class="products-table">
        <div class="table-header"><div>Product</div><div>Price</div><div>Stock</div><div>Status</div><div>Action</div></div>
        <div class="table-body">
          ${products.map((product) => `
            <div class="table-row">
              <div>${product.title}</div>
              <div>R${Number(product.price || 0).toFixed(2)}</div>
              <div>${product.stock}</div>
              <div><span class="badge ${Number(product.stock) > 0 ? 'badge-success' : 'badge-warning'}">${Number(product.stock) > 0 ? 'Available' : 'Out of stock'}</span></div>
              <div><a href="#/products/${product.id}/edit" class="btn btn-secondary btn-sm">Edit</a></div>
            </div>
          `).join('') || '<div class="empty-state"><p>No products listed yet.</p></div>'}
        </div>
      </div>
    </div>
  `;
}
