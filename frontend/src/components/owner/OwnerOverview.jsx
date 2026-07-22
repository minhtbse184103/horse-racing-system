import { ArrowRight, CheckCircle2, ClipboardList, Flag, HeartPulse, ShieldCheck, Sparkles, Trophy, UserRound } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatNumber } from '../../lib';

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getHorseStatusCounts(horses) {
  return horses.reduce((accumulator, horse) => {
    const status = String(horse?.status || 'UNKNOWN').toUpperCase();
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});
}

function OverviewMetricCard({ icon: Icon, label, value, description, tone = 'neutral' }) {
  return (
    <article className={`owner-overview-metric-card ${tone}`}>
      <div className="owner-overview-metric-icon">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <span>{label}</span>
        <strong>{formatNumber(safeNumber(value))}</strong>
        {description && <p>{description}</p>}
      </div>
    </article>
  );
}

function WorkflowButton({ variant = 'secondary', icon: Icon, label, description, onClick }) {
  return (
    <button className={`owner-overview-workflow-button ${variant}`} type="button" onClick={onClick}>
      <span className="owner-overview-workflow-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}

function ReadinessRow({ label, value, total, tone }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="owner-overview-readiness-row">
      <div>
        <span>{label}</span>
        <strong>{formatNumber(value)} / {formatNumber(total)}</strong>
      </div>
      <div className="owner-overview-readiness-track" aria-hidden="true">
        <span className={tone} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <small>{percent}%</small>
    </div>
  );
}

export default function OwnerOverview({ dashboard, horses, onGoHorses, onGoInvitations, onGoProfile }) {
  const { language, t } = useLanguage();
  const totalHorses = safeNumber(dashboard?.totalHorses ?? horses.length);
  const registeredHorses = safeNumber(dashboard?.registeredHorses ?? horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length);
  const participatedHorses = safeNumber(dashboard?.participatedHorses ?? horses.filter((horse) => horse.participated).length);
  const totalRegistrations = safeNumber(dashboard?.totalRegistrations ?? 0);
  const statusCounts = getHorseStatusCounts(horses);
  const activeHorses = safeNumber(statusCounts.ACTIVE);
  const pendingHorses = safeNumber(statusCounts.PENDING);
  const readyForRegistration = horses.filter((horse) => String(horse?.status || '').toUpperCase() === 'ACTIVE' && Number(horse.registrationCount || 0) === 0).length;

  return (
    <section className="owner-overview-page">
      <section className="owner-overview-hero-panel">
        <div className="owner-overview-hero-copy">
          <span className="owner-overview-kicker">
            <Sparkles size={15} aria-hidden="true" />
            {t('ownerOverviewSpace')}
          </span>
          <h2>{t('ownerOverviewManageStable')}</h2>
          <p>{t('ownerOverviewHeroDesc')}</p>
        </div>

        <div className="owner-overview-hero-actions" aria-label="Owner quick actions">
          <WorkflowButton
            variant="primary"
            icon={HeartPulse}
            label={t('ownerOverviewManageHorses')}
            description={t('ownerOverviewTotalHorsesDesc')}
            onClick={onGoHorses}
          />
          <WorkflowButton
            icon={ClipboardList}
            label={t('ownerOverviewInvitations')}
            description={t('ownerOverviewRegistrationsDesc')}
            onClick={onGoInvitations}
          />
          <WorkflowButton
            icon={UserRound}
            label={t('ownerOverviewProfile')}
            description={t('ownerDashboardEyebrow')}
            onClick={onGoProfile}
          />
        </div>
      </section>

      <section className="owner-overview-metrics" aria-label="Owner overview metrics">
        <OverviewMetricCard
          icon={HeartPulse}
          label={t('ownerOverviewTotalHorses')}
          value={totalHorses}
          description={t('ownerOverviewTotalHorsesDesc')}
          tone="primary"
        />
        <OverviewMetricCard
          icon={ClipboardList}
          label={t('ownerOverviewRegistrations')}
          value={totalRegistrations}
          description={t('ownerOverviewRegistrationsDesc')}
          tone="accent"
        />
        <OverviewMetricCard
          icon={Flag}
          label={t('ownerOverviewRegisteredHorses')}
          value={registeredHorses}
          description={t('ownerOverviewRegisteredHorsesDesc')}
        />
        <OverviewMetricCard
          icon={Trophy}
          label={t('ownerOverviewParticipated')}
          value={participatedHorses}
          description={t('ownerOverviewParticipatedDesc')}
        />
      </section>

      <section className="owner-overview-operations-grid">
        <article className="owner-overview-readiness-panel">
          <div className="owner-overview-panel-heading">
            <span className="owner-overview-kicker">{t('ownerOverviewQuickStatus')}</span>
            <h3>{t('ownerOverviewHorseReadiness')}</h3>
            <p>{t('ownerOverviewHorseReadinessDesc')}</p>
          </div>

          <div className="owner-overview-readiness-list">
            <ReadinessRow label={t('status_ACTIVE')} value={activeHorses} total={totalHorses} tone="success" />
            <ReadinessRow label={t('ownerOverviewRegisteredHorses')} value={registeredHorses} total={totalHorses} tone="gold" />
            <ReadinessRow label={t('ownerOverviewParticipated')} value={participatedHorses} total={totalHorses} tone="brown" />
          </div>
        </article>

        <article className="owner-overview-next-panel">
          <div className="owner-overview-panel-heading">
            <span className="owner-overview-kicker">
              {language === 'vi' ? 'Vận hành chuồng ngựa' : 'Stable operations'}
            </span>
            <h3>{language === 'vi' ? 'Việc nên xử lý tiếp theo' : 'Recommended next steps'}</h3>
            <p>
              {language === 'vi'
                ? 'Giữ hồ sơ Horse đầy đủ trước khi đăng ký vào Tournament.'
                : 'Keep horse profiles clean before registering into Tournament.'}
            </p>
          </div>

          <div className="owner-overview-next-list">
            <button type="button" onClick={onGoHorses}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>
                <strong>{formatNumber(activeHorses)} active Horse</strong>
                <small>
                  {language === 'vi'
                    ? `${formatNumber(pendingHorses)} đang chờ duyệt, ${formatNumber(readyForRegistration)} sẵn sàng tạo Registration mới.`
                    : `${formatNumber(pendingHorses)} pending review, ${formatNumber(readyForRegistration)} ready for new Registration.`}
                </small>
              </span>
            </button>
            <button type="button" onClick={onGoInvitations}>
              <ClipboardList size={18} aria-hidden="true" />
              <span>
                <strong>{formatNumber(totalRegistrations)} Registration record</strong>
                <small>
                  {language === 'vi'
                    ? 'Theo dõi lời mời, Payment Status và tiến độ đăng ký Tournament.'
                    : 'Review invitations, Payment Status, and Tournament Registration progress.'}
                </small>
              </span>
            </button>
            <button type="button" onClick={onGoProfile}>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>
                <strong>{language === 'vi' ? 'Hồ sơ Owner' : 'Owner identity'}</strong>
                <small>
                  {language === 'vi'
                    ? 'Đảm bảo thông tin liên hệ và hồ sơ luôn sẵn sàng khi Admin kiểm tra.'
                    : 'Keep contact and profile information ready for Admin review.'}
                </small>
              </span>
            </button>
          </div>
        </article>
      </section>
    </section>
  );
}
