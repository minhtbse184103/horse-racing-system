import { useMemo, useState } from 'react';
import { validateSignupForm } from '../utils/validators';
import { useAuthState } from '../states/authState';

const ROLES = [
  { value: 'OWNER', label: 'Owner - Chủ ngựa' },
  { value: 'JOCKEY', label: 'Jockey - Kỵ sĩ' },
  { value: 'SPECTATOR', label: 'Spectator - Khán giả' },
];

/**
 * SignUpForm component
 * Props:
 *   onGoLogin: () => void  — callback chuyển sang trang login
 */
export default function SignUpForm({ onGoLogin }) {
  const { signup } = useAuthState();

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'OWNER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady = useMemo(
    () =>
      values.fullName.trim() &&
      values.email.trim() &&
      values.phone.trim() &&
      values.password &&
      values.roleName,
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
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        roleName: values.roleName,
      });

      setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setValues({ fullName: '', email: '', phone: '', password: '', roleName: 'OWNER' });
    } catch (error) {
      setApiError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-card" aria-label="Form đăng ký">
      <div className="mobile-brand">🏇 Horse Racing System</div>

      <button className="back-button" type="button" onClick={onGoLogin}>
        ← Quay lại đăng nhập
      </button>

      <p className="eyebrow">Create account</p>
      <h2>Đăng ký</h2>
      <p className="subtitle">Tạo tài khoản mới để sử dụng hệ thống.</p>

      {apiError && (
        <div className="alert" role="alert">
          {apiError}
        </div>
      )}

      {successMessage && (
        <div className="success-alert" role="status">
          {successMessage}
          <button className="text-button" type="button" onClick={onGoLogin} style={{ marginLeft: 8 }}>
            Đăng nhập ngay
          </button>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="fullName">
          Họ tên
        </label>
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

        <label className="field-label" htmlFor="registerEmail">
          Email
        </label>
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

        <label className="field-label" htmlFor="phone">
          Số điện thoại
        </label>
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

        <label className="field-label" htmlFor="roleName">
          Vai trò
        </label>
        <select
          className={errors.roleName ? 'input has-error' : 'input'}
          id="roleName"
          name="roleName"
          value={values.roleName}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        {errors.roleName && <p className="field-error">{errors.roleName}</p>}

        <div className="password-row">
          <label className="field-label" htmlFor="registerPassword">
            Password
          </label>
          <button
            className="text-button"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
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

        <button
          className="primary-button register-submit"
          type="submit"
          disabled={!isFormReady || isSubmitting}
        >
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <p className="switch-auth-text">
        Đã có tài khoản?{' '}
        <button className="text-button" type="button" onClick={onGoLogin}>
          Đăng nhập
        </button>
      </p>
    </section>
  );
}
