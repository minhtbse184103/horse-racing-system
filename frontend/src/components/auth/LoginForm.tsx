import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AuthLayout from './AuthLayout';
import { login, saveAuthSession } from '../../services/authService';
import type { AuthUser, LoginRequest } from '../../services/authService';
import { validateLoginForm } from '../../utils/validators';
import type { FormErrors } from '../../utils/validators';

// MERGED FROM ZIP FRONTEND:
// Login form is typed to match the merged auth service response.
interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  onGoRegister: () => void;
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

export default function LoginForm({ onLoginSuccess, onGoRegister }: LoginFormProps) {
  const [values, setValues] = useState<LoginRequest>({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors<LoginRequest>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(() => Boolean(values.email.trim() && values.password), [values]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
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
      setApiError(getErrorText(error, 'Đăng nhập thất bại. Vui lòng thử lại.'));
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

        <div className="auth-actions auth-actions-single">
          <button className="secondary-button" type="button" onClick={onGoRegister}>
            Đăng ký
          </button>
        </div>
      </section>
    </AuthLayout>
  );
}
