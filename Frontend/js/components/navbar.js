/**
 * Navbar Component
 * Role-aware navigation bar
 */

import { auth } from '../utils/auth.js';
import { authService } from '../services/authService.js';
import { cartService } from '../services/cartService.js';

export const navByRole = {
  buyer: [
    { label: 'Dashboard', href: '#/dashboard' },
    { label: 'Browse Products', href: '#/products' },
    { label: 'Categories', href: '#/categories' },
    { label: 'Cart', href: '#/cart' },
    { label: 'Orders', href: '#/orders' },
    { label: 'Messages', href: '#/messages' },
    { label: 'Profile', href: '#/profile' },
    { label: 'Settings', href: '#/profile/settings' },
  ],
  seller: [
    { label: 'Dashboard', href: '#/dashboard' },
    { label: 'My Products', href: '#/seller/products' },
    { label: 'Add Product', href: '#/products/create' },
    { label: 'Inventory', href: '#/seller/inventory' },
    { label: 'Orders', href: '#/seller/orders' },
    { label: 'Sales Analytics', href: '#/seller/analytics' },
    { label: 'Messages', href: '#/messages/seller-messages' },
    { label: 'Profile', href: '#/profile' },
    { label: 'Settings', href: '#/profile/settings' },
  ],
  admin: [
    { label: 'Dashboard', href: '#/admin' },
    { label: 'User Management', href: '#/admin/users' },
    { label: 'Seller Management', href: '#/admin/sellers' },
    { label: 'Product Moderation', href: '#/admin/products' },
    { label: 'Categories', href: '#/admin/categories' },
    { label: 'Reports', href: '#/admin/reports' },
    { label: 'System Settings', href: '#/admin/settings' },
    { label: 'Audit Logs', href: '#/admin/logs' },
  ],
};

export async function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const user = auth.getUser();
  const roleLinks = user ? (navByRole[user.role] || navByRole.buyer) : [];
  const currentHash = window.location.hash || '#/';
  const cartCount = user?.role === 'buyer' ? await getCartCount() : 0;

  navbar.innerHTML = `
    <div class="navbar-container">
      <a href="${user?.role === 'admin' ? '#/admin' : '#/'}" class="navbar-brand">
        <img src="images/bater-logo.jpeg" alt="Bater Logo" class="navbar-logo">
      </a>
      <ul class="navbar-nav">
        ${user
          ? `
            ${roleLinks.map((item) => `
              <li>
                <a href="${item.href}" class="${currentHash === item.href ? 'active' : ''}">
                  ${item.label}${item.href === '#/cart' ? `<span class="cart-count">${cartCount}</span>` : ''}
                </a>
              </li>
            `).join('')}
            <li class="account-menu">
              <details>
                <summary>${user.name || 'Account'}</summary>
                <div class="account-menu-list">
                  <a href="#/profile">Profile</a>
                  <a href="#/profile/settings">Settings</a>
                  <a href="#/login" id="logout-link">Logout</a>
                </div>
              </details>
            </li>
          `
          : `
            <li><a href="#/products" class="${currentHash === '#/products' ? 'active' : ''}">Browse Products</a></li>
            <li><a href="#/login" class="${currentHash === '#/login' ? 'active' : ''}">Login</a></li>
            <li><a href="#/register" class="${currentHash === '#/register' ? 'active' : ''}">Register</a></li>
          `
        }
      </ul>
    </div>
  `;

  navbar.querySelector('#logout-link')?.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      await authService.logout();
    } catch {
      auth.clear();
    } finally {
      window.location.hash = '#/login';
      renderNavbar();
    }
  });
}



export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const user = auth.getUser();
  const roleLinks = user ? (navByRole[user.role] || navByRole.buyer) : [
    { label: 'Browse Products', href: '#/products' },
    { label: 'Categories', href: '#/categories' },
    { label: 'Login', href: '#/login' },
    { label: 'Register', href: '#/register' },
  ];

  const currentHash = window.location.hash || '#/';
  sidebar.innerHTML = `
    <div class="sidebar-panel">
      <div class="sidebar-brand">
        <img src="images/bater-logo.jpeg" alt="Bater Logo" class="sidebar-logo">
        <div>
          <small>${user ? user.role : 'Marketplace'}</small>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${roleLinks.map((item) => `
          <a href="${item.href}" class="${currentHash === item.href ? 'active' : ''}">
            ${item.label}
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}
