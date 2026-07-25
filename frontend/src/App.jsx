import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import JockeyDashboard from './components/jockey/JockeyDashboard';
import RefereeDashboard from './components/referee/RefereeDashboard';
import UserPanel from './components/user/UserPanel';
import AccessDenied from './components/common/AccessDenied';
import LandingPage from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';
import { getUserRole } from './lib';
import WalletTransferPanel from './components/payment/WalletTransferPanel';
import OwnerHorseDetailPage from './components/owner/OwnerHorseDetailPage';

function getInitialPage() {
  if (window.location.pathname === '/register') return 'register';
  if (window.location.pathname === '/login') return 'login';
  return 'landing';
}

export default function App() {
  const { user, setUser, clearAuth } = useAuth();
  const [page, setPage] = useState(getInitialPage);
  const userRole = getUserRole(user);
  const accountType = String(user?.accountType || userRole || '').toUpperCase();
  const currentPath = window.location.pathname;

  const ownerHorseDetailMatch = currentPath.match(
  /^\/owner\/horses\/([^/]+)\/detail\/?$/
);

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

  if (user && currentPath.startsWith('/owner') && accountType !== 'OWNER' && userRole !== 'OWNER') {
    return <AccessDenied onReturnDashboard={() => navigateTo('/dashboard')} />;
  }

  if (user && currentPath.startsWith('/admin') && userRole !== 'ADMIN') {
    return <AccessDenied onReturnDashboard={() => navigateTo('/dashboard')} />;
  }

  if (user && currentPath === '/wallet/kyc/result' && accountType !== 'SPECTATOR') {
    return <AccessDenied onReturnDashboard={() => navigateTo('/dashboard')} />;
  }

  if (user && currentPath === '/wallet/kyc/result') {
    return (
      <main className="min-h-screen bg-cream-100 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <WalletTransferPanel currentUser={user} role="SPECTATOR" />
        </div>
      </main>
    );
  }

  if (
    user &&
    ownerHorseDetailMatch &&
    (accountType === 'OWNER' || userRole === 'OWNER')
) {
    return (
      <OwnerHorseDetailPage
        horseId={ownerHorseDetailMatch[1]}
      />
    );
}

  if (userRole === 'ADMIN') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (userRole === 'REFEREE') {
    return <RefereeDashboard currentUser={user} onLogout={handleLogout} />;
  }

  if (accountType === 'OWNER' || userRole === 'OWNER') {
    return <OwnerDashboard currentUser={user} onLogout={handleLogout} onUserUpdated={setUser} />;
  }

  if (accountType === 'JOCKEY' || userRole === 'JOCKEY') {
    return <JockeyDashboard currentUser={user} onLogout={handleLogout} onUserUpdated={setUser} />;
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
