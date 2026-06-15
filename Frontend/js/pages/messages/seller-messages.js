/**
 * Seller Messages Page
 * Display all message threads for a seller
 */

import { messageService } from '../../services/messageService.js';
import { auth } from '../../utils/auth.js';
import { showNotification } from '../../components/notifications.js';

export async function sellerMessagesPage() {
  try {
    const user = auth.getUser();
    if (!user || user.role !== 'seller') {
      return `<div class="error-container"><p>Only sellers can access this page.</p></div>`;
    }

    const response = await messageService.getThreads(user.id);
    const threads = response.success ? response.data : [];

    if (!Array.isArray(threads)) {
      return `<div class="error-container"><p>Failed to load messages</p></div>`;
    }

    // Group messages by product and other user
    const threadMap = new Map();
    
    threads.forEach(msg => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const key = `${msg.product_id}-${otherUserId}`;
      
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          product_id: msg.product_id,
          other_user_id: otherUserId,
          other_user_name: msg.sender_id === user.id ? msg.receiver_name : msg.sender_name,
          last_message: msg.body,
          last_sent_at: msg.sent_at,
          product_name: msg.product_name || 'Unknown Product',
          unread_count: 0
        });
      }

      const thread = threadMap.get(key);
      thread.last_message = msg.body;
      thread.last_sent_at = msg.sent_at;
      if (!msg.is_read && msg.receiver_id === user.id) {
        thread.unread_count++;
      }
    });

    const threadsList = Array.from(threadMap.values())
      .sort((a, b) => new Date(b.last_sent_at) - new Date(a.last_sent_at));

    return `
      <div class="main-layout">
        <div class="messages-container">
          <div class="messages-header">
            <h1>My Messages</h1>
            <p class="subtitle">${threadsList.length} conversation${threadsList.length !== 1 ? 's' : ''}</p>
          </div>

          <div class="threads-list">
            ${
              threadsList.length === 0
                ? '<div class="empty-state"><p>No messages yet. Customers will message you when interested in your products.</p></div>'
                : threadsList
                    .map(
                      (thread) => `
              <div class="thread-item" data-product-id="${thread.product_id}" data-user-id="${thread.other_user_id}">
                <div class="thread-content">
                  <div class="thread-header-info">
                    <h3 class="thread-user">${thread.other_user_name || 'Unknown Buyer'}</h3>
                    <small class="thread-time">${formatTime(thread.last_sent_at)}</small>
                  </div>
                  <p class="thread-product">Product: ${thread.product_name}</p>
                  <p class="thread-preview">${truncate(thread.last_message, 100)}</p>
                </div>
                ${thread.unread_count > 0 ? `<span class="badge badge-primary">${thread.unread_count}</span>` : ''}
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading seller messages:', error);
    return `<div class="error-container"><p>Failed to load messages</p></div>`;
  }
}

export function initSellerMessagesPage() {
  const threadItems = document.querySelectorAll('.thread-item');

  threadItems.forEach((item) => {
    item.addEventListener('click', () => {
      const productId = item.dataset.productId;
      const userId = item.dataset.userId;
      window.location.hash = `#/messages/${productId}?user_id=${userId}`;
    });
  });
}

// Helper: Format time ago
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Helper: Truncate text
function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}
