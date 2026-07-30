import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleDollarSign, LoaderCircle, X, XCircle } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import OperationStatusBadge from '../operations/OperationStatusBadge';
import { formatOperationDateTime } from '../operations/operationHelpers';
import { useLanguage } from '../../../../context/LanguageContext';

function DetailItem({ label, value, onClick, disabled = false }) {
  const content = (
    <>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-brown-900">{value}</p>
    </>
  );

  if (!onClick || disabled) {
    return <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-brown-700/10 bg-white/70 p-4 text-left transition hover:border-gold-400/45 hover:bg-cream-200/70 focus:outline-none focus:ring-4 focus:ring-gold-400/15"
    >
      {content}
    </button>
  );
}

export default function RegistrationReviewDialog({ registration, onClose, onDecision, onConfirmRefund, onViewEntity }) {
  // FLOW: Admin Registration Entity Detail Popup
  // ORDER: 1/6 - Review dialog also exposes Horse/Owner/Jockey detail click targets before approve/reject.
  const { t } = useLanguage();
  const [reason, setReason] = useState(registration.rejectionReason || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPending = registration.approvalStatus === 'PENDING';
  const isRefundPending = registration.approvalStatus === 'REJECTED'
    && registration.paymentStatus === 'REFUND_PENDING';

  async function decide(status, rejectionReason = null) {
    // FLOW: Admin Approve Registration / Reject Registration
    // ORDER: 1/8 - Review dialog submits the selected decision and keeps backend errors visible.
    // Purpose: submit the chosen review decision and display backend validation errors in the dialog.
    setIsSubmitting(true);
    setError('');
    try {
      await onDecision(registration, status, rejectionReason);
    } catch (decisionError) {
      setError(decisionError.message || t('eventCommonActionError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function reject() {
    // FLOW: Admin Reject Registration
    // ORDER: 1/6 - Review dialog validates rejection reason before submitting REJECTED decision.
    // FE validation: rejectionReason is required before calling the backend reject endpoint.
    if (!reason.trim()) {
      setError(t('rejectReasonRequired'));
      return;
    }
    decide('REJECTED', reason.trim());
  }

  async function confirmRefund() {
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirmRefund(registration);
    } catch (refundError) {
      setError(refundError.message || t('eventCommonActionError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[70] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <motion.div {...modalPanel} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="registration-review-title">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-5 md:p-6">
          <div className="min-w-0"><p className="truncate text-xs font-black uppercase text-brown-500">{registration.registrationNo}</p><h3 id="registration-review-title" className="mt-1 text-2xl font-black text-brown-900">{t('eventRegistrationReviewTitle')}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{t('eventRegistrationReviewSubtitle')}</p></div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200" aria-label={t('eventCommonClose')}><X size={17} /></button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5 md:p-6">
          <div className="mb-4 rounded-lg border border-gold-400/25 bg-gold-400/10 p-4"><p className="text-xs font-black uppercase text-brown-500">{t('eventDomainTournament')}</p><p className="mt-1 font-black text-brown-900">{registration.tournamentName}</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label={t('eventDomainHorse')} value={registration.horse} onClick={() => onViewEntity?.('horse', registration)} />
            <DetailItem label={t('eventDomainOwner')} value={registration.owner} onClick={() => onViewEntity?.('owner', registration)} />
            <DetailItem label={t('eventDomainJockey')} value={registration.jockey || t('eventRegistrationNoJockey')} disabled={!registration.jockeyId} onClick={() => onViewEntity?.('jockey', registration)} />
            <DetailItem label={t('eventRegistrationSubmittedAt')} value={formatOperationDateTime(registration.submittedAt)} />
            <DetailItem label={t('eventRegistrationReviewedAt')} value={formatOperationDateTime(registration.reviewedAt)} />
            <DetailItem label={t('eventRegistrationReviewedBy')} value={registration.reviewedBy || t('eventStatus_PENDING')} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><OperationStatusBadge status={registration.paymentStatus} type="payment" /><OperationStatusBadge status={registration.approvalStatus} /></div>
          {registration.rejectionReason && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-xs font-black uppercase text-red-700">{t('eventRegistrationRejectionReason')}</p><p className="mt-2 text-sm font-bold text-red-900">{registration.rejectionReason}</p></div>}
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{error}</div>}
          {isPending && (
            <label className="mt-5 grid gap-1.5 text-sm font-extrabold text-brown-900">{t('eventRegistrationRejectionReason')}
              <textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} className="min-h-24 rounded-lg border border-brown-700/15 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15" placeholder={t('eventRegistrationRejectPlaceholder')} />
            </label>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-brown-700/10 bg-white/70 p-4 md:px-5">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">{t('eventCommonClose')}</button>
          {isPending && <><button type="button" disabled={isSubmitting} onClick={reject} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-extrabold text-danger hover:bg-red-100 disabled:opacity-50"><XCircle size={16} /> {t('eventCommonReject')}</button><button type="button" disabled={isSubmitting} onClick={() => decide('APPROVED')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-50">{isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} {t('eventCommonApprove')}</button></>}
          {isRefundPending && (
            <button type="button" disabled={isSubmitting} onClick={confirmRefund} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-sky-800 disabled:opacity-50">
              {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <CircleDollarSign size={16} />}
              {t('eventRegistrationConfirmRefund')}
            </button>
          )}
        </footer>
      </motion.div>
    </motion.div>
  );
}
