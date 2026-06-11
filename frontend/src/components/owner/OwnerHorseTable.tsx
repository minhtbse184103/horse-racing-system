import { formatDate, formatNumber, getHorseId, getHorseName } from '../../lib';
import type { Horse } from '../../services/ownerService';

interface OwnerHorseTableProps {
  horses: Horse[];
  isLoading: boolean;
  onEditHorse: (horse: Horse) => void;
  onDeleteHorse: (horse: Horse) => void;
}

export default function OwnerHorseTable({ horses, isLoading, onEditHorse, onDeleteHorse }: OwnerHorseTableProps) {
  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <h2>My Horses</h2>
          <p>Quản lý hồ sơ, giấy sức khỏe và trạng thái sẵn sàng thi đấu của từng ngựa.</p>
        </div>
        <span className="owner-count-pill">{formatNumber(horses.length)} ngựa</span>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải danh sách ngựa...</p>
      ) : horses.length === 0 ? (
        <div className="owner-empty-state">
          <div>🐎</div>
          <h3>Chưa có ngựa nào</h3>
          <p>Bấm nút “Thêm ngựa mới” để tạo hồ sơ ngựa đầu tiên.</p>
        </div>
      ) : (
        <div className="horse-card-list">
          {horses.map((horse) => {
            const horseId = getHorseId(horse);
            const horseName = getHorseName(horse) || 'N/A';
            const status = String(horse.status || 'N/A').toLowerCase();

            return (
              <article className="horse-card" key={horseId || horseName}>
                <div className="horse-avatar">
                  {horse.imgUrl ? <img src={horse.imgUrl} alt={horseName} /> : '🐎'}
                </div>
                <div className="horse-info">
                  <div className="horse-title-row">
                    <h3>{horseName}</h3>
                    <span className={`status-badge ${status}`}>{horse.status || 'N/A'}</span>
                  </div>
                  <div className="horse-meta-grid">
                    <span>Breed</span>
                    <strong>{horse.breed || 'Chưa cập nhật'}</strong>
                    <span>Gender</span>
                    <strong>{horse.gender || 'Chưa cập nhật'}</strong>
                    <span>Color</span>
                    <strong>{horse.color || 'Chưa cập nhật'}</strong>
                    <span>Birth Date</span>
                    <strong>{formatDate(horse.dayOfBirth)}</strong>
                    <span>Weight</span>
                    <strong>{horse.weight ? `${horse.weight} kg` : 'Chưa cập nhật'}</strong>
                    <span>Health Cert</span>
                    <strong>{formatDate(horse.healthCertExpiry)}</strong>
                    <span>Registrations</span>
                    <strong>{formatNumber(horse.registrationCount)}</strong>
                  </div>
                  <div className="horse-flags">
                    <span className={horse.participated ? 'flag-badge success' : 'flag-badge'}>
                      {horse.participated ? 'Đã thi đấu' : 'Chưa thi đấu'}
                    </span>
                  </div>
                </div>
                <div className="horse-actions">
                  <button type="button" onClick={() => onEditHorse(horse)}>
                    Sửa
                  </button>
                  <button
                    className="danger-action"
                    type="button"
                    onClick={() => onDeleteHorse(horse)}
                    disabled={horse.participated}
                    title={horse.participated ? 'Không thể xóa hồ sơ đã có lịch sử thi đấu.' : 'Xóa hồ sơ ngựa'}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
