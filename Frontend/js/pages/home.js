/**
 * Home Page Module
 * Main landing page
 */

import { auth } from '../utils/auth.js';
import { productService } from '../services/productService.js';
import { assetUrl } from '../utils/assets.js';

export async function homePage() {
  try {
    const user = auth.getUser();
    
    // Get featured products
    let featuredProducts = [];
    try {
      const response = await productService.getFeatured();
      if (response.success) {
        featuredProducts = response.data || [];
      }
    } catch (e) {
      console.error('Failed to fetch featured products');
    }
    
    return `
      <div class="home-container">
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-content">
            <h1>Welcome to Bater</h1>
            <p>Your trusted peer-to-peer marketplace</p>
            <div class="hero-actions">
              ${user
                ? `<a href="#/products" class="btn btn-primary">Browse Products</a>`
                : `
                  <a href="#/login" class="btn btn-primary">Login</a>
                  <a href="#/register" class="btn btn-secondary">Join Bater</a>
                `
              }
            </div>
          </div>
        </section>
        
        <!-- Featured Products -->
        ${featuredProducts.length > 0
          ? `
            <section class="featured-section">
              <h2>Featured Products</h2>
              <div class="products-grid">
                ${featuredProducts.map(p => `
                  <div class="product-card">
                    <img src="${assetUrl(p.image_path)}" alt="${p.title}">
                    <h3>${p.title}</h3>
                    <p>R${Number(p.price || 0).toFixed(2)}</p>
                    <a href="#/products/${p.id}" class="btn btn-secondary">View</a>
                  </div>
                `).join('')}
              </div>
            </section>
          `
          : ''
        }
        
        <!-- CTA Section -->
        <section class="cta-section">
          <h2>Ready to start?</h2>
          ${user
            ? `<p>Head to our marketplace to find or list products</p>
               <a href="#/products" class="btn btn-primary">Browse Now</a>`
            : `<p>Join thousands of users buying and selling on Bater</p>
               <a href="#/register" class="btn btn-primary">Get Started</a>`
          }
        </section>
      </div>
    `;
  } catch (error) {
    return `
      <div class="home-container">
        <section class="hero">
          <h1>Welcome to Bater</h1>
          <a href="#/products" class="btn btn-primary">Browse Products</a>
        </section>
      </div>
    `;
  }
}
