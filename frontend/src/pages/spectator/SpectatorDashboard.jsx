import { CalendarDays, Gauge, TrendingUp, Trophy, WalletCards } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { dashboardStats, raceCards } from '../../data/mockData.js';

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="overflow-hidden">
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

export default function SpectatorDashboard() {
  const stats = dashboardStats.spectator;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Spectator Dashboard"
        title="Racing overview"
        description="Follow horses, races, betting activity, and results from a premium spectator workspace."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Trophy} label="Total Horses" value={stats.totalHorses} />
        <StatTile icon={CalendarDays} label="Upcoming Races" value={stats.upcomingRaces} />
        <StatTile icon={Gauge} label="Today's Races" value={stats.todayRaces} />
        <StatTile icon={WalletCards} label="Betting Overview" value={stats.bettingOverview} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card title="Featured race cards" description="Mock race cards with modern horse racing placeholders.">
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {raceCards.map((race, index) => (
              <article key={race.title} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="race-image flex h-40 items-end justify-between p-5 text-white" data-index={index + 1}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">Race {index + 1}</p>
                    <p className="mt-1 text-lg font-black">{race.location}</p>
                  </div>
                  <StatusBadge status={race.status} className="bg-white/90" />
                </div>
                <div className="p-5">
                  <h3 className="font-black text-slate-950">{race.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#1B5E20]">{race.time}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{race.description}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card title="Betting overview" description="Static mock data for future backend integration.">
          <div className="rounded-3xl bg-[#1B5E20] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/65">Weekly volume</p>
                <p className="mt-2 text-4xl font-black">$24.8K</p>
              </div>
              <TrendingUp className="text-[#D4AF37]" size={34} />
            </div>
            <div className="mt-6 h-2 rounded-full bg-white/15">
              <div className="h-2 w-2/3 rounded-full bg-[#D4AF37]" />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">
              Betting features are displayed as UI only. Service files are mocked and ready for backend endpoints later.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
