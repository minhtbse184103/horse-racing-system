import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const initialForm = {
  username: '',
  email: '',
  phone: '',
  password: ''
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function updateField(event) {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(form);
      setSuccess('Registration successful. Your default role is Spectator. Redirecting to Login...');
      window.setTimeout(() => navigate('/login'), 700);
    } catch (submitError) {
      setError(submitError.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Register as a Spectator first. Owner access is requested later from your Profile page."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="field-label">
          Tên đăng nhập
          <input className="field-input" name="username" value={form.username} onChange={updateField} placeholder="ten_dang_nhap" />
        </label>
        <label className="field-label">
          Email
          <input className="field-input" type="email" name="email" value={form.email} onChange={updateField} placeholder="oanh@gmail.com" />
        </label>
        <label className="field-label">
          Phone Number
          <input className="field-input" name="phone" value={form.phone} onChange={updateField} placeholder="0901234567" />
        </label>
        <label className="field-label">
          Password
          <input className="field-input" type="password" name="password" value={form.password} onChange={updateField} placeholder="Minimum 6 characters" />
        </label>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-slate-500">Already have an account?</span>
        <Link to="/login" className="font-bold text-[#1B5E20] hover:underline">
          Login
        </Link>
      </div>
    </AuthShell>
  );
}
