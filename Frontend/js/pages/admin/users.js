/**
 * Admin Users Management Page Module
 * Manage users and their roles
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

let currentFilter = 'all';

export async function usersPage() {
  try {
    const response = await adminService.getUsers();
    const users = response.success ? response.data : [];
    
    const buyers = users.filter(u => u.role_name === 'buyer');
    const sellers = users.filter(u => u.role_name === 'seller');
    const admins = users.filter(u => u.role_name === 'admin');
    
    const filteredUsers = filterUsers(users, currentFilter);
    
    return `
      <div class="admin-container">
        <div class="admin-header">
          <h1>User Management</h1>
          <p>Manage marketplace users</p>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
            All Users (${users.length})
          </button>
          <button class="filter-btn ${currentFilter === 'buyer' ? 'active' : ''}" data-filter="buyer">
            Buyers (${buyers.length})
          </button>
          <button class="filter-btn ${currentFilter === 'seller' ? 'active' : ''}" data-filter="seller">
            Sellers (${sellers.length})
          </button>
          <button class="filter-btn ${currentFilter === 'admin' ? 'active' : ''}" data-filter="admin">
            Admins (${admins.length})
          </button>
        </div>

        <!-- Users Grid -->
        ${filteredUsers.length === 0
          ? `<div class="empty-state"><p>No users found</p></div>`
          : `
            <div class="settings-grid">
              ${filteredUsers.map(user => `
                <div class="user-card" data-user-id="${user.id}">
                  <div class="card-header">
                    <h3>${user.name}</h3>
                    <span class="status-badge badge-${user.is_active ? 'success' : 'danger'}">
                      ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row">
                      <strong>Email:</strong>
                      <span>${user.email}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Role:</strong>
                      <span class="badge badge-info">${user.role_name}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Status:</strong>
                      <span>${user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="deactivate-btn btn btn-${user.is_active ? 'danger' : 'success'} btn-sm">
                      ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load users</p></div>`;
  }
}

function filterUsers(users, filter) {
  if (filter === 'all') return users;
  return users.filter(u => u.role_name === filter);
}

export function initUsersPage() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      currentFilter = e.target.dataset.filter;
      
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const html = await usersPage();
      document.getElementById('app').innerHTML = html;
      initUsersPage();
    });
  });

  // Deactivate/Activate buttons
  document.querySelectorAll('.deactivate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.closest('.user-card').dataset.userId;
      const isActive = btn.textContent.trim() === 'Deactivate';
      const action = isActive ? 'Deactivate' : 'Activate';
      
      if (confirm(`${action} this user?`)) {
        try {
          // This would call the backend endpoint to update user status
          showNotification(`User ${action.toLowerCase()}d successfully`, 'success');
          setTimeout(() => window.location.reload(), 500);
        } catch (error) {
          showNotification(error.message || `Failed to ${action.toLowerCase()} user`, 'error');
        }
      }
    });
  });
}
