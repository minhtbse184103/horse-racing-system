import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/userService';
import { getUserId } from '../../lib';
import type { AdminUserFormValues, AuthUser } from '../../types';

const manageableRoles = ['OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'] as const;
const userStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

interface AdminDashboardProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

function emptyUserForm(): AdminUserFormValues {
  return {
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleName: 'SPECTATOR',
    status: 'ACTIVE'
  };
}

function getRole(user: AuthUser | null | undefined): string {
  return String(user?.role || user?.roleName || '').trim().toUpperCase();
}

function isAdminUser(user: AuthUser | null | undefined): boolean {
  return getRole(user) === 'ADMIN';
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [formValues, setFormValues] = useState<AdminUserFormValues>(emptyUserForm());
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const manageableUsers = users.filter((user) => !isAdminUser(user));
  const adminUsers = users.filter(isAdminUser).length;
  const activeUsers = manageableUsers.filter((user) => user.status === 'ACTIVE').length;
  const inactiveUsers = manageableUsers.filter((user) => user.status === 'INACTIVE').length;
  const blockedUsers = manageableUsers.filter((user) => user.status === 'BLOCKED').length;

  useEffect(() => {
    loadUsers().catch(() => {});
  }, []);

  async function loadUsers(): Promise<void> {
    setIsLoading(true);
    setError('');

    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorText(err, 'Không thể tải danh sách user.'));
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  function handleEdit(user: AuthUser): void {
    if (isAdminUser(user)) {
      setError('Không được chỉnh sửa tài khoản ADMIN. Admin chỉ quản lý OWNER, JOCKEY, REFEREE và SPECTATOR.');
      setMessage('');
      return;
    }

    const role = getRole(user);

    setEditingUser(user);
    setFormValues({
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      password: '',
      roleName: manageableRoles.includes(role as AdminUserFormValues['roleName']) ? (role as AdminUserFormValues['roleName']) : 'SPECTATOR',
      status: user.status === 'INACTIVE' || user.status === 'BLOCKED' ? user.status : 'ACTIVE'
    });
    setMessage('');
    setError('');
  }

  function handleCancelEdit(): void {
    setEditingUser(null);
    setFormValues(emptyUserForm());
    setMessage('');
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (editingUser && isAdminUser(editingUser)) {
      setError('Không được chỉnh sửa tài khoản ADMIN.');
      return;
    }

    if (!manageableRoles.includes(formValues.roleName)) {
      setError('Admin chỉ được tạo hoặc cập nhật tài khoản OWNER, JOCKEY, REFEREE hoặc SPECTATOR.');
      return;
    }

    if (!formValues.email.trim()) {
      setError('Email không được để trống.');
      return;
    }

    if (!formValues.fullName.trim()) {
      setError('Họ tên không được để trống.');
      return;
    }

    if (!formValues.phone.trim()) {
      setError('Số điện thoại không được để trống.');
      return;
    }

    if (!editingUser && !formValues.password) {
      setError('Password không được để trống khi tạo user.');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingUser) {
        const userId = getUserId(editingUser);
        if (!userId) throw new Error('Không tìm thấy mã user.');

        await updateUser(userId, {
          email: formValues.email.trim(),
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.trim(),
          roleName: formValues.roleName,
          status: formValues.status
        });
        setMessage('Cập nhật user thành công.');
      } else {
        await createUser({
          email: formValues.email.trim(),
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.trim(),
          password: formValues.password,
          roleName: formValues.roleName
        });
        setMessage('Tạo user thành công.');
      }

      setEditingUser(null);
      setFormValues(emptyUserForm());
      await loadUsers();
    } catch (err) {
      setError(getErrorText(err, 'Lưu user thất bại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user: AuthUser): Promise<void> {
    if (isAdminUser(user)) {
      setError('Không được khóa tài khoản ADMIN.');
      setMessage('');
      return;
    }

    const userId = getUserId(user);
    if (!userId) {
      setError('Không tìm thấy mã user.');
      return;
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn khóa user "${user.fullName || user.email}" không?\nTài khoản sẽ được chuyển sang trạng thái INACTIVE.`
    );

    if (!confirmDelete) return;

    setError('');
    setMessage('');

    try {
      await deleteUser(userId);
      setMessage('Khóa user thành công.');
      await loadUsers();
    } catch (err) {
      setError(getErrorText(err, 'Không thể khóa user.'));
    }
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">🏇</div>
          <div>
            <strong>Horse Racing</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item active" type="button">
            Quản lý user
          </button>
        </nav>

        <div className="admin-profile">
          <span>Đang đăng nhập</span>
          <strong>{currentUser?.fullName || currentUser?.email}</strong>
          <small>{currentUser?.role}</small>
        </div>

        <button className="admin-logout" type="button" onClick={onLogout}>
          Đăng xuất
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Quản lý người dùng</h1>
            <p>Admin chỉ được tạo, cập nhật, khóa hoặc mở khóa tài khoản OWNER, JOCKEY, REFEREE và SPECTATOR.</p>
          </div>

          <button className="refresh-button" type="button" onClick={() => loadUsers()} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </header>

        <section className="admin-stats">
          <div><span>User quản lý được</span><strong>{manageableUsers.length}</strong></div>
          <div><span>ACTIVE</span><strong>{activeUsers}</strong></div>
          <div><span>INACTIVE</span><strong>{inactiveUsers}</strong></div>
          <div><span>BLOCKED</span><strong>{blockedUsers}</strong></div>
        </section>

        {adminUsers > 0 && (
          <div className="admin-alert info" role="status">
            Có {adminUsers} tài khoản ADMIN trong hệ thống. Các tài khoản này chỉ được xem, không được sửa hoặc khóa từ màn hình này.
          </div>
        )}
        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        <section className="admin-grid">
          <form className="admin-card admin-form" onSubmit={handleSubmit}>
            <div className="admin-card-header">
              <div>
                <h2>{editingUser ? 'Cập nhật user' : 'Tạo user mới'}</h2>
                <p>
                  {editingUser
                    ? 'Chỉnh thông tin user thuộc 4 role được phép. Password không được cập nhật ở form này.'
                    : 'Tạo tài khoản mới cho Owner, Jockey, Referee hoặc Spectator.'}
                </p>
              </div>
            </div>

            <label className="field-label" htmlFor="adminFullName">Họ tên</label>
            <input className="input" id="adminFullName" name="fullName" type="text" value={formValues.fullName} onChange={handleChange} disabled={isSaving} />

            <label className="field-label" htmlFor="adminEmail">Email</label>
            <input className="input" id="adminEmail" name="email" type="email" value={formValues.email} onChange={handleChange} disabled={isSaving} />

            <label className="field-label" htmlFor="adminPhone">Số điện thoại</label>
            <input className="input" id="adminPhone" name="phone" type="tel" value={formValues.phone} onChange={handleChange} disabled={isSaving} />

            {!editingUser && (
              <>
                <label className="field-label" htmlFor="adminPassword">Password</label>
                <input className="input" id="adminPassword" name="password" type="password" value={formValues.password} onChange={handleChange} disabled={isSaving} />
              </>
            )}

            <label className="field-label" htmlFor="adminRole">Vai trò</label>
            <select className="input" id="adminRole" name="roleName" value={formValues.roleName} onChange={handleChange} disabled={isSaving}>
              {manageableRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>

            {editingUser && (
              <>
                <label className="field-label" htmlFor="adminStatus">Trạng thái</label>
                <select className="input" id="adminStatus" name="status" value={formValues.status} onChange={handleChange} disabled={isSaving}>
                  {userStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </>
            )}

            <div className="admin-form-actions">
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : editingUser ? 'Cập nhật user' : 'Tạo user'}
              </button>
              {editingUser && (
                <button className="outline-button" type="button" onClick={handleCancelEdit} disabled={isSaving}>Hủy sửa</button>
              )}
            </div>
          </form>

          <section className="admin-card user-table-card">
            <div className="admin-card-header">
              <div>
                <h2>Danh sách user</h2>
                <p>Tài khoản ADMIN được hiển thị để theo dõi, nhưng không thể sửa hoặc khóa.</p>
              </div>
            </div>

            {isLoading ? (
              <p className="table-empty">Đang tải danh sách user...</p>
            ) : users.length === 0 ? (
              <p className="table-empty">Chưa có user nào.</p>
            ) : (
              <div className="table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Họ tên</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const userId = getUserId(user);
                      const userRole = getRole(user);
                      const adminRow = userRole === 'ADMIN';

                      return (
                        <tr key={userId || user.email} className={adminRow ? 'read-only-row' : undefined}>
                          <td>{userId}</td>
                          <td>{user.fullName || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td><span className="role-badge">{userRole || 'N/A'}</span></td>
                          <td><span className={`status-badge ${String(user.status || '').toLowerCase()}`}>{user.status || 'N/A'}</span></td>
                          <td>
                            {adminRow ? (
                              <span className="readonly-note">Chỉ xem</span>
                            ) : (
                              <div className="table-actions">
                                <button type="button" onClick={() => handleEdit(user)}>Sửa</button>
                                <button className="danger-action" type="button" onClick={() => handleDelete(user)}>Khóa</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
