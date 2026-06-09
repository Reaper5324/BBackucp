function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function itemProduct(item) {
  return item.product || item;
}

export function createCartItem(item) {
  const product = itemProduct(item);
  const productId = item.product_id || product.id;
  const price = item.price || product.price || item.unit_price || 0;
  const quantity = Number(item.quantity || 1);
  const subtotal = item.subtotal || price * quantity;

  return `
    <div class="cart-item table-row" data-product-id="${productId}">
      <div class="col-product cart-product">
        <img src="${assetUrl(product.image_path)}" alt="${product.title || 'Product'}">
        <span>${product.title || 'Product'}</span>
      </div>
      <div class="col-price">${money(price)}</div>
      <div class="col-quantity">
        <input class="quantity-input form-control" type="number" min="1" value="${quantity}">
      </div>
      <div class="col-subtotal">${money(subtotal)}</div>
      <div class="col-actions">
        <button class="remove-btn btn btn-danger btn-sm">Remove</button>
      </div>
    </div>
  `;
}
import { assetUrl } from '../utils/assets.js';

