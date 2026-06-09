import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AuthLayout from './AuthLayout';
import { signup } from '../../services/authService';
import { validateSignupForm } from '../../utils/validators';
import type { FormErrors, SignupRequest } from '../../types';

// MERGED FROM ZIP FRONTEND:
// Register form is typed to match the merged signup request contract.
interface RegisterFormProps {
  onGoLogin: () => void;
}

function emptySignupForm(): SignupRequest {
  return {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'OWNER'
  };
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

export default function RegisterForm({ onGoLogin }: RegisterFormProps) {
  const [values, setValues] = useState<SignupRequest>(emptySignupForm());
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors<SignupRequest>>({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(
    () => Boolean(values.fullName.trim() && values.email.trim() && values.phone.trim() && values.password && values.roleName),
    [values]
  );

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
    setSuccessMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const formErrors = validateSignupForm(values);
    setErrors(formErrors);
    setApiError('');
    setSuccessMessage('');

    if (Object.keys(formErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await signup({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        roleName: values.roleName
      });

      setValues(emptySignupForm());
      onGoLogin();
    } catch (error) {
      setApiError(getErrorText(error, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <section className="login-card" aria-label="Form đăng ký">
        <div className="mobile-brand">🏇 Horse Racing System</div>

        <button className="back-button" type="button" onClick={onGoLogin}>
          ← Quay lại đăng nhập
        </button>

        <p className="eyebrow">Create account</p>
        <h2>Đăng ký</h2>
        <p className="subtitle">Tạo tài khoản mới để sử dụng hệ thống.</p>

        {apiError && <div className="alert" role="alert">{apiError}</div>}
        {successMessage && <div className="success-alert" role="status">{successMessage}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="fullName">Họ tên</label>
          <input
            className={errors.fullName ? 'input has-error' : 'input'}
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            value={values.fullName}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.fullName && <p className="field-error">{errors.fullName}</p>}

          <label className="field-label" htmlFor="registerEmail">Email</label>
          <input
            className={errors.email ? 'input has-error' : 'input'}
            id="registerEmail"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}

          <label className="field-label" htmlFor="phone">Số điện thoại</label>
          <input
            className={errors.phone ? 'input has-error' : 'input'}
            id="phone"
            name="phone"
            type="tel"
            placeholder="0901234567"
            autoComplete="tel"
            value={values.phone}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}

          <label className="field-label" htmlFor="roleName">Vai trò</label>
          <select
            className={errors.roleName ? 'input has-error' : 'input'}
            id="roleName"
            name="roleName"
            value={values.roleName}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="OWNER">Owner</option>
            <option value="JOCKEY">Jockey</option>
            <option value="SPECTATOR">Spectator</option>
          </select>
          {errors.roleName && <p className="field-error">{errors.roleName}</p>}

          <div className="password-row">
            <label className="field-label" htmlFor="registerPassword">Password</label>
            <button className="text-button" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>

          <input
            className={errors.password ? 'input has-error' : 'input'}
            id="registerPassword"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}

          <button className="primary-button" type="submit" disabled={!isFormReady || isSubmitting}>
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
          </button>
        </form>
      </section>
    </AuthLayout>
  );
}
