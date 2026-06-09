/**
 * Admin Users Management Page Module
 * Manage users and their roles
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

export async function usersPage() {
  try {
    const response = await adminService.getUsers();
    const users = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="admin-users">
          <h1>User Management</h1>
          
          <div class="users-table">
            <div class="table-header">
              <div class="col-name">Name</div>
              <div class="col-email">Email</div>
              <div class="col-role">Role</div>
              <div class="col-status">Status</div>
              <div class="col-actions">Actions</div>
            </div>
            
            <div class="table-body">
              ${users.map(u => `
                <div class="table-row" data-user-id="${u.id}">
                  <div class="col-name">${u.name}</div>
                  <div class="col-email">${u.email}</div>
                  <div class="col-role">${u.role}</div>
                  <div class="col-status">
                    <span class="badge badge-${u.is_active ? 'success' : 'danger'}">
                      ${u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div class="col-actions">
                    <button class="deactivate-btn btn btn-danger btn-sm">
                      ${u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load users</p></div>`;
  }
}

export function initUsersPage() {
  document.querySelectorAll('.deactivate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.closest('.table-row').dataset.userId;
      try {
        const isActive = btn.textContent.trim() === 'Deactivate';
        const response = await adminService.toggleUserStatus(userId, isActive);
        if (response.success) {
          showNotification('User status updated', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to update user', 'error');
      }
    });
  });
}
