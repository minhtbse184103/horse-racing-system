import { motion } from 'framer-motion';
import { CircleGauge, UserMinus } from 'lucide-react';
import { hoverLift, tapPress } from '../../ui/motion';
import OperationStatusBadge from '../operations/OperationStatusBadge';
import { formatOperationDateTime } from '../operations/operationHelpers';

export default function OfficialEntries({ race, entries, onCancel, canCancel = true, cancelDisabledReason = '' }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/75 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase text-brown-500">RaceEntry chính thức</p><p className="mt-1 text-xs font-semibold text-slate-500">Vị trí xuất phát và thông tin phân công</p></div>
        <span className="rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">{entries.length}/{race.maxRunners} người tham gia</span>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {[...entries].sort((a, b) => a.startingStall - b.startingStall).map((entry) => {
          return (
            <motion.article key={entry.id} whileHover={hoverLift} className="rounded-lg border border-white/80 bg-cream-100 p-3.5 shadow-[0_8px_22px_rgba(78,44,25,0.08)] hover:border-gold-400/40 hover:shadow-[0_14px_32px_rgba(78,44,25,0.13)]">
              <div className="flex items-start justify-between gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brown-900 text-base font-black text-white">{entry.startingStall}</span><OperationStatusBadge status={entry.status} type="entry" /></div>
              <h4 className="mt-3 truncate font-black text-brown-900">{entry.horse || 'Không rõ ngựa'}</h4>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{entry.registrationNo} · {entry.owner}</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">Jockey: {entry.jockey || 'Chưa phân công'}</p>
              <div className="mt-3 border-t border-brown-700/10 pt-3 text-xs font-semibold text-slate-500"><p>{formatOperationDateTime(entry.assignedAt)}</p><p className="mt-1">Người phân công: {entry.assignedBy}</p></div>
              {entry.cancelledAt && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900"><p>Đã hủy {formatOperationDateTime(entry.cancelledAt)}</p><p className="mt-1">Bởi {entry.cancelledByName || entry.cancelledBy || 'Admin không xác định'}</p><p className="mt-1 font-bold">{entry.cancellationReason || 'Không có lý do'}</p></div>
              )}
              {entry.status === 'ASSIGNED' && canCancel && (
                <motion.button whileTap={tapPress} type="button" onClick={() => onCancel(entry)} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100"><UserMinus size={14} /> Hủy RaceEntry</motion.button>
              )}
              {entry.status === 'ASSIGNED' && !canCancel && cancelDisabledReason && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-900">
                  {cancelDisabledReason}
                </p>
              )}
            </motion.article>
          );
        })}

        {entries.length === 0 && (
          <div className="col-span-full grid min-h-36 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-cream-200/25 p-6 text-center">
            <div><CircleGauge className="mx-auto text-brown-500" size={22} /><p className="mt-3 text-sm font-black text-brown-900">Chưa có RaceEntry chính thức</p><p className="mt-1 text-xs font-semibold text-slate-500">Sử dụng Phân công RaceEntry để thêm Registration hợp lệ vào Race này.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
