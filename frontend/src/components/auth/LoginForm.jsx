import { useMemo, useState } from 'react';
import AuthLayout from './AuthLayout';
import { login, saveAuthSession, startGoogleLogin } from '../../services/authService';
import { validateLoginForm } from '../../utils/validators';

export default function LoginForm({ onLoginSuccess, onGoRegister }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(() => values.email.trim() && values.password, [values]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formErrors = validateLoginForm(values);
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
      setApiError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <section className="login-card" aria-label="Form đăng nhập">
        <div className="mobile-brand">🏇 Horse Racing System</div>

        <p className="eyebrow">Welcome back</p>
        <h2>Đăng nhập</h2>
        <p className="subtitle">Nhập email và password để tiếp tục.</p>

        {apiError && (
          <div className="alert" role="alert">
            {apiError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            className={errors.email ? 'input has-error' : 'input'}
            id="email"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}

          <div className="password-row">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <button className="text-button" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>

          <input
            className={errors.password ? 'input has-error' : 'input'}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}

          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={isSubmitting}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <button className="primary-button" type="submit" disabled={!isFormReady || isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <div className="auth-actions">
          <button className="google-button" type="button" onClick={startGoogleLogin}>
            <span className="google-icon">G</span>
            Đăng nhập bằng Gmail
          </button>

          <button className="secondary-button" type="button" onClick={onGoRegister}>
            Đăng ký
          </button>
        </div>
      </section>
    </AuthLayout>
  );
}
