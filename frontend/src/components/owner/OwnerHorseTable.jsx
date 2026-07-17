import { useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel, formatNumber, getHorseId, getHorseName } from '../../lib';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'REJECTED'];

function getOwnerHorseStatusLabel(status, t) {
  if (status === 'ALL') return t('allStatuses');
  return t(`status_${status}`);
}

function getOwnerHorseSexLabel(sex, t) {
  if (sex === 'MALE') return t('ownerHorseSexMale');
  if (sex === 'FEMALE') return t('ownerHorseSexFemale');
  return formatDisplayLabel(sex, t('notUpdated'));
}

export default function OwnerHorseTable({ horses, isLoading, onViewHorse, onEditHorse, onDeleteHorse }) {
  const { t } = useLanguage();
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
    <section className="owner-panel owner-horse-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">{t('ownerHorseSectionEyebrow')}</p>
          <h2>{t('ownerHorseTableTitle')}</h2>
          <p>{t('ownerHorseTableDesc')}</p>
        </div>
        <span className="owner-count-pill">
          {t('ownerHorseCountText', {
            filtered: formatNumber(filteredHorses.length),
            total: formatNumber(horses.length)
          })}
        </span>
      </div>

      <div className="owner-filter-bar">
        <input
          className="input"
          type="search"
          placeholder={t('ownerHorseSearchPlaceholder')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{getOwnerHorseStatusLabel(status, t)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="table-empty">{t('ownerHorseLoading')}</p>
      ) : horses.length === 0 ? (
        <div className="owner-empty-state">
          <div>Horse</div>
          <h3>{t('ownerHorseEmptyTitle')}</h3>
          <p>{t('ownerHorseEmptyDesc')}</p>
        </div>
      ) : filteredHorses.length === 0 ? (
        <p className="table-empty">{t('ownerHorseNoMatch')}</p>
      ) : (
        <div className="horse-card-list">
          {filteredHorses.map((horse) => {
            const horseId = getHorseId(horse);
            const horseName = getHorseName(horse) || 'N/A';
            const statusValue = String(horse.status || '').toUpperCase();
            const status = statusValue.toLowerCase();

            return (
              <article className="horse-card" key={horseId || horseName}>
                <div className="horse-info">
                  <div className="horse-title-row">
                    <div>
                      <p className="horse-card-kicker">{t('ownerHorseCardKicker')} #{horseId || 'N/A'}</p>
                      <h3>{horseName}</h3>
                    </div>
                    <span className={`status-badge ${status || 'unknown'}`}>
                      {statusValue ? t(`status_${statusValue}`) : t('notUpdated')}
                    </span>
                  </div>
                  <div className="horse-meta-grid">
                    <span>{t('ownerHorseBreeding')}</span>
                    <strong>{horse.breeding || t('notUpdated')}</strong>
                    <span>{t('ownerHorseSex')}</span>
                    <strong>{getOwnerHorseSexLabel(horse.sex, t)}</strong>
                    <span>{t('ownerHorseColour')}</span>
                    <strong>{horse.colour || t('notUpdated')}</strong>
                    <span>{t('ownerHorseAge')}</span>
                    <strong>{horse.age || t('notUpdated')}</strong>
                    <span>{t('ownerHorseWeight')}</span>
                    <strong>{horse.weight ? `${horse.weight} kg` : t('notUpdated')}</strong>
                    <span>{t('ownerHorseTrainer')}</span>
                    <strong>{horse.trainer || t('notUpdated')}</strong>
                    <span>{t('ownerHorseHealthCertExpiryShort')}</span>
                    <strong>{formatDate(horse.healthCertificateExpiryDate || horse.healthCertExpiry)}</strong>
                    <span>{t('ownerHorseCreatedAt')}</span>
                    <strong>{formatDate(horse.createdAt || horse.submittedAt)}</strong>
                    <span>{t('ownerHorseRegistrationCount')}</span>
                    <strong>{formatNumber(horse.registrationCount)}</strong>
                  </div>
                  <div className="horse-flags">
                    <span className={horse.participated ? 'flag-badge success' : 'flag-badge'}>
                      {horse.participated ? t('ownerHorseHasRaceHistory') : t('ownerHorseNoRaceHistory')}
                    </span>
                    {horse.status === 'PENDING' && <span className="flag-badge">{t('ownerHorsePendingApproval')}</span>}
                    {horse.rejectionReason && <span className="flag-badge danger">{t('ownerHorseRejectedPrefix')}: {horse.rejectionReason}</span>}
                  </div>
                </div>
                <div className="horse-actions">
                  <button className="table-button" type="button" onClick={() => onViewHorse(horse)}>{t('view')}</button>
                  <button className="table-button" type="button" onClick={() => onEditHorse(horse)}>{t('edit')}</button>
                  <button
                    className="table-button danger-action"
                    type="button"
                    onClick={() => onDeleteHorse(horse)}
                    disabled={horse.participated}
                    title={horse.participated ? t('ownerHorseCannotDeleteHistory') : t('ownerHorseDeleteTitle')}
                  >
                    {t('delete')}
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
