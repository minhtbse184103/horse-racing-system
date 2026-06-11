import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import UserPanel from './components/user/UserPanel';
import LandingPage from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';

function getInitialPage() {
  if (window.location.pathname === '/register') return 'register';
  if (window.location.pathname === '/login') return 'login';
  return 'landing';
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
    setPage(getInitialPage());
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return (
      <RegisterForm
        onGoHome={() => navigateTo('/')}
        onGoLogin={() => navigateTo('/login')}
      />
    );
  }

  if (page === 'landing') {
    return (
      <LandingPage
        onGoLogin={() => navigateTo('/login')}
        onGoRegister={() => navigateTo('/register')}
      />
    );
  }

  return (
    <LoginForm
      onLoginSuccess={setUser}
      onGoHome={() => navigateTo('/')}
      onGoRegister={() => navigateTo('/register')}
    />
  );
}
