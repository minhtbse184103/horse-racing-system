import { Flag, Plus } from 'lucide-react';
import RaceEditorCard from './RaceEditorCard';
import { WizardSectionHeading, WizardValidationBanner } from './WizardPrimitives';

export default function RaceConfigStep({ draft, errors, onAddRace, onUpdateRace, onUpdateRaces }) {
  return (
    <div>
      <WizardSectionHeading
        eyebrow="Bước 2 trên 4"
        title="Cấu hình Race"
        description="Thêm Race trực tiếp vào Tournament. Mỗi Race có đường đua, thời gian, cự ly và sức chứa riêng."
        action={<button type="button" onClick={onAddRace} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white shadow-md hover:bg-brown-900"><Plus size={16} /> Thêm Race</button>}
      />
      <WizardValidationBanner message={errors.races} />
      <div className="mt-4 grid gap-3">
        {draft.races.map((race, index) => (
          <RaceEditorCard
            key={race.id}
            race={race}
            index={index}
            draft={draft}
            errors={errors}
            onChange={(patch) => onUpdateRace(race.id, patch)}
            onRemove={() => onUpdateRaces(draft.races.filter((item) => item.id !== race.id))}
          />
        ))}
        {draft.races.length === 0 && (
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/45 p-8 text-center">
            <div><span className="mx-auto grid size-12 place-items-center rounded-lg bg-cream-200 text-brown-700"><Flag size={22} /></span><h4 className="mt-4 text-lg font-black text-brown-900">Chưa cấu hình Race</h4><p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">Thêm Race đầu tiên. Race sẽ thuộc trực tiếp Tournament này và có cơ cấu giải thưởng riêng.</p><button type="button" onClick={onAddRace} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white hover:bg-brown-900"><Plus size={16} /> Thêm Race đầu tiên</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
