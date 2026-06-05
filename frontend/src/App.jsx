import { useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  getToken,
  login,
  logout,
  saveAuthSession,
  signup,
  startGoogleLogin
} from './services/authService';

const roleDashboards = {
  ADMIN: '/admin',
  OWNER: '/owner',
  JOCKEY: '/jockey',
  REFEREE: '/referee',
  SPECTATOR: '/spectator'
};

const publicRoles = ['OWNER', 'JOCKEY', 'SPECTATOR'];

function validateLoginForm(values) {
  const errors = {};
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!values.email.trim()) {
    errors.email = 'Email không được để trống.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  if (!values.password) {
    errors.password = 'Password không được để trống.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password phải từ 6 đến 72 ký tự.';
  }

  return errors;
}

function validateRegisterForm(values) {
  const errors = {};
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const phoneRegex = /^\+?[0-9]{9,15}$/;

  if (!values.fullName.trim()) {
    errors.fullName = 'Họ tên không được để trống.';
  } else if (values.fullName.trim().length > 255) {
    errors.fullName = 'Họ tên không được vượt quá 255 ký tự.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email không được để trống.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Số điện thoại không được để trống.';
  } else if (!phoneRegex.test(values.phone.trim())) {
    errors.phone = 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
  }

  if (!values.password) {
    errors.password = 'Password không được để trống.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password phải từ 6 đến 72 ký tự.';
  }

  if (!publicRoles.includes(values.roleName)) {
    errors.roleName = 'Role chỉ được là OWNER, JOCKEY hoặc SPECTATOR.';
  }

  return errors;
}

function AuthLayout({ children }) {
  return (
    <main className="page-shell">
      <section className="hero-panel" aria-hidden="true">
        <div className="brand-pill">Equestrian Tournament</div>
        <h1>Horse Racing Management System</h1>
      </section>

      {children}
    </main>
  );
}

function UserPanel({ user, onLogout }) {
  const dashboardPath = roleDashboards[user?.role] || '/dashboard';

  return (
    <main className="page-shell">
      <section className="success-card" aria-label="Thông tin đăng nhập thành công">
        <div className="brand-mark">🏇</div>
        <p className="eyebrow">Horse Racing System</p>
        <h1>Đăng nhập thành công</h1>
        <p className="success-message">
          Chào <strong>{user?.fullName || user?.email}</strong>, tài khoản của bạn có quyền{' '}
          <strong>{user?.role}</strong>.
        </p>

        <div className="user-info-grid">
          <span>Email</span>
          <strong>{user?.email}</strong>

          <span>Trạng thái</span>
          <strong>{user?.status || 'N/A'}</strong>

          <span>Trang sau login</span>
          <strong>{dashboardPath}</strong>
        </div>

        <button className="primary-button" onClick={onLogout} type="button">
          Đăng xuất
        </button>
      </section>
    </main>
  );
}

function LoginForm({ onLoginSuccess, onGoRegister }) {
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

function RegisterForm({ onGoLogin }) {
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'OWNER'
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

    const formErrors = validateRegisterForm(values);
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

      setSuccessMessage('Đăng ký thành công. Bạn có thể quay lại trang đăng nhập.');
      setValues({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        roleName: 'OWNER'
      });
    } catch (error) {
      setApiError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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

        {apiError && (
          <div className="alert" role="alert">
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="success-alert" role="status">
            {successMessage}
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
            <option value="OWNER">Owner</option>
            <option value="JOCKEY">Jockey</option>
            <option value="SPECTATOR">Spectator</option>
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

          <button className="primary-button register-submit" type="submit" disabled={!isFormReady || isSubmitting}>
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
    </AuthLayout>
  );
}

function getInitialPage() {
  return window.location.pathname === '/register' ? 'register' : 'login';
}

export default function App() {
  const [user, setUser] = useState(() => (getToken() ? getCurrentUser() : null));
  const [page, setPage] = useState(getInitialPage);

  useEffect(() => {
    function handlePopState() {
      setPage(getInitialPage());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigateTo(path) {
    window.history.pushState(null, '', path);
    setPage(path === '/register' ? 'register' : 'login');
  }

  function handleLogout() {
    logout();
    setUser(null);
    navigateTo('/login');
  }

  if (user) {
    return <UserPanel user={user} onLogout={handleLogout} />;
  }

  if (page === 'register') {
    return <RegisterForm onGoLogin={() => navigateTo('/login')} />;
  }

  return <LoginForm onLoginSuccess={setUser} onGoRegister={() => navigateTo('/register')} />;
}