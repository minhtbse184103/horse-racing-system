import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { tapPress } from '../../ui/motion';
import OperationStatusBadge from '../operations/OperationStatusBadge';
import { useLanguage } from '../../../../context/LanguageContext';

function EntityLink({ children, onClick, disabled = false }) {
  if (disabled) {
    return <span className="truncate text-slate-500">{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="max-w-full truncate text-left font-inherit text-current underline-offset-4 transition hover:text-brown-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gold-400/35"
    >
      {children}
    </button>
  );
}

function ReviewButton({ onClick }) {
  const { t } = useLanguage();
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={tapPress}
      type="button"
      onClick={onClick}
      className="rounded-lg border border-brown-700/15 bg-white px-3 py-2 text-xs font-extrabold text-brown-700 shadow-sm hover:border-gold-400/45 hover:bg-cream-200"
    >
      {t('eventCommonViewDetail')}
    </motion.button>
  );
}

export default function RegistrationList({ registrations, onReview, onViewEntity }) {
  const { t } = useLanguage();

  if (registrations.length === 0) {
    return (
      <div className="grid min-h-44 place-items-center p-6 text-center">
        <div>
          <ClipboardList className="mx-auto text-brown-500" size={24} />
          <p className="mt-3 font-black text-brown-900">{t('eventCommonEmptyResult')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{t('eventRegistrationReviewSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden xl:block">
        <table className="w-full table-fixed text-sm">
          <colgroup><col className="w-[15%]" /><col className="w-[21%]" /><col className="w-[17%]" /><col className="w-[15%]" /><col className="w-[16%]" /><col className="w-[16%]" /></colgroup>
          <thead className="bg-cream-200/55 text-left text-[11px] font-black uppercase text-brown-700">
            <tr><th className="px-3 py-3">{t('eventDomainRegistration')}</th><th className="px-3 py-3">{t('eventRegistrationHorseJockey')}</th><th className="px-3 py-3">{t('eventDomainOwner')}</th><th className="px-3 py-3">{t('eventRegistrationPaymentStatus')}</th><th className="px-3 py-3">{t('eventRegistrationApprovalStatus')}</th><th className="px-3 py-3 text-right">{t('eventCommonViewDetail')}</th></tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <motion.tr key={registration.id} whileHover={{ x: 2 }} className="border-t border-brown-700/10 transition-colors hover:bg-cream-200/45">
                <td className="truncate px-3 py-3.5 font-black text-brown-900" title={registration.registrationNo}>{registration.registrationNo}</td>
                <td className="min-w-0 px-3 py-3.5">
                  <p className="truncate font-black text-brown-900">
                    <EntityLink onClick={() => onViewEntity('horse', registration)}>{registration.horse}</EntityLink>
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    <EntityLink disabled={!registration.jockeyId} onClick={() => onViewEntity('jockey', registration)}>
                      {registration.jockey || t('eventRegistrationNoJockey')}
                    </EntityLink>
                  </p>
                </td>
                <td className="truncate px-3 py-3.5 font-bold text-brown-900" title={registration.owner}>
                  <EntityLink onClick={() => onViewEntity('owner', registration)}>{registration.owner}</EntityLink>
                </td>
                <td className="px-3 py-3.5"><OperationStatusBadge status={registration.paymentStatus} type="payment" /></td>
                <td className="px-3 py-3.5"><OperationStatusBadge status={registration.approvalStatus} /></td>
                <td className="px-3 py-3.5 text-right"><ReviewButton onClick={() => onReview(registration)} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-brown-700/10 xl:hidden">
        {registrations.map((registration) => (
          <motion.article whileHover={{ x: 2 }} key={registration.id} className="p-4 transition-colors hover:bg-white/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase text-brown-500">{registration.registrationNo}</p>
                <h5 className="mt-1 truncate font-black text-brown-900">
                  <EntityLink onClick={() => onViewEntity('horse', registration)}>{registration.horse}</EntityLink>
                </h5>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  <EntityLink onClick={() => onViewEntity('owner', registration)}>{registration.owner}</EntityLink>
                  <span> · </span>
                  <EntityLink disabled={!registration.jockeyId} onClick={() => onViewEntity('jockey', registration)}>
                    {registration.jockey || t('eventRegistrationNoJockey')}
                  </EntityLink>
                </p>
              </div>
              <OperationStatusBadge status={registration.approvalStatus} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3"><OperationStatusBadge status={registration.paymentStatus} type="payment" /><ReviewButton onClick={() => onReview(registration)} /></div>
          </motion.article>
        ))}
      </div>
    </>
  );
}
