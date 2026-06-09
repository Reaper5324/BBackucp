import { adminService } from '../../services/adminService.js';

export async function sellersPage() {
  let sellers = [];
  try {
    const response = await adminService.getSellers();
    sellers = response.success ? response.data : [];
  } catch {
    sellers = [];
  }

  return `
    <div class="admin-users">
      <header class="profile-header-card"><div><h1>Seller Management</h1><p>Review seller accounts and verification status.</p></div></header>
      <div class="products-table">
        <div class="table-header"><div>Name</div><div>Email</div><div>Status</div><div>Joined</div><div>Actions</div></div>
        <div class="table-body">
          ${sellers.map((seller) => `
            <div class="table-row">
              <div>${seller.name}</div>
              <div>${seller.email}</div>
              <div><span class="badge ${Number(seller.is_active) ? 'badge-success' : 'badge-danger'}">${Number(seller.is_active) ? 'Active' : 'Suspended'}</span></div>
              <div>${seller.created_at || '-'}</div>
              <div><a class="btn btn-secondary btn-sm" href="#/admin/verifications">Verifications</a></div>
            </div>
          `).join('') || '<div class="empty-state"><p>No sellers found.</p></div>'}
        </div>
      </div>
    </div>
  `;
}
