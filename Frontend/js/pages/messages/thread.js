/**
 * Message Thread Page Module
 * Display messages in a conversation
 */

import { messageService } from '../../services/messageService.js';
import { productService } from '../../services/productService.js';
import { showNotification } from '../../components/notifications.js';

let currentProductId = null;
let currentOtherUserId = null;

export async function threadPage(productId) {
  try {
    currentProductId = productId;
    const query = new URLSearchParams(window.location.hash.split('?')[1] || '');
    currentOtherUserId = query.get('user_id');
    
    if (!currentOtherUserId) {
      const productResponse = await productService.getById(productId);
      currentOtherUserId = productResponse.success ? productResponse.data?.seller_id : null;
    }

    if (!currentOtherUserId) {
      return `<div class="error-container"><p>Seller information is unavailable for this product.</p></div>`;
    }

    const response = await messageService.getThread(currentProductId, currentOtherUserId);
    const messages = response.success ? response.data : [];
    
    return `
      <div class="main-layout">
        <div class="thread-container">
          <div class="thread-header">
            <h1>Product Conversation</h1>
          </div>
          
          <div class="messages-area" id="messages-area">
            ${messages.length === 0 ? '<p class="empty-text">No messages yet.</p>' : messages.map(m => `
              <div class="message ${String(m.sender_id) === String(currentOtherUserId) ? 'received' : 'sent'}">
                <p>${m.body || m.content || ''}</p>
                <small>${m.sent_at || m.created_at || ''}</small>
              </div>
            `).join('')}
          </div>
          
          <form id="message-form" class="message-form">
            <input 
              type="text" 
              id="message-input" 
              placeholder="Type a message..." 
              class="form-control"
              required
            >
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>Failed to load thread</p></div>`;
  }
}

export function initThreadPage() {
  const form = document.getElementById('message-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const input = document.getElementById('message-input');
      const content = input.value.trim();
      
      if (!content) return;
      
      try {
        const response = await messageService.send(currentOtherUserId, currentProductId, content);
        if (response.success) {
          // Add message to UI immediately instead of reloading
          const messagesArea = document.getElementById('messages-area');
          if (messagesArea && messagesArea.querySelector('.empty-text')) {
            messagesArea.innerHTML = ''; // Remove "No messages yet"
          }
          
          const messageEl = document.createElement('div');
          messageEl.className = 'message sent';
          messageEl.innerHTML = `
            <p>${content}</p>
            <small>${new Date().toLocaleString()}</small>
          `;
          if (messagesArea) messagesArea.appendChild(messageEl);
          
          input.value = '';
          showNotification('Message sent!', 'success');
        }
      } catch (error) {
        showNotification(error.message || 'Failed to send message', 'error');
      }
    });
  }
}
