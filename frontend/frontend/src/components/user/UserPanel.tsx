import { getUserRole } from '../../lib';
import type { AuthUser } from '../../types';

const roleDashboards: Record<string, string> = {
  ADMIN: '/admin',
  OWNER: '/owner',
  JOCKEY: '/jockey',
  REFEREE: '/referee',
  SPECTATOR: '/spectator'
};

interface UserPanelProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function UserPanel({ user, onLogout }: UserPanelProps) {
  const role = getUserRole(user);
  const dashboardPath = roleDashboards[role] || '/dashboard';

  return (
    <main className="page-shell">
      <section className="success-card" aria-label="Thông tin đăng nhập thành công">
        <div className="brand-mark">🏇</div>
        <p className="eyebrow">Horse Racing System</p>
        <h1>Đăng nhập thành công</h1>
        <p className="success-message">
          Chào <strong>{user.fullName || user.email}</strong>, tài khoản của bạn có quyền{' '}
          <strong>{role}</strong>.
        </p>

        <div className="user-info-grid">
          <span>Email</span>
          <strong>{user.email}</strong>

          <span>Trạng thái</span>
          <strong>{user.status || 'N/A'}</strong>

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
