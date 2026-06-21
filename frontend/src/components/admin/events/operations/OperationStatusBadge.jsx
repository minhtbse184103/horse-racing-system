import { motion } from 'framer-motion';
import {
  APPROVAL_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  RACE_ENTRY_STATUS_LABELS,
  STATUS_BADGE_STYLES
} from './operationConstants';

const LABELS_BY_TYPE = {
  approval: APPROVAL_STATUS_LABELS,
  payment: PAYMENT_STATUS_LABELS,
  entry: RACE_ENTRY_STATUS_LABELS
};

export default function OperationStatusBadge({ status, type = 'approval' }) {
  const labels = LABELS_BY_TYPE[type] || APPROVAL_STATUS_LABELS;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -1 }}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.7rem] font-black uppercase shadow-[0_4px_12px_rgba(43,23,16,0.07)] before:size-1.5 before:rounded-full before:shadow-[0_0_0_3px_rgba(255,255,255,0.7)] ${STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.PENDING}`}
    >
      {labels[status] || status}
    </motion.span>
  );
}
