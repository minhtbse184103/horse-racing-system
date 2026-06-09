import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import UserPanel from './components/user/UserPanel';
import { useAuth } from './hooks/useAuth';
import { getUserRole } from './lib';

type AuthPage = 'login' | 'register';

function getInitialPage(): AuthPage {
  return window.location.pathname === '/register' ? 'register' : 'login';
}

export default function App() {
  const { user, setUser, clearAuth } = useAuth();
  const [page, setPage] = useState<AuthPage>(getInitialPage);
  const userRole = getUserRole(user);

  useEffect(() => {
    function handlePopState(): void {
      setPage(getInitialPage());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigateTo(path: '/login' | '/register'): void {
    window.history.pushState(null, '', path);
    setPage(path === '/register' ? 'register' : 'login');
  }

  function handleLogout(): void {
    clearAuth();
    navigateTo('/login');
  }

  if (userRole === 'ADMIN') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (userRole === 'OWNER') {
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
