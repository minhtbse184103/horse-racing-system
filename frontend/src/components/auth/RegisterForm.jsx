import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LogIn, Trophy } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { signup } from '../../services/authService';
import { validateSignupForm } from '../../utils/validators';

const inputClasses =
  'w-full rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function RegisterForm({ onGoHome, onGoLogin }) {
  const [values, setValues] = useState({
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(
    () =>
      values.username.trim() &&
      values.email.trim() &&
      values.phone.trim() &&
      values.password,
    [values]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateSignupForm(values);
    setErrors(formErrors);
    setApiError('');
    setSuccessMessage('');

    if (Object.keys(formErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await signup({
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password
      });
      setSuccessMessage('Đã tạo tài khoản thành công. Bạn có thể đăng nhập ngay.');
      setValues({
        username: '',
        email: '',
        phone: '',
        password: ''
      });
    } catch (error) {
      setApiError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function fieldClasses(error) {
    return `${inputClasses} ${
      error ? 'border-danger bg-danger-bg' : 'border-brown-700/15'
    }`;
  }

  return (
    <AuthLayout>
      <section className="py-2" aria-label="Biểu mẫu tạo tài khoản">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3.5 py-2.5 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/35 hover:bg-cream-200 hover:shadow-md"
            type="button"
            onClick={onGoHome}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Về trang chủ
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-cream-200 px-3.5 py-2.5 text-sm font-extrabold text-brown-700 transition hover:-translate-y-0.5 hover:border-brown-700/35 hover:bg-white hover:shadow-md"
            type="button"
            onClick={onGoLogin}
          >
            <LogIn size={16} strokeWidth={2.5} />
            Đăng nhập
          </button>
        </div>

        <span className="mb-5 grid size-10 place-items-center rounded-lg bg-brown-900 text-gold-400 lg:hidden">
          <Trophy size={19} />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
          Tham gia hệ thống
        </p>
        <h2 className="mt-2 text-4xl font-black text-brown-900">
          Tạo tài khoản
        </h2>
        <p className="mt-3 font-medium text-slate-500">
          Tài khoản mới mặc định là Spectator. Bạn có thể đăng ký trở thành Owner trong Profile sau khi đăng nhập.
        </p>

        {apiError && (
          <div
            className="mt-5 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm font-bold text-danger"
            role="alert"
          >
            {apiError}
          </div>
        )}
        {successMessage && (
          <div
            className="mt-5 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2" htmlFor="username">
              <span className="text-sm font-extrabold text-brown-900">
                Username
              </span>
              <input
                className={fieldClasses(errors.username)}
                id="username"
                name="username"
                type="text"
                placeholder="oanhle"
                autoComplete="username"
                value={values.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.username && (
                <span className="text-xs font-bold text-danger">
                  {errors.username}
                </span>
              )}
            </label>

            <label className="grid gap-2" htmlFor="phone">
              <span className="text-sm font-extrabold text-brown-900">
                Số điện thoại
              </span>
              <input
                className={fieldClasses(errors.phone)}
                id="phone"
                name="phone"
                type="tel"
                placeholder="0901234567"
                autoComplete="tel"
                value={values.phone}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <span className="text-xs font-bold text-danger">
                  {errors.phone}
                </span>
              )}
            </label>
          </div>

          <label className="grid gap-2" htmlFor="registerEmail">
            <span className="text-sm font-extrabold text-brown-900">Email</span>
            <input
              className={fieldClasses(errors.email)}
              id="registerEmail"
              name="email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.email && (
              <span className="text-xs font-bold text-danger">{errors.email}</span>
            )}
          </label>

          <label className="grid gap-2" htmlFor="registerPassword">
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-brown-900">
                Mật khẩu
              </span>
              <button
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold text-brown-500 transition hover:bg-cream-200 hover:text-brown-700"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </span>
            <input
              className={fieldClasses(errors.password)}
              id="registerPassword"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.password && (
              <span className="text-xs font-bold text-danger">
                {errors.password}
              </span>
            )}
          </label>

          <button
            className="mt-2 rounded-lg bg-brown-700 px-5 py-3.5 font-extrabold text-white shadow-[0_10px_24px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            type="submit"
            disabled={!isFormReady || isSubmitting}
          >
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-slate-500">
          Đã có tài khoản?{' '}
          <button
            className="rounded-md px-1.5 py-1 font-extrabold text-brown-500 transition hover:bg-cream-200 hover:text-brown-700"
            type="button"
            onClick={onGoLogin}
          >
            Đăng nhập
          </button>
        </p>
      </section>
    </AuthLayout>
  );
}
