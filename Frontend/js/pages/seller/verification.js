/**
 * Seller Verification Page Module
 * Submit seller verification documents
 */

import { verificationService } from '../../services/verificationService.js';
import { showNotification } from '../../components/notifications.js';

export async function verificationPage() {
  try {
    const response = await verificationService.getStatus();
    const status = response.success ? response.data : null;
    
    return `
      <div class="main-layout">
        <div class="verification-container">
          <div class="verification-header">
            <h1>Seller Verification</h1>
            <p>Verify your account to start selling</p>
          </div>
          
          ${status && status.status === 'approved'
            ? `
              <div class="success-message">
                <h2>Your account is verified!</h2>
                <p>You can start selling on Bater</p>
              </div>
            `
            : `
              <form id="verification-form" class="verification-form">
                <div class="form-group">
                  <label for="doc-type">Document Type:</label>
                  <select id="doc-type" name="doc_type" class="form-control" required>
                    <option value="">Choose a document type</option>
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_licence">Driver's licence</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="document">Document (PDF, JPG, or PNG):</label>
                  <input type="file" id="document" name="document" accept="application/pdf,image/jpeg,image/png" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Submit for Verification</button>
              </form>
            `
          }
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Error loading verification status</p></div>`;
  }
}

export function initVerificationPage() {
  const form = document.getElementById('verification-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(form);
        const response = await verificationService.submit(formData);
        
        if (response.success) {
          showNotification('Verification submitted for review!', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        showNotification(error.message || 'Submission failed', 'error');
      }
    });
  }
}
