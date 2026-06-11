import { Search, ClipboardList, UserPlus, ShieldCheck, Flag, Trophy } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Discover Tournament", desc: "Browse the calendar and find an eligible event." },
  { icon: ClipboardList, title: "Register Horse", desc: "Owners submit horses that match the conditions." },
  { icon: UserPlus, title: "Invite Jockey", desc: "Send invitations to qualified professional jockeys." },
  { icon: ShieldCheck, title: "Admin Review", desc: "Entries are verified and the field is approved." },
  { icon: Flag, title: "Race Assignment", desc: "Horses are drawn into races and gates assigned." },
  { icon: Trophy, title: "Compete & View Results", desc: "Race, record results, publish standings." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-200 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">Process</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-base text-brown-900/70">
            From discovery to the winner's circle — every stage is tracked in one place.
          </p>
        </div>

        <ol className="relative mt-14 hidden lg:grid lg:grid-cols-6 lg:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-6 h-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-start">
              <div className="relative z-10 grid h-12 w-12 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-brown-500">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-base font-bold text-brown-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{s.desc}</p>
            </li>
          ))}
        </ol>

        <ol className="relative mt-12 space-y-7 lg:hidden">
          <div className="absolute left-6 top-3 bottom-3 w-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-5">
              <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown-500">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-bold text-brown-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
