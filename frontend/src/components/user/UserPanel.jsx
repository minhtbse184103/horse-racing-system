import { getUserRole } from '../../lib';

export default function UserPanel({ user, onLogout }) {
  return (
    <main className="auth-page">
      <section className="success-card" aria-label="Successful login information">
        <div className="success-icon">✓</div>
        <p className="auth-eyebrow">Trackside Triumph</p>
        <h1>Signed In Successfully</h1>
        <p>
          Hello <strong>{user?.fullName || user?.email}</strong>, your account has the{' '}
          <strong>{getUserRole(user) || 'USER'}</strong> role.
        </p>
        <div className="user-info-grid">
          <span>Email</span>
          <strong>{user?.email}</strong>
          <span>Phone</span>
          <strong>{user?.phone || 'Not updated'}</strong>
          <span>Status</span>
          <strong>{user?.status || 'N/A'}</strong>
        </div>
        <button className="primary-button full-width" type="button" onClick={onLogout}>
          Sign Out
        </button>
      </section>
    </main>
  );
}
