import StatCard from '../common/StatCard';
import { formatNumber } from '../../lib';
import type { Horse, OwnerDashboardData } from '../../types';

interface OwnerOverviewProps {
  dashboard: OwnerDashboardData | null;
  horses: Horse[];
  onGoHorses: () => void;
}

export default function OwnerOverview({ dashboard, horses, onGoHorses }: OwnerOverviewProps) {
  const activeHorses = horses.filter((horse) => String(horse.status || '').toUpperCase() === 'ACTIVE').length;
  const participatedHorses = horses.filter((horse) => horse.participated).length;
  const registeredHorses = horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length;

  return (
    <>
      <section className="owner-stats-grid">
        <StatCard
          label="Total Horses"
          value={dashboard?.totalHorses ?? horses.length}
          description="Số hồ sơ ngựa đang thuộc quyền quản lý"
          highlight
        />
        <StatCard
          label="Registrations"
          value={dashboard?.totalRegistrations ?? 0}
          description="Tổng lượt đăng ký thi đấu đã ghi nhận"
        />
        <StatCard
          label="Registered Horses"
          value={dashboard?.registeredHorses ?? registeredHorses}
          description="Số ngựa đã có đăng ký race"
        />
        <StatCard
          label="Participated"
          value={dashboard?.participatedHorses ?? participatedHorses}
          description="Số ngựa đã tham gia thi đấu"
        />
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Stable Overview</p>
            <h2>Quản lý chuồng ngựa của bạn</h2>
            <p>
              Theo dõi tổng số ngựa, tình trạng đăng ký và lịch sử tham gia thi đấu. Các thông tin này giúp owner chuẩn bị hồ sơ ngựa trước khi đăng ký race.
            </p>
          </div>
          <button className="primary-button owner-hero-action" type="button" onClick={onGoHorses}>
            Quản lý ngựa
          </button>
        </div>

        <div className="owner-panel compact-panel">
          <div className="owner-panel-header">
            <div>
              <h2>Trạng thái nhanh</h2>
              <p>Dựa trên danh sách ngựa hiện tại.</p>
            </div>
          </div>
          <div className="owner-mini-list">
            <div>
              <span>ACTIVE</span>
              <strong>{formatNumber(activeHorses)}</strong>
            </div>
            <div>
              <span>Có registration</span>
              <strong>{formatNumber(registeredHorses)}</strong>
            </div>
            <div>
              <span>Đã tham gia</span>
              <strong>{formatNumber(participatedHorses)}</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
