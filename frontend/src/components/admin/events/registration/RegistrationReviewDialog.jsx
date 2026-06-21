import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, X, XCircle } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import OperationStatusBadge from '../operations/OperationStatusBadge';
import { formatOperationDateTime } from '../operations/operationHelpers';

function DetailItem({ label, value }) {
  return <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-2 break-words text-sm font-black text-brown-900">{value}</p></div>;
}

export default function RegistrationReviewDialog({ registration, onClose, onDecision }) {
  const [reason, setReason] = useState(registration.rejectionReason || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPending = registration.approvalStatus === 'PENDING';

  async function decide(status, rejectionReason = null) {
    setIsSubmitting(true);
    setError('');
    try {
      await onDecision(registration, status, rejectionReason);
    } catch (decisionError) {
      setError(decisionError.message || 'Không thể cập nhật Registration này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function reject() {
    if (!reason.trim()) {
      setError('Lý do từ chối là trường bắt buộc.');
      return;
    }
    decide('REJECTED', reason.trim());
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[70] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <motion.div {...modalPanel} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="registration-review-title">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-5 md:p-6">
          <div className="min-w-0"><p className="truncate text-xs font-black uppercase text-brown-500">{registration.registrationNo}</p><h3 id="registration-review-title" className="mt-1 text-2xl font-black text-brown-900">Duyệt Registration</h3><p className="mt-1 text-sm font-semibold text-slate-500">Kiểm tra người tham gia và thông tin truy vết trước khi đưa ra quyết định.</p></div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200" aria-label="Đóng"><X size={17} /></button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5 md:p-6">
          <div className="mb-4 rounded-lg border border-gold-400/25 bg-gold-400/10 p-4"><p className="text-xs font-black uppercase text-brown-500">Tournament</p><p className="mt-1 font-black text-brown-900">{registration.tournamentName}</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Ngựa" value={registration.horse} />
            <DetailItem label="Owner" value={registration.owner} />
            <DetailItem label="Jockey" value={registration.jockey || 'Chưa phân công'} />
            <DetailItem label="Ngày gửi" value={formatOperationDateTime(registration.submittedAt)} />
            <DetailItem label="Ngày duyệt" value={formatOperationDateTime(registration.reviewedAt)} />
            <DetailItem label="Người duyệt" value={registration.reviewedBy || 'Chưa duyệt'} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><OperationStatusBadge status={registration.paymentStatus} type="payment" /><OperationStatusBadge status={registration.approvalStatus} /></div>
          {registration.rejectionReason && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-xs font-black uppercase text-red-700">Lý do từ chối</p><p className="mt-2 text-sm font-bold text-red-900">{registration.rejectionReason}</p></div>}
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{error}</div>}
          {isPending && (
            <label className="mt-5 grid gap-1.5 text-sm font-extrabold text-brown-900">Lý do từ chối
              <textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} className="min-h-24 rounded-lg border border-brown-700/15 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15" placeholder="Bắt buộc khi từ chối" />
            </label>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-brown-700/10 bg-white/70 p-4 md:px-5">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Đóng</button>
          {isPending && <><button type="button" disabled={isSubmitting} onClick={reject} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-extrabold text-danger hover:bg-red-100 disabled:opacity-50"><XCircle size={16} /> Từ chối</button><button type="button" disabled={isSubmitting} onClick={() => decide('APPROVED')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-50">{isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Duyệt</button></>}
        </footer>
      </motion.div>
    </motion.div>
  );
}
