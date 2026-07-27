import { motion } from 'framer-motion';
import { Activity, Award, BookOpen, CalendarDays, Dumbbell, Hash, HeartPulse, Home, Link as LinkIcon, LoaderCircle, Mail, MapPin, Phone, ShieldCheck, Trophy, User, X } from 'lucide-react';
import OperationStatusBadge from '../operations/OperationStatusBadge';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import { useLanguage } from '../../../../context/LanguageContext';

function valueOrDash(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function hasDetailValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function InfoItem({ icon: Icon, label, value, children }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
        {Icon && <Icon size={14} className="text-brown-500" />}
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-black text-brown-900">
        {children || valueOrDash(value)}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function calculateRate(part, total) {
  const totalValue = Number(total);
  if (!totalValue) return null;
  return (Number(part || 0) / totalValue) * 100;
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function buildEntityConfig(entity, t) {
  // FLOW: Admin Registration Entity Detail Popup
  // ORDER: 6A/6 - Dialog normalizes the loaded Horse/Owner/Jockey detail DTO into display sections.
  // Purpose: merge the Registration row snapshot with the enriched Horse/Owner/Jockey profile response for display.
  if (!entity) return null;

  const detail = entity.detail || {};

  if (entity.type === 'horse') {
    const horseName = detail.horseName || entity.registration.horse || entity.registration.horseName || `Horse #${entity.registration.horseId}`;
    const performance = detail.performance || {};
    const totalRaces = Number(performance.totalRaces || 0);
    const top1 = Number(performance.top1Count || 0);
    const top2 = Number(performance.top2Count || 0);
    const top3 = Number(performance.top3Count || 0);
    const top3Rate = formatPercent(calculateRate(top1 + top2 + top3, totalRaces));
    const winRate = formatPercent(calculateRate(top1, totalRaces));
    return {
      eyebrow: t('eventDomainHorse'),
      title: horseName,
      subtitle: entity.registration.registrationNo,
      items: [
        { icon: Hash, label: t('eventRegistrationHorseId'), value: detail.horseId || entity.registration.horseId },
        { icon: ShieldCheck, label: t('eventRegistrationStatus'), value: detail.status || entity.registration.horseStatus, status: detail.status || entity.registration.horseStatus },
        { icon: CalendarDays, label: t('eventRegistrationAge'), value: detail.age },
        { icon: CalendarDays, label: t('eventRegistrationDateOfBirth'), value: formatDate(detail.dayOfBirth) || entity.registration.horseDateOfBirth },
        { icon: Dumbbell, label: t('eventRegistrationWeight'), value: detail.weight == null && entity.registration.horseWeight == null ? null : `${detail.weight ?? entity.registration.horseWeight} kg` },
        { icon: User, label: t('eventRegistrationColour'), value: detail.colour },
        { icon: User, label: t('eventRegistrationSex'), value: detail.sex || entity.registration.horseGender },
        { icon: User, label: t('eventRegistrationBreeding'), value: detail.breeding || entity.registration.horseBreed },
        { icon: User, label: t('eventRegistrationTrainer'), value: detail.trainer },
        { icon: HeartPulse, label: t('eventRegistrationHealthCertExpiry'), value: formatDate(detail.healthCertExpiry) || entity.registration.horseHealthCertExpiry },
        { icon: Activity, label: t('ownerRaceTotalRace'), value: totalRaces },
        { icon: Trophy, label: t('ownerRaceWins'), value: top1 },
        { icon: Trophy, label: 'Top 1 / 2 / 3', value: `${top1} / ${top2} / ${top3}` },
        { icon: Activity, label: t('ownerRaceWinRate'), value: winRate },
        { icon: Activity, label: t('ownerRaceTop3Rate'), value: top3Rate },
        { icon: ShieldCheck, label: t('ownerRaceViolation'), value: `${Number(performance.violationCount || 0)} / DQ ${Number(performance.disqualifiedCount || 0)}` },
        { icon: Activity, label: t('eventRegistrationCount'), value: detail.registrationCount },
        { icon: Trophy, label: t('eventRegistrationParticipated'), value: detail.participated == null ? null : detail.participated ? t('eventRegistrationYes') : t('eventRegistrationNoValue') },
        { icon: LinkIcon, label: t('eventRegistrationOfficialProfileUrl'), value: detail.officialHorseProfileUrl },
        { icon: LinkIcon, label: t('eventRegistrationHealthCertificateUrl'), value: detail.healthCertificateUrl }
      ]
    };
  }

  if (entity.type === 'owner') {
    const title = detail.fullName || entity.registration.owner || entity.registration.ownerName || `Owner #${entity.registration.ownerId}`;
    return {
      eyebrow: t('eventDomainOwner'),
      title,
      subtitle: entity.registration.registrationNo,
      items: [
        { icon: Hash, label: t('eventRegistrationOwnerId'), value: detail.ownerId || entity.registration.ownerId },
        { icon: User, label: t('eventRegistrationFullName'), value: title },
        { icon: Mail, label: t('eventRegistrationEmail'), value: detail.email || entity.registration.ownerEmail },
        { icon: Phone, label: t('eventRegistrationPhone'), value: detail.phone },
        { icon: ShieldCheck, label: t('eventRegistrationStatus'), value: detail.status, status: detail.status },
        { icon: ShieldCheck, label: t('eventRegistrationKycStatus'), value: detail.kycStatus, status: detail.kycStatus },
        { icon: CalendarDays, label: t('eventRegistrationDateOfBirth'), value: formatDate(detail.dateOfBirth) },
        { icon: User, label: t('eventRegistrationGender'), value: detail.gender },
        { icon: MapPin, label: t('eventRegistrationNationality'), value: detail.nationality },
        { icon: MapPin, label: t('eventRegistrationAddress'), value: detail.address },
        { icon: Home, label: t('eventRegistrationStableName'), value: detail.stableName },
        { icon: Home, label: t('eventRegistrationStableAddress'), value: detail.stableAddress },
        { icon: Activity, label: t('eventRegistrationTotalHorsesOwned'), value: detail.totalHorsesOwned },
        { icon: CalendarDays, label: t('eventRegistrationOwnerSince'), value: formatDate(detail.ownerSince) }
      ]
    };
  }

  const jockeyTitle = detail.fullName || entity.registration.jockey || entity.registration.jockeyName || t('eventRegistrationNoJockey');
  const jockeyPerformance = detail.performance || {};
  const jockeyTotalRaces = Number(jockeyPerformance.totalRaces ?? detail.totalRaces ?? 0);
  const jockeyTop1 = Number(jockeyPerformance.top1Count ?? detail.totalWins ?? 0);
  const jockeyTop2 = Number(jockeyPerformance.top2Count || 0);
  const jockeyTop3 = Number(jockeyPerformance.top3Count || 0);
  const jockeyTop3Rate = formatPercent(calculateRate(jockeyTop1 + jockeyTop2 + jockeyTop3, jockeyTotalRaces));
  const jockeyWinRate = formatPercent(calculateRate(jockeyTop1, jockeyTotalRaces));

  return {
    eyebrow: t('eventDomainJockey'),
    title: jockeyTitle,
    subtitle: entity.registration.registrationNo,
    items: [
      { icon: Hash, label: t('eventRegistrationJockeyId'), value: detail.jockeyId || entity.registration.jockeyId },
      { icon: User, label: t('eventRegistrationFullName'), value: jockeyTitle },
      { icon: Mail, label: t('eventRegistrationEmail'), value: detail.email || entity.registration.jockeyEmail },
      { icon: Phone, label: t('eventRegistrationPhone'), value: detail.phoneNumber },
      { icon: Dumbbell, label: t('eventRegistrationWeight'), value: detail.weight == null ? null : `${detail.weight} kg` },
      { icon: BookOpen, label: t('eventRegistrationBiography'), value: detail.biography },
      { icon: Activity, label: t('eventRegistrationTotalRaces'), value: jockeyTotalRaces },
      { icon: Trophy, label: t('eventRegistrationTotalWins'), value: jockeyTop1 },
      { icon: Trophy, label: 'Top 1 / 2 / 3', value: `${jockeyTop1} / ${jockeyTop2} / ${jockeyTop3}` },
      { icon: Activity, label: t('ownerRaceWinRate'), value: jockeyWinRate },
      { icon: Activity, label: t('ownerRaceTop3Rate'), value: jockeyTop3Rate },
      { icon: ShieldCheck, label: t('ownerRaceViolation'), value: `${Number(jockeyPerformance.violationCount || 0)} / DQ ${Number(jockeyPerformance.disqualifiedCount || 0)}` },
      { icon: User, label: t('eventRegistrationTrainerName'), value: detail.trainerName },
      { icon: Mail, label: t('eventRegistrationTrainerEmail'), value: detail.trainerEmail },
      { icon: Home, label: t('eventRegistrationAcademyStableAddress'), value: detail.academyStableAddress },
      { icon: Award, label: t('eventRegistrationLicenceType'), value: detail.licenceType },
      { icon: CalendarDays, label: t('eventRegistrationExpiryDate'), value: formatDate(detail.expiryDate) },
      { icon: ShieldCheck, label: t('eventRegistrationVerificationStatus'), value: detail.verificationStatus, status: detail.verificationStatus }
    ]
  };
}

export default function RegistrationEntityDetailDialog({ entity, isLoading = false, error = '', onClose }) {
  // FLOW: Admin Registration Entity Detail Popup
  // ORDER: 6/6 - Modal renders the enriched entity detail, loading state, or backend lookup error.
  // FE path: RegistrationApprovalPanel opens this read-only modal after profile data is fetched.
  // Purpose: let Admin verify Horse/Owner/Jockey evidence while staying inside the Registration review workflow.
  const { t } = useLanguage();
  const config = buildEntityConfig(entity, t);
  const visibleItems = config?.items.filter((item) => item.status || hasDetailValue(item.value)) || [];

  if (!config) return null;

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[90] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <motion.div
        {...modalPanel}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/80 p-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-brown-500">{config.eyebrow}</p>
            <h3 className="mt-1 truncate text-2xl font-black text-brown-900">{config.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{config.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200" aria-label={t('eventCommonClose')}>
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          {config.note && (
            <div className="mb-4 rounded-lg border border-gold-400/25 bg-gold-400/10 px-4 py-3 text-xs font-bold leading-5 text-brown-700">
              {config.note}
            </div>
          )}

          {isLoading && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-brown-700/10 bg-white/75 px-4 py-3 text-sm font-extrabold text-brown-700">
              <LoaderCircle className="animate-spin" size={16} />
              {t('eventCommonLoading')}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleItems.map((item) => (
              <InfoItem key={item.label} icon={item.icon} label={item.label} value={item.value}>
                {item.status ? <OperationStatusBadge status={item.status} /> : null}
              </InfoItem>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-brown-700/10 bg-white/70 p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200">
            {t('eventCommonClose')}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
