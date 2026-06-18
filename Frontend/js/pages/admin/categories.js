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
                  <button
            class="edit-category-btn btn btn-secondary btn-sm"
            data-id="${category.id}"
            data-name="${category.name}"
            data-description="${category.description || ''}"
              > Edit </button>
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
  btn.addEventListener('click', () => {

    showEditCategoryModal({
      id: btn.dataset.id,
      name: btn.dataset.name,
      description: btn.dataset.description
    });

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
  modal.className = 'modal-overlay is-open'; // add is-open
  modal.innerHTML = `
    <div class="modal"> <!-- use modal not modal-content -->
      <div class="modal-header">
        <h2>Add New Category</h2>
        <button class="close-modal-btn modal-close">&times;</button>
      </div>
      <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Category Name *</label>
            <input 
              type="text" 
              id="cat-name" 
              class="form-control"
              placeholder="e.g., Electronics"
            >
            <span class="error-message" id="name-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              id="cat-desc" 
              class="form-control"
              rows="4"
              placeholder="Enter category description"
            ></textarea>
          </div>
      </div>
      <div class="modal-footer">
        <button class="close-modal-btn btn btn-secondary">Cancel</button>
        <button id="submit-category-btn" class="btn btn-primary">Create Category</button>
      </div>
    </div>
  `;

  modal.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => modal.remove());
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#submit-category-btn').addEventListener('click', async () => {
    const name = modal.querySelector('#cat-name').value.trim();
    const description = modal.querySelector('#cat-desc').value.trim();
    const nameError = modal.querySelector('#name-error');
    const submitBtn = modal.querySelector('#submit-category-btn');

    nameError.textContent = '';

    if (!name) {
      nameError.textContent = 'Category name is required';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      const response = await productService.createCategory({ name, description });

      if (response.success) {
        showNotification('Category created successfully!', 'success');
        setTimeout(() => {
          modal.remove();
          window.location.reload();
        }, 800);
      } else {
        showNotification(response.error || 'Failed to create category', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Category';
      }
    } catch (error) {
      showNotification(error.message || 'Failed to create category', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Category';
    }
  });

  document.body.appendChild(modal);
}

//same thing but for edit button:
function showEditCategoryModal(category) {
  const modal = document.createElement('div');
//is-open to show our modal
  modal.className = 'modal-overlay is-open';
//The pop up modal page
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Edit Category</h2>
        <button class="close-modal-btn modal-close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Category Name *</label>

          <input
            type="text"
            id="edit-cat-name"
            class="form-control"
            value="${category.name || ''}"
            placeholder="e.g., Electronics"
          >

          <span class="error-message" id="edit-name-error"></span>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>

          <textarea
            id="edit-cat-desc"
            class="form-control"
            rows="4"
            placeholder="Enter category description"
          >${category.description || ''}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-modal-btn btn btn-secondary">
          Cancel
        </button>

        <button id="update-category-btn" class="btn btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  `;

  modal.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => modal.remove());
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#update-category-btn')
    .addEventListener('click', async () => {

      const name = modal.querySelector('#edit-cat-name').value.trim();
      const description = modal.querySelector('#edit-cat-desc').value.trim();
      const errorLabel = modal.querySelector('#edit-name-error');
      const submitBtn = modal.querySelector('#update-category-btn');

      errorLabel.textContent = '';

      if (!name) {
        errorLabel.textContent = 'Category name is required';
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const response = await productService.updateCategory(category.id, {
          name,
          description
        });

        if (response.success) {
          showNotification('Category updated successfully!', 'success');
          setTimeout(() => {
            modal.remove();
            window.location.reload();
          }, 800);
        } else {
          showNotification(response.error || 'Failed to update category', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Changes';
        }

      } catch (error) {
        showNotification(error.message || 'Failed to update category', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    });

  document.body.appendChild(modal);
}