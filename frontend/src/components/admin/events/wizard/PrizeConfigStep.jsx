import { motion } from 'framer-motion';
import { CircleDollarSign, Flag, Medal } from 'lucide-react';
import { staggerContainer } from '../../ui/motion';
import PrizeEditorCard from './PrizeEditorCard';
import { WizardSectionHeading, WizardSummaryItem } from './WizardPrimitives';

export default function PrizeConfigStep({ draft, errors, prizeTotal, onUpdateRace }) {
  return (
    <div>
      <WizardSectionHeading eyebrow="Bước 3 trên 4" title="Cấu hình giải thưởng Race" description="Thiết lập giá trị giải thưởng theo thứ hạng hoàn thành của từng Race. Thứ tự hạng được tạo tự động." />
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 grid gap-3 sm:grid-cols-3">
        <WizardSummaryItem icon={Flag} label="Race" value={draft.races.length} />
        <WizardSummaryItem icon={Medal} label="Hạng giải thưởng" value={draft.races.reduce((sum, race) => sum + race.prizes.length, 0)} />
        <WizardSummaryItem icon={CircleDollarSign} label="Tổng giải thưởng" value={`THB ${prizeTotal.toLocaleString()}`} />
      </motion.div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {draft.races.map((race, index) => (
          <PrizeEditorCard key={race.id} race={race} index={index} error={errors[`race-${race.id}-prizes`]} onChange={(prizes) => onUpdateRace(race.id, { prizes })} />
        ))}
      </div>
    </div>
  );
}
