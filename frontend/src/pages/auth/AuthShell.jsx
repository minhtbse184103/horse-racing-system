import { Trophy } from 'lucide-react';

export default function AuthShell({ title, description, children }) {
  return (
    <main className="grid min-h-screen bg-[#F5F5F5] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#1B5E20] p-12 text-white lg:block">
        <div className="absolute inset-0 opacity-20 racing-pattern" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#D4AF37] ring-1 ring-white/15">
              <Trophy size={24} />
            </span>
            <div>
              <p className="text-xl font-black">EquiRace</p>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Owner Management</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Premium Racing SaaS</p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
              Manage owners, horses, and race operations from one workspace.
            </h1>
            <p className="mt-6 text-base leading-8 text-white/70">
              A clean front-end workflow for Spectator registration, Owner application review, and role-based dashboards.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Spectator', 'Owner', 'Admin'].map((role) => (
              <div key={role} className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="font-bold">{role}</p>
                <p className="mt-1 text-xs text-white/55">Role workspace</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft md:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#D4AF37]">EquiRace</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
