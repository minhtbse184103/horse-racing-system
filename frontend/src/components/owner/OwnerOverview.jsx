import StatCard from '../common/StatCard';

export default function OwnerOverview({ dashboard, horses, onGoHorses, onGoInvitations }) {
  const registeredHorses = horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length;
  const participatedHorses = horses.filter((horse) => horse.participated).length;

  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label="Total Horses" value={dashboard?.totalHorses ?? horses.length} description="Horse profiles under your management" highlight />
        <StatCard label="Registrations" value={dashboard?.totalRegistrations ?? 0} description="Total recorded race registrations" />
        <StatCard label="Registered Horses" value={dashboard?.registeredHorses ?? registeredHorses} description="Horses with race registrations" />
        <StatCard label="Participated" value={dashboard?.participatedHorses ?? participatedHorses} description="Horses that have joined races" />
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Owner workspace</p>
            <h2>Manage Your Stable</h2>
            <p>
              Track horse totals, registration status, and race history. New horse profiles are submitted as PENDING until admin approval.
            </p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onGoHorses}>
              Manage Horses
            </button>
            <button className="outline-button owner-hero-action" type="button" onClick={onGoInvitations}>
              Invitations / Registrations
            </button>
          </div>
        </div>

        <div className="owner-panel compact-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Quick status</p>
              <h2>Horse Readiness</h2>
              <p>Based on your current horse list.</p>
            </div>
          </div>
          <div className="owner-mini-list">
            <div>
              <span>With registration</span>
              <strong>{registeredHorses}</strong>
            </div>
            <div>
              <span>Already participated</span>
              <strong>{participatedHorses}</strong>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
