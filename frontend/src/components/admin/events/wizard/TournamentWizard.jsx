import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Trophy, X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import PrizeConfigStep from './PrizeConfigStep';
import RaceConfigStep from './RaceConfigStep';
import ReviewStep from './ReviewStep';
import TournamentInfoStep from './TournamentInfoStep';
import WizardSaveDialog from './WizardSaveDialog';
import WizardStepper from './WizardStepper';
import { WIZARD_STEPS } from './wizardConstants';
import {
  createInitialTournamentDraft,
  createRace,
  getPrizeTotal,
  getTotalRunnerCapacity,
  resetConditionDraft
} from './wizardHelpers';
import { validateWizardStep } from './wizardValidation';

export default function TournamentWizard({ initialTournament, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => createInitialTournamentDraft(initialTournament));
  const [conditionDraft, setConditionDraft] = useState(() => resetConditionDraft());
  const [conditionError, setConditionError] = useState('');
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scrollContainerRef = useRef(null);

  const prizeTotal = useMemo(() => getPrizeTotal(draft.races), [draft.races]);
  const totalRunnerCapacity = useMemo(() => getTotalRunnerCapacity(draft.races), [draft.races]);

  function updateTournamentField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function updateRace(raceId, patch) {
    setDraft((current) => ({
      ...current,
      races: current.races.map((race) => (race.id === raceId ? { ...race, ...patch } : race))
    }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[`race-${raceId}-${key}`]);
      return next;
    });
  }

  function scrollToTop() {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() {
    const nextErrors = validateWizardStep(step, draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStep((current) => Math.min(4, current + 1));
      scrollToTop();
    }
  }

  function previousStep() {
    setErrors({});
    setStep((current) => Math.max(1, current - 1));
    scrollToTop();
  }

  function addRace() {
    updateTournamentField('races', [...draft.races, createRace(draft)]);
  }

  async function submitTournament() {
    return onSave(draft);
  }

  const activeStep = WIZARD_STEPS.find((item) => item.id === step);

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-50 overflow-hidden bg-brown-900/60 p-0 backdrop-blur-sm md:p-3 xl:p-4">
      <motion.div {...modalPanel} role="dialog" aria-modal="true" aria-labelledby="tournament-studio-title" className="mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden bg-cream-100 shadow-[0_32px_100px_rgba(43,23,16,0.46)] md:h-[calc(100dvh-1.5rem)] md:rounded-lg md:border md:border-white/60 xl:h-[calc(100dvh-2rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/80 px-4 py-3 md:px-6 md:py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="hidden size-10 shrink-0 place-items-center rounded-lg bg-brown-900 text-white sm:grid"><Trophy size={20} /></span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-brown-500">Tournament studio</p>
              <h2 id="tournament-studio-title" className="mt-0.5 truncate text-xl font-black text-brown-900 md:text-2xl">{initialTournament ? 'Edit tournament' : 'Create tournament'}</h2>
              <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 lg:block">Tournament has many races. Each race has its own ranked prize structure.</p>
            </div>
          </div>
          <button className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 transition hover:border-brown-500 hover:bg-cream-200" type="button" onClick={onClose} aria-label="Close tournament studio"><X size={19} /></button>
        </header>

        <WizardStepper step={step} />

        <div ref={scrollContainerRef} data-wizard-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5 xl:p-6">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                {step === 1 && (
                  <TournamentInfoStep
                    draft={draft}
                    setDraft={setDraft}
                    errors={errors}
                    updateTournamentField={updateTournamentField}
                    conditionDraft={conditionDraft}
                    setConditionDraft={setConditionDraft}
                    conditionError={conditionError}
                    setConditionError={setConditionError}
                  />
                )}
                {step === 2 && <RaceConfigStep draft={draft} errors={errors} onAddRace={addRace} onUpdateRace={updateRace} onUpdateRaces={(races) => updateTournamentField('races', races)} />}
                {step === 3 && <PrizeConfigStep draft={draft} errors={errors} prizeTotal={prizeTotal} onUpdateRace={updateRace} />}
                {step === 4 && <ReviewStep draft={draft} prizeTotal={prizeTotal} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <footer className="shrink-0 border-t border-brown-700/10 bg-white/95 px-4 py-2.5 shadow-[0_-12px_30px_rgba(43,23,16,0.06)] backdrop-blur md:px-6 md:py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div className="hidden sm:block"><p className="text-xs font-black uppercase text-brown-500">Current step</p><p className="text-sm font-black text-brown-900">{activeStep.label}: {activeStep.shortLabel}</p></div>
            <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
              {step === 1 ? (
                <button type="button" onClick={onClose} className="mr-auto inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-extrabold text-slate-500 hover:bg-cream-200 hover:text-brown-900 sm:mr-0"><ArrowLeft size={16} /> Cancel</button>
              ) : (
                <button type="button" onClick={previousStep} className="mr-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200 sm:mr-0"><ArrowLeft size={16} /> Back</button>
              )}
              {step < 4 ? (
                <button type="button" onClick={nextStep} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-md hover:bg-brown-900">Continue <ArrowRight size={16} /></button>
              ) : (
                <button type="button" onClick={() => setShowConfirmation(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-md hover:bg-brown-900"><Trophy size={16} /> {initialTournament ? 'Save changes' : 'Create tournament'}</button>
              )}
            </div>
          </div>
        </footer>
      </motion.div>

      <WizardSaveDialog
        open={showConfirmation}
        draft={draft}
        editing={Boolean(initialTournament?.id)}
        prizeTotal={prizeTotal}
        totalRunnerCapacity={totalRunnerCapacity}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={submitTournament}
      />
    </motion.div>
  );
}
