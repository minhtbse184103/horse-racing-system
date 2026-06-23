import { useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel, formatNumber, getHorseId, getHorseName } from '../../lib';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'REJECTED'];

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
          <h2>Ngua cua toi</h2>
          <p>Quan ly ho so ngua, chung nhan suc khoe va trang thai phe duyet.</p>
        </div>
        <span className="owner-count-pill">
          {formatNumber(filteredHorses.length)} / {formatNumber(horses.length)} horses
        </span>
      </div>

      <div className="owner-filter-bar">
        <input
          className="input"
          type="search"
          placeholder="Tim theo ten ngua..."
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
        <p className="table-empty">Dang tai danh sach ngua...</p>
      ) : horses.length === 0 ? (
        <div className="owner-empty-state">
          <div>Horse</div>
          <h3>Chua co ngua</h3>
          <p>Nhan Them ngua moi de tao ho so ngua dau tien.</p>
        </div>
      ) : filteredHorses.length === 0 ? (
        <p className="table-empty">Khong co ngua phu hop voi bo loc hien tai.</p>
      ) : (
        <div className="horse-card-list">
          {filteredHorses.map((horse) => {
            const horseId = getHorseId(horse);
            const horseName = getHorseName(horse) || 'N/A';
            const status = String(horse.status || 'N/A').toLowerCase();

            return (
              <article className="horse-card" key={horseId || horseName}>
                <div className="horse-info">
                  <div className="horse-title-row">
                    <h3>{horseName}</h3>
                    <span className={`status-badge ${status}`}>{formatDisplayLabel(horse.status)}</span>
                  </div>
                  <div className="horse-meta-grid">
                    <span>Breeding</span>
                    <strong>{horse.breeding || 'Chua cap nhat'}</strong>
                    <span>Sex</span>
                    <strong>{formatDisplayLabel(horse.sex, 'Chua cap nhat')}</strong>
                    <span>Colour</span>
                    <strong>{horse.colour || 'Chua cap nhat'}</strong>
                    <span>Age</span>
                    <strong>{horse.age || 'Chua cap nhat'}</strong>
                    <span>Weight</span>
                    <strong>{horse.weight ? `${horse.weight} kg` : 'Chua cap nhat'}</strong>
                    <span>Trainer</span>
                    <strong>{horse.trainer || 'Chua cap nhat'}</strong>
                    <span>Health Cert Expiry</span>
                    <strong>{formatDate(horse.healthCertificateExpiryDate || horse.healthCertExpiry)}</strong>
                    <span>Ngay tao</span>
                    <strong>{formatDate(horse.createdAt || horse.submittedAt)}</strong>
                    <span>Don dang ky</span>
                    <strong>{formatNumber(horse.registrationCount)}</strong>
                  </div>
                  <div className="horse-flags">
                    <span className={horse.participated ? 'flag-badge success' : 'flag-badge'}>
                      {horse.participated ? 'Da thi dau' : 'Chua thi dau'}
                    </span>
                    {horse.status === 'PENDING' && <span className="flag-badge">Dang cho admin phe duyet</span>}
                    {horse.rejectionReason && <span className="flag-badge danger">Da tu choi: {horse.rejectionReason}</span>}
                  </div>
                </div>
                <div className="horse-actions">
                  <button type="button" onClick={() => onViewHorse(horse)}>Xem</button>
                  <button type="button" onClick={() => onEditHorse(horse)}>Chinh sua</button>
                  <button
                    className="danger-action"
                    type="button"
                    onClick={() => onDeleteHorse(horse)}
                    disabled={horse.participated}
                    title={horse.participated ? 'Khong the xoa ho so da co lich su thi dau.' : 'Xoa ho so ngua'}
                  >
                    Xoa
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
