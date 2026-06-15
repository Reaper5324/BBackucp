/**
 * Main Application Router
 * Handles hash-based routing and page initialization
 */

import { homePage } from './pages/home.js';
import { loginPage, initLoginPage } from './pages/auth/login.js';
import { registerPage, initRegisterPage } from './pages/auth/register.js';
import { forgotPasswordPage, initForgotPasswordPage } from './pages/auth/forgot-password.js';
import { resetPasswordPage, initResetPasswordPage } from './pages/auth/reset-password.js';
import {
  profilePage,
  initProfilePage
} from './pages/auth/profile.js';
import { dashboardPage } from './pages/dashboard.js';
import { categoriesPage } from './pages/categories.js';
import { wishlistPage } from './pages/wishlist.js';
import { productListPage, initProductListPage } from './pages/products/list.js';
import { productDetailPage, initProductDetailPage } from './pages/products/detail.js';
import { productCreatePage, initProductCreatePage } from './pages/products/create.js';
import { sellerProductsPage, initSellerProductsPage } from './pages/products/seller-products.js';
import { cartPage, initCartPage } from './pages/shopping/cart.js';
import { checkoutPage, initCheckoutPage } from './pages/shopping/checkout.js';
import { buyerOrdersPage, initBuyerOrdersPage } from './pages/orders/buyer-orders.js';
import { sellerOrdersPage, initSellerOrdersPage } from './pages/orders/seller-orders.js';
import { orderDetailPage, initOrderDetailPage } from './pages/orders/order-detail.js';
import { paymentPage, initPaymentPage } from './pages/payments/payment.js';
import { paymentStatusPage, initPaymentStatusPage } from './pages/payments/payment-status.js';
import { reviewsPage, initReviewsPage } from './pages/reviews/reviews.js';
import { messagesPage, initMessagesPage } from './pages/messages/messages.js';
import { threadPage, initThreadPage } from './pages/messages/thread.js';
import { sellerMessagesPage, initSellerMessagesPage } from './pages/messages/seller-messages.js';
import { verificationPage, initVerificationPage } from './pages/seller/verification.js';
import { sellerInventoryPage, initSellerInventoryPage } from './pages/seller/inventory.js';
import { sellerAnalyticsPage } from './pages/seller/analytics.js';
import { adminDashboardPage } from './pages/admin/dashboard.js';
import { usersPage, initUsersPage } from './pages/admin/users.js';
import { productsPage, initProductsPage } from './pages/admin/products.js';
import { verificationsPage, initVerificationsPage } from './pages/admin/verifications.js';
import { logsPage } from './pages/admin/logs.js';
import { sellersPage } from './pages/admin/sellers.js';
import { adminCategoriesPage, initAdminCategoriesPage } from './pages/admin/categories.js';
import { reportsPage } from './pages/admin/reports.js';
import { adminSettingsPage } from './pages/admin/settings.js';
import { supportPage, initSupportPage } from './pages/support.js';
import { adminSupportPage, initAdminSupportPage } from './pages/admin/support.js';
import { auth } from './utils/auth.js';
import { renderNavbar, renderSidebar } from './components/navbar.js';

const app = document.getElementById('app');
const loadingOverlay = document.getElementById('loading-overlay');

