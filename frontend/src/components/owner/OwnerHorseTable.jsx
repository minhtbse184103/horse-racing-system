import { useMemo, useState } from 'react';
import defaultHorseImage from '../../assets/default-horse.svg';
import { formatDate, formatDisplayLabel, formatNumber, getHorseId, getHorseName } from '../../lib';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'];

function getDisplayImage(horse) {
  const firstImportedImage = Array.isArray(horse?.horseImages)
    ? horse.horseImages.find((image) => image?.dataUrl || image?.url)
    : null;
  const importedValue = firstImportedImage?.dataUrl || firstImportedImage?.url || '';
  const fallbackValue = String(horse?.imgUrl || '').trim();

  if (importedValue) return importedValue;
  return /^https?:\/\/.+/i.test(fallbackValue) || fallbackValue.startsWith('data:image/') ? fallbackValue : defaultHorseImage;
}

export default function OwnerHorseTable({ horses, isLoading, onViewHorse, onEditHorse, onDeleteHorse }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredHorses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return horses.filter((horse) => {
      const matchesKeyword = !keyword || getHorseName(horse).toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'ALL' || String(horse.status || '').toUpperCase() === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [horses, searchTerm, statusFilter]);

  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <h2>Ngựa của tôi</h2>
          <p>Quản lý hồ sơ ngựa, chứng nhận sức khỏe và trạng thái phê duyệt.</p>
        </div>
        <span className="owner-count-pill">
          {formatNumber(filteredHorses.length)} / {formatNumber(horses.length)} horses
        </span>
      </div>

      <div className="owner-filter-bar">
        <input
          className="input"
          type="search"
          placeholder="Tìm theo tên ngựa..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{formatDisplayLabel(status)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải danh sách ngựa...</p>
      ) : horses.length === 0 ? (
        <div className="owner-empty-state">
          <div>🐎</div>
          <h3>Chưa có ngựa</h3>
          <p>Nhấn “Thêm ngựa mới” để tạo hồ sơ ngựa đầu tiên.</p>
        </div>
      ) : filteredHorses.length === 0 ? (
        <p className="table-empty">Không có ngựa phù hợp với bộ lọc hiện tại.</p>
      ) : (
        <div className="horse-card-list">
          {filteredHorses.map((horse) => {
            const horseId = getHorseId(horse);
            const horseName = getHorseName(horse) || 'N/A';
            const status = String(horse.status || 'N/A').toLowerCase();

            return (
              <article className="horse-card" key={horseId || horseName}>
                <div className="horse-avatar">
                  <img src={getDisplayImage(horse)} alt={horseName} />
                </div>
                <div className="horse-info">
                  <div className="horse-title-row">
                    <h3>{horseName}</h3>
                    <span className={`status-badge ${status}`}>{formatDisplayLabel(horse.status)}</span>
                  </div>
                  <div className="horse-meta-grid">
                    <span>Giống ngựa</span>
                    <strong>{horse.breed || 'Chưa cập nhật'}</strong>
                    <span>Giới tính</span>
                    <strong>{formatDisplayLabel(horse.gender, 'Chưa cập nhật')}</strong>
                    <span>Màu lông</span>
                    <strong>{horse.color || 'Chưa cập nhật'}</strong>
                    <span>Ngày sinh</span>
                    <strong>{formatDate(horse.dayOfBirth)}</strong>
                    <span>Cân nặng</span>
                    <strong>{horse.weight ? `${horse.weight} kg` : 'Chưa cập nhật'}</strong>
                    <span>Passport Number</span>
                    <strong>{horse.passportNumber || 'Chưa cập nhật'}</strong>
                    <span>Ngày tạo</span>
                    <strong>{formatDate(horse.createdAt || horse.submittedAt)}</strong>
                    <span>Đơn đăng ký</span>
                    <strong>{formatNumber(horse.registrationCount)}</strong>
                  </div>
                  <div className="horse-flags">
                    <span className={horse.participated ? 'flag-badge success' : 'flag-badge'}>
                      {horse.participated ? 'Đã thi đấu' : 'Chưa thi đấu'}
                    </span>
                    {horse.status === 'PENDING' && <span className="flag-badge">Đang chờ admin phê duyệt</span>}
                    {horse.rejectionReason && <span className="flag-badge danger">Đã từ chối: {horse.rejectionReason}</span>}
                  </div>
                </div>
                <div className="horse-actions">
                  <button type="button" onClick={() => onViewHorse(horse)}>Xem</button>
                  <button type="button" onClick={() => onEditHorse(horse)}>Chỉnh sửa</button>
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
