# BATER Frontend Architecture Explanation

## Table of Contents
1. [Overall Architecture](#overall-architecture)
2. [Project Structure](#project-structure)
3. [Application Startup](#application-startup)
4. [Routing System](#routing-system)
5. [Authentication Flow](#authentication-flow)
6. [State Management](#state-management)
7. [HTML Structure](#html-structure)
8. [CSS Design System](#css-design-system)
9. [JavaScript Modules](#javascript-modules)
10. [Complete Data Flows](#complete-data-flows)

---

## Overall Architecture

The BATER frontend is a **Single Page Application (SPA)** built with vanilla HTML, CSS, and JavaScript. It does NOT use any frameworks like React, Vue, or Angular. Instead, it implements a custom router and service-based architecture.

### Key Architecture Characteristics:

- **Type**: Vanilla JavaScript SPA
- **Routing**: Hash-based (`#/path/to/page`)
- **State**: Session-based (sessionStorage for user data)
- **Data Persistence**: sessionStorage + localStorage
- **API Communication**: Fetch API with credentials
- **Component Pattern**: Functional JavaScript with template literals

### Why This Approach?

1. **No Build Process Required** - Pure JavaScript runs in browser without compilation
2. **Simple Deployment** - Static files only (HTML, CSS, JS)
3. **Small Bundle** - Lightweight compared to full frameworks
4. **Direct DOM Manipulation** - All template rendering uses template literals and innerHTML

---

## Project Structure

```
Frontend/
├── index.html              # Entry point
├── css/
│   ├── styles.css         # Main stylesheet (2700+ lines)
│   ├── components.css     # Component-specific styles (buttons, cards, forms)
│   ├── responsive.css     # Media queries for all breakpoints
│   └── variables.css      # CSS custom properties (design tokens)
├── js/
│   ├── config.js          # Global configuration (API URL, constants)
│   ├── app.js             # Router and main app logic
│   ├── pages/             # Page components (one per route)
│   │   ├── home.js
│   │   ├── dashboard.js
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── register.js
│   │   │   ├── profile.js
│   │   │   ├── forgot-password.js
│   │   │   └── reset-password.js
│   │   ├── products/
│   │   ├── orders/
│   │   ├── shopping/
│   │   ├── messages/
│   │   ├── seller/
│   │   ├── admin/
│   │   └── payments/
│   ├── services/          # Business logic & API calls
│   │   ├── api.js         # HTTP wrapper (fetch)
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   ├── userService.js
│   │   └── [other services]
│   ├── components/        # Reusable UI components
│   │   ├── navbar.js
│   │   ├── notifications.js
│   │   ├── products.js
│   │   ├── empty-states.js
│   │   ├── orders.js
│   │   ├── cart.js
│   │   └── reviews.js
│   └── utils/             # Helper functions
│       ├── auth.js        # Authentication state manager
│       ├── storage.js     # localStorage wrapper
│       ├── validators.js  # Form validation functions
│       ├── assets.js      # Asset URL helpers
│       └── [other utilities]
└── images/                # Static assets
```

### Module Organization Pattern

Each major feature follows this pattern:

```
Feature X/
├── pages/featureX.js          # UI component (exports page HTML + init)
├── services/featureXService.js # API calls + business logic
└── components/featureX.js      # Reusable sub-components
```

### Example: Product Feature

- **Page**: `pages/products/list.js` - renders product grid and filters
- **Service**: `services/productService.js` - calls `/products` API
- **Component**: `components/products.js` - reusable product card

---

## Application Startup

### Entry Point: `index.html`

```html
<body>
  <div id="notifications"></div>          <!-- Notification container -->
  <header class="site-header">
    <nav id="navbar"></nav>               <!-- Dynamic navbar -->
  </header>
  <div class="app-shell">
    <aside id="sidebar"></aside>          <!-- Dynamic sidebar -->
    <main id="app"></main>                <!-- Page content renders here -->
  </div>
  <footer class="site-footer"></footer>
  <div id="loading-overlay"></div>        <!-- Loading spinner -->
  
  <!-- Module scripts (ES6) -->
  <script src="js/config.js" type="module"></script>
  <script src="js/app.js" type="module"></script>
</body>
```

### Initialization Flow (in `app.js`)

```javascript
// 1. Define all routes (40+ routes total)
const routes = {
  '': { page: homePage, protected: false },
  'login': { page: loginPage, protected: false },
  'dashboard': { page: dashboardPage, protected: true, requiredRole: 'buyer' },
  // ... many more
};

// 2. When DOM loads, start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 3. init() function
async function init() {
  await renderNavbar();      // Render navbar based on user role
  renderSidebar();           // Render sidebar
  window.addEventListener('hashchange', router);  // Listen for URL changes
  if (!window.location.hash) {
    window.location.hash = '#/';  // Go to home if no hash
  } else {
    router();                // Render current page
  }
}
```

### Key Components Initialized

1. **Navbar** (`renderNavbar()`)
   - Changes based on user role (admin, seller, buyer, or anonymous)
   - Shows cart count for buyers
   - Displays user name and logout option

2. **Sidebar** (`renderSidebar()`)
   - Context-specific navigation
   - Role-aware menu

3. **Main Router** (`router()`)
   - Parses hash URL
   - Checks authentication and role requirements
   - Renders appropriate page
   - Initializes page-specific event handlers

---

## Routing System

### How Hash-Based Routing Works

Traditional websites use paths: `/products/123`

Bater uses hashes: `#/products/123`

**Why?** Because the browser doesn't reload when hash changes, allowing SPA navigation without server requests.

### Route Configuration

```javascript
const routes = {
  'products/:id': { 
    page: productDetailPage,           // Function that returns HTML
    init: initProductDetailPage,       // Function that sets up event listeners
    protected: true,                   // Requires authentication
    requiredRole: 'buyer'              // Only buyers can see this
  }
};
```

### The Router Process

```javascript
async function router() {
  // 1. Parse the hash URL
  const route = parseRoute(window.location.hash);
  // e.g., '#/products/123' → { path: 'products/:id', params: { id: '123' } }
  
  // 2. Show loading indicator
  showLoading();
  
  // 3. Render navbar (always, same on all pages)
  await renderNavbar();
  renderSidebar();
  
  // 4. Check if route exists
  if (!route) {
    app.innerHTML = '404 Not Found';
    return;
  }
  
  // 5. Check authentication
  if (route.config.protected && !auth.isAuthenticated()) {
    window.location.hash = '#/login';  // Redirect to login
    return;
  }
  
  // 6. Check role authorization
  if (route.config.requiredRole && !auth.hasRole(route.config.requiredRole)) {
    app.innerHTML = '403 Forbidden';
    return;
  }
  
  // 7. Render the page
  const pageHTML = await route.config.page(route.params);
  app.innerHTML = pageHTML;
  
  // 8. Initialize page event handlers
  if (route.config.init) {
    route.config.init();
  }
  
  // 9. Hide loading, scroll to top
  hideLoading();
  window.scrollTo(0, 0);
}
```

### URL Pattern Matching

```javascript
function parseRoute(hash) {
  const path = hash.slice(1);  // Remove '#'
  // '#/products/123' → 'products/123'
  const segments = path.split('/');
  // ['products', '123']
  
  // Try to match against route patterns
  for (const [pattern, config] of Object.entries(routes)) {
    const patternSegments = pattern.split('/');
    
    if (patternSegments.length !== segments.length) continue;
    
    const params = {};
    let matched = true;
    
    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(':')) {
        // :id → capture this segment
        params[patternSegments[i].slice(1)] = segments[i];
      } else if (patternSegments[i] !== segments[i]) {
        matched = false;
        break;
      }
    }
    
    if (matched) {
      return { path: pattern, params, config };
    }
  }
  
  return null;  // No route matched
}
```

### Navigation

Users navigate by changing the hash:

```javascript
// In a click handler
window.location.hash = '#/products/123';
// Browser fires 'hashchange' event
// router() function is called
// Product detail page is rendered
```

---

## Authentication Flow

### Complete Login Process

#### Step 1: User Submits Login Form

```javascript
// pages/auth/login.js
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Call login service
  const response = await authService.login(email, password);
  
  if (response.success) {
    // Store user data locally
    auth.setUser({ ...response.data, id: response.data.user_id });
    showNotification('Login successful!', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.hash = '#/dashboard';
    }, 500);
  } else {
    showNotification(response.error, 'error');
  }
});
```

#### Step 2: API Call with Credentials

```javascript
// services/authService.js
async login(email, password) {
  const response = await apiPost('/auth/login', { email, password });
  // apiPost calls apiCall with credentials: 'include'
  if (response.success) {
    auth.setUser(normalizeUser(response.data));  // Store user info
  }
  return response;
}
```

#### Step 3: API Call Implementation

```javascript
// services/api.js
export async function apiCall(endpoint, options = {}) {
  const { method = 'GET', body = null, headers = {} } = options;
  
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include'  // *** CRITICAL: Send cookies with request ***
  };
  
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, fetchOptions);
  
  // Handle 401 (session expired)
  if (response.status === 401) {
    auth.clear();
    window.location.hash = '#/login';
    throw new Error('Session expired. Please login again.');
  }
  
  return response.json();
}
```

#### Step 4: Backend Response

Backend responds with user data:

```json
{
  "success": true,
  "data": {
    "user_id": 5,
    "name": "John Doe",
    "role": "buyer"
  }
}
```

Backend ALSO sets a session cookie:

```
Set-Cookie: PHPSESSID=abc123def456; Path=/; Secure; HttpOnly; SameSite=None
```

#### Step 5: Frontend Stores User Locally

```javascript
// utils/auth.js
class AuthManager {
  setUser(userData) {
    // Store in sessionStorage so user persists during browser session
    sessionStorage.setItem('bater_user', JSON.stringify(userData));
  }
  
  getUser() {
    const userJson = sessionStorage.getItem('bater_user');
    return userJson ? JSON.parse(userJson) : null;
  }
}

const auth = new AuthManager();
```

### Verification After Login

When user navigates to protected pages:

```javascript
// In router()
const config = route.config;

if (config.protected && !auth.isAuthenticated()) {
  // Check if user data exists in sessionStorage
  window.location.hash = '#/login';
  return;
}
```

The user information comes from **sessionStorage**, NOT from API verification on every page load.

### Session Storage Keys

```javascript
// config.js
STORAGE_KEYS: {
  USER: 'bater_user',           // Stores: { id, name, role }
  AUTH_TOKEN: 'bater_auth_token', // Currently not widely used
  CART: 'bater_cart',           // Cart items
  PREFERENCES: 'bater_preferences',
  FILTERS: 'bater_filters'
}
```

### Logout Process

```javascript
// services/authService.js
async logout() {
  // Call backend to destroy session
  await apiPost('/auth/logout', {});
  
  // Clear frontend storage
  auth.clear();
  storage.clearCart();
  
  // Redirect to login
  window.location.hash = '#/login';
}

// utils/auth.js
clear() {
  sessionStorage.removeItem('bater_user');
  sessionStorage.removeItem('bater_auth_token');
}
```

Backend destroys the PHP session and expires the cookie.

---

## State Management

### No Redux/Vuex - Simple Pattern

Bater uses a simple state management approach:

1. **User State** - `sessionStorage` (managed by `auth.js`)
2. **Cart State** - `localStorage` (managed by `storage.js`)
3. **Temporary State** - Page-level variables (not persisted)

### User State Example

```javascript
// Getting user
const user = auth.getUser();
if (user?.role === 'seller') {
  // Show seller dashboard
}

// Updating user
auth.setUser({ ...currentUser, name: 'New Name' });

// Clearing on logout
auth.clear();
```

### Cart State Example

```javascript
// Getting cart
const cart = storage.getCart();  // Returns array

// Adding to cart
storage.setCart([...cart, { productId: 5, quantity: 2 }]);

// Clearing cart
storage.clearCart();
```

### Why sessionStorage (not localStorage)?

- **sessionStorage** persists during a browser session
- **localStorage** persists indefinitely across sessions
- **User data** should be cleared when browser closes (more secure)
- **Cart** uses localStorage so it survives browser restart

---

## HTML Structure

### Root Layout (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bater - Buy & Sell Locally</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- Notifications (alerts, errors, success messages) -->
  <div id="notifications" class="notification-container"></div>
  
  <!-- Sticky header with navbar -->
  <header class="site-header">
    <nav id="navbar"></nav>
  </header>
  
  <!-- Main application layout -->
  <div class="app-shell">
    <aside id="sidebar" class="app-sidebar"></aside>
    <main id="app" class="app-container"></main>
  </div>
  
  <!-- Footer -->
  <footer class="site-footer">
    <img src="images/bater-logo.jpeg" alt="Bater Logo">
    <span>Peer-to-peer marketplace for local buying and selling.</span>
  </footer>
  
  <!-- Loading overlay (spinner) -->
  <div id="loading-overlay" class="loading-overlay hidden">
    <div class="spinner"></div>
  </div>
  
  <script src="js/config.js" type="module"></script>
  <script src="js/app.js" type="module"></script>
</body>
</html>
```

### Grid-Based Layout

The app uses CSS Grid extensively:

```css
.app-shell {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);  /* Sidebar + Main */
  gap: 1.25rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

### Common Page Patterns

#### Pattern 1: Hero Section + Content

```html
<section class="page-hero">
  <h1>Page Title</h1>
  <p>Page Description</p>
</section>

<section class="page-content">
  <!-- Page-specific content -->
</section>
```

#### Pattern 2: Form Layout

```html
<form class="form-card">
  <div class="form-group">
    <label class="form-label">Field Label</label>
    <input type="text" class="form-control">
    <span class="error-message"></span>
  </div>
  
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

#### Pattern 3: Data Grid

```html
<div class="product-grid">
  <div class="product-card">
    <img src="..." alt="...">
    <h3>Product Title</h3>
    <p>Price</p>
    <a href="#/products/5" class="btn">View</a>
  </div>
  <!-- More cards -->
</div>
```

### Responsive Container

```html
<div class="container">
  <!-- Max width: 1280px, auto margins for centering -->
</div>
```

### Semantic Elements Used

- `<header>` - Site header
- `<nav>` - Navigation
- `<main>` - Main content
- `<aside>` - Sidebar
- `<section>` - Content sections
- `<article>` - Cards/items
- `<footer>` - Site footer
- `<form>` - Forms
- `<input>`, `<select>`, `<textarea>` - Form fields

---

## CSS Design System

### Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #0A66C2;
  --color-secondary: #0078D4;
  --color-success: #16834a;
  --color-danger: #c92a2a;
  --color-text: #1F2937;
  --color-muted: #6B7280;
  --color-background: #F5F7FA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  
  /* Spacing (8px scale) */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  
  /* Shadows */
  --shadow-sm: 0 8px 20px rgba(7, 17, 31, 0.07);
  --shadow-md: 0 16px 36px rgba(7, 17, 31, 0.12);
  
  /* Border Radius */
  --radius: 8px;
  
  /* Fonts */
  --font-family: "Segoe UI", Arial, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

### Component Styles

#### Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-sm);
}
```

#### Forms

```css
.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: 600;
  color: var(--color-text);
}

.form-control {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-size-base);
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(10, 102, 194, 0.1);
}

.error-message {
  display: block;
  margin-top: var(--space-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
```

#### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Responsive Design

Mobile-first approach with breakpoints:

```css
/* Base styles (mobile - up to 767px) */
.products-grid {
  grid-template-columns: 1fr;  /* 1 column on mobile */
}

/* Tablet (768px - 991px) */
@media (min-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);  /* 2 columns */
  }
}

/* Desktop (992px+) */
@media (min-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);  /* 3 columns */
  }
}
```

### Navbar Styling

```css
.navbar {
  background: linear-gradient(90deg, #030914, #071e3c 55%, #0a3f91);
  position: sticky;
  top: 0;
  z-index: 900;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
}

.navbar-nav {
  display: flex;
  gap: 0.4rem;
  list-style: none;
}

.navbar-nav a {
  padding: 0.55rem 0.75rem;
  color: #d9e8ff;
  transition: background 200ms ease;
}

.navbar-nav a:hover {
  background: var(--color-primary);
  color: white;
}
```

---

## JavaScript Modules

### Service Layer Pattern

Each service encapsulates API calls for a feature:

```javascript
// services/productService.js
export const productService = {
  async getAll(filters) {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/products${params ? '?' + params : ''}`);
  },
  
  async getById(id) {
    return apiGet(`/products/${id}`);
  },
  
  async create(formData) {
    return apiPost('/products', formData);
  },
  
  async update(id, data) {
    return apiPut(`/products/${id}`, data);
  },
  
  async delete(id) {
    return apiDelete(`/products/${id}`);
  }
};
```

### Page Components Pattern

Each page exports two functions:

```javascript
// pages/products/list.js

// 1. render function - returns HTML string
export async function productListPage() {
  try {
    const [response, categoriesResponse] = await Promise.all([
      productService.getAll(currentFilters),
      productService.getCategories()
    ]);
    
    currentProducts = response.data || [];
    
    return `
      <div class="main-layout">
        <main class="main-content">
          ${currentProducts.length === 0 
            ? `<div class="empty-state">No products found</div>`
            : `<div class="product-grid">
                ${currentProducts.map(p => createProductCard(p)).join('')}
              </div>`
          }
        </main>
      </div>
    `;
  } catch (error) {
    return `<div class="error-container"><p>${error.message}</p></div>`;
  }
}

// 2. init function - attaches event listeners
export function initProductListPage() {
  const searchBtn = document.getElementById('search-btn');
  
  searchBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    currentFilters.search = searchInput.value;
    const html = await productListPage();
    document.getElementById('app').innerHTML = html;
    initProductListPage();  // Reattach listeners
  });
}
```

### API Client (`services/api.js`)

```javascript
export async function apiCall(endpoint, options = {}) {
  const { method = 'GET', body = null, headers = {} } = options;
  
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include'  // Important: Send cookies
  };
  
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(API_BASE_URL + endpoint, fetchOptions);
    
    if (response.status === 401) {
      auth.clear();
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'GET' });
}

export function apiPost(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: 'POST', body });
}

export function apiPut(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: 'PUT', body });
}

