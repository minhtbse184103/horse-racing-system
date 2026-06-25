import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Trophy } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { login, saveAuthSession } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

const inputClasses =
  'w-full rounded-lg border bg-white px-4 py-3.5 text-sm font-semibold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function LoginForm({ onLoginSuccess, onGoHome, onGoRegister }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(
    () => values.email.trim() && values.password,
    [values]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateForm(values, t);
    setErrors(formErrors);
    setApiError('');

    if (Object.keys(formErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const loginResponse = await login({
        email: values.email.trim(),
        password: values.password
      });
      saveAuthSession(loginResponse, rememberMe);
      onLoginSuccess(loginResponse.user);
    } catch (error) {
      setApiError(error.message || t('loginError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <section aria-label="Biểu mẫu đăng nhập">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3.5 py-2.5 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/35 hover:bg-cream-200 hover:shadow-md"
            type="button"
            onClick={onGoHome}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            {t('backHome')}
          </button>
          <span className="grid size-10 place-items-center rounded-lg bg-brown-900 text-gold-400 lg:hidden">
            <Trophy size={19} />
          </span>
        </div>

        <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
          {t('welcomeBack')}
        </p>
        <h2 className="mt-2 text-4xl font-black text-brown-900">{t('login')}</h2>
        <p className="mt-3 font-medium text-slate-500">
          {t('loginSubtitle')}
        </p>

        {apiError && (
          <div
            className="mt-6 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm font-bold text-danger"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-2" htmlFor="email">
            <span className="text-sm font-extrabold text-brown-900">Email</span>
            <input
              className={`${inputClasses} ${
                errors.email ? 'border-danger bg-danger-bg' : 'border-brown-700/15'
              }`}
              id="email"
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

          <label className="grid gap-2" htmlFor="password">
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-brown-900">
                {t('password')}
              </span>
              <button
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold text-brown-500 transition hover:bg-cream-200 hover:text-brown-700"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? t('hide') : t('show')}
              </button>
            </span>
            <input
              className={`${inputClasses} ${
                errors.password
                  ? 'border-danger bg-danger-bg'
                  : 'border-brown-700/15'
              }`}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('minPasswordPlaceholder')}
              autoComplete="current-password"
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

          <label className="flex w-fit items-center gap-3 text-sm font-bold text-slate-500">
            <input
              className="size-4 accent-brown-700"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={isSubmitting}
            />
            {t('rememberLogin')}
          </label>

          <button
            className="rounded-lg bg-brown-700 px-5 py-3.5 font-extrabold text-white shadow-[0_10px_24px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            type="submit"
            disabled={!isFormReady || isSubmitting}
          >
            {isSubmitting ? t('signingIn') : t('login')}
          </button>
        </form>

        <p className="mt-7 text-center text-sm font-semibold text-slate-500">
          {t('noAccount')}{' '}
          <button
            className="rounded-md px-1.5 py-1 font-extrabold text-brown-500 transition hover:bg-cream-200 hover:text-brown-700"
            type="button"
            onClick={onGoRegister}
          >
            {t('createAccount')}
          </button>
        </p>
      </section>
    </AuthLayout>
  );
}

function validateForm(values, t) {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = t('emailRequired');
  } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(values.email.trim())) {
    errors.email = t('invalidEmail');
  }

  if (!values.password) {
    errors.password = t('passwordRequired');
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = t('invalidPassword');
  }

  return errors;
}
