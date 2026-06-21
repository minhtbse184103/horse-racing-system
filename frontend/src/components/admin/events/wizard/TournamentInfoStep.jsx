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
      <WizardSectionHeading eyebrow="Step 1 of 4" title="Tournament information" description="Define the tournament identity, registration window, event schedule, capacity, and eligibility rules." />

      <section className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3 border-b border-brown-700/10 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cream-200 text-brown-700"><Trophy size={18} /></span>
          <div><h4 className="text-lg font-black text-brown-900">Event essentials</h4><p className="mt-1 text-sm font-semibold text-slate-500">Public identity and participation settings.</p></div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <WizardField label="Tournament name" error={errors.name} className="xl:col-span-4">
            <input className={FIELD_CLASS} value={draft.name} onChange={(event) => updateTournamentField('name', event.target.value)} placeholder="Bangkok Royal Invitational" />
          </WizardField>
          <WizardField label="Venue" error={errors.venue} className="xl:col-span-2">
            <input className={FIELD_CLASS} value={draft.venue} onChange={(event) => updateTournamentField('venue', event.target.value)} placeholder="Royal Turf Club" />
          </WizardField>
          <WizardField label="Description" hint="Visible to owners and participants" className="md:col-span-2 xl:col-span-6">
            <textarea className={`${FIELD_CLASS} min-h-24 resize-y`} value={draft.description} onChange={(event) => updateTournamentField('description', event.target.value)} placeholder="Describe the event format and purpose" />
          </WizardField>
          <WizardField label="Maximum registrations" error={errors.maxRegistration} hint="Minimum capacity is 3" className="xl:col-span-3">
            <input type="number" min="3" className={FIELD_CLASS} value={draft.maxRegistration} onChange={(event) => updateTournamentField('maxRegistration', Number(event.target.value))} />
          </WizardField>
          <WizardField label="Entry fee" error={errors.entryFee} hint="Amount in Thai baht" className="xl:col-span-3">
            <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">THB</span><input type="number" min="0" className={`${FIELD_CLASS} pl-12`} value={draft.entryFee} onChange={(event) => updateTournamentField('entryFee', Number(event.target.value))} /></div>
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
          <div><h4 className="text-lg font-black text-brown-900">Registration and event dates</h4><p className="mt-1 text-sm font-semibold text-slate-500">Registration must close before the tournament begins.</p></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <WizardField label="Registration opens" error={errors.registrationOpen}><input type="date" className={FIELD_CLASS} value={draft.registrationOpen} onChange={(event) => updateTournamentField('registrationOpen', event.target.value)} /></WizardField>
          <WizardField label="Registration closes" error={errors.registrationClose}><input type="date" min={draft.registrationOpen || undefined} className={FIELD_CLASS} value={draft.registrationClose} onChange={(event) => updateTournamentField('registrationClose', event.target.value)} /></WizardField>
          <WizardField label="Tournament starts" error={errors.start}><input type="date" min={draft.registrationClose || undefined} className={FIELD_CLASS} value={draft.start} onChange={(event) => updateTournamentField('start', event.target.value)} /></WizardField>
          <WizardField label="Tournament ends" error={errors.end}><input type="date" min={draft.start || undefined} className={FIELD_CLASS} value={draft.end} onChange={(event) => updateTournamentField('end', event.target.value)} /></WizardField>
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