export function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'DELETE' });
}
```

### Component Functions

Reusable functions that return HTML for repeated patterns:

```javascript
// components/products.js
export function createProductCard(product) {
  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image">
        <img src="${assetUrl(product.image_path)}" alt="${product.title}">
      </div>
      <div class="product-info">
        <h3>${escapeHtml(product.title)}</h3>
        <p class="product-price">R${Number(product.price).toFixed(2)}</p>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm">View</button>
          <button class="btn btn-secondary btn-sm add-to-cart-btn">Cart</button>
        </div>
      </div>
    </div>
  `;
}
```

---

## Complete Data Flows

### Flow 1: User Login

```
[Login Form Submitted]
        ↓
[validateEmail() & validatePassword()]
        ↓
[authService.login(email, password)]
        ↓
[apiPost('/auth/login', { email, password })]
        ↓
[fetch with credentials: 'include']
        ↓
[Backend sets PHPSESSID cookie]
[Backend returns { user_id, name, role }]
        ↓
[normalizeUser() → { id, name, role }]
        ↓
[auth.setUser() stores in sessionStorage]
        ↓
[Set window.location.hash = '#/dashboard']
        ↓
[hashchange event fired]
        ↓
[router() → renderNavbar() → renderPage()]
        ↓
[User sees personalized dashboard]
```

### Flow 2: Browsing Products

```
[Click 'Products' in navbar]
        ↓
[window.location.hash = '#/products']
        ↓
[router() called]
        ↓
[productListPage() called]
        ↓
[productService.getAll() calls apiGet('/products')]
        ↓
[fetch('/products', { credentials: 'include' })]
        ↓
[Backend checks PHPSESSID cookie (optional for public route)]
[Returns { success: true, data: [...products] }]
        ↓
[currentProducts = response.data]
        ↓
[HTML generated with map(product => createProductCard(product))]
        ↓
[app.innerHTML = productHTML]
        ↓
[initProductListPage() called]
        ↓
[Event listeners attached to search, filters, cards]
        ↓
[User can click product to view detail]
```

### Flow 3: Adding to Cart

```
[User clicks 'Add to Cart' button]
        ↓
[handleAddToCart(productId) called]
        ↓
[cartService.addItem(productId, 1)]
        ↓
[storage.getCart() → array from localStorage]
        ↓
[Add item to array: [...cart, { productId, quantity }]]
        ↓
[storage.setCart(updatedCart)]
        ↓
[Notification: 'Added to cart!']
        ↓
[updateCartCount()]  (if updates navbar)
```

### Flow 4: Checkout & Payment

```
[User clicks 'Checkout']
        ↓
[window.location.hash = '#/checkout']
        ↓
[checkoutPage() renders cart items]
        ↓
[User fills shipping details, clicks 'Pay Now']
        ↓
[orderService.create({ items, total, shippingInfo })]
        ↓
[apiPost('/orders', data)]
        ↓
[Backend creates order, returns { order_id }]
        ↓
[paymentService.initiate(order_id)]
        ↓
[apiPost('/payments/initiate', { order_id })]
        ↓
[Backend generates PayFast redirect form]
        ↓
[window.location = paymentFormURL]
        ↓
[User redirected to PayFast payment gateway]
        ↓
[User completes payment]
        ↓
[PayFast redirects back to #/payment/status/success or /failed]
        ↓
[paymentStatusPage() renders confirmation]
        ↓
[Cart cleared: storage.clearCart()]
```

### Flow 5: Creating a Product (Seller)

```
[Seller clicks 'Add Product']
        ↓
[window.location.hash = '#/products/create']
        ↓
[router() checks: protected: true, requiredRole: 'seller']
        ↓
[auth.hasRole('seller') returns true → page renders]
        ↓
[productCreatePage() renders form with fields]
        ↓
[initProductCreatePage() attaches form listener]
        ↓
[User fills form, picks image, clicks 'Create']
        ↓
[validateProductForm(form) validates all fields]
        ↓
[FormData created including file]
        ↓
[productService.create(formData)]
        ↓
[apiPost('/products', formData, { headers: {} })]
        ↓
[Browser auto-handles multipart/form-data header]
        ↓
[fetch with credentials: 'include']
        ↓
[Backend validates, checks seller role via AuthMiddleware]
[Saves product to DB]
[Returns { success: true, product_id }]
        ↓
[showNotification('Product created!', 'success')]
        ↓
[window.location.hash = '#/seller/products']
        ↓
[New product appears in seller's product list]
```

### Flow 6: Protected Route (Admin Dashboard)

```
[User manually types #/admin/dashboard in address bar]
        ↓
[hashchange event fired → router() called]
        ↓
[parseRoute('#/admin/dashboard') returns route config]
        ↓
[route.config.protected === true]
        ↓
[auth.isAuthenticated() checks sessionStorage]
        ↓
[If NOT authenticated: redirect to #/login]
        ↓
[If authenticated, check: route.config.requiredRole === 'admin']
        ↓
[auth.hasRole('admin') checks user.role from sessionStorage]
        ↓
[If NOT admin: show 403 Forbidden]
        ↓
[If admin: adminDashboardPage() renders]
        ↓
[initAdminDashboardPage() attaches handlers]
```

---

## Key Concepts Summary

### 1. SPA Architecture
- Single HTML file
- Router dynamically loads pages
- No page refreshes
- All state in JavaScript

### 2. Module Pattern
- Each feature (products, orders, etc.) has:
  - Service (API calls)
  - Pages (UI components)
  - Components (reusable pieces)

### 3. Event-Driven
- User actions trigger event listeners
- Event handlers update DOM or navigate
- No automatic reactivity (not Vue/React)

### 4. Storage-Based Auth
- Session data stored in sessionStorage
- Backend maintains PHP session via cookie
- Frontend verifies with sessionStorage (not API)
- **This is critical for Safari compatibility issues**

### 5. Role-Based Access Control
- Routes can require specific roles
- Frontend checks role before rendering
- Backend also validates via middleware
- Defense in depth

### 6. Progressive Enhancement
- Forms work without JavaScript (fallback)
- Validation on both client and server
- Error handling at each layer

---

## Security Considerations

### 1. Input Validation
- Client-side: `validateEmail()`, `validatePassword()`, etc.
- Server-side: Required (not shown in this analysis)

### 2. CSRF Protection
- FormData sent via fetch (browser handles tokens)
- Backend validates Origin header

### 3. Authentication
- Credentials stored securely in sessionStorage
- Not accessible via XSS (if CSP enabled)
- Logout clears all data

### 4. Authorization
- Frontend role checks (UX prevention)
- Backend role checks (security)

### 5. Sensitive Data
- API base URL in config.js (public, but could use env)
- No API keys exposed in frontend
- Payment tokens handled by backend only

---

## Conclusion

The BATER frontend is a well-structured vanilla JavaScript SPA that demonstrates:

- **Simplicity**: No framework complexity, pure JavaScript
- **Modularity**: Clear separation of services, pages, components
- **Functionality**: Complete user flows from login to payment
- **Responsiveness**: Mobile-first CSS with media queries
- **Maintainability**: Clear patterns for adding new features

For a junior developer learning this codebase:

1. Start with `index.html` to understand the DOM structure
2. Read `app.js` to understand routing
3. Study `auth.js` to understand authentication
4. Look at one page module (e.g., `pages/products/list.js`)
5. Trace the service layer (e.g., `services/productService.js`)
6. Understand CSS patterns in `styles.css`
7. Practice adding a new page following existing patterns
