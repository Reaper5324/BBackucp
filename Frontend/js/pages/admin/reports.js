import { adminService } from '../../services/adminService.js';

export async function reportsPage() {
  let dashboard = {};
  try {
    const response = await adminService.getDashboard();
    dashboard = response.success ? response.data : {};
  } catch {
    dashboard = {};
  }

  return `
    <div class="admin-dashboard">
      <header class="profile-header-card"><div><h1>Reports</h1><p>Platform health and marketplace activity.</p></div></header>
      <section class="stats-grid">
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${dashboard.total_users || 0}</div><div class="stat-label">Users</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${dashboard.total_products || 0}</div><div class="stat-label">Active Products</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${dashboard.total_orders || 0}</div><div class="stat-label">Orders</div></div></div>
        <div class="stat-card"><div class="stat-content"><div class="stat-value">${dashboard.pending_verifs || 0}</div><div class="stat-label">Pending Verifications</div></div></div>
      </section>
    </div>
  `;
}
