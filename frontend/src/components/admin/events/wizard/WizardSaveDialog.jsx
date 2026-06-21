import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';

export default function WizardSaveDialog({ open, draft, editing, prizeTotal, totalRunnerCapacity, onCancel, onConfirm }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setIsSaving(true);
    setError('');
    try {
      await onConfirm();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this tournament.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div {...modalBackdrop} className="fixed inset-0 z-[60] grid place-items-center bg-brown-900/65 p-4" onMouseDown={isSaving ? undefined : onCancel}>
          <motion.div {...modalPanel} className="w-full max-w-md rounded-lg border border-white/60 bg-cream-100 p-6 shadow-[0_32px_90px_rgba(43,23,16,0.48)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="save-tournament-title">
            <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><CheckCircle2 size={21} /></span><div><h3 id="save-tournament-title" className="text-xl font-black text-brown-900">{editing ? 'Save tournament changes?' : 'Create tournament and open registration?'}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{editing ? 'Tournament details and the race programme will be synchronized with the backend.' : 'The tournament will be created first, followed by its configured races.'} It contains {draft.races.length} races with THB {prizeTotal.toLocaleString()} in prizes and {totalRunnerCapacity} total runner places.</p></div></div>
            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-900">{error}</div>}
            <div className="mt-6 flex justify-end gap-2 border-t border-brown-700/10 pt-5"><button type="button" disabled={isSaving} onClick={onCancel} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Keep editing</button><button type="button" disabled={isSaving} onClick={confirm} className="inline-flex items-center gap-2 rounded-lg bg-brown-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-brown-900 disabled:opacity-60">{isSaving && <LoaderCircle className="animate-spin" size={16} />}{editing ? 'Save changes' : 'Create tournament'}</button></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
