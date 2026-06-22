import { motion } from 'framer-motion';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { tapPress } from '../../ui/motion';

export default function TournamentActions({ tournament, onEdit, onClone, onDelete, compact = false }) {
  const hasRegistrations = Number(tournament.registrationCount || 0) > 0;
  const lockedStatus = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(tournament.status);
  const canModify = !hasRegistrations && !lockedStatus;
  const disabledReason = hasRegistrations
    ? 'Không khả dụng sau khi đã có Registration được gửi'
    : `Không khả dụng khi Status của Tournament là ${tournament.status}`;
  const baseClass = compact
    ? 'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold transition'
    : 'grid size-9 place-items-center rounded-lg border transition';
  const disabledClass = 'disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none';

  return (
    <div className={`flex ${compact ? 'gap-2' : 'justify-end gap-1.5'}`}>
      <motion.button
        whileHover={canModify ? { y: -1 } : undefined}
        whileTap={canModify ? tapPress : undefined}
        type="button"
        onClick={() => onEdit(tournament)}
        disabled={!canModify}
        className={`${baseClass} ${disabledClass} border-brown-700/15 bg-white text-brown-700 enabled:hover:border-brown-500 enabled:hover:bg-cream-200`}
        title={canModify ? 'Chỉnh sửa Tournament' : `Không thể chỉnh sửa: ${disabledReason}`}
        aria-label={canModify ? 'Chỉnh sửa Tournament' : `Không thể chỉnh sửa Tournament: ${disabledReason}`}
      >
        <Pencil size={15} />
        {compact && 'Chỉnh sửa'}
      </motion.button>
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={tapPress}
        type="button"
        onClick={() => onClone(tournament)}
        className={`${baseClass} border-brown-700/15 bg-white text-brown-700 hover:border-brown-500 hover:bg-cream-200`}
        title="Nhân bản Tournament"
      >
        <Copy size={15} />
        {compact && 'Nhân bản'}
      </motion.button>
      <motion.button
        whileHover={canModify ? { y: -1 } : undefined}
        whileTap={canModify ? tapPress : undefined}
        type="button"
        onClick={() => onDelete(tournament)}
        disabled={!canModify}
        className={`${baseClass} ${disabledClass} border-red-200 bg-red-50 text-danger enabled:hover:border-red-300 enabled:hover:bg-red-100`}
        title={canModify ? 'Hủy Tournament' : `Không thể hủy: ${disabledReason}`}
        aria-label={canModify ? 'Hủy Tournament' : `Không thể hủy Tournament: ${disabledReason}`}
      >
        <Trash2 size={15} />
        {compact && 'Hủy'}
      </motion.button>
    </div>
  );
}
