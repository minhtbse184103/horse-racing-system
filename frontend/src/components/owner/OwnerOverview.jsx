import StatCard from '../common/StatCard';

export default function OwnerOverview({ dashboard, horses, onGoHorses, onGoInvitations }) {
  const registeredHorses = horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length;
  const participatedHorses = horses.filter((horse) => horse.participated).length;

  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label="Tổng số ngựa" value={dashboard?.totalHorses ?? horses.length} description="Hồ sơ ngựa bạn đang quản lý" highlight />
        <StatCard label="Đơn đăng ký" value={dashboard?.totalRegistrations ?? 0} description="Tổng số đơn đăng ký thi đấu đã ghi nhận" />
        <StatCard label="Registered Horses" value={dashboard?.registeredHorses ?? registeredHorses} description="Ngựa đã có đăng ký thi đấu" />
        <StatCard label="Participated" value={dashboard?.participatedHorses ?? participatedHorses} description="Ngựa đã tham gia thi đấu" />
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Không gian owner</p>
            <h2>Quản lý chuồng ngựa</h2>
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
              <p className="eyebrow">Trạng thái nhanh</p>
              <h2>Mức độ sẵn sàng của ngựa</h2>
              <p>Dựa trên danh sách ngựa hiện tại.</p>
            </div>
          </div>
          <div className="owner-mini-list">
            <div>
              <span>Đã có đăng ký</span>
              <strong>{registeredHorses}</strong>
            </div>
            <div>
              <span>Đã tham gia</span>
              <strong>{participatedHorses}</strong>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
