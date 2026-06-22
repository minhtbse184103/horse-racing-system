import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const roleRedirects = {
  Spectator: '/dashboard',
  Owner: '/owner/dashboard',
  Admin: '/admin/dashboard'
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form);
      navigate(roleRedirects[user.role] || '/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Login" description="Sign in and continue to the dashboard for your current role.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="field-label">
          Email
          <input className="field-input" type="email" name="email" value={form.email} onChange={updateField} placeholder="oanh@gmail.com" />
        </label>
        <label className="field-label">
          Password
          <input className="field-input" type="password" name="password" value={form.password} onChange={updateField} placeholder="password123" />
        </label>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
        <p className="font-bold text-slate-700">Mock accounts</p>
        <p>Spectator: oanh@gmail.com / password123</p>
        <p>Admin: admin@horse.test / admin123</p>
        <p>Owner: owner@horse.test / owner123</p>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-slate-500">Need an account?</span>
        <Link to="/register" className="font-bold text-[#1B5E20] hover:underline">
          Register
        </Link>
      </div>
    </AuthShell>
  );
}
