export default function AccessDenied({ onReturnDashboard }) {
  return (
    <main className="auth-page">
      <section className="success-card" aria-label="Access denied">
        <div className="success-icon">!</div>
        <p className="auth-eyebrow">Protected Area</p>
        <h1>Access Denied</h1>
        <p className="success-message">Access Denied. Only Owners can access this page.</p>
        <button className="primary-button full-width" type="button" onClick={onReturnDashboard}>
          Return Dashboard
        </button>
      </section>
    </main>
  );
}
