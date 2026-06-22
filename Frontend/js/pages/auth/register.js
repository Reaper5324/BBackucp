

import { authService } from '../../services/authService.js';
import { showNotification } from '../../components/notifications.js';
import { validateEmail, validatePassword } from '../../utils/validators.js';

export async function registerPage() {
  return `
    <div class="auth-layout">
      <section class="auth-showcase">
        <p class="hero-kicker">Start trading locally</p>
        <h2>Create your Bater account.</h2>
        <p>Choose how you want to use the platform, then access product browsing, seller listings, orders, and messages.</p>
        <div class="auth-points">
          <span>Browse products</span>
          <span>List items</span>
          <span>Manage orders</span>
        </div>
      </section>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-label">New account</span>
            <h1 class="auth-title">Join Bater</h1>
            <p class="auth-subtitle">Create your marketplace account</p>
          </div>

          <form id="register-form" class="register-form">
            <div class="form-grid-2">
              <div class="form-group">
                <label for="name" class="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="John Doe"
                  class="form-control"
                  autocomplete="name"
                >
                <span class="error-message" id="name-error"></span>
              </div>

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
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="At least 8 characters"
                  class="form-control"
                  autocomplete="new-password"
                >
                <span class="form-hint">Must be at least 8 characters</span>
                <span class="error-message" id="password-error"></span>
              </div>

              <div class="form-group">
                <label for="confirm-password" class="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  name="confirm-password"
                  required
                  placeholder="Repeat password"
                  class="form-control"
                  autocomplete="new-password"
                >
                <span class="error-message" id="confirm-error"></span>
              </div>
            </div>

            <div class="form-group">
              <label for="role" class="form-label">I want to</label>
              <select id="role" name="role" class="form-control" required>
                <option value="">Select an option</option>
                <option value="buyer">Buy items</option>
                <option value="seller">Sell items</option>
                <option value="both">Both buy and sell</option>
              </select>
              <span class="error-message" id="role-error"></span>
            </div>

            <div class="form-group form-checkbox">
              <input
                type="checkbox"
                id="agree"
                name="agree"
                required
                class="form-checkbox-input"
              >
              <label for="agree" class="form-checkbox-label">
                I agree to the Terms of Service and Privacy Policy
              </label>
              <span class="error-message" id="agree-error"></span>
            </div>

            <button type="submit" id="register-btn" class="btn btn-primary btn-block">
              <span id="btn-text">Create Account</span>
              <span id="spinner" class="spinner-inline hidden"></span>
            </button>
          </form>

          <div class="auth-divider">
            <span>Already have an account?</span>
          </div>

          <a href="#/login" class="btn btn-secondary btn-block">Sign In</a>
        </div>
      </div>
    </div>
  `;
}

export function initRegisterPage() {
  const form = document.getElementById('register-form');
  const btn = document.getElementById('register-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const roleInput = document.getElementById('role');
  const agreeInput = document.getElementById('agree');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.getElementById('name-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('confirm-error').textContent = '';
    document.getElementById('role-error').textContent = '';
    document.getElementById('agree-error').textContent = '';

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const role = roleInput.value;

    let hasError = false;

    if (name.length < 2) {
      document.getElementById('name-error').textContent = 'Name must be at least 2 characters';
      hasError = true;
    }

    if (!validateEmail(email)) {
      document.getElementById('email-error').textContent = 'Please enter a valid email';
      hasError = true;
    }

    if (!validatePassword(password)) {
      document.getElementById('password-error').textContent = 'Password must be at least 8 characters';
      hasError = true;
    }

    if (password !== confirm) {
      document.getElementById('confirm-error').textContent = 'Passwords do not match';
      hasError = true;
    }

    if (!role) {
      document.getElementById('role-error').textContent = 'Please select an option';
      hasError = true;
    }

    if (!agreeInput.checked) {
      document.getElementById('agree-error').textContent = 'You must agree to the terms';
      hasError = true;
    }

    if (hasError) return;

    btn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');

    try {
      const userData = {
        name,
        email,
        password,
        role: role === 'both' ? 'buyer' : role
      };

      const response = await authService.register(userData);

      if (response.success) {
        showNotification('Account created! Please log in.', 'success');
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 500);
      }
    } catch (error) {
      showNotification(error.message || 'Registration failed', 'error');
      btnText.textContent = 'Create Account';
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  });
}
