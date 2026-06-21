import { motion } from 'framer-motion';
import { CircleDollarSign, Flag, Medal } from 'lucide-react';
import { staggerContainer } from '../../ui/motion';
import PrizeEditorCard from './PrizeEditorCard';
import { WizardSectionHeading, WizardSummaryItem } from './WizardPrimitives';

export default function PrizeConfigStep({ draft, errors, prizeTotal, onUpdateRace }) {
  return (
    <div>
      <WizardSectionHeading eyebrow="Step 3 of 4" title="Race prize configuration" description="Define prize amounts by finishing rank for each race. Rank order is generated automatically." />
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 grid gap-3 sm:grid-cols-3">
        <WizardSummaryItem icon={Flag} label="Races" value={draft.races.length} />
        <WizardSummaryItem icon={Medal} label="Prize ranks" value={draft.races.reduce((sum, race) => sum + race.prizes.length, 0)} />
        <WizardSummaryItem icon={CircleDollarSign} label="Total prizes" value={`THB ${prizeTotal.toLocaleString()}`} />
      </motion.div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {draft.races.map((race, index) => (
          <PrizeEditorCard key={race.id} race={race} index={index} error={errors[`race-${race.id}-prizes`]} onChange={(prizes) => onUpdateRace(race.id, { prizes })} />
        ))}
      </div>
    </div>
  );
}
