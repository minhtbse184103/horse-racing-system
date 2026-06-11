import { useMemo, useState } from 'react';
import defaultHorseImage from '../../assets/default-horse.svg';
import { formatDate, formatNumber, getHorseId, getHorseName } from '../../lib';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'];

function getDisplayImage(src) {
  return src && !/^https?:\/\//i.test(String(src)) ? src : defaultHorseImage;
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
          <h2>My Horses</h2>
          <p>Manage horse profiles, health certificates, and admin approval status.</p>
        </div>
        <span className="owner-count-pill">
          {formatNumber(filteredHorses.length)} / {formatNumber(horses.length)} horses
        </span>
      </div>

      <div className="owner-filter-bar">
        <input
          className="input"
          type="search"
          placeholder="Search by horse name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="table-empty">Loading horses...</p>
      ) : horses.length === 0 ? (
        <div className="owner-empty-state">
          <div>🐎</div>
          <h3>No horses yet</h3>
          <p>Click “Add New Horse” to create your first horse profile.</p>
        </div>
      ) : filteredHorses.length === 0 ? (
        <p className="table-empty">No horses match the current filters.</p>
      ) : (
        <div className="horse-card-list">
          {filteredHorses.map((horse) => {
            const horseId = getHorseId(horse);
            const horseName = getHorseName(horse) || 'N/A';
            const status = String(horse.status || 'N/A').toLowerCase();

            return (
              <article className="horse-card" key={horseId || horseName}>
                <div className="horse-avatar">
                  <img src={getDisplayImage(horse.imgUrl)} alt={horseName} />
                </div>
                <div className="horse-info">
                  <div className="horse-title-row">
                    <h3>{horseName}</h3>
                    <span className={`status-badge ${status}`}>{horse.status || 'N/A'}</span>
                  </div>
                  <div className="horse-meta-grid">
                    <span>Breed</span>
                    <strong>{horse.breed || 'Not updated'}</strong>
                    <span>Gender</span>
                    <strong>{horse.gender || 'Not updated'}</strong>
                    <span>Color</span>
                    <strong>{horse.color || 'Not updated'}</strong>
                    <span>Birth Date</span>
                    <strong>{formatDate(horse.dayOfBirth)}</strong>
                    <span>Weight</span>
                    <strong>{horse.weight ? `${horse.weight} kg` : 'Not updated'}</strong>
                    <span>Health Cert</span>
                    <strong>{formatDate(horse.healthCertExpiry)}</strong>
                    <span>Registrations</span>
                    <strong>{formatNumber(horse.registrationCount)}</strong>
                  </div>
                  <div className="horse-flags">
                    <span className={horse.participated ? 'flag-badge success' : 'flag-badge'}>
                      {horse.participated ? 'Has raced' : 'No races yet'}
                    </span>
                    {horse.status === 'PENDING' && <span className="flag-badge">Waiting for admin approval</span>}
                    {horse.rejectionReason && <span className="flag-badge danger">Rejected: {horse.rejectionReason}</span>}
                  </div>
                </div>
                <div className="horse-actions">
                  <button type="button" onClick={() => onViewHorse(horse)}>View</button>
                  <button type="button" onClick={() => onEditHorse(horse)}>Edit</button>
                  <button
                    className="danger-action"
                    type="button"
                    onClick={() => onDeleteHorse(horse)}
                    disabled={horse.participated}
                    title={horse.participated ? 'Profiles with race history cannot be deleted.' : 'Delete horse profile'}
                  >
                    Delete
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
