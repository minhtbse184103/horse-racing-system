import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { tapPress } from '../../ui/motion';
import OperationStatusBadge from '../operations/OperationStatusBadge';

function ReviewButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={tapPress}
      type="button"
      onClick={onClick}
      className="rounded-lg border border-brown-700/15 bg-white px-3 py-2 text-xs font-extrabold text-brown-700 shadow-sm hover:border-gold-400/45 hover:bg-cream-200"
    >
      View details
    </motion.button>
  );
}

export default function RegistrationList({ registrations, onReview }) {
  if (registrations.length === 0) {
    return (
      <div className="grid min-h-44 place-items-center p-6 text-center">
        <div>
          <ClipboardList className="mx-auto text-brown-500" size={24} />
          <p className="mt-3 font-black text-brown-900">No registrations found</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Adjust the search or status filters to see more results.</p>
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
            <tr><th className="px-3 py-3">Registration</th><th className="px-3 py-3">Horse / Jockey</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Approval</th><th className="px-3 py-3 text-right">Details</th></tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <motion.tr key={registration.id} whileHover={{ x: 2 }} className="border-t border-brown-700/10 transition-colors hover:bg-cream-200/45">
                <td className="truncate px-3 py-3.5 font-black text-brown-900" title={registration.registrationNo}>{registration.registrationNo}</td>
                <td className="min-w-0 px-3 py-3.5"><p className="truncate font-black text-brown-900">{registration.horse}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{registration.jockey || 'No jockey assigned'}</p></td>
                <td className="truncate px-3 py-3.5 font-bold text-brown-900" title={registration.owner}>{registration.owner}</td>
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
              <div className="min-w-0"><p className="truncate text-xs font-black uppercase text-brown-500">{registration.registrationNo}</p><h5 className="mt-1 truncate font-black text-brown-900">{registration.horse}</h5><p className="mt-1 truncate text-xs font-semibold text-slate-500">{registration.owner} · {registration.jockey || 'No jockey'}</p></div>
              <OperationStatusBadge status={registration.approvalStatus} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3"><OperationStatusBadge status={registration.paymentStatus} type="payment" /><ReviewButton onClick={() => onReview(registration)} /></div>
          </motion.article>
        ))}
      </div>
    </>
  );
}
