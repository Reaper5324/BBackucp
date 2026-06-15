/**
 * Forgot Password Page
 * Request password reset by email
 */

import { authService } from '../../services/authService.js';
import { showNotification } from '../../components/notifications.js';
import { validateEmail } from '../../utils/validators.js';

export async function forgotPasswordPage() {
  return `
    <div class="auth-layout">
      <section class="auth-showcase">
        <p class="hero-kicker">Reset your password</p>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
        <div class="auth-points">
          <span>ITECA BATER DEMO</span>
        </div>
      </section>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Forgot Password</h1>
            <p class="auth-subtitle">We'll send you a password reset link</p>
          </div>

          <form id="forgot-password-form" class="forgot-password-form">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                class="form-control"
                autocomplete="email"
              > 
              <span class="error-message" id="email-error"></span> 
            </div>

            <button type="submit" id="send-btn" class="btn btn-primary btn-block">
              <span id="btn-text">Send Reset Link</span>
              <span id="spinner" class="spinner-inline hidden"></span>
            </button>
          </form>

          <div class="auth-divider">
            <span>Remember your password?</span>
          </div>

          <a href="#/login" class="btn btn-secondary btn-block">Back to Login</a>

          <p class="auth-footer">
            <small>We'll send a password reset link to your email. Check your spam folder if you don't see it.</small>
          </p>
        </div>
      </div>
    </div>
  `;
}

export function initForgotPasswordPage() {
  const form = document.getElementById('forgot-password-form');
  const btn = document.getElementById('send-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.textContent = '';

    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      emailError.textContent = 'Please enter a valid email address';
      return;
    }

    btn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');

    try {
      const response = await authService.requestPasswordReset(email);

      if (response.success) {
        showNotification('Password reset link sent to your email!', 'success');
        emailInput.value = '';
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      } else {
        showNotification(response.error || 'Failed to send reset link', 'error');
        btnText.textContent = 'Send Reset Link';
        spinner.classList.add('hidden');
        btn.disabled = false;
      }
    } catch (error) {
      showNotification(error.message || 'An error occurred', 'error');
      btnText.textContent = 'Send Reset Link';
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  });
}
