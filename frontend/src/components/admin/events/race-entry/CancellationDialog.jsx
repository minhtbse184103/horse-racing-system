import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, LoaderCircle, UserMinus, X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';

export default function CancellationDialog({ entry, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Lý do hủy là trường bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(entry.raceEntryId, trimmedReason);
      onClose();
    } catch (cancellationError) {
      setError(cancellationError.message || 'Không thể hủy RaceEntry này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[80] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm" onMouseDown={isSubmitting ? undefined : onClose}>
      <motion.form {...modalPanel} onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" role="dialog" aria-modal="true" aria-labelledby="cancel-entry-title">
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-5">
          <div><p className="text-xs font-black uppercase text-red-700">Hủy RaceEntry</p><h3 id="cancel-entry-title" className="mt-1 text-xl font-black text-brown-900">Giải phóng vị trí {entry.startingStall}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{entry.horse} · {entry.registrationNo}</p></div>
          <button type="button" disabled={isSubmitting} onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200 disabled:opacity-50" aria-label="Đóng"><X size={17} /></button>
        </header>

        <div className="p-5">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><p>Backend sẽ giải phóng Registration và vị trí xuất phát sau khi xác thực yêu cầu hủy.</p></div>
          <label className="mt-4 grid gap-1.5 text-sm font-extrabold text-brown-900">Lý do hủy
            <textarea autoFocus value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} maxLength={500} className="min-h-28 resize-y rounded-lg border border-brown-700/15 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15" placeholder="Giải thích lý do hủy RaceEntry này" />
          </label>
          <div className="mt-1 flex items-start justify-between gap-3"><span className="text-xs font-bold text-danger">{error}</span><span className="shrink-0 text-xs font-semibold text-slate-500">{reason.length}/500</span></div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-brown-700/10 bg-white/70 p-4">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Giữ RaceEntry</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <UserMinus size={16} />} Hủy RaceEntry</button>
        </footer>
      </motion.form>
    </motion.div>
  );
}
