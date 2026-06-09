/**
 * Admin Verifications Page Module
 * Review seller verification submissions
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

export async function verificationsPage() {
  try {
    const response = await adminService.getVerifications();
    const verifications = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="admin-verifications">
          <h1>Seller Verifications</h1>
          
          <div class="verifications-table">
            <div class="table-header">
              <div class="col-seller">Seller</div>
              <div class="col-id">ID Number</div>
              <div class="col-status">Status</div>
              <div class="col-submitted">Submitted</div>
              <div class="col-actions">Actions</div>
            </div>
            
            <div class="table-body">
              ${verifications.map(v => `
                <div class="table-row" data-verification-id="${v.id}">
                  <div class="col-seller">${v.seller_name}</div>
                  <div class="col-id">${v.id_number}</div>
                  <div class="col-status">
                    <span class="badge badge-${v.status === 'verified' ? 'success' : 'warning'}">
                      ${v.status}
                    </span>
                  </div>
                  <div class="col-submitted">${v.submitted_at}</div>
                  <div class="col-actions">
                    <button class="view-docs-btn btn btn-info btn-sm">View Docs</button>
                    <button class="approve-btn btn btn-success btn-sm">Approve</button>
                    <button class="reject-btn btn btn-danger btn-sm">Reject</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load verifications</p></div>`;
  }
}

export function initVerificationsPage() {
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const verificationId = btn.closest('.table-row').dataset.verificationId;
      try {
        const response = await adminService.approveVerification(verificationId);
        if (response.success) {
          showNotification('Verification approved', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to approve', 'error');
      }
    });
  });
  
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Reject this verification?')) {
        const verificationId = btn.closest('.table-row').dataset.verificationId;
        try {
          const response = await adminService.rejectVerification(verificationId);
          if (response.success) {
            showNotification('Verification rejected', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to reject', 'error');
        }
      }
    });
  });
}