// Route configuration
const routes = {
  '': { page: homePage, init: null },
  'login': { page: loginPage, init: initLoginPage, protected: false },
  'register': { page: registerPage, init: initRegisterPage, protected: false },
  'forgot-password': { page: forgotPasswordPage, init: initForgotPasswordPage, protected: false },
  'reset-password': { page: resetPasswordPage, init: initResetPasswordPage, protected: false },
  'dashboard': { page: dashboardPage, init: null, protected: true, allowedRoles: ['buyer', 'seller'] },
  'profile': { page: profilePage, init: initProfilePage, protected: true },
  'profile/edit': { page: profilePage, init: initProfilePage, protected: true },
  'profile/change-password': { page: profilePage, init: initProfilePage, protected: true },
  'profile/settings': { page: profilePage, init: initProfilePage, protected: true },
  'products': { page: productListPage, init: initProductListPage },
  'categories': { page: categoriesPage, init: null },
  'products/create': { page: productCreatePage, init: initProductCreatePage, protected: true, requiredRole: 'seller' },
  'products/:id': { page: productDetailPage, init: initProductDetailPage },
  'products/:id/edit': { page: productCreatePage, init: initProductCreatePage, protected: true, requiredRole: 'seller' },
  'seller/products': { page: sellerProductsPage, init: initSellerProductsPage, protected: true, requiredRole: 'seller' },
  'seller/inventory': { page: sellerInventoryPage, init: initSellerInventoryPage, protected: true, requiredRole: 'seller' },
  'seller/analytics': { page: sellerAnalyticsPage, init: null, protected: true, requiredRole: 'seller' },
  'cart': { page: cartPage, init: initCartPage, protected: true, requiredRole: 'buyer' },
  'wishlist': { page: wishlistPage, init: null, protected: true, requiredRole: 'buyer' },
  'checkout': { page: checkoutPage, init: initCheckoutPage, protected: true, requiredRole: 'buyer' },
  'orders': { page: buyerOrdersPage, init: initBuyerOrdersPage, protected: true, requiredRole: 'buyer' },
  'orders/:id': { page: orderDetailPage, init: initOrderDetailPage, protected: true },
  'seller/orders': { page: sellerOrdersPage, init: initSellerOrdersPage, protected: true, requiredRole: 'seller' },
  'seller/messages': { page: sellerMessagesPage, init: initSellerMessagesPage, protected: true, requiredRole: 'seller' },
  'messages': { page: messagesPage, init: initMessagesPage, protected: true },
  'messages/:id': { page: threadPage, init: initThreadPage, protected: true },
  'payment': { page: paymentPage, init: initPaymentPage },
  'payment/status/:status': {
    page: paymentStatusPage,
    init: () => {
      // Re-read status from hash since init() receives no arguments from the router
      const status = window.location.hash.split('/').pop()?.split('?')[0] || '';
      initPaymentStatusPage(status);
    }
  },
  'reviews/:id': { page: reviewsPage, init: initReviewsPage },
  'seller/verification': { page: verificationPage, init: initVerificationPage, protected: true, requiredRole: 'seller' },
  'admin': { page: adminDashboardPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/dashboard': { page: adminDashboardPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/users': { page: usersPage, init: initUsersPage, protected: true, requiredRole: 'admin' },
  'admin/sellers': { page: sellersPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/products': { page: productsPage, init: initProductsPage, protected: true, requiredRole: 'admin' },
  'admin/categories': { page: adminCategoriesPage, init: initAdminCategoriesPage, protected: true, requiredRole: 'admin' },
  'admin/reports': { page: reportsPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/settings': { page: adminSettingsPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/verifications': { page: verificationsPage, init: initVerificationsPage, protected: true, requiredRole: 'admin' },
  'admin/logs': { page: logsPage, init: null, protected: true, requiredRole: 'admin' },
  'admin/support': { page: adminSupportPage, init: initAdminSupportPage, protected: true, requiredRole: 'admin' },
  'support': { page: supportPage, init: initSupportPage, protected: true }
};

/**
 * Parse route from hash
 * Returns { path, params }
 */
function parseRoute(hash) {
  const cleanedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = cleanedHash.replace(/^\/+|\/+$/g, '').split('?')[0] || '';
  const segments = path ? path.split('/') : [];

  for (const [routePattern, config] of Object.entries(routes)) {
    const normalizedPattern = routePattern.replace(/^\/+|\/+$/g, '');
    const patternSegments = normalizedPattern ? normalizedPattern.split('/') : [];
    if (patternSegments.length !== segments.length) {
      continue;
    }

    const params = {};
    let matched = true;

    for (let index = 0; index < patternSegments.length; index += 1) {
      const patternPart = patternSegments[index];
      const segment = segments[index];

      if (patternPart.startsWith(':')) {
        params[patternPart.slice(1)] = decodeURIComponent(segment || '');
      } else if (patternPart !== segment) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return {
        path: routePattern,
        actualPath: path,
        params,
        config
      };
    }
  }

  return null;
}

/**
 * Show loading indicator
 */
function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

/**
 * Route handler
 */
async function router() {
  const hash = window.location.hash;
  const route = parseRoute(hash);
  
  showLoading();
  
  try {
    await renderNavbar();
    renderSidebar();

    if (!route) {
      // Route not found
      app.innerHTML = `
        ${renderPageHero('Page Not Found', 'The route could not be matched.')}
        <div class="error-container" style="text-align: center; padding: 2rem;">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      `;
      hideLoading();
      return;
    }
    
    const { config, params } = route;
    
    // Check if route is protected
    if (config.protected && !auth.isAuthenticated()) {
      window.location.hash = '#/login';
      hideLoading();
      return;
    }
    
    // Check if user has required role
    if (config.requiredRole && !auth.hasRole(config.requiredRole)) {
      app.innerHTML = `${renderPageHero('Access Restricted', 'This area is only available to approved roles.')}${forbiddenPage()}`;
      hideLoading();
      return;
    }

    if (config.allowedRoles && !auth.hasAnyRole(...config.allowedRoles)) {
      app.innerHTML = forbiddenPage();
      hideLoading();
      return;
    }
    
    // Render page
    let pageContent;
    const hasParams = params && Object.keys(params).length > 0;
    if (hasParams) {
      const paramKeys = Object.keys(params);
      if (paramKeys.length === 1) {
        pageContent = await config.page(params[paramKeys[0]], params);
      } else {
        pageContent = await config.page(params);
      }
    } else {
      pageContent = await config.page();
    }
    
    app.innerHTML = `${renderPageHeroForRoute(route)}${pageContent}`;
    
    // Initialize page event handlers
    if (config.init) {
      config.init();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Router error:', error);
    app.innerHTML = `
      ${renderPageHero('Loading Error', 'Something went wrong while opening this page.')}
      <div class="error-container" style="text-align: center; padding: 2rem;">
        <h1>Error Loading Page</h1>
        <p>${error.message}</p>
        <a href="#/" class="btn btn-primary">Back to Home</a>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

function forbiddenPage() {
  return `
    <div class="error-container">
      <h1>403 - Forbidden</h1>
      <p>You do not have permission to access this page.</p>
      <a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a>
    </div>
  `;
}

function renderPageHeroForRoute(route) {
  if (!route || route.path === '') {
    return '';
  }

  const titles = {
    login: ['Login', 'Sign in to continue buying, selling, and tracking activity.'],
    register: ['Create Account', 'Join Bater as a buyer, seller, or admin user.'],
    dashboard: ['Dashboard', 'Your main workspace for the marketplace.'],
    profile: ['Profile', 'Manage your account details and contact information.'],
    'profile/edit': ['Edit Profile', 'Update your personal information.'],
    'profile/change-password': ['Change Password', 'Keep your account secure.'],
    'profile/settings': ['Settings', 'Review account preferences and safety options.'],
    products: ['Marketplace', 'Browse local listings, compare prices, and find what you need.'],
    categories: ['Categories', 'Explore products by marketplace category.'],
    'products/create': ['Add Product', 'Create a clear listing for buyers to discover.'],
    'products/:id': ['Product Details', 'Review product information, seller details, and buying options.'],
    'products/:id/edit': ['Edit Product', 'Update product information and listing details.'],
    'seller/products': ['My Products', 'Manage the listings you have published.'],
    'seller/inventory': ['Inventory', 'Review stock levels and listing status.'],
    'seller/analytics': ['Sales Analytics', 'Check performance across your seller activity.'],
    cart: ['Shopping Cart', 'Review your selected items before checkout.'],
    wishlist: ['Wishlist', 'Keep track of products you may want later.'],
    checkout: ['Checkout', 'Confirm your order and payment details.'],
    orders: ['Orders', 'Track purchases and order progress.'],
    'orders/:id': ['Order Details', 'Review items, status, and order actions.'],
    'seller/orders': ['Seller Orders', 'Prepare, dispatch, and manage buyer orders.'],
    messages: ['Messages', 'Continue conversations between buyers and sellers.'],
    'messages/:id': ['Message Thread', 'View and continue a marketplace conversation.'],
    payment: ['Payment', 'Complete payment for your order.'],
    'payment/status/:status': ['Payment Status', 'Review the result of your payment attempt.'],
    'reviews/:id': ['Reviews', 'Read or submit feedback for a product.'],
    'seller/verification': ['Seller Verification', 'Submit details needed to build buyer trust.'],
    admin: ['Admin Dashboard', 'Monitor users, products, orders, and platform activity.'],
    'admin/dashboard': ['Admin Dashboard', 'Monitor users, products, orders, and platform activity.'],
    'admin/users': ['User Management', 'Review and manage platform accounts.'],
    'admin/sellers': ['Seller Management', 'Review seller activity and trust signals.'],
    'admin/products': ['Product Moderation', 'Review listings and keep the marketplace clean.'],
    'admin/categories': ['Admin Categories', 'Maintain product category information.'],
    'admin/reports': ['Reports', 'Review marketplace summaries and activity reports.'],
    'admin/settings': ['System Settings', 'Manage administrative settings.'],
    'admin/verifications': ['Verifications', 'Approve or reject seller verification requests.'],
    'admin/logs': ['Audit Logs', 'Review important admin actions.'],
  };

  const fallbackTitle = route.actualPath
    .split('/')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const [title, subtitle] = titles[route.path] || [fallbackTitle || 'Bater', 'Marketplace tools and page information.'];
  return renderPageHero(title, subtitle);
}

function renderPageHero(title, subtitle) {
  return `
    <section class="page-hero">
      <div>
        <p class="hero-kicker">Bater Marketplace</p>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    </section>
  `;
}

/**
 * Initialize application
 */
async function init() {
  // Render navbar
  await renderNavbar();
  renderSidebar();
  
  // Handle route changes
  window.addEventListener('hashchange', router);
  
  // Initial route
  if (!window.location.hash) {
    window.location.hash = '#/';
  } else {
    router();
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}