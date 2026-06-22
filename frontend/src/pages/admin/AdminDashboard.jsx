import { ClipboardCheck, Trophy, Users, UserStar } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { getAdminSummary } from '../../services/adminService.js';

function AdminStat({ label, value, icon: Icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#D4AF37]/15 text-[#80630d]">
          <Icon size={24} />
        </span>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getAdminSummary().then(setSummary);
  }, []);

  if (!summary) {
    return (
      <DashboardLayout>
        <LoadingState label="Loading admin dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Admin Dashboard"
        title="System control center"
        description="Review users, owner applications, horses, races, and results from a dedicated admin workspace."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Total Users" value={summary.totalUsers} icon={Users} />
        <AdminStat label="Total Owners" value={summary.totalOwners} icon={UserStar} />
        <AdminStat label="Pending Applications" value={summary.pendingApplications} icon={ClipboardCheck} />
        <AdminStat label="Total Horses" value={summary.totalHorses} icon={Trophy} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Owner approval workflow" description="Approve converts the user role to Owner and creates a mock OwnerProfile.">
          <div className="rounded-3xl bg-[#1B5E20] p-6 text-white">
            <p className="text-3xl font-black">Pending → Approved / Rejected</p>
            <p className="mt-4 text-sm leading-6 text-white/70">
              The Admin page uses mock services with the same shape as future backend endpoints. Actions persist in localStorage for testing.
            </p>
          </div>
        </Card>
        <Card title="Backend-ready contracts" description="Services are separated so API calls can replace mock logic later.">
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            <li>POST /api/auth/register</li>
            <li>POST /api/auth/login</li>
            <li>GET /api/admin/owner-applications</li>
            <li>PUT /api/admin/owner-applications/{'{id}'}/approve</li>
            <li>PUT /api/admin/owner-applications/{'{id}'}/reject</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
