const roleDashboards = {
  ADMIN: '/admin',
  OWNER: '/owner',
  JOCKEY: '/jockey',
  REFEREE: '/referee',
  SPECTATOR: '/spectator'
};

export default function UserPanel({ user, onLogout }) {
  const dashboardPath = roleDashboards[user?.role] || '/dashboard';

  return (
    <main className="page-shell">
      <section className="success-card" aria-label="Thông tin đăng nhập thành công">
        <div className="brand-mark">🏇</div>
        <p className="eyebrow">Horse Racing System</p>
        <h1>Đăng nhập thành công</h1>
        <p className="success-message">
          Chào <strong>{user?.fullName || user?.email}</strong>, tài khoản của bạn có quyền{' '}
          <strong>{user?.role}</strong>.
        </p>

        <div className="user-info-grid">
          <span>Email</span>
          <strong>{user?.email}</strong>

          <span>Trạng thái</span>
          <strong>{user?.status || 'N/A'}</strong>

          <span>Trang sau login</span>
          <strong>{dashboardPath}</strong>
        </div>

        <button className="primary-button" onClick={onLogout} type="button">
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
