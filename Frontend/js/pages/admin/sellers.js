import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

export async function sellersPage() {
  let sellers = [];
  try {
    const response = await adminService.getSellers();
    sellers = response.success ? response.data : [];
  } catch {
    sellers = [];
  }

  return `
    <div class="admin-container">
      <div class="admin-header">
        <h1>Seller Management</h1>
        <p>Review seller accounts and verification status</p>
      </div>

      ${sellers.length === 0
        ? `<div class="empty-state"><p>No sellers found</p></div>`
        : `
          <div class="settings-grid">
            ${sellers.map((seller) => `
              <div class="seller-card" data-seller-id="${seller.id}">
                <div class="card-header">
                  <h3>${seller.name}</h3>
                  <span class="status-badge badge-${seller.is_active ? 'success' : 'danger'}">
                    ${seller.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <div class="card-body">
                  <div class="orders-info-row">
                    <strong>Email:</strong>
                    <span>${seller.email}</span>
                  </div>
                  <div class="orders-info-row">
                    <strong>Joined:</strong>
                    <span>${new Date(seller.created_at).toLocaleDateString()}</span>
                  </div>
                  <div class="orders-info-row">
                    <strong>Status:</strong>
                    <span>${seller.is_active ? 'Active' : 'Suspended'}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <a href="#/admin/verifications" class="btn btn-secondary btn-sm">View Verification</a>
                  <button class="suspend-seller-btn btn btn-${seller.is_active ? 'danger' : 'success'} btn-sm">
                    ${seller.is_active ? 'Suspend' : 'Unsuspend'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
    </div>
  `;
}

export function initSellersPage() {
  document.querySelectorAll('.suspend-seller-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sellerId = btn.closest('.seller-card').dataset.sellerId;
      const isSuspended = btn.textContent.trim() === 'Suspend';
      const action = isSuspended ? 'Suspend' : 'Unsuspend';
      
      if (confirm(`${action} this seller?`)) {
        try {
          showNotification(`Seller ${action.toLowerCase()}ed successfully`, 'success');
          setTimeout(() => window.location.reload(), 500);
        } catch (error) {
          showNotification(error.message || `Failed to ${action.toLowerCase()} seller`, 'error');
        }
      }
    });
  });
}
