import { CalendarDays, Flag, ShieldCheck, Trophy } from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Tournament Operations',
    description: 'Manage schedules, rounds, races, and registrations.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Participation',
    description: 'Connect owners, jockeys, admins, and referees.'
  },
  {
    icon: Flag,
    title: 'Race Day Ready',
    description: 'Assign entries and follow each event through the finish.'
  }
];

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-cream-200 p-3 text-brown-900 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-lg border border-brown-700/10 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.16)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
        <section className="relative hidden overflow-hidden bg-brown-900 px-10 py-12 text-cream-100 lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-gold-400 text-brown-900">
                <Trophy size={22} strokeWidth={2.5} />
              </span>
              <div>
                <strong className="block text-lg font-extrabold">
                  Horse Racing System
                </strong>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                  Equestrian Tournament
                </span>
              </div>
            </div>

            <h1 className="mt-16 max-w-2xl text-5xl font-black leading-tight xl:text-6xl">
              Every race begins with a well-managed starting gate.
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-cream-100/70">
              Sign in to manage tournaments, horses, registrations, race
              assignments, and official results.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-lg border border-cream-100/15 bg-cream-100/5 p-4"
                key={title}
              >
                <Icon className="text-gold-400" size={19} strokeWidth={2.4} />
                <strong className="mt-4 block text-sm font-extrabold">
                  {title}
                </strong>
                <p className="mt-2 text-xs font-medium leading-5 text-cream-100/60">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid place-items-center overflow-y-auto px-5 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-lg">{children}</div>
        </section>
      </div>
    </main>
  );
}
