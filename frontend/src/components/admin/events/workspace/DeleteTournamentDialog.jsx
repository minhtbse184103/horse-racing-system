import { useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';

export default function DeleteTournamentDialog({ tournament, onCancel, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function confirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to cancel this tournament.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-50 grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onMouseDown={isDeleting ? undefined : onCancel}>
      <motion.div {...modalPanel} className="w-full max-w-md rounded-lg border border-white/70 bg-cream-100 p-6 shadow-[0_32px_90px_rgba(43,23,16,0.44)]" onMouseDown={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="delete-tournament-title">
        <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-red-100 text-danger"><Trash2 size={20} /></span><div><h3 id="delete-tournament-title" className="text-xl font-black text-brown-900">Cancel tournament?</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500"><strong className="text-brown-900">{tournament.name}</strong> will be cancelled through the backend. Existing records remain available for audit history.</p></div></div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{error}</div>}
        <div className="mt-6 flex justify-end gap-2 border-t border-brown-700/10 pt-5"><button type="button" disabled={isDeleting} onClick={onCancel} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Keep tournament</button><button type="button" disabled={isDeleting} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-extrabold text-white shadow-lg hover:bg-red-700 disabled:opacity-60">{isDeleting && <LoaderCircle className="animate-spin" size={16} />} Cancel tournament</button></div>
      </motion.div>
    </motion.div>
  );
}
