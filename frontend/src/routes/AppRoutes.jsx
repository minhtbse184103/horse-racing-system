import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Register from '../pages/auth/Register.jsx';
import Login from '../pages/auth/Login.jsx';
import SpectatorDashboard from '../pages/spectator/SpectatorDashboard.jsx';
import Profile from '../pages/profile/Profile.jsx';
import OwnerApplicationForm from '../pages/profile/OwnerApplicationForm.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import OwnerApplicationList from '../pages/admin/OwnerApplicationList.jsx';
import OwnerApplicationDetail from '../pages/admin/OwnerApplicationDetail.jsx';
import OwnerDashboard from '../pages/owner/OwnerDashboard.jsx';
import AccessDenied from '../pages/system/AccessDenied.jsx';
import NotFound from '../pages/system/NotFound.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const roleHome = {
  Spectator: '/dashboard',
  Owner: '/owner/dashboard',
  Admin: '/admin/dashboard'
};

function PublicOnly() {
  const { user, booting } = useAuth();
  if (booting) return <LoadingState label="Preparing app..." />;
  if (user) return <Navigate to={roleHome[user.role] || '/dashboard'} replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <LoadingState label="Preparing app..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function RequireOwner() {
  const { user } = useAuth();
  if (user?.role !== 'Owner') {
    return <AccessDenied message="Access Denied. Only Owners can access this page." />;
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== 'Admin') {
    return <AccessDenied message="Access Denied. Only Admins can access this page." />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SpectatorDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/become-owner" element={<OwnerApplicationForm />} />

        <Route element={<RequireOwner />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/owner-applications" element={<OwnerApplicationList />} />
          <Route path="/admin/owner-applications/:id" element={<OwnerApplicationDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
