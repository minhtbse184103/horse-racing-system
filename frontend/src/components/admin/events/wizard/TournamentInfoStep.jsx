import { CalendarDays, Trophy } from 'lucide-react';
import EligibilityConditionBuilder from './EligibilityConditionBuilder';
import { FIELD_CLASS } from './wizardConstants';
import { WizardField, WizardSectionHeading } from './WizardPrimitives';
import VenueImageField from './VenueImageField';

export default function TournamentInfoStep({
  draft,
  setDraft,
  errors,
  updateTournamentField,
  conditionDraft,
  setConditionDraft,
  conditionError,
  setConditionError
}) {
  return (
    <div className="space-y-4">
      <WizardSectionHeading eyebrow="Bước 1 trên 4" title="Thông tin Tournament" description="Thiết lập thông tin Tournament, thời gian Registration, lịch sự kiện, sức chứa và điều kiện tham gia." />

      <section className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3 border-b border-brown-700/10 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cream-200 text-brown-700"><Trophy size={18} /></span>
          <div><h4 className="text-lg font-black text-brown-900">Thông tin chính</h4><p className="mt-1 text-sm font-semibold text-slate-500">Thông tin công khai và thiết lập tham gia.</p></div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <WizardField label="Tên Tournament" error={errors.name} className="xl:col-span-4">
            <input className={FIELD_CLASS} value={draft.name} onChange={(event) => updateTournamentField('name', event.target.value)} placeholder="Bangkok Royal Invitational" />
          </WizardField>
          <WizardField label="Địa điểm" error={errors.venue} className="xl:col-span-2">
            <input className={FIELD_CLASS} value={draft.venue} onChange={(event) => updateTournamentField('venue', event.target.value)} placeholder="Royal Turf Club" />
          </WizardField>
          <WizardField label="Mô tả" hint="Hiển thị cho Owner và người tham gia" className="md:col-span-2 xl:col-span-6">
            <textarea className={`${FIELD_CLASS} min-h-24 resize-y`} value={draft.description} onChange={(event) => updateTournamentField('description', event.target.value)} placeholder="Mô tả thể thức và mục đích của sự kiện" />
          </WizardField>
          <WizardField label="Số Registration tối đa" error={errors.maxRegistration} hint="Sức chứa tối thiểu là 3" className="xl:col-span-3">
            <input type="number" min="3" className={FIELD_CLASS} value={draft.maxRegistration} onChange={(event) => updateTournamentField('maxRegistration', Number(event.target.value))} />
          </WizardField>
          <WizardField label="Phí tham gia" error={errors.entryFee} hint="Đơn vị VND, điều chỉnh theo bước 1.000.000 VND" className="xl:col-span-3">
            <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">VND</span><input type="number" min="0" step="1000000" className={`${FIELD_CLASS} pl-14`} value={draft.entryFee} onChange={(event) => updateTournamentField('entryFee', Number(event.target.value))} /></div>
          </WizardField>
        </div>
        <VenueImageField
          file={draft.venueImageFile}
          existingSrc={draft.venueImageSrc}
          onSelect={(file) => setDraft((current) => ({
            ...current,
            venueImageFile: file,
            venueImageRemoved: false
          }))}
          onRemove={() => setDraft((current) => ({
            ...current,
            venueImageFile: null,
            venueImageUrl: '',
            venueImageSrc: '',
            venueImageRemoved: Boolean(current.venueImageUrl) || current.venueImageRemoved
          }))}
        />
      </section>

      <section className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3 border-b border-brown-700/10 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cream-200 text-brown-700"><CalendarDays size={18} /></span>
          <div><h4 className="text-lg font-black text-brown-900">Thời gian Registration và sự kiện</h4><p className="mt-1 text-sm font-semibold text-slate-500">Registration phải đóng trước khi Tournament bắt đầu.</p></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <WizardField label="Mở Registration" error={errors.registrationOpen}><input type="date" className={FIELD_CLASS} value={draft.registrationOpen} onChange={(event) => updateTournamentField('registrationOpen', event.target.value)} /></WizardField>
          <WizardField label="Đóng Registration" error={errors.registrationClose}><input type="date" min={draft.registrationOpen || undefined} className={FIELD_CLASS} value={draft.registrationClose} onChange={(event) => updateTournamentField('registrationClose', event.target.value)} /></WizardField>
          <WizardField label="Bắt đầu Tournament" error={errors.start}><input type="date" min={draft.registrationClose || undefined} className={FIELD_CLASS} value={draft.start} onChange={(event) => updateTournamentField('start', event.target.value)} /></WizardField>
          <WizardField label="Kết thúc Tournament" error={errors.end}><input type="date" min={draft.start || undefined} className={FIELD_CLASS} value={draft.end} onChange={(event) => updateTournamentField('end', event.target.value)} /></WizardField>
        </div>
      </section>

      <EligibilityConditionBuilder
        draft={draft}
        setDraft={setDraft}
        conditionDraft={conditionDraft}
        setConditionDraft={setConditionDraft}
        error={conditionError}
        setError={setConditionError}
      />
    </div>
  );
}
