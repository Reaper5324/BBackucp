/**
 * Product Create Page Module
 * Allows sellers to create new products
 */

import { productService } from '../../services/productService.js';
import { showNotification } from '../../components/notifications.js';
import { validateProductForm } from '../../utils/validators.js';
import { assetUrl } from '../../utils/assets.js';

export async function productCreatePage(productId = null) {
  // Normalize route parameter input.
  if (productId && typeof productId === 'object') {
    productId = null;
  }

  if (typeof productId === 'string') {
    const normalized = productId.trim().toLowerCase();
    if (normalized === 'null' || normalized === 'undefined' || normalized === '') {
      productId = null;
    }
  }

  // Only treat it as edit mode when we have a real id value.
  const hasRealId = productId !== null && productId !== undefined && productId !== '';
  const isEdit = hasRealId;
  let product = null;

  if (isEdit) {
    try {
      const response = await productService.getById(productId);
      product = response.success ? response.data : null;
    } catch {
      product = null;
    }

    if (!product) {
      return '<div class="error-container"><p>Product not found.</p><a class="btn btn-primary" href="#/seller/products">Back to Products</a></div>';
    }
  }

  // Fetch categories
  let categories = [];
  try {
    const response = await productService.getCategories();
    categories = response.success ? response.data : [];
  } catch (error) {
    console.error('Failed to load categories');
  }
  
  return `
    <div class="product-container">
      <div class="product-form-container">
        <div class="form-header">
          <h1>${isEdit ? 'Edit Product' : 'Create New Product'}</h1>
          <p>${isEdit ? 'Update your listing details' : 'List your product on Bater'}</p>
        </div>
        
        <form id="product-form" class="product-form" data-product-id="${productId || ''}">
          <!-- Product Title -->
          <div class="form-group">
            <label for="title" class="form-label">Product Title *</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required 
              placeholder="e.g., iPhone 14 Pro"
              maxlength="200"
              value="${product?.title || ''}"
              class="form-control"
            >
            <span class="form-hint">Maximum 200 characters</span>
            <span class="error-message" id="title-error"></span>
          </div>
          
          <!-- Category -->
          <div class="form-group">
            <label for="category" class="form-label">Category *</label>
            <select id="category" name="category_id" required class="form-control">
              <option value="">Select a category</option>
              ${categories.map(c => `<option value="${c.id}" ${Number(product?.category_id) === Number(c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
            <span class="error-message" id="category-error"></span>
          </div>
          
          <!-- Price -->
          <div class="form-group">
            <label for="price" class="form-label">Price (R) *</label>
            <input 
              type="number" 
              id="price" 
              name="price" 
              required 
              min="0"
              step="0.01"
              placeholder="0.00"
              value="${product?.price ?? ''}"
              class="form-control"
            >
            <span class="error-message" id="price-error"></span>
          </div>
          
          <!-- Stock -->
          <div class="form-group">
            <label for="stock" class="form-label">Stock Quantity *</label>
            <input 
              type="number" 
              id="stock" 
              name="stock" 
              required 
              min="1"
              placeholder="1"
              value="${product?.stock ?? ''}"
              class="form-control"
            >
            <span class="error-message" id="stock-error"></span>
          </div>
          
          <!-- Description -->
          <div class="form-group">
            <label for="description" class="form-label">Description *</label>
            <textarea 
              id="description" 
              name="description" 
              required 
              placeholder="Describe your product in detail..."
              maxlength="2000"
              rows="6"
              class="form-control"
            >${product?.description || ''}</textarea>
            <span class="form-hint">Maximum 2000 characters</span>
            <span class="error-message" id="description-error"></span>
          </div>
          
          <!-- Image Upload -->
          <div class="form-group">
            <label for="image" class="form-label">Product Image *</label>
            <div class="image-upload">
              <input 
                type="file" 
                id="image" 
                name="image" 
                accept="image/*" 
                ${isEdit ? '' : 'required'}
                class="hidden"
              >
              <label for="image" class="upload-label" alt="click here">
                <div class="upload-icon">here</div>
                <p>Click to upload image</p>
              </label>
              <div id="preview" class="image-preview ${product?.image_path ? '' : 'hidden'}">
                <img id="preview-img" src="${assetUrl(product?.image_path, '')}" alt="Preview">
                <button 
                  type="button" 
                  id="remove-image-btn" 
                  class="btn btn-secondary btn-sm"
                >
                  Remove
                </button>
              </div>
            </div>
            <span class="error-message" id="image-error"></span>
          </div>
          
          <!-- Form Actions -->
          <div class="form-actions">
            <button type="submit" id="submit-btn" class="btn btn-primary">
              <span id="btn-text">${isEdit ? 'Save Product' : 'Create Product'}</span>
              <span id="spinner" class="spinner-inline hidden"></span>
            </button>
            <button 
              type="button" 
              id="cancel-btn" 
              class="btn btn-secondary"
              onclick="window.location.hash='#/seller/products'"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initProductCreatePage() {
  const form = document.getElementById('product-form');
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img');
  const removeBtn = document.getElementById('remove-image-btn');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  
  if (!form) return;
  
  // Image preview
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });
  
  removeBtn?.addEventListener('click', () => {
    imageInput.value = '';
    preview.classList.add('hidden');
  });
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Validate form
    const validation = validateProductForm(form);
    if (!validation.valid) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        const errorEl = document.getElementById(`${field}-error`);
        if (errorEl) errorEl.textContent = error;
      });
      return;
    }
    
    // Show loading
    submitBtn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');
    
    try {
      const formData = new FormData(form);
      let productId = form.dataset.productId;
      if (typeof productId === 'string') {
        const normalized = productId.trim().toLowerCase();
        if (normalized === 'null' || normalized === 'undefined' || normalized === '') {
          productId = '';
        }
      }
      const response = productId
        ? await productService.update(productId, formData)
        : await productService.create(formData);
      
      if (response.success) {
        showNotification(productId ? 'Product updated successfully!' : 'Product created successfully!', 'success');
        setTimeout(() => {
          window.location.hash = '#/seller/products';
        }, 500);
      }
    } catch (error) {
      showNotification(error.message || 'Failed to create product', 'error');
      btnText.textContent = 'Create Product';
      spinner.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
}
