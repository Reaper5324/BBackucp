
 
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


export function showSuccess(message, duration = 4000) {
  showNotification(message, 'success', duration);
}


export function showError(message, duration = 4000) {
  showNotification(message, 'danger', duration);
}


export function showWarning(message, duration = 4000) {
  showNotification(message, 'warning', duration);
}


export function showInfo(message, duration = 4000) {
  showNotification(message, 'info', duration);
}


export function dismissAll() {
  const container = document.getElementById('notifications');
  if (container) {
    container.innerHTML = '';
  }
}
