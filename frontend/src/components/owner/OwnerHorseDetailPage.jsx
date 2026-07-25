import { useEffect, useMemo, useState } from 'react';
import {
  formatDisplayLabel,
  formatNumber,
  getHorseId,
  getHorseName
} from '../../lib';
import {
  getOwnerHorseById,
  getOwnerRaces
} from '../../services/ownerService';
import { useLanguage } from '../../context/LanguageContext';

function getErrorText(error, fallback) {
  return error instanceof Error
    ? error.message || fallback
    : fallback;
}

function getHorseSexLabel(sex, t) {
  const normalizedSex = String(sex || '').toUpperCase();

  if (normalizedSex === 'MALE') {
    return t('ownerHorseSexMale');
  }

  if (normalizedSex === 'FEMALE') {
    return t('ownerHorseSexFemale');
  }

  return formatDisplayLabel(sex, t('notUpdated'));
}

function isPreviewableHorseImage(file) {
  const source = String(file?.dataUrl || file?.url || '');

  return (
    String(file?.type || '').startsWith('image/') ||
    source.startsWith('data:image/') ||
    /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(source)
  );
}

function getHorseDocumentUrl(file) {
  return String(file?.dataUrl || file?.url || '').trim();
}

function formatRaceDate(value, language, fallback) {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    language === 'vi' ? 'vi-VN' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

export default function OwnerHorseDetailPage({ horseId }) {
  const { language, t } = useLanguage();

  const [horse, setHorse] = useState(null);
  const [ownerRaces, setOwnerRaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!horseId) {
        setError(
          language === 'vi'
            ? 'Không tìm thấy ID ngựa.'
            : 'Horse ID was not found.'
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        /*
         * getOwnerHorseById:
         * GET /api/owner/horses/{horseId}
         *
         * getOwnerRaces:
         * GET /api/owner/tournament-registrations/my-races
         */
        const [horseDetail, raceList] = await Promise.all([
          getOwnerHorseById(horseId),
          getOwnerRaces()
        ]);

        if (cancelled) return;

        setHorse(horseDetail);
        setOwnerRaces(Array.isArray(raceList) ? raceList : []);
      } catch (requestError) {
        if (cancelled) return;

        setError(
          getErrorText(
            requestError,
            language === 'vi'
              ? 'Không thể tải chi tiết ngựa.'
              : 'Unable to load horse details.'
          )
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [horseId, language]);

  const raceHistory = useMemo(() => {
    return ownerRaces
      .filter(
        (race) =>
          String(race?.horseId) === String(horseId)
      )
      .sort((left, right) => {
        const leftTime = new Date(left?.raceStartTime || 0).getTime();
        const rightTime = new Date(right?.raceStartTime || 0).getTime();

        return rightTime - leftTime;
      });
  }, [ownerRaces, horseId]);

  function handleClose() {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) {
        window.history.back();
      }
    }, 100);
  }

  if (isLoading) {
    return (
      <main className="horse-detail-window">
        <section className="horse-detail-window-state">
          <h1>
            {language === 'vi'
              ? 'Đang tải chi tiết ngựa'
              : 'Loading horse details'}
          </h1>
          <p>{t('loading')}...</p>
        </section>
      </main>
    );
  }

  if (error || !horse) {
    return (
      <main className="horse-detail-window">
        <section className="horse-detail-window-state error">
          <h1>
            {language === 'vi'
              ? 'Không thể tải dữ liệu'
              : 'Unable to load data'}
          </h1>

          <p>
            {error ||
              (language === 'vi'
                ? 'Không tìm thấy ngựa.'
                : 'Horse was not found.')}
          </p>

          <button
            className="outline-button compact-button"
            type="button"
            onClick={handleClose}
          >
            {t('close')}
          </button>
        </section>
      </main>
    );
  }

  const horseDocuments = Array.isArray(
    horse.horseCertificateImages
  )
    ? horse.horseCertificateImages
    : [];

  const statusValue = String(horse.status || '').toUpperCase();

  return (
    <main className="horse-detail-window">
      <section className="horse-detail-window-container">
        <header className="horse-detail-window-header">
          <div>
            <p className="eyebrow">
              {t('ownerHorseDetailEyebrow')}
            </p>

            <h1>
              {getHorseName(horse) ||
                t('ownerHorseDetailEyebrow')}
            </h1>

            <p>{t('ownerHorseDetailLoaded')}</p>
          </div>

          <button
            className="outline-button horse-detail-close-button"
            type="button"
            onClick={handleClose}
          >
            {t('close')}
          </button>
        </header>

        <section className="horse-detail-window-info">
          <DetailItem
            label="ID"
            value={getHorseId(horse) || 'N/A'}
          />

          <DetailItem
            label={t('ownerHorseBreeding')}
            value={horse.breeding || t('notUpdated')}
          />

          <DetailItem
            label={t('ownerHorseSex')}
            value={getHorseSexLabel(horse.sex, t)}
          />

          <DetailItem
            label={t('ownerHorseColour')}
            value={horse.colour || t('notUpdated')}
          />

          <DetailItem
            label={t('ownerHorseAge')}
            value={
              horse.age !== null &&
              horse.age !== undefined
                ? formatNumber(horse.age)
                : t('notUpdated')
            }
          />

          <DetailItem
            label={t('ownerHorseDayOfBirth')}
            value={horse.dayOfBirth || t('notUpdated')}
          />

          <DetailItem
            label={t('ownerHorseWeight')}
            value={
              horse.weight
                ? `${formatNumber(horse.weight)} kg`
                : t('notUpdated')
            }
          />

          <DetailItem
            label={t('ownerHorseTrainer')}
            value={horse.trainer || t('notUpdated')}
          />

          <DetailItem
            label={t('ownerHorseOfficialProfileUrl')}
            value={
              horse.officialHorseProfileUrl ? (
                <a
                  href={horse.officialHorseProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {horse.officialHorseProfileUrl}
                </a>
              ) : (
                t('notUpdated')
              )
            }
          />

          <DetailItem
            label={t('ownerHorseOfficialWebsite')}
            value={
              horse.officialHorseProfileUrl ? (
                <a
                  className="table-button"
                  href={horse.officialHorseProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('ownerHorseOpenWebsite')}
                </a>
              ) : (
                t('notUpdated')
              )
            }
          />

          <DetailItem
            label={t('ownerHorseHealthExpiry')}
            value={
              horse.healthCertificateExpiryDate ||
              t('notUpdated')
            }
          />

          <DetailItem
            label={t('status')}
            value={
              <span
                className={`status-badge ${statusValue.toLowerCase()}`}
              >
                {statusValue
                  ? t(`status_${statusValue}`)
                  : t('notUpdated')}
              </span>
            }
          />

          <DetailItem
            label={t('ownerHorseRegistrationCount')}
            value={formatNumber(
              horse.registrationCount ?? 0
            )}
          />

          <DetailItem
            label={t('ownerHorseParticipated')}
            value={
              horse.participated
                ? t('ownerHorseYes')
                : t('ownerHorseNo')
            }
          />

          {horse.rejectionReason && (
            <DetailItem
              label={t('ownerHorseRejectedReason')}
              value={horse.rejectionReason}
              wide
            />
          )}
        </section>

        <section className="horse-detail-window-section">
          <div className="horse-detail-section-heading">
            <div>
              <p className="eyebrow">
                {t('ownerHorseHealthCertificate')}
              </p>

              <h2>
                {t('ownerHorseHealthCertificate')}
              </h2>
            </div>
          </div>

          {horseDocuments.length === 0 ? (
            <div className="horse-detail-empty">
              {t('ownerHorseNoFile')}
            </div>
          ) : (
            <div className="horse-detail-document-grid">
              {horseDocuments.map((file, index) => {
                const documentUrl =
                  getHorseDocumentUrl(file);

                const documentName =
                  file?.name ||
                  `${t('ownerHorseHealthCertificate')} ${index + 1}`;

                return (
                  <article
                    className="horse-detail-document-card"
                    key={
                      file?.id ||
                      documentUrl ||
                      `${documentName}-${index}`
                    }
                  >
                    {isPreviewableHorseImage(file) &&
                    documentUrl ? (
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={t('ownerHorseOpenImage')}
                      >
                        <img
                          className="horse-detail-certificate-image"
                          src={documentUrl}
                          alt={documentName}
                        />
                      </a>
                    ) : (
                      <div className="horse-detail-pdf-preview">
                        PDF
                      </div>
                    )}

                    <strong>{documentName}</strong>

                    {documentUrl ? (
                      <a
                        className="table-button"
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('ownerHorseViewFile')}
                      </a>
                    ) : (
                      <p>{t('ownerHorseMissingFileUrl')}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="horse-detail-window-section">
          <div className="horse-detail-section-heading">
            <div>
              <p className="eyebrow">
                {language === 'vi'
                  ? 'LỊCH SỬ RACE'
                  : 'RACE HISTORY'}
              </p>

              <h2>
                {language === 'vi'
                  ? 'Lịch sử thi đấu'
                  : 'Race history'}
              </h2>
            </div>

            <span className="owner-count-pill">
              {formatNumber(raceHistory.length)} Race
            </span>
          </div>

          {raceHistory.length === 0 ? (
            <div className="horse-detail-empty">
              {language === 'vi'
                ? 'Ngựa này chưa có lịch sử Race.'
                : 'This horse has no Race history yet.'}
            </div>
          ) : (
            <div className="horse-race-history-table-wrapper">
              <table className="horse-race-history-table">
                <thead>
                  <tr>
                    <th>
                      {language === 'vi'
                        ? 'Tournament'
                        : 'Tournament'}
                    </th>
                    <th>Race</th>
                    <th>
                      {language === 'vi'
                        ? 'Đường đua'
                        : 'Track'}
                    </th>
                    <th>
                      {language === 'vi'
                        ? 'Thời gian'
                        : 'Time'}
                    </th>
                    <th>
                      {language === 'vi'
                        ? 'Chuồng xuất phát'
                        : 'Starting stall'}
                    </th>
                    <th>
                      {language === 'vi'
                        ? 'Trạng thái'
                        : 'Status'}
                    </th>
                    <th>
                      {language === 'vi'
                        ? 'Kết quả'
                        : 'Result'}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {raceHistory.map((race) => (
                    <tr
                      key={
                        race.raceEntryId ||
                        `${race.raceId}-${race.horseId}`
                      }
                    >
                      <td>
                        {race.tournamentName ||
                          t('notUpdated')}
                      </td>

                      <td>
                        {race.raceName ||
                          `Race #${race.raceId}`}
                      </td>

                      <td>
                        {race.trackName ||
                          t('notUpdated')}
                      </td>

                      <td>
                        {formatRaceDate(
                          race.raceStartTime,
                          language,
                          t('notUpdated')
                        )}
                      </td>

                      <td>
                        {race.startingStall ??
                          t('notUpdated')}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${String(
                            race.raceStatus || ''
                          ).toLowerCase()}`}
                        >
                          {formatDisplayLabel(
                            race.raceStatus,
                            t('notUpdated')
                          )}
                        </span>
                      </td>

                      <td>
                        {race.officialResultAvailable
                          ? language === 'vi'
                            ? 'Đã có kết quả'
                            : 'Result available'
                          : language === 'vi'
                            ? 'Chưa có kết quả'
                            : 'No result yet'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div
      className={`horse-detail-window-item${
        wide ? ' wide' : ''
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}