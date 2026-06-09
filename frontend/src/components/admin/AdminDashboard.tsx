import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/userService';
import { getUserId } from '../../lib';
import AdminTournamentTools from './AdminTournamentTools';
import AdminRaceTools from './AdminRaceTools';
import AdminRegistrationReview from './AdminRegistrationReview';
import AdminOverviewDashboard from './AdminOverviewDashboard';

const adminRoles = ['ADMIN', 'OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'];
const userStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

function emptyUserForm() {
  return {
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleName: 'SPECTATOR',
    status: 'ACTIVE'
  };
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState(emptyUserForm());
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const inactiveUsers = users.filter((user) => user.status === 'INACTIVE').length;
  const blockedUsers = users.filter((user) => user.status === 'BLOCKED').length;

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách user.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  function handleEdit(user) {
    setEditingUser(user);
    setFormValues({
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      password: '',
      roleName: user.role || 'SPECTATOR',
      status: user.status || 'ACTIVE'
    });
    setMessage('');
    setError('');
  }

  function handleCancelEdit() {
    setEditingUser(null);
    setFormValues(emptyUserForm());
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

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
      setError(err.message || 'Lưu user thất bại.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user) {
    const userId = getUserId(user);
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
      setError(err.message || 'Không thể khóa user.');
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
          <button
            className={`admin-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('users')}
          >
            Quản lý user
          </button>
          <button
            className={`admin-nav-item ${activeSection === 'tournaments' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('tournaments')}
          >
            Quản lý giải đấu
          </button>
          <button
            className={`admin-nav-item ${activeSection === 'races' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('races')}
          >
            Race
          </button>
          <button
            className={`admin-nav-item ${activeSection === 'registrationReview' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('registrationReview')}
          >
            Registration
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
            {activeSection === 'dashboard' ? (
              <>
                <h1>Dashboard</h1>
                <p>Theo dõi nhanh số lượng giải đấu và race trong hệ thống.</p>
              </>
            ) : activeSection === 'users' ? (
              <>
                <h1>Quản lý người dùng</h1>
                <p>Admin có thể tạo, cập nhật, khóa hoặc mở khóa tài khoản người dùng trong hệ thống.</p>
              </>
            ) : activeSection === 'tournaments' ? (
              <>
                <h1>Quản lý giải đấu</h1>
                <p>Tạo giải đấu và theo dõi các giải đấu đang có trong database.</p>
              </>
            ) : activeSection === 'races' ? (
              <>
                <h1>Race</h1>
                <p>Theo dõi đăng ký đã duyệt và tạo race mới cho các vòng thi.</p>
              </>
            ) : (
              <>
                <h1>Registration</h1>
                <p>Duyệt các đơn đăng ký đang ở trạng thái ACCEPTED.</p>
              </>
            )}
          </div>

          {activeSection === 'users' && (
            <button className="refresh-button" type="button" onClick={loadUsers} disabled={isLoading}>
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          )}
        </header>

        {activeSection === 'dashboard' ? (
          <AdminOverviewDashboard />
        ) : activeSection === 'users' ? (
          <>
        <section className="admin-stats">
          <div><span>Tổng user</span><strong>{users.length}</strong></div>
          <div><span>ACTIVE</span><strong>{activeUsers}</strong></div>
          <div><span>INACTIVE</span><strong>{inactiveUsers}</strong></div>
          <div><span>BLOCKED</span><strong>{blockedUsers}</strong></div>
        </section>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        <section className="admin-grid">
          <form className="admin-card admin-form" onSubmit={handleSubmit}>
            <div className="admin-card-header">
              <div>
                <h2>{editingUser ? 'Cập nhật user' : 'Tạo user mới'}</h2>
                <p>
                  {editingUser
                    ? 'Chỉnh thông tin user. Password không được cập nhật ở form này.'
                    : 'Tạo tài khoản mới cho Admin, Owner, Jockey, Referee hoặc Spectator.'}
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
              {adminRoles.map((role) => <option key={role} value={role}>{role}</option>)}
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
                <p>Theo dõi tài khoản, vai trò và trạng thái truy cập của người dùng.</p>
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
                      return (
                        <tr key={userId || user.email}>
                          <td>{userId}</td>
                          <td>{user.fullName || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td><span className="role-badge">{user.role}</span></td>
                          <td><span className={`status-badge ${String(user.status || '').toLowerCase()}`}>{user.status || 'N/A'}</span></td>
                          <td>
                            <div className="table-actions">
                              <button type="button" onClick={() => handleEdit(user)}>Sửa</button>
                              <button className="danger-action" type="button" onClick={() => handleDelete(user)}>Khóa</button>
                            </div>
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
          </>
        ) : activeSection === 'tournaments' ? (
          <AdminTournamentTools />
        ) : activeSection === 'races' ? (
          <AdminRaceTools />
        ) : (
          <AdminRegistrationReview />
        )}
      </section>
    </main>
  );
}
