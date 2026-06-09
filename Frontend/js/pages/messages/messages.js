/**
 * Messages Page Module
 * Display message threads
 */

export async function messagesPage() {
  return `
    <div class="main-layout">
      <div class="messages-container">
        <h1>Messages</h1>
        <div class="empty-state">
          <p>Message threads open from product pages so Bater can connect the product and seller correctly.</p>
          <a href="#/products" class="btn btn-primary">Browse Products</a>
        </div>
      </div>
    </div>
  `;
}

export function initMessagesPage() {
}
