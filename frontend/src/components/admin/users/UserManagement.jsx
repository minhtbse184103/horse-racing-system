import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  CircleUserRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserRoundX,
  Users
} from 'lucide-react';
import { getUserId } from '../../../lib';
import { useLanguage } from '../../../context/LanguageContext';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from '../../../services/userService';

const ROLES = ['ADMIN', 'OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'];
const STANDARD_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

function emptyForm() {
  return {
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleName: 'SPECTATOR',
    status: 'ACTIVE'
  };
}

function getStatusClasses(status) {
  switch (String(status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'border border-green-700/15 bg-green-50 text-green-800';
    case 'PENDING':
      return 'border border-amber-300/50 bg-amber-50 text-amber-800';
    case 'UNDER_REVIEW':
      return 'border border-blue-300/50 bg-blue-50 text-blue-800';
    case 'REJECTED':
    case 'BLOCKED':
      return 'border border-red-200 bg-red-50 text-red-700';
    case 'INACTIVE':
      return 'border border-stone-200 bg-stone-100 text-stone-700';
    default:
      return 'border border-brown-700/10 bg-cream-200 text-brown-700';
  }
}

function formatStatus(status, t) {
  const normalized = String(status || '').toUpperCase();
  return t(`status_${normalized}`);
}

function formatRole(role, t) {
  const normalized = String(role || '').toUpperCase();
  return t(`role_${normalized}`);
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    brown: 'bg-brown-700 text-white',
    green: 'bg-green-700 text-white',
    gold: 'bg-gold-400 text-brown-900',
    red: 'bg-danger text-white'
  };

  return (
    <article className="rounded-lg border border-white/80 bg-cream-100/90 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <strong className="mt-2 block text-3xl font-black text-brown-900">
            {value}
          </strong>
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-lg shadow-[0_8px_20px_rgba(78,44,25,0.08)] ${tones[tone]}`}>
          <Icon size={19} strokeWidth={2.5} />
        </div>
      </div>
    </article>
  );
}

export default function UserManagement() {
  const { t } = useLanguage();
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
      setError(err.message || t('loadUsersError'));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.username, user.email, user.phone]
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
      fullName: user.username || '',
      phone: user.phone || '',
      password: '',
      roleName: user.role || 'SPECTATOR',
      status: user.status || 'ACTIVE'
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

      return next;
    });

    setError('');
  }

  function validateForm() {
    if (!form.fullName.trim()) return t('usernameRequired');
    if (!form.email.trim()) return t('emailRequired');
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
      return t('invalidEmail');
    }
    if (!/^\+?[0-9]{9,15}$/.test(form.phone)) {
      return t('invalidPhone');
    }
    if (!editingUser && (form.password.length < 6 || form.password.length > 72)) {
      return t('invalidPassword');
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
        }

        await updateUser(getUserId(editingUser), payload);
        setMessage(t('updateUserSuccess'));
      } else {
        await createUser({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password,
          roleName: form.roleName
        });
        setMessage(t('createUserSuccess'));
      }

      setIsFormOpen(false);
      setEditingUser(null);
      setForm(emptyForm());
      await loadUsers();
    } catch (err) {
      setError(err.message || t('saveUserError'));
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
      setMessage(t('deactivateUserSuccess'));
      setUserToDeactivate(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || t('deactivateUserError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-5 text-brown-900">
      <header className="flex flex-col gap-4 border-b border-brown-700/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
            <span className="h-px w-7 bg-brown-500" /> {t('admin')}
          </div>
          <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 md:text-4xl">
            {t('userManagementTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            {t('userManagementSubtitle')}
          </p>
        </div>

        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-extrabold text-brown-700 shadow-[0_10px_24px_rgba(78,44,25,0.08)] transition hover:-translate-y-0.5 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
        >
          <RefreshCw size={17} strokeWidth={2.5} className={isLoading ? 'animate-spin' : ''} />
          {t('refresh')}
        </button>
      </header>

      {error && !isFormOpen && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard icon={Users} label={t('totalUsers')} value={users.length} tone="brown" />
        <SummaryCard
          icon={CheckCircle2}
          label={t('activeUsers')}
          value={users.filter((user) => user.status === 'ACTIVE').length}
          tone="green"
        />
        <SummaryCard
          icon={UserRoundX}
          label={t('inactiveBlocked')}
          value={
            users.filter((user) => ['INACTIVE', 'BLOCKED'].includes(user.status))
              .length
          }
          tone="red"
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] px-5 py-4 max-sm:grid">
          <div>
            <h2 className="text-2xl font-black text-brown-900">{t('userList')}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {t('userCount', { filtered: filteredUsers.length, total: users.length })}
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-900"
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            {t('createUser')}
          </button>
        </div>

        <div className="grid gap-3 border-b border-brown-700/10 bg-cream-200/35 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder={t('searchUsers')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            className="rounded-lg border border-brown-700/15 bg-white px-3 py-3 text-sm font-extrabold text-brown-700 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">{t('allRoles')}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{formatRole(role, t)}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-brown-700/15 bg-white px-3 py-3 text-sm font-extrabold text-brown-700 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">{t('allStatuses')}</option>
            {STANDARD_STATUSES.map((status) => (
              <option key={status} value={status}>{formatStatus(status, t)}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-3 px-5 py-8" aria-label={t('loadingUsers')}>
            {[1, 2, 3].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-cream-200/70" key={item} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="grid place-items-center px-5 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-cream-200 text-brown-700">
              <Users size={23} />
            </span>
            <p className="mt-4 font-black text-brown-900">{t('noUsersFound')}</p>
          </div>
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
                  {[t('id'), t('username'), t('email'), t('phone'), t('role'), t('status'), t('actions')].map(
                    (heading, index) => (
                      <th
                        className={`border-b border-brown-700/10 px-3 py-4 text-[0.68rem] font-extrabold uppercase tracking-wide text-brown-700 ${
                          index === 6 ? 'text-right' : index === 5 ? 'text-center' : 'text-left'
                        }`}
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
                    className="transition hover:bg-white/70"
                    key={getUserId(user) || user.email}
                  >
                    <td className="border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold">
                      #{getUserId(user)}
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-cream-200 text-brown-700">
                          <CircleUserRound size={18} />
                        </span>
                        <strong className="truncate text-[0.82rem] font-extrabold leading-snug">
                          {user.username || 'N/A'}
                        </strong>
                      </div>
                    </td>
                    <td className="truncate border-b border-brown-700/10 px-3 py-4 text-[0.75rem] font-bold">
                      {user.email}
                    </td>
                    <td className="truncate border-b border-brown-700/10 px-3 py-4 text-[0.75rem] font-bold">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <span className="inline-flex rounded-full border border-brown-700/10 bg-cream-200 px-2.5 py-1 text-[0.68rem] font-extrabold text-brown-700">
                        {formatRole(user.role, t)}
                      </span>
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-center text-[0.65rem] font-extrabold leading-tight shadow-[0_6px_16px_rgba(78,44,25,0.04)] ${getStatusClasses(
                          user.status
                        )}`}
                      >
                        {formatStatus(user.status, t)}
                      </span>
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          className="grid size-9 place-items-center rounded-lg border border-brown-700/15 bg-white text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:border-brown-500 hover:bg-cream-200"
                          type="button"
                          title={t('edit')}
                          aria-label={`${t('edit')} ${user.username || user.email}`}
                          onClick={() => openEditForm(user)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="grid size-9 place-items-center rounded-lg border border-danger/20 bg-danger-bg text-danger shadow-[0_8px_18px_rgba(185,28,28,0.05)] transition hover:-translate-y-0.5 hover:bg-red-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          disabled={user.status === 'INACTIVE'}
                          title={t('deactivate')}
                          aria-label={`${t('deactivate')} ${user.username || user.email}`}
                          onClick={() => setUserToDeactivate(user)}
                        >
                          <Ban size={15} />
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
            className="flex max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.28)] max-sm:max-h-[calc(100vh-24px)]"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] px-6 py-5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
                  {editingUser ? t('userNumber', { id: getUserId(editingUser) }) : t('newAccount')}
                </span>
                <h2 className="mt-2 text-2xl font-black text-brown-900">
                  {editingUser ? t('editUser') : t('createUserTitle')}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {editingUser
                    ? t('editUserDescription')
                    : t('createUserDescription')}
                </p>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-xl font-bold text-slate-500 shadow-[0_8px_18px_rgba(78,44,25,0.06)] hover:bg-cream-200"
                type="button"
                onClick={closeForm}
                aria-label={t('close') || t('cancel')}
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['fullName', t('username'), 'text'],
                ['email', t('email'), 'email'],
                ['phone', t('phone'), 'tel']
              ].map(([name, label, type]) => (
                <label
                  className="grid gap-2 text-sm font-extrabold"
                  key={name}
                >
                  <span>{label}</span>
                  <input
                    className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={handleChange}
                  />
                </label>
              ))}

              {!editingUser && (
                <label className="grid gap-2 text-sm font-extrabold">
                  <span>{t('password')}</span>
                  <input
                    className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label className="grid gap-2 text-sm font-extrabold">
                <span>{t('role')}</span>
                <select
                  className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none"
                  name="roleName"
                  value={form.roleName}
                  onChange={handleChange}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{formatRole(role, t)}</option>
                  ))}
                </select>
              </label>

              {editingUser && (
                <label className="grid gap-2 text-sm font-extrabold">
                  <span>{t('status')}</span>
                  <select
                    className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>{formatStatus(status, t)}</option>
                    ))}
                  </select>
                </label>
              )}

            </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brown-700/10 bg-white/60 px-6 py-4">
              <button
                className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-60"
                type="button"
                onClick={closeForm}
                disabled={isSaving}
              >
                {t('cancel')}
              </button>
              <button
                className="rounded-lg bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.22)] transition hover:-translate-y-0.5 hover:bg-brown-900 disabled:translate-y-0 disabled:opacity-50"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? t('saving') : editingUser ? t('saveChanges') : t('createUser')}
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
            className="w-full max-w-lg overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] px-6 py-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-danger-bg text-danger">
                <Ban size={22} />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  {t('userNumber', { id: getUserId(userToDeactivate) })}
                </span>
                <h2 className="mt-1 text-xl font-black text-brown-900">{t('deactivateUser')}</h2>
              </div>
            </header>

            <div className="px-6 py-5">
              <p className="leading-relaxed font-semibold text-slate-500">
                {t('deactivateDescription')}
              </p>
              <div className="mt-4 rounded-lg border border-white/80 bg-white p-4 shadow-[0_12px_28px_rgba(78,44,25,0.08)]">
                <strong className="block font-extrabold text-brown-900">
                  {userToDeactivate.username}
                </strong>
                <span className="mt-1 block text-sm font-semibold text-slate-500">
                  {userToDeactivate.email}
                </span>
              </div>
            </div>
            <footer className="grid grid-cols-2 gap-3 border-t border-brown-700/10 bg-white/60 px-6 py-4">
              <button
                className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-60"
                type="button"
                onClick={() => setUserToDeactivate(null)}
              >
                {t('goBack')}
              </button>
              <button
                className="rounded-lg bg-danger px-4 py-3 font-extrabold text-white shadow-[0_12px_28px_rgba(194,65,53,0.2)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                type="button"
                disabled={isSaving}
                onClick={deactivateUser}
              >
                {t('deactivateUser')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
