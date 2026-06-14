/**
 * Login Page Module
 * Renders login form and handles authentication
 */

import { authService } from '../../services/authService.js';
import { auth } from '../../utils/auth.js';
import { showNotification } from '../../components/notifications.js';
import { validateEmail, validatePassword } from '../../utils/validators.js';

export async function loginPage() {
  return `
    <div class="auth-layout">
      <section class="auth-showcase">
        <p class="hero-kicker">Local trade made simpler</p>
        <p>Sign in to browse listings, manage orders, chat with sellers, and keep your marketplace activity in one place.</p>
        <div class="auth-points">
          <span>ITECA BATER DEMO</span>
        </div>
      </section>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">Sign in to your Bater account</p>
          </div>

          <form id="login-form" class="login-form">
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

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                class="form-control"
                autocomplete="current-password"
              >
              
             
<span class="error-message" id="password-error"></span>
             
            </div>

            <div class="form-group form-checkbox">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                class="form-checkbox-input"
              >
              <label for="remember" class="form-checkbox-label">Remember me</label>
            </div>

            <button type="submit" id="login-btn" class="btn btn-primary btn-block">
              <span id="btn-text">Sign In</span>
              <span id="spinner" class="spinner-inline hidden"></span>
            </button>
          </form>

          <div class="auth-divider">
            <span>Don't have an account?</span>
          </div>

          <a href="#/register" class="btn btn-secondary btn-block">Create Account</a>

          <p class="auth-footer">
            <a href="#/forgot-password" class="link">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export function initLoginPage() {
  const form = document.getElementById('login-form');
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    emailError.textContent = '';
    passwordError.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateEmail(email)) {
      emailError.textContent = 'Please enter a valid email';
      return;
    }

    if (!validatePassword(password)) {
      passwordError.textContent = 'Password must be at least 6 characters';
      return;
    }

    btn.disabled = true;
    btnText.textContent = '';
    spinner.classList.remove('hidden');

    try {
      const response = await authService.login(email, password);

      if (response.success) {
        auth.setUser({ ...response.data, id: response.data.id || response.data.user_id });
        showNotification('Login successful!', 'success');

        setTimeout(() => {
          const redirectPath = response.data.role === 'admin'
            ? '#/admin/dashboard'
            : response.data.role === 'seller'
            ? '#/seller/products'
            : '#/products';
          window.location.hash = redirectPath;
        }, 500);
      }
    } catch (error) {
      showNotification(error.message || 'Login failed', 'error');
      btnText.textContent = 'Sign In';
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  });

  emailInput.addEventListener('blur', () => {
    if (emailInput.value && !validateEmail(emailInput.value.trim())) {
      emailError.textContent = 'Invalid email address';
    } else {
      emailError.textContent = '';
    }
  });
}
