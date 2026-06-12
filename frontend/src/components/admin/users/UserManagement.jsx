import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  CircleUserRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundX,
  Users
} from 'lucide-react';
import { formatDisplayLabel, getUserId } from '../../../lib';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from '../../../services/userService';

const ROLES = ['ADMIN', 'OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'];
const STANDARD_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];
const JOCKEY_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
  'PENDING',
  'UNDER_REVIEW',
  'REJECTED',
];

function emptyForm() {
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

function getStatusClasses(status) {
  switch (String(status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-800';
    case 'REJECTED':
    case 'BLOCKED':
      return 'bg-red-100 text-red-700';
    case 'INACTIVE':
      return 'bg-stone-200 text-stone-700';
    default:
      return 'bg-cream-200 text-brown-700';
  }
}

function formatStatus(status) {
  return formatDisplayLabel(status);
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    brown: 'bg-brown-700 text-white',
    green: 'bg-green-700 text-white',
    gold: 'bg-gold-400 text-brown-900',
    red: 'bg-danger text-white'
  };

  return (
    <article className="rounded-xl border border-brown-700/10 bg-cream-100/90 p-5 shadow-[0_14px_35px_rgba(78,44,25,0.1)]">
      <div className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} strokeWidth={2.5} />
      </div>
      <span className="mt-4 block text-xs font-extrabold uppercase text-slate-500">
        {label}
      </span>
      <strong className="mt-1 block text-3xl font-black text-brown-900">
        {value}
      </strong>
    </article>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingUser, setEditingUser] = useState(null);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      setError(err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.fullName, user.email, user.phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

const availableStatuses = STANDARD_STATUSES;

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm());
    setError('');
    setMessage('');
    setIsFormOpen(true);
  }

  function openEditForm(user) {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      password: '',
      roleName: user.role || 'SPECTATOR',
      status: user.status || 'ACTIVE',
      rejectionReason: user.rejectionReason || ''
    });
    setError('');
    setMessage('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm());
    setError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };

      if (
        name === 'roleName' &&
        value !== 'JOCKEY' &&
        !STANDARD_STATUSES.includes(current.status)
      ) {
        next.status = 'ACTIVE';
        next.rejectionReason = '';
      }

      if (name === 'status' && value !== 'REJECTED') {
        next.rejectionReason = '';
      }

      return next;
    });

    setError('');
  }

  function validateForm() {
    if (!form.fullName.trim()) return 'Họ và tên là bắt buộc.';
    if (!form.email.trim()) return 'Email là bắt buộc.';
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
      return 'Định dạng email không hợp lệ.';
    }
    if (!/^\+?[0-9]{9,15}$/.test(form.phone)) {
      return 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
    }
    if (!editingUser && (form.password.length < 6 || form.password.length > 72)) {
      return 'Mật khẩu phải có từ 6 đến 72 ký tự.';
    }
    if (
      editingUser &&
      form.status === 'REJECTED' &&
      !form.rejectionReason.trim()
    ) {
      return 'Bắt buộc nhập lý do khi từ chối jockey.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingUser) {
        const payload = {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          roleName: form.roleName
        };

        if (form.status !== editingUser.status) {
          payload.status = form.status;
          payload.rejectionReason =
            form.status === 'REJECTED' ? form.rejectionReason.trim() : null;
        } else if (
          form.status === 'REJECTED' &&
          form.rejectionReason.trim() !== (editingUser.rejectionReason || '')
        ) {
          payload.rejectionReason = form.rejectionReason.trim();
        }

        await updateUser(getUserId(editingUser), payload);
        setMessage('Đã cập nhật người dùng thành công.');
      } else {
        await createUser({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password,
          roleName: form.roleName
        });
        setMessage('Đã tạo người dùng thành công.');
      }

      setIsFormOpen(false);
      setEditingUser(null);
      setForm(emptyForm());
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Không thể lưu người dùng.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivateUser() {
    if (!userToDeactivate) return;

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteUser(getUserId(userToDeactivate));
      setMessage('Đã chuyển người dùng sang trạng thái INACTIVE thành công.');
      setUserToDeactivate(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Không thể vô hiệu hóa người dùng.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin
          </p>
          <h1 className="text-4xl font-black text-brown-900 md:text-5xl">
            User Management
          </h1>
          <p className="mt-3 text-slate-500">
            Manage account access, roles, and jockey review statuses.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-200 hover:shadow-md disabled:opacity-60"
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && !isFormOpen && (
        <div className="rounded-xl border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Tổng số người dùng" value={users.length} tone="brown" />
        <SummaryCard
          icon={CheckCircle2}
          label="Active"
          value={users.filter((user) => user.status === 'ACTIVE').length}
          tone="green"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Xét duyệt jockey"
          value={
            users.filter((user) =>
              ['PENDING', 'UNDER_REVIEW', 'REJECTED'].includes(user.status)
            ).length
          }
          tone="gold"
        />
        <SummaryCard
          icon={UserRoundX}
          label="Inactive / Blocked"
          value={
            users.filter((user) => ['INACTIVE', 'BLOCKED'].includes(user.status))
              .length
          }
          tone="red"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-5 py-4 max-sm:grid">
          <div>
            <h2 className="text-xl font-extrabold text-brown-900">Danh sách người dùng</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredUsers.length} of {users.length} users
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_8px_20px_rgba(108,63,36,0.2)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg"
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Create User
          </button>
        </div>

        <div className="grid gap-3 border-b border-brown-700/10 bg-cream-200/45 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm theo tên, email hoặc số điện thoại"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            className="rounded-xl border border-brown-700/15 bg-white/90 px-3 py-3 text-sm font-extrabold text-brown-700 outline-none"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{formatDisplayLabel(role)}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-brown-700/15 bg-white/90 px-3 py-3 text-sm font-extrabold text-brown-700 outline-none"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">ALL</option>
            {JOCKEY_STATUSES.map((status) => (
              <option key={status} value={status}>{formatDisplayLabel(status)}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Đang tải người dùng...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-5 py-10 text-slate-500">Không tìm thấy người dùng.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[20%]" />
                <col className="w-[21%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-cream-200/60">
                <tr>
                  {['ID', 'Người dùng', 'Email', 'Số điện thoại', 'Role', 'Trạng thái', 'Thao tác'].map(
                    (heading) => (
                      <th
                        className="border-b border-brown-700/10 px-2 py-4 text-left text-[0.68rem] font-extrabold uppercase tracking-wide text-brown-700"
                        key={heading}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={getUserId(user) || user.email}
                  >
                    <td className="border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold">
                      #{getUserId(user)}
                    </td>
                    <td className="border-b border-brown-700/10 px-2 py-4">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-200 text-brown-700">
                          <CircleUserRound size={18} />
                        </span>
                        <strong className="break-words text-[0.82rem] font-extrabold leading-snug">
                          {user.fullName || 'N/A'}
                        </strong>
                      </div>
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.75rem] font-bold">
                      {user.email}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.75rem] font-bold">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="border-b border-brown-700/10 px-2 py-4">
                      <span className="inline-flex rounded-full bg-cream-200 px-2 py-1 text-[0.68rem] font-extrabold text-brown-700">
                        {formatDisplayLabel(user.role)}
                      </span>
                    </td>
                    <td className="border-b border-brown-700/10 px-2 py-4">
                      <span
                        className={`inline-flex rounded-xl px-2 py-1 text-center text-[0.65rem] font-extrabold leading-tight ${getStatusClasses(
                          user.status
                        )}`}
                      >
                        {formatStatus(user.status)}
                      </span>
                    </td>
                    <td className="border-b border-brown-700/10 px-2 py-4">
                      <div className="grid gap-2">
                        <button
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-brown-700/15 bg-white/90 px-2 py-2 text-xs font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-200"
                          type="button"
                          onClick={() => openEditForm(user)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-danger/20 bg-danger-bg px-2 py-2 text-xs font-extrabold text-danger shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          disabled={user.status === 'INACTIVE'}
                          onClick={() => setUserToDeactivate(user)}
                        >
                          <Ban size={14} />
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3">
          <form
            className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-y-auto rounded-xl border border-brown-700/20 bg-cream-100 p-7 shadow-2xl max-sm:max-h-[calc(100vh-24px)] max-sm:p-5"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-brown-500">
                  {editingUser ? `User #${getUserId(editingUser)}` : 'Tài khoản mới'}
                </span>
                <h2 className="mt-1 text-2xl font-extrabold">
                  {editingUser ? 'Chỉnh sửa người dùng' : 'Tạo người dùng'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {editingUser
                    ? 'Cập nhật thông tin tài khoản, role và trạng thái truy cập.'
                    : 'Tài khoản do admin tạo sẽ hoạt động ngay lập tức.'}
                </p>
              </div>
              <button
                className="grid size-9 place-items-center rounded-full border border-brown-700/15 bg-white/80 text-xl font-bold text-slate-500"
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['fullName', 'Họ và tên', 'text'],
                ['email', 'Email', 'email'],
                ['phone', 'Số điện thoại', 'tel']
              ].map(([name, label, type]) => (
                <label
                  className="grid gap-2 text-sm font-extrabold"
                  key={name}
                >
                  <span>{label}</span>
                  <input
                    className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={handleChange}
                  />
                </label>
              ))}

              {!editingUser && (
                <label className="grid gap-2 text-sm font-extrabold">
                  <span>Mật khẩu</span>
                  <input
                    className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label className="grid gap-2 text-sm font-extrabold">
                <span>Role</span>
                <select
                  className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 outline-none"
                  name="roleName"
                  value={form.roleName}
                  onChange={handleChange}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{formatDisplayLabel(role)}</option>
                  ))}
                </select>
              </label>

              {editingUser && (
                <label className="grid gap-2 text-sm font-extrabold">
                  <span>Trạng thái</span>
                  <select
                    className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 outline-none"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>{formatDisplayLabel(status)}</option>
                    ))}
                  </select>
                </label>
              )}

              {editingUser && form.status === 'REJECTED' && (
                <label className="grid gap-2 text-sm font-extrabold sm:col-span-2">
                  <span>Lý do từ chối</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                    maxLength="500"
                    name="rejectionReason"
                    value={form.rejectionReason}
                    onChange={handleChange}
                  />
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700"
                type="button"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="rounded-xl border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white shadow-lg disabled:opacity-50"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : editingUser ? 'Lưu thay đổi' : 'Tạo người dùng'}
              </button>
            </div>
          </form>
        </div>
      )}

      {userToDeactivate && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm"
          onClick={() => setUserToDeactivate(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-danger"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-danger-bg text-danger">
                <Ban size={22} />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase text-slate-500">
                  User #{getUserId(userToDeactivate)}
                </span>
                <h2 className="mt-1 text-xl font-extrabold">Vô hiệu hóa người dùng</h2>
              </div>
            </div>
            <p className="my-5 leading-relaxed text-slate-500">
              This performs the backend soft-delete operation and changes the
              account status to INACTIVE.
            </p>
            <div className="rounded-xl border border-brown-700/10 bg-white/70 p-4">
              <strong className="block font-extrabold">
                {userToDeactivate.fullName}
              </strong>
              <span className="mt-1 block text-sm text-slate-500">
                {userToDeactivate.email}
              </span>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700"
                type="button"
                onClick={() => setUserToDeactivate(null)}
              >
                Go Back
              </button>
              <button
                className="rounded-xl border border-danger bg-danger px-4 py-3 font-extrabold text-white disabled:opacity-50"
                type="button"
                disabled={isSaving}
                onClick={deactivateUser}
              >
                Deactivate User
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
