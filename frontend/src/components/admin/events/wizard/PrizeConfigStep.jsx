import { motion } from 'framer-motion';
import { CircleDollarSign, Flag, Medal } from 'lucide-react';
import { staggerContainer } from '../../ui/motion';
import PrizeEditorCard from './PrizeEditorCard';
import { WizardSectionHeading, WizardSummaryItem } from './WizardPrimitives';
import { useLanguage } from '../../../../context/LanguageContext';

export default function PrizeConfigStep({ draft, errors, prizeTotal, onUpdateRace }) {
  const { t } = useLanguage();

  return (
    <div>
      <WizardSectionHeading eyebrow={t('eventWizardStepCounter', { step: 3 })} title={t('eventWizardStepPrizeConfig')} description={t('eventWizardPrizeConfigDescription')} />
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 grid gap-3 sm:grid-cols-3">
        <WizardSummaryItem icon={Flag} label={t('eventDomainRace')} value={draft.races.length} />
        <WizardSummaryItem icon={Medal} label={t('eventWorkspacePrizeRanks')} value={draft.races.reduce((sum, race) => sum + race.prizes.length, 0)} />
        <WizardSummaryItem icon={CircleDollarSign} label={t('eventWorkspaceTotalPrize')} value={`VND ${prizeTotal.toLocaleString()}`} />
      </motion.div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {draft.races.map((race, index) => (
          <PrizeEditorCard key={race.id} race={race} index={index} error={errors[`race-${race.id}-prizes`]} onChange={(prizes) => onUpdateRace(race.id, { prizes })} />
        ))}
      </div>
    </div>
  );
}
