import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/userService';
import { getUserId, getUserRole } from '../../lib';
import AdminTournamentTools from './AdminTournamentTools';
import AdminRaceTools from './AdminRaceTools';
import AdminRegistrationReview from './AdminRegistrationReview';
import AdminOverviewDashboard from './AdminOverviewDashboard';

const adminRoles = ['ADMIN', 'OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'];
const userStatuses = ['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE', 'BLOCKED'];

function emptyUserForm() {
  return {
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleName: 'SPECTATOR',
    status: 'ACTIVE',
    rejectionReason: ''
  };
}

function normalizeComparableId(id) {
  return id === undefined || id === null ? '' : String(id);
}

function isSameUser(user, currentUser) {
  const userId = normalizeComparableId(user ? getUserId(user) : '');
  const currentUserId = normalizeComparableId(currentUser ? getUserId(currentUser) : '');

  if (userId && currentUserId && userId === currentUserId) return true;

  const userEmail = String(user?.email || '').trim().toLowerCase();
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();

  return Boolean(userEmail && currentUserEmail && userEmail === currentUserEmail);
}

function isOtherAdminUser(user, currentUser) {
  return getUserRole(user) === 'ADMIN' && !isSameUser(user, currentUser);
}

function stopModalClick(event) {
  event.stopPropagation();
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState(emptyUserForm());
  const [editingUser, setEditingUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const inactiveUsers = users.filter((user) => user.status === 'INACTIVE').length;
  const blockedUsers = users.filter((user) => user.status === 'BLOCKED').length;

  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
    }
  }, [activeSection]);

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
    setModalError('');
    setMessage('');
  }

  function handleOpenCreateUser() {
    setEditingUser(null);
    setFormValues(emptyUserForm());
    setIsUserModalOpen(true);
    setMessage('');
    setError('');
    setModalError('');
}

  function handleEdit(user) {
    if (isOtherAdminUser(user, currentUser)) {
      setError('Không thể sửa tài khoản Admin khác.');
      setMessage('');
      return;
    }

    setEditingUser(user);
    setFormValues({
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      password: '',
      roleName: getUserRole(user) || user.role || 'SPECTATOR',
      status: user.status || 'ACTIVE',
      rejectionReason: user.rejectionReason || ''
    });
    setIsUserModalOpen(true);
    setMessage('');
    setError('');
    setModalError('');
  }

  function closeUserModal() {
    if (isSaving) return;

    setIsUserModalOpen(false);
    setEditingUser(null);
    setFormValues(emptyUserForm());
    setModalError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (editingUser && isOtherAdminUser(editingUser, currentUser)) {
      setModalError('Không thể sửa tài khoản Admin khác.');
      return;
    }

    if (!formValues.email.trim()) {
      setModalError('Email không được để trống.');
      return;
    }

    if (!formValues.fullName.trim()) {
      setModalError('Họ tên không được để trống.');
      return;
    }

    if (!formValues.phone.trim()) {
      setModalError('Số điện thoại không được để trống.');
      return;
    }

    if (!editingUser && !formValues.password) {
      setModalError('Password không được để trống khi tạo user.');
      return;
    }

    setIsSaving(true);
    setError('');
    setModalError('');
    setMessage('');

    try {
      if (editingUser) {
        const userId = getUserId(editingUser);

        await updateUser(userId, {
          email: formValues.email.trim(),
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.trim(),
          roleName: formValues.roleName,
          status: formValues.status,
          rejectionReason: formValues.status === 'REJECTED' ? formValues.rejectionReason.trim() : ''
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
      setIsUserModalOpen(false);
      setModalError('');
      await loadUsers();
    } catch (err) {
      setModalError(err.message || 'Lưu user thất bại.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user) {
    if (isOtherAdminUser(user, currentUser)) {
      setModalError('Không thể khóa tài khoản Admin khác.');
      setMessage('');
      return;
    }

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
      setModalError(err.message || 'Không thể khóa user.');
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
            <div className="admin-header-actions">
              <button className="outline-button" type="button" onClick={loadUsers} disabled={isLoading}>
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>

              <button className="primary-button tournament-create-button" type="button" onClick={handleOpenCreateUser}>
                Thêm user
              </button>
            </div>
          )}
        </header>

        {activeSection === 'dashboard' ? (
          <AdminOverviewDashboard />
        ) : activeSection === 'users' ? (
          <>
            <section className="admin-stats">
              <div>
                <span>Tổng user</span>
                <strong>{users.length}</strong>
              </div>

              <div>
                <span>ACTIVE</span>
                <strong>{activeUsers}</strong>
              </div>

              <div>
                <span>INACTIVE</span>
                <strong>{inactiveUsers}</strong>
              </div>

              <div>
                <span>BLOCKED</span>
                <strong>{blockedUsers}</strong>
              </div>
            </section>

            {error && !isUserModalOpen && (
              <div className="admin-alert error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-alert success" role="status">
                {message}
              </div>
            )}

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
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => {
                        const userId = getUserId(user);
                        const roleLabel = getUserRole(user) || user.role || 'N/A';
                        const cannotManageAdmin = isOtherAdminUser(user, currentUser);

                        return (
                          <tr key={userId || user.email}>
                            <td>{userId}</td>
                            <td>{user.fullName || 'N/A'}</td>
                            <td>{user.email}</td>
                            <td>{user.phone || 'N/A'}</td>
                            <td>
                              <span className="role-badge">{roleLabel}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${String(user.status || '').toLowerCase()}`}>
                                {user.status || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                {cannotManageAdmin ? (
                                  <>
                                    <button type="button" disabled title="Không thể sửa tài khoản Admin khác">
                                      Không được sửa
                                    </button>

                                    <button
                                      className="danger-action"
                                      type="button"
                                      disabled
                                      title="Không thể khóa tài khoản Admin khác"
                                    >
                                      Không được khóa
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => handleEdit(user)}>
                                      Sửa
                                    </button>

                                    <button className="danger-action" type="button" onClick={() => handleDelete(user)}>
                                      Khóa
                                    </button>
                                  </>
                                )}
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

            {isUserModalOpen && (
                <div className="admin-modal-overlay" role="presentation" onMouseDown={closeUserModal}>
                  <form
                    className="admin-card admin-form admin-modal"
                    onSubmit={handleSubmit}
                    onMouseDown={stopModalClick}
                    noValidate
                  >
                    <div className="admin-card-header">
                      <div>
                        <h2>{editingUser ? 'Cập nhật user' : 'Tạo user mới'}</h2>
                        <p>
                          {editingUser
                            ? 'Chỉnh thông tin user. Password không được cập nhật ở form này.'
                            : 'Tạo tài khoản mới cho Admin, Owner, Jockey, Referee hoặc Spectator.'}
                        </p>
                      </div>

                      <button className="outline-button" type="button" onClick={closeUserModal} disabled={isSaving}>
                        Đóng
                      </button>
                    </div>

                    {modalError && (
                      <div className="admin-alert error modal-alert" role="alert">
                        {modalError}
                      </div>
                    )}

                    <label className="field-label" htmlFor="adminFullName">
                      Họ tên
                    </label>
                    <input
                      className="input"
                      id="adminFullName"
                      name="fullName"
                      type="text"
                      value={formValues.fullName}
                      onChange={handleChange}
                      disabled={isSaving}
                    />

                    <label className="field-label" htmlFor="adminEmail">
                      Email
                    </label>
                    <input
                      className="input"
                      id="adminEmail"
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={handleChange}
                      disabled={isSaving}
                    />

                    <label className="field-label" htmlFor="adminPhone">
                      Số điện thoại
                    </label>
                    <input
                      className="input"
                      id="adminPhone"
                      name="phone"
                      type="tel"
                      value={formValues.phone}
                      onChange={handleChange}
                      disabled={isSaving}
                    />

                    {!editingUser && (
                      <>
                        <label className="field-label" htmlFor="adminPassword">
                          Password
                        </label>
                        <input
                          className="input"
                          id="adminPassword"
                          name="password"
                          type="password"
                          value={formValues.password}
                          onChange={handleChange}
                          disabled={isSaving}
                        />
                      </>
                    )}

                    <label className="field-label" htmlFor="adminRole">
                      Vai trò
                    </label>
                    <select
                      className="input"
                      id="adminRole"
                      name="roleName"
                      value={formValues.roleName}
                      onChange={handleChange}
                      disabled={isSaving}
                    >
                      {adminRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    {editingUser && (
                      <>
                        <label className="field-label" htmlFor="adminStatus">
                          Trạng thái
                        </label>
                        <select
                          className="input"
                          id="adminStatus"
                          name="status"
                          value={formValues.status}
                          onChange={handleChange}
                          disabled={isSaving}
                        >
                          {userStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {formValues.status === 'REJECTED' && (
                          <>
                            <label className="field-label" htmlFor="adminRejectionReason">
                              Lý do từ chối
                            </label>
                            <input
                              className="input"
                              id="adminRejectionReason"
                              name="rejectionReason"
                              type="text"
                              value={formValues.rejectionReason}
                              onChange={handleChange}
                              disabled={isSaving}
                              placeholder="Tối đa 500 ký tự"
                            />
                          </>
                        )}
                      </>
                    )}

                    <div className="admin-form-actions tournament-modal-actions">
                      <button className="outline-button" type="button" onClick={closeUserModal} disabled={isSaving}>
                        Hủy
                      </button>

                      <button className="primary-button" type="submit" disabled={isSaving}>
                        {isSaving ? 'Đang lưu...' : editingUser ? 'Cập nhật user' : 'Tạo user'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
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