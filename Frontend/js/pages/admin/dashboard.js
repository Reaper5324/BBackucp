

import { adminService } from '../../services/adminService.js';

export async function adminDashboardPage() {
  try {
    const response = await adminService.getDashboard();
    const dashboard = response.success ? response.data : {};
    
    return `
      <div class="profile-header-card">
        <div class="admin-dashboard">
          <h1>Admin Dashboard</h1>
          
          <div class="settings-card">
            <div class="stat-card">
              <div class="stat-icon">Users</div>
              <div class="stat-content">
                <div class="stat-value">${dashboard.total_users || 0}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">Items</div>
              <div class="stat-content">
                <div class="stat-value">${dashboard.total_products || 0}</div>
                <div class="stat-label">Total Products</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">Orders</div>
              <div class="stat-content">
                <div class="stat-value">${dashboard.total_orders || 0}</div>
                <div class="stat-label">Total Orders</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">Sales</div>
              <div class="stat-content">
                <div class="stat-value">R${Number(dashboard.total_revenue || 0).toFixed(2)}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
            </div>
          </div>
          
          <div class="settings-card">
            <a href="#/admin/users" class="btn btn-secondary">Manage Users</a>
            <a href="#/admin/products" class="btn btn-secondary">Moderate Products</a>
            <a href="#/admin/verifications" class="btn btn-secondary">Review Verifications</a>
            <a href="#/admin/logs" class="btn btn-secondary">View Logs</a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load dashboard</p></div>`;
  }
}
