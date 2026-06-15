import { productService } from '../../services/productService.js';
import { showNotification } from '../../components/notifications.js';

export async function adminCategoriesPage() {
  let categories = [];
  try {
    const response = await productService.getCategories();
    categories = response.success ? response.data : [];
  } catch {
    categories = [];
  }

  return `
    <div class="admin-container">
      <div class="admin-header">
        <h1>Categories Management</h1>
        <p>Manage marketplace categories</p>
      </div>

      <div style="margin-bottom: 2rem;">
        <button id="add-category-btn" class="btn btn-primary">+ Add New Category</button>
      </div>

      <div class="settings-grid">
        ${categories.length > 0
          ? categories.map((category) => `
              <div class="category-card" data-category-id="${category.id}">
                <div class="card-header">
                  <h3>${category.name}</h3>
                </div>
                <div class="card-body">
                  <p>${category.description || 'No description provided.'}</p>
                </div>
                <div class="card-actions">
                  <button class="edit-category-btn btn btn-secondary btn-sm" data-id="${category.id}">Edit</button>
                  <button class="delete-category-btn btn btn-danger btn-sm" data-id="${category.id}">Delete</button>
                </div>
              </div>
            `).join('')
          : '<div class="empty-state"><p>No categories found.</p></div>'}
      </div>
    </div>
  `;
}

export function initAdminCategoriesPage() {
  // Add Category Button
  const addBtn = document.getElementById('add-category-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showAddCategoryModal();
    });
  }

  // Edit Category Buttons
  document.querySelectorAll('.edit-category-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const categoryId = btn.dataset.id;
      // Fetch category details and show modal
      showNotification('Edit feature coming soon', 'info');
    });
  });

  // Delete Category Buttons
  document.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const categoryId = btn.dataset.id;
      const categoryName = btn.closest('.category-card').querySelector('h3').textContent;
      
      if (confirm(`Delete category "${categoryName}"? This action cannot be undone.`)) {
        try {
          const response = await productService.deleteCategory(categoryId);
          if (response.success) {
            showNotification('Category deleted successfully', 'success');
            setTimeout(() => window.location.reload(), 500);
          } else {
            showNotification(response.error || 'Failed to delete category', 'error');
          }
        } catch (error) {
          showNotification(error.message || 'Failed to delete category', 'error');
        }
      }
    });
  });
}

function showAddCategoryModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>Add New Category</h2>
        <button class="close-modal-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="add-category-form" class="form-card">
          <div class="form-group">
            <label for="cat-name" class="form-label">Category Name *</label>
            <input 
              type="text" 
              id="cat-name" 
              name="name" 
              required 
              placeholder="e.g., Electronics"
              class="form-control"
            >
            <span class="error-message" id="name-error"></span>
          </div>
          
          <div class="form-group">
            <label for="cat-desc" class="form-label">Description</label>
            <textarea 
              id="cat-desc" 
              name="description" 
              placeholder="Enter category description"
              class="form-control"
              rows="4"
            ></textarea>
            <span class="error-message" id="description-error"></span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">
            <button type="submit" class="btn btn-primary">
              <span class="btn-text">Create Category</span>
              <span class="spinner hidden"></span>
            </button>
            <button type="button" class="close-modal-btn btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Close modal
  const closeButtons = modal.querySelectorAll('.close-modal-btn');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => modal.remove());
  });

  // Form submission
  const form = modal.querySelector('#add-category-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    const name = form.querySelector('#cat-name').value.trim();
    const description = form.querySelector('#cat-desc').value.trim();
    
    if (!name) {
      form.querySelector('#name-error').textContent = 'Category name is required';
      return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = form.querySelector('.btn-text');
    const spinner = form.querySelector('.spinner');
    
    try {
      submitBtn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = 'Creating...';
      
      const response = await productService.createCategory({ name, description });
      
      if (response.success) {
        showNotification('Category created successfully!', 'success');
        setTimeout(() => {
          modal.remove();
          window.location.reload();
        }, 1000);
      } else {
        showNotification(response.error || 'Failed to create category', 'error');
        submitBtn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Create Category';
      }
    } catch (error) {
      showNotification(error.message || 'Failed to create category', 'error');
      submitBtn.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Create Category';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}
