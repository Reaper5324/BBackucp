/**
 * Reset Password Page
 * User clicks link from email to reset password
 */

import { authService } from '../../services/authService.js';
import { showNotification } from '../../components/notifications.js';
import { validatePassword } from '../../utils/validators.js';

export async function resetPasswordPage() {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.split('?')[1] || '');
  const token = urlParams.get('token');

  if (!token) {
    return `
      <div class="auth-layout">
        <div class="auth-container">
          <div class="auth-card">
            <div class="error-container">
              <p>Invalid or missing reset token. Please request a new password reset link.</p>
              <a href="#/forgot-password" class="btn btn-primary">Request New Link</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="auth-layout">
      <section class="auth-showcase">
        <p class="hero-kicker">Create a new password</p>
        <p>Enter a strong, unique password for your Bater account.</p>
        <div class="auth-points">
          <span>ITECA BATER DEMO</span>
        </div>
      </section>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Reset Password</h1>
            <p class="auth-subtitle">Create a new password for your account</p>
          </div>

          <form id="reset-password-form" class="reset-password-form">
            <div class="form-group">
              <label for="password" class="form-label">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter new password"
                class="form-control"
                autocomplete="new-password"
              >
              <span class="error-message" id="password-error"></span>
              <small class="form-hint">At least 6 characters</small>
            </div>

            <div class="form-group">
              <label for="password-confirm" class="form-label">Confirm Password</label>
              <input
                type="password"
                id="password-confirm"
                name="password-confirm"
                required
                placeholder="Confirm new password"
                class="form-control"
                autocomplete="new-password"
              >
              <span class="error-message" id="confirm-error"></span>
            </div>

            <button type="submit" id="reset-btn" class="btn btn-primary btn-block">
              <span id="btn-text">Reset Password</span>
              <span id="spinner" class="spinner-inline hidden"></span>
            </button>
          </form>

          <p class="auth-footer">
            <a href="#/login" class="link">Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export function initResetPasswordPage() {
  const form = document.getElementById('reset-password-form');
  if (!form) return;

  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.split('?')[1] || '');
  const token = urlParams.get('token');

  if (!token) return;

  const btn = document.getElementById('reset-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('password-confirm');
  const passwordError = document.getElementById('password-error');
  const confirmError = document.getElementById('confirm-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordError.textContent = '';
    confirmError.textContent = '';

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!validatePassword(password)) {
      passwordError.textContent = 'Password must be at least 6 characters';
      return;
    }

    if (password !== confirm) {
      confirmError.textContent = 'Passwords do not match';
      return;
    }

    btn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');

    try {
      const response = await authService.resetPassword(token, password);

      if (response.success) {
        showNotification('Password reset successfully! Redirecting to login...', 'success');
        
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1500);
      } else {
        showNotification(response.error || 'Failed to reset password', 'error');
        btnText.textContent = 'Reset Password';
        spinner.classList.add('hidden');
        btn.disabled = false;
      }
    } catch (error) {
      showNotification(error.message || 'An error occurred', 'error');
      btnText.textContent = 'Reset Password';
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  });
}
