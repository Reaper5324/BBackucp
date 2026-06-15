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
      <div class="admin-container">
        <div class="admin-header">
          <h1>Support Tickets</h1>
          <p>Manage customer support tickets</p>
        </div>
        
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

        ${openTickets.length > 0 ? `
          <div style="margin-bottom: 3rem;">
            <h2 style="margin-bottom: 1rem;">Open Tickets</h2>
            <div class="settings-grid">
              ${openTickets.map(ticket => `
                <div class="ticket-card" data-ticket-id="${ticket.id}">
                  <div class="card-header">
                    <h3>${ticket.subject}</h3>
                    <span class="status-badge badge-warning">Open</span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row">
                      <strong>From:</strong>
                      <span>${ticket.user_name}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Email:</strong>
                      <span>${ticket.user_email}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Category:</strong>
                      <span class="badge badge-info">${ticket.category}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Message:</strong>
                      <span style="font-size: 0.9em; color: #666;">${ticket.message.substring(0, 80)}...</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Submitted:</strong>
                      <span>${new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="view-ticket-btn btn btn-secondary btn-sm">View</button>
                    <button class="resolve-ticket-btn btn btn-success btn-sm">Resolve</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${resolvedTickets.length > 0 ? `
          <div>
            <h2 style="margin-bottom: 1rem;">Resolved Tickets</h2>
            <div class="product-grid">
              ${resolvedTickets.map(ticket => `
                <div class="ticket-card resolved" data-ticket-id="${ticket.id}">
                  <div class="card-header">
                    <h3>${ticket.subject}</h3>
                    <span class="status-badge badge-success">Resolved</span>
                  </div>
                  <div class="card-body">
                    <div class="orders-info-row">
                      <strong>From:</strong>
                      <span>${ticket.user_name}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Category:</strong>
                      <span class="badge badge-info">${ticket.category}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Submitted:</strong>
                      <span>${new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="orders-info-row">
                      <strong>Resolved:</strong>
                      <span>${ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
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
      const ticketId = btn.closest('.ticket-card').dataset.ticketId;
      if (!ticketId) {
        showNotification('Error: Ticket ID not found', 'error');
        return;
      }
      
      try {
        const response = await adminService.getSupportTicketDetail(ticketId);
          
        console.log('ticket data:', response);
        
        if (response.success && response.data) {
          const ticket = response.data;
          const modal = createTicketModal(ticket);
          document.body.appendChild(modal);
        } else {
          showNotification(response.error || 'Failed to load ticket details', 'error');
        }
      } catch (error) {
        console.error('Error loading ticket:', error);
        showNotification('Failed to load ticket details', 'error');
      }
    });
  });
  
  // Resolve ticket
  document.querySelectorAll('.resolve-ticket-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Mark this ticket as resolved?')) {
        const ticketId = btn.closest('.ticket-card').dataset.ticketId;
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
  modal.className = 'modal-overlay is-open';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Support Ticket #${ticket.id}</h2>
        <button class="close-modal-btn modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="info-row">
          <span class="info-label">From</span>
          <span class="info-value">${ticket.user_name} (${ticket.user_email})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Subject</span>
          <span class="info-value">${ticket.subject}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Category</span>
          <span class="info-value"><span class="badge badge-info">${ticket.category}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="badge badge-${ticket.status === 'open' ? 'warning' : 'success'}">${ticket.status}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Message</span>
          <span class="info-value">${ticket.message}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted</span>
          <span class="info-value">${new Date(ticket.created_at).toLocaleString()}</span>
        </div>
        ${ticket.resolved_at ? `
          <div class="info-row">
            <span class="info-label">Resolved</span>
            <span class="info-value">${new Date(ticket.resolved_at).toLocaleString()} by ${ticket.admin_name || 'Admin'}</span>
          </div>
        ` : `
          <div style="margin-top: 1.25rem;">
            <label class="form-label"><strong>Admin Reply</strong></label>
            <textarea class="form-control reply-textarea" placeholder="Type your reply..." rows="4"></textarea>
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button class="send-reply-btn btn btn-primary btn-sm">Send Reply</button>
            </div>
          </div>
        `}
      </div>
      <div class="modal-footer">
        <button class="close-modal-btn btn btn-secondary">Close</button>
      </div>
    </div>
  `;

  modal.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => modal.remove());
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  const sendBtn = modal.querySelector('.send-reply-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const replyText = modal.querySelector('.reply-textarea').value.trim();
      if (!replyText) {
        showNotification('Please enter a reply', 'warning');
        return;
      }
      try {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        const response = await adminService.addSupportTicketReply(ticket.id, replyText);
        if (response.success) {
          showNotification('Reply sent successfully', 'success');
          setTimeout(() => modal.remove(), 800);
        } else {
          showNotification(response.error || 'Failed to send reply', 'error');
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send Reply';
        }
      } catch (error) {
        showNotification('Failed to send reply', 'error');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Reply';
      }
    });
  }

  return modal;
}