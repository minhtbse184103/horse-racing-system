import { formatDisplayLabel, getUserRole } from '../../lib';

export default function UserPanel({ user, onLogout }) {
  return (
    <main className="auth-page">
      <section className="success-card" aria-label="Thông tin đăng nhập thành công">
        <div className="success-icon">✓</div>
        <p className="auth-eyebrow">Đường đua chiến thắng</p>
        <h1>Đăng nhập thành công</h1>
        <p>
          Hello <strong>{user?.fullName || user?.email}</strong>, your account has the{' '}
          Vai trò <strong>{formatDisplayLabel(getUserRole(user))}</strong>.
        </p>
        <div className="user-info-grid">
          <span>Email</span>
          <strong>{user?.email}</strong>
          <span>Số điện thoại</span>
          <strong>{user?.phone || 'Chưa cập nhật'}</strong>
          <span>Trạng thái</span>
          <strong>{formatDisplayLabel(user?.status)}</strong>
        </div>
        <button className="primary-button full-width" type="button" onClick={onLogout}>
          Sign Out
        </button>
      </section>
    </main>
  );
}
