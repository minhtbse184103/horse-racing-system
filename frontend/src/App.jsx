import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import JockeyDashboard from './components/jockey/JockeyDashboard';
import RefereeDashboard from './components/referee/RefereeDashboard';
import UserPanel from './components/user/UserPanel';
import AccessDenied from './components/common/AccessDenied';
import VnpayReturnPage from './components/payment/VnpayReturnPage';
import LandingPage from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';
import { getUserRole } from './lib';

function getInitialPage() {
  if (window.location.pathname === '/register') return 'register';
  if (window.location.pathname === '/login') return 'login';
  return 'landing';
}

export default function App() {
  const { user, setUser, clearAuth } = useAuth();
  const [page, setPage] = useState(getInitialPage);
  const userRole = getUserRole(user);
  const currentPath = window.location.pathname;

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

  if (currentPath.startsWith('/payment/vnpay-return')) {
    return <VnpayReturnPage />;
  }

  if (user && currentPath.startsWith('/owner') && userRole !== 'OWNER') {
    return <AccessDenied onReturnDashboard={() => navigateTo('/dashboard')} />;
  }

  if (user && currentPath.startsWith('/admin') && userRole !== 'ADMIN') {
    return <AccessDenied onReturnDashboard={() => navigateTo('/dashboard')} />;
  }

  if (userRole === 'ADMIN') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (userRole === 'OWNER') {
    return <OwnerDashboard currentUser={user} onLogout={handleLogout} onUserUpdated={setUser} />;
  }

  if (userRole === 'JOCKEY') {
    return <JockeyDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (userRole === 'REFEREE') {
    return <RefereeDashboard currentUser={user} onLogout={handleLogout} />;
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
