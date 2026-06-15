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
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <strong>Admin Reply:</strong>
          <form class="reply-form" style="margin-top: 15px;">
            <textarea 
              name="reply" 
              placeholder="Type your reply here..." 
              style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"
              required
            ></textarea>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">Send Reply</button>
              <button type="button" class="cancel-reply-btn btn btn-secondary">Cancel</button>
            </div>
          </form>
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
  
  // Handle reply form submission
  const replyForm = modal.querySelector('.reply-form');
  if (replyForm) {
    replyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Define the button variable from the submit event
      const button = event.target.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      const replyText = replyForm.querySelector('textarea[name="reply"]').value.trim();
      
      if (!replyText) {
        showNotification('Please enter a reply', 'warning');
        return;
      }
      
      try {
        // Disable button and show loading state
        button.disabled = true;
        button.textContent = 'Sending...';
        
        // Send reply to backend
        const response = await adminService.addSupportTicketReply(ticket.id, replyText);
        
        if (response.success) {
          showNotification('Reply sent successfully', 'success');
          replyForm.reset();
          setTimeout(() => modal.remove(), 1000);
        } else {
          showNotification(response.message || 'Failed to send reply', 'error');
          button.disabled = false;
          button.textContent = originalText;
        }
      } catch (error) {
        showNotification(error.message || 'Failed to send reply', 'error');
        button.disabled = false;
        button.textContent = originalText;
      }
    });
    
    // Handle cancel button
    const cancelBtn = modal.querySelector('.cancel-reply-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        replyForm.reset();
      });
    }
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  return modal;
}
