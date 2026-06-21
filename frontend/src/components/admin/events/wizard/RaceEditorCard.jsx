import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { FIELD_CLASS } from './wizardConstants';
import { WizardField } from './WizardPrimitives';
import { formatRaceSchedule } from '../../../../lib/eventFormatters';

export default function RaceEditorCard({ race, index, draft, errors, onChange, onRemove }) {
  const prefix = `race-${race.id}`;

  return (
    <motion.article layout className="overflow-hidden rounded-lg border border-white/80 bg-white/90 shadow-[0_10px_28px_rgba(78,44,25,0.08)] transition-shadow hover:shadow-[0_16px_36px_rgba(78,44,25,0.12)]">
      <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brown-900 text-xs font-black text-white">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-brown-900">{race.name || `Race ${index + 1}`}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {formatRaceSchedule(race)} · {race.distance || 0}m · {race.maxRunners || 0} runners
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 bg-red-50 text-danger transition hover:bg-red-100"
          aria-label={`Remove ${race.name || `race ${index + 1}`}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-8">
        <WizardField label="Race name" error={errors[`${prefix}-name`]} className="xl:col-span-2">
          <input className={FIELD_CLASS} value={race.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Bangkok Mile" />
        </WizardField>
        <WizardField label="Track" error={errors[`${prefix}-track`]} className="xl:col-span-2">
          <input className={FIELD_CLASS} value={race.track} onChange={(event) => onChange({ track: event.target.value })} placeholder="Main Turf" />
        </WizardField>
        <WizardField label="Race starts" error={errors[`${prefix}-raceStartTime`]} className="xl:col-span-2">
          <input type="datetime-local" min={draft.start ? `${draft.start}T00:00` : undefined} max={draft.end ? `${draft.end}T23:59` : undefined} className={FIELD_CLASS} value={race.raceStartTime} onChange={(event) => onChange({ raceStartTime: event.target.value })} />
        </WizardField>
        <WizardField label="Race ends" error={errors[`${prefix}-raceEndTime`]} className="xl:col-span-2">
          <input type="datetime-local" min={race.raceStartTime || (draft.start ? `${draft.start}T00:00` : undefined)} max={draft.end ? `${draft.end}T23:59` : undefined} className={FIELD_CLASS} value={race.raceEndTime} onChange={(event) => onChange({ raceEndTime: event.target.value })} />
        </WizardField>
        <WizardField label="Distance" error={errors[`${prefix}-distance`]} hint="Measured in metres" className="xl:col-span-4">
          <div className="relative">
            <input type="number" min="1" step="100" className={`${FIELD_CLASS} pr-12`} value={race.distance} onChange={(event) => onChange({ distance: Number(event.target.value) })} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">m</span>
          </div>
        </WizardField>
        <WizardField label="Maximum runners" error={errors[`${prefix}-maxRunners`]} hint="Official race capacity" className="xl:col-span-4">
          <input type="number" min="1" max="30" className={FIELD_CLASS} value={race.maxRunners} onChange={(event) => onChange({ maxRunners: Number(event.target.value) })} />
        </WizardField>
      </div>
    </motion.article>
  );
}
