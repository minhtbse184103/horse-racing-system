import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';

export default function AccessDenied({ message = 'Access Denied. Only Owners can access this page.' }) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-red-600">
              <ShieldAlert size={28} />
            </div>
            <h1 className="mt-5 text-3xl font-black text-slate-950">Access Denied</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
            <Link to="/dashboard" className="btn btn-primary mt-6 inline-flex">
              Return Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
