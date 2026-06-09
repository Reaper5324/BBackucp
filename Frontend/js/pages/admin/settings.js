export function adminSettingsPage() {
  return `
    <div class="settings-page">
      <header class="sprofile-header-card"><div><h1>System Settings</h1><p>Administrative configuration overview.</p></div></header>
      <section class="settings-sections">
        <article class="settings-card"><h2>Access Control</h2><p>Admin routes are restricted to authenticated admins.</p></article>
        <article class="settings-card"><h2>Product Moderation</h2><p>Admins can remove listings from the product moderation screen.</p></article>
        <article class="settings-card"><h2>Audit Logs</h2><p>Administrative actions are recorded in audit logs.</p></article>
      </section>
    </div>
  `;
}
