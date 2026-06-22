import { CalendarDays, Flag, Medal, Plus, Trophy } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { dashboardStats } from '../../data/mockData.js';

function OwnerStat({ label, value, icon: Icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1B5E20]/10 text-[#1B5E20]">
          <Icon size={24} />
        </span>
      </div>
    </Card>
  );
}

export default function OwnerDashboard() {
  const stats = dashboardStats.owner;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Owner Dashboard"
        title="Owner racing workspace"
        description="Manage your horses, race registration, results, and recent activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OwnerStat label="My Horses" value={stats.myHorses} icon={Trophy} />
        <OwnerStat label="Upcoming Races" value={stats.upcomingRaces} icon={CalendarDays} />
        <OwnerStat label="Registered Races" value={stats.registeredRaces} icon={Flag} />
        <OwnerStat label="Total Wins" value={stats.totalWins} icon={Medal} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Recent Horse Activity" description="Mock empty state until horse registration is connected.">
          <EmptyState
            title="No horses registered yet."
            description="Register your first horse to see activity, race entries, and performance data here."
            action={
              <button type="button" className="btn btn-primary">
                <Plus size={16} /> Register Horse
              </button>
            }
          />
        </Card>

        <Card title="Race registrations" description="No race registrations are currently available.">
          <EmptyState
            title="No race registrations"
            description="Once horses are registered, upcoming race entries will appear in this area."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
