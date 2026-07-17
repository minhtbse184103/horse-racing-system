import StatCard from '../common/StatCard';
import { useLanguage } from '../../context/LanguageContext';

export default function OwnerOverview({ dashboard, horses, onGoHorses, onGoInvitations, onGoProfile }) {
  const { t } = useLanguage();
  const registeredHorses = horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length;
  const participatedHorses = horses.filter((horse) => horse.participated).length;

  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label={t('ownerOverviewTotalHorses')} value={dashboard?.totalHorses ?? horses.length} description={t('ownerOverviewTotalHorsesDesc')} highlight />
        <StatCard label={t('ownerOverviewRegistrations')} value={dashboard?.totalRegistrations ?? 0} description={t('ownerOverviewRegistrationsDesc')} />
        <StatCard label={t('ownerOverviewRegisteredHorses')} value={dashboard?.registeredHorses ?? registeredHorses} description={t('ownerOverviewRegisteredHorsesDesc')} />
        <StatCard label={t('ownerOverviewParticipated')} value={dashboard?.participatedHorses ?? participatedHorses} description={t('ownerOverviewParticipatedDesc')} />
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">{t('ownerOverviewSpace')}</p>
            <h2>{t('ownerOverviewManageStable')}</h2>
            <p>
              {t('ownerOverviewHeroDesc')}
            </p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onGoHorses}>
              {t('ownerOverviewManageHorses')}
            </button>
            <button className="outline-button owner-hero-action" type="button" onClick={onGoInvitations}>
              {t('ownerOverviewInvitations')}
            </button>
            <button className="outline-button owner-hero-action" type="button" onClick={onGoProfile}>
              {t('ownerOverviewProfile')}
            </button>
          </div>
        </div>

        <div className="owner-panel compact-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">{t('ownerOverviewQuickStatus')}</p>
              <h2>{t('ownerOverviewHorseReadiness')}</h2>
              <p>{t('ownerOverviewHorseReadinessDesc')}</p>
            </div>
          </div>
          <div className="owner-mini-list">
            <div>
              <span>{t('ownerOverviewRegisteredHorses')}</span>
              <strong>{registeredHorses}</strong>
            </div>
            <div>
              <span>{t('ownerOverviewParticipated')}</span>
              <strong>{participatedHorses}</strong>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
