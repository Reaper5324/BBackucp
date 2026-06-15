/**
 * Admin Support Tickets Page Module
 * Manage and resolve support tickets
 */

import { adminService } from '../../services/adminService.js';
import { showNotification } from '../../components/notifications.js';

export async function adminSupportPage() {
  try {
    const response = await adminService.getSupportTickets();
    const tickets = response.success ? response.data : [];
    
    // Group tickets by status
    const openTickets = tickets.filter(t => t.status === 'open');
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    
    return `
      <div class="main-layout">
        <div class="admin-support">
          <h1>Support Tickets</h1>
          
          <div class="status-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-value">${openTickets.length}</div>
                <div class="stat-label">Open</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-value">${inProgressTickets.length}</div>
                <div class="stat-label">In Progress</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <div class="stat-value">${resolvedTickets.length}</div>
                <div class="stat-label">Resolved</div>
              </div>
            </div>
          </div>
          
          <div class="tickets-section">
            <h2>Open Tickets</h2>
            <div class="tickets-table">
              <div class="table-header">
                <div class="col-subject">Subject</div>
                <div class="col-user">From</div>
                <div class="col-category">Category</div>
                <div class="col-date">Submitted</div>
                <div class="col-actions">Actions</div>
              </div>
              <div class="table-body">
                ${openTickets.length > 0 ? openTickets.map(ticket => `
                  <div class="table-row" data-ticket-id="${ticket.id}">
                    <div class="col-subject">
                      <strong>${ticket.subject}</strong>
                      <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        ${ticket.message.substring(0, 60)}...
                      </div>
                    </div>
                    <div class="col-user">
                      <strong>${ticket.user_name}</strong>
                      <div style="font-size: 0.85em; color: #666;">${ticket.user_email}</div>
                    </div>
                    <div class="col-category">
                      <span class="badge badge-info">${ticket.category}</span>
                    </div>
                    <div class="col-date">${new Date(ticket.created_at).toLocaleDateString()}</div>
                    <div class="col-actions">
                      <button class="view-ticket-btn btn btn-info btn-sm">View</button>
                      <button class="resolve-ticket-btn btn btn-success btn-sm">Resolve</button>
                    </div>
                  </div>
                `).join('') : '<div style="padding: 20px; text-align: center; color: #666;">No open tickets</div>'}
              </div>
            </div>
          </div>
          
          ${resolvedTickets.length > 0 ? `
            <div class="tickets-section" style="margin-top: 40px;">
              <h2>Resolved Tickets</h2>
              <div class="tickets-table">
                <div class="table-header">
                  <div class="col-subject">Subject</div>
                  <div class="col-user">From</div>
                  <div class="col-date">Resolved</div>
                </div>
                <div class="table-body">
                  ${resolvedTickets.map(ticket => `
                    <div class="table-row">
                      <div class="col-subject">${ticket.subject}</div>
                      <div class="col-user">${ticket.user_name}</div>
                      <div class="col-date">${ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : '-'}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load support tickets</p></div>`;
  }
}

export function initAdminSupportPage() {
  // View ticket details
  document.querySelectorAll('.view-ticket-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ticketId = btn.closest('.table-row').dataset.ticketId;
      const response = await adminService.getSupportTicketDetail(ticketId);
      
      if (response.success) {
        const ticket = response.data;
        const modal = createTicketModal(ticket);
        document.body.appendChild(modal);
      }
    });
  });
  
  // Resolve ticket
  document.querySelectorAll('.resolve-ticket-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Mark this ticket as resolved?')) {
        const ticketId = btn.closest('.table-row').dataset.ticketId;
        try {
          const response = await adminService.resolveSupportTicket(ticketId);
          if (response.success) {
            showNotification('Ticket resolved', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          showNotification(error.message || 'Failed to resolve ticket', 'error');
        }
      }
    });
  });
}

/**
 * Create modal for viewing ticket details
 */
function createTicketModal(ticket) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>Support Ticket #${ticket.id}</h2>
        <button class="close-modal-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 20px;">
          <strong>From:</strong> ${ticket.user_name} (${ticket.user_email})
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Subject:</strong> ${ticket.subject}
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Category:</strong> <span class="badge badge-info">${ticket.category}</span>
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Status:</strong> <span class="badge badge-${ticket.status === 'open' ? 'warning' : 'success'}">${ticket.status}</span>
        </div>
        <div style="margin-bottom: 20px;">
          <strong>Message:</strong>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 10px;">
            ${ticket.message.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
        </div>
        <div style="margin-bottom: 20px; font-size: 0.9em; color: #666;">
          <strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}
        </div>
      </div>
      <div class="modal-footer">
        <button class="close-modal-btn btn btn-secondary">Close</button>
      </div>
    </div>
  `;
  
  const closeButtons = modal.querySelectorAll('.close-modal-btn');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => modal.remove());
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  return modal;
}
