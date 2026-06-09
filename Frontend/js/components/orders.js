function money(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

export function createOrderRow(order) {
  return `
    <div class="order-row table-row" data-order-id="${order.id}">
      <div class="col-id">#${order.id}</div>
      <div class="col-date">${formatDate(order.created_at)}</div>
      <div class="col-total">${money(order.total_amount || order.total)}</div>
      <div class="col-status">
        <span class="status-badge badge-${order.status || 'pending'}">${order.status || 'pending'}</span>
      </div>
      <div class="col-actions">
        <a href="#/orders/${order.id}" class="btn btn-secondary btn-sm">View</a>
      </div>
    </div>
  `;
}

