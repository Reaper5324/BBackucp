/**
 * Notifications Component
 * Display toast notifications
 */

/**
 * Show a notification toast
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (0 = permanent)
 */
export function showNotification(message, type = 'info', duration = 4000) {
  const container = document.getElementById('notifications');
  
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification alert alert-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="alert-close" aria-label="Close notification">&times;</button>
  `;
  
  container.appendChild(notification);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      notification.remove();
    }, duration);
  }
  
  // Manual close
  notification.querySelector('.alert-close').addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Show success notification
 */
export function showSuccess(message, duration = 4000) {
  showNotification(message, 'success', duration);
}

/**
 * Show error notification
 */
export function showError(message, duration = 4000) {
  showNotification(message, 'danger', duration);
}

/**
 * Show warning notification
 */
export function showWarning(message, duration = 4000) {
  showNotification(message, 'warning', duration);
}

/**
 * Show info notification
 */
export function showInfo(message, duration = 4000) {
  showNotification(message, 'info', duration);
}

/**
 * Dismiss all notifications
 */
export function dismissAll() {
  const container = document.getElementById('notifications');
  if (container) {
    container.innerHTML = '';
  }
}
