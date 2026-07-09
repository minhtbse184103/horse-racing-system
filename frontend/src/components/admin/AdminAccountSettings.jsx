import { useEffect, useState } from 'react';
import { Languages, Mail, Phone, RefreshCw, Save, UserRound } from 'lucide-react';

import { updateMyAccount, updateStoredUser } from '../../services/authService';
import LanguageToggle from '../common/LanguageToggle';

function getInitialValues(user) {
  return {
    fullName: user?.username || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  };
}

export default function AdminSettings({ currentUser, onUserUpdated }) {
  const [values, setValues] = useState(() => getInitialValues(currentUser));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues(getInitialValues(currentUser));
  }, [currentUser]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  function validate() {
    if (!values.fullName.trim()) return 'Tên không được để trống.';
    if (!values.email.trim()) return 'Email không được để trống.';
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(values.email.trim())) {
      return 'Email không đúng định dạng.';
    }
    if (!/^\+?[0-9]{9,15}$/.test(values.phone.trim())) {
      return 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const persistedUser = await updateMyAccount({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim()
      });
      const updatedUser = {
        ...currentUser,
        ...persistedUser,
        username: persistedUser?.username || values.fullName.trim(),
        email: persistedUser?.email || values.email.trim(),
        phone: persistedUser?.phone || values.phone.trim()
      };

      updateStoredUser(updatedUser);
      onUserUpdated?.(updatedUser);
      setValues(getInitialValues(updatedUser));
      setMessage('Đã cập nhật tài khoản admin.');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tài khoản admin.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setValues(getInitialValues(currentUser));
    setError('');
    setMessage('');
  }

  return (
    <section className="space-y-5 text-brown-900">
      <header className="flex flex-col gap-4 border-b border-brown-700/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
            <span className="h-px w-7 bg-brown-500" /> Quản trị
          </div>
          <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 md:text-4xl">
            Cài đặt
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Cập nhật tài khoản admin và tùy chỉnh trải nghiệm quản trị.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">
          {message}
        </div>
      )}

      <form
        className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-brown-700/10 px-5 py-4">
          <h2 className="text-xl font-black text-brown-900">Tài khoản admin</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Chỉ cập nhật tên, email và số điện thoại. Vai trò và trạng thái là thông tin chỉ đọc.
          </p>
        </div>
        <div className="grid gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] px-5 py-5 sm:grid-cols-3">
          <div className="rounded-lg border border-brown-700/10 bg-white/80 p-4">
            <span className="text-xs font-extrabold uppercase text-slate-500">Vai trò</span>
            <strong className="mt-2 block text-brown-900">Quản trị viên</strong>
          </div>
          <div className="rounded-lg border border-brown-700/10 bg-white/80 p-4">
            <span className="text-xs font-extrabold uppercase text-slate-500">Trạng thái</span>
            <strong className="mt-2 block text-brown-900">{currentUser?.status || 'ACTIVE'}</strong>
          </div>
          <div className="rounded-lg border border-brown-700/10 bg-white/80 p-4">
            <span className="text-xs font-extrabold uppercase text-slate-500">ID</span>
            <strong className="mt-2 block text-brown-900">#{currentUser?.userID || currentUser?.id || '-'}</strong>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-extrabold">
            <span>Tên</span>
            <span className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                name="fullName"
                value={values.fullName}
                onChange={handleChange}
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-extrabold">
            <span>Email</span>
            <span className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-extrabold">
            <span>Số điện thoại</span>
            <span className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={handleChange}
              />
            </span>
          </label>
        </div>

        <footer className="flex flex-col gap-3 border-t border-brown-700/10 bg-white/60 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-60"
            type="button"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RefreshCw size={17} />
            Đặt lại
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.22)] transition hover:-translate-y-0.5 hover:bg-brown-900 disabled:translate-y-0 disabled:opacity-50"
            type="submit"
            disabled={isSaving}
          >
            <Save size={17} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </footer>
      </form>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700">
              <Languages size={20} />
            </span>
            <div>
              <h2 className="text-xl font-black text-brown-900">Ngôn ngữ</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Chọn ngôn ngữ hiển thị cho khu vực quản trị.
              </p>
            </div>
          </div>
          <LanguageToggle className="min-h-11 min-w-40 border-brown-700/15 bg-white" />
        </div>
      </section>
    </section>
  );
}
