/**
 * Support Page Module
 * Contact support form for buyers and sellers
 */

import { supportService } from '../services/supportService.js';
import { showNotification } from '../components/notifications.js';
import { auth } from '../utils/auth.js';

export async function supportPage() {
  const user = auth.getUser();
  
  return `
    <div class="product-container">
      <div class="profile-page">
        <header class="sprofile-header-card">
          <div>
            <h1>Contact Support</h1>
            <p>Submit a support ticket and we'll get back to you as soon as possible.</p>
          </div>
        </header>
        
        <div class="orders-card">
          <form id="support-form" class="settings-card">
            <h2>Submit Support Ticket</h2>
            
            <div class="form-group">
              <label for="subject">Subject *</label>
              <input 
                type="text" 
                id="subject" 
                name="subject" 
                class="form-control"
                placeholder="Brief summary of your issue"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="category">Problem Category *</label>
              <select id="category" name="category" class="form-control" required>
                <option value="">Select Category</option>
                <option value="account">Account & Login</option>
                <option value="payment">Payment & Billing</option>
                <option value="order">Order & Delivery</option>
                <option value="product">Product & Listing</option>
                <option value="seller_verification">Seller Verification</option>
                <option value="dispute">Dispute & Returns</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="message">Message *</label>
              <textarea 
                id="message" 
                name="message" 
                class="form-control"
                placeholder="Describe your issue in detail..."
                rows="6"
                required
              ></textarea>
            </div>
            
            <div class="form-group">
              <p class="form-note">
                We'll respond to your email address: <strong>${user?.email || 'your email'}</strong>
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary">Submit Support Ticket</button>
          </form>
          
          <div class="settings-card info-card" style="margin-top: 30px;">
            <h3>What to expect:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
              <li>We review all support tickets within 24 hours</li>
              <li>You'll receive email updates on your ticket status</li>
              <li>Our team is committed to resolving your issue quickly</li>
              <li>For urgent matters, contact us via email directly </li>
              <li>email Shaun Maswikaneng: tyronemas@gmail.com </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSupportPage() {
  const form = document.getElementById('support-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('subject').value.trim();
    const category = document.getElementById('category').value;
    const message = document.getElementById('message').value.trim();
    
    if (!subject || !category || !message) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    try {
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Submitting...';
      
      const response = await supportService.submitTicket({
        subject,
        category,
        message
      });
      
      if (response.success) {
        showNotification('Support ticket submitted successfully! We\'ll be in touch soon.', 'success');
        form.reset();
        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 1500);
      } else {
        showNotification(response.error || 'Failed to submit ticket', 'error');
      }
    } catch (error) {
      showNotification(error.message || 'Failed to submit ticket', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
