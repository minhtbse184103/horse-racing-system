import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import UserPanel from './components/user/UserPanel';
import { useAuth } from './hooks/useAuth';

function getInitialPage() {
  return window.location.pathname === '/register' ? 'register' : 'login';
}

export default function App() {
  const { user, setUser, clearAuth } = useAuth();
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
    clearAuth();
    navigateTo('/login');
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (user?.role === 'OWNER') {
    return <OwnerDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (user) {
    return <UserPanel user={user} onLogout={handleLogout} />;
  }

  if (page === 'register') {
    return <RegisterForm onGoLogin={() => navigateTo('/login')} />;
  }

  return <LoginForm onLoginSuccess={setUser} onGoRegister={() => navigateTo('/register')} />;
}
