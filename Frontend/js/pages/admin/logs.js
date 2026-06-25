

import { adminService } from '../../services/adminService.js';

export async function logsPage() {
  try {
    const response = await adminService.getLogs();
    const logs = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="admin-logs">
          <h1>System Logs</h1>
          
          <div class="logs-table">
            <div class="table-header">
              <div class="col-timestamp">Timestamp</div>
              <div class="col-user">User</div>
              <div class="col-action">Action</div>
              <div class="col-details">Details</div>
            </div>
            
            <div class="table-body">
              ${logs.map(log => `
                <div class="table-row">
                  <div class="col-timestamp">${log.created_at}</div>
                  <div class="col-user">${log.user_name}</div>
                  <div class="col-action">${log.action}</div>
                  <div class="col-details">${log.details}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load logs</p></div>`;
  }
}
