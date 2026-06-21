import { AlertCircle, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardCheck, Flag, Info, MapPin, Trophy } from 'lucide-react';
import { formatRaceSchedule, formatTournamentCondition, formatVndCurrency, tournamentStatusLabels } from '../../../../lib/eventFormatters';
import { WizardSectionHeading, WizardSummaryItem } from './WizardPrimitives';

export default function ReviewStep({ draft, prizeTotal }) {
  const readiness = [
    { label: 'Tournament information complete', ready: Boolean(draft.name && draft.venue && draft.start && draft.end) },
    { label: `${draft.conditions.length} eligibility rules configured`, ready: draft.conditions.length > 0, optional: true },
    { label: `${draft.races.length} races configured`, ready: draft.races.length > 0 },
    { label: 'Every race has ranked prizes', ready: draft.races.length > 0 && draft.races.every((race) => race.prizes.length > 0) }
  ];

  return (
    <div>
      <WizardSectionHeading eyebrow="Step 4 of 4" title="Review and confirmation" description="Review the complete tournament, race programme, eligibility rules, and prize totals before creation." />
      <div className="mt-4">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <WizardSummaryItem icon={Trophy} label="Tournament" value={draft.name || 'Not provided'} />
              <WizardSummaryItem icon={MapPin} label="Venue" value={draft.venue || 'Not provided'} />
              <WizardSummaryItem icon={CalendarDays} label="Tournament dates" value={`${draft.start || 'TBD'} - ${draft.end || 'TBD'}`} />
              <WizardSummaryItem icon={CircleDollarSign} label="Total race prizes" value={`THB ${prizeTotal.toLocaleString()}`} />
              <WizardSummaryItem icon={CheckCircle2} label="Initial status" value={tournamentStatusLabels.OPEN_FOR_REGISTRATION} />
            </div>

            <section className="rounded-lg border border-brown-700/10 bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase text-brown-500">Race programme</p><h4 className="mt-1 text-lg font-black text-brown-900">{draft.races.length} configured races</h4></div><Flag className="text-brown-500" size={21} /></div>
              <div className="mt-4 divide-y divide-brown-700/10">
                {draft.races.map((race, index) => (
                  <div key={race.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center">
                    <span className="grid size-8 place-items-center rounded-lg bg-brown-900 text-xs font-black text-white">{index + 1}</span>
                    <div><p className="font-black text-brown-900">{race.name}</p><p className="mt-0.5 text-xs font-semibold text-slate-500">{race.track} · {formatRaceSchedule(race)} · {race.distance}m · {race.maxRunners} runners</p><p className="mt-1 text-[0.68rem] font-extrabold uppercase text-emerald-700">{tournamentStatusLabels[race.status] || race.status}</p></div>
                    <div className="text-left sm:text-right"><p className="text-sm font-black text-brown-900">THB {race.prizes.reduce((sum, prize) => sum + Number(prize.amount || 0), 0).toLocaleString()}</p><p className="text-xs font-semibold text-slate-500">{race.prizes.length} ranks · owner/jockey split configured</p></div>
                  </div>
                ))}
                {draft.races.length === 0 && <p className="py-6 text-center text-sm font-semibold text-slate-500">No races configured.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-brown-700/10 bg-white/80 p-5">
              <p className="text-xs font-black uppercase text-brown-500">Eligibility rules</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.conditions.map((condition) => <span key={condition.id} className="rounded-full border border-brown-700/10 bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">{formatTournamentCondition(condition)}</span>)}
                {draft.conditions.length === 0 && <span className="text-sm font-semibold text-slate-500">No eligibility restrictions.</span>}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-brown-700/10 bg-cream-200/50 p-5">
              <p className="text-xs font-black uppercase text-brown-500">Event summary</p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Registration opens</dt><dd className="text-right font-black text-brown-900">{draft.registrationOpen || 'TBD'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Registration closes</dt><dd className="text-right font-black text-brown-900">{draft.registrationClose || 'TBD'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Capacity</dt><dd className="font-black text-brown-900">{draft.maxRegistration}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Entry fee</dt><dd className="font-black text-brown-900">{formatVndCurrency(draft.entryFee)}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border border-brown-700/10 bg-white/80 p-5">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><ClipboardCheck size={17} /></span><div><p className="font-black text-brown-900">Readiness check</p><p className="text-xs font-semibold text-slate-500">Frontend validation summary</p></div></div>
              <div className="mt-4 grid gap-3">
                {readiness.map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    {item.ready ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={16} /> : item.optional ? <Info className="mt-0.5 shrink-0 text-amber-600" size={16} /> : <AlertCircle className="mt-0.5 shrink-0 text-danger" size={16} />}
                    <span className="text-xs font-bold leading-5 text-brown-900">{item.label}{item.optional && !item.ready ? ' (optional)' : ''}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
