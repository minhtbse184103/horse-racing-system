import { useState } from 'react';
import { BarChart3, Flag, HeartPulse, ReceiptText, RefreshCw, ScrollText, UserRound } from 'lucide-react';
import AppShell from '../common/AppShell';
import OwnerOverview from './OwnerOverview';
import OwnerHorseForm from './OwnerHorseForm';
import OwnerHorseTable from './OwnerHorseTable';
import OwnerRegisterRace from './OwnerRegisterRace';
import OwnerRaces from './OwnerRaces';
import OwnerMoneyTransactions from './OwnerMoneyTransactions';
import OwnerProfile from './OwnerProfile';
import { useHorses } from '../../hooks/useHorses';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { emptyHorseForm, formatDisplayLabel, getHorseId, getHorseName, getUserRole, toHorsePayload } from '../../lib';
import { validateHorseForm } from '../../utils/validators';
import { getOwnerHorseById } from '../../services/ownerService';
import OwnerPendingDashboard from './OwnerPendingDashboard';
import { useLanguage } from '../../context/LanguageContext';

const ownerNavItems = [
  { key: 'overview', labelKey: 'ownerNavOverview', icon: BarChart3 },
  { key: 'horses', labelKey: 'ownerNavHorses', icon: HeartPulse },
  { key: 'register', labelKey: 'ownerNavRegister', icon: ScrollText },
  { key: 'races', labelKey: 'ownerNavRaces', icon: Flag },
  { key: 'transactions', labelKey: 'ownerNavTransactions', icon: ReceiptText },
  { key: 'profile', labelKey: 'ownerNavProfile', icon: UserRound }
];

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function calculateRate(part, total) {
  const totalValue = Number(total);
  if (!totalValue) return null;
  return (Number(part || 0) / totalValue) * 100;
}

function formatPercent(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function getHorsePerformance(horse) {
  const performance = horse?.performance || {};
  const totalRaces = Number(performance.totalRaces || 0);
  const top1 = Number(performance.top1Count || 0);
  const top2 = Number(performance.top2Count || 0);
  const top3 = Number(performance.top3Count || 0);
  const podium = top1 + top2 + top3;

  return {
    totalRaces,
    top1,
    top2,
    top3,
    winRate: calculateRate(top1, totalRaces),
    top3Rate: calculateRate(podium, totalRaces),
    violationCount: Number(performance.violationCount || 0),
    disqualifiedCount: Number(performance.disqualifiedCount || 0)
  };
}

function isOwnerSection(section) {
  return section === 'overview'
    || section === 'horses'
    || section === 'register'
    || section === 'races'
    || section === 'transactions'
    || section === 'profile';
}

function hasRegistrationPaymentReturn(params) {
  if (!params.has('vnp_TxnRef') && !params.has('vnp_SecureHash')) return false;
  if (String(params.get('vnp_TxnRef') || '').toUpperCase().startsWith('REG-')) return true;
  try {
    return window.localStorage.getItem('owner_registration_payment_pending') === 'true';
  } catch {
    return false;
  }
}

function readImageFile(file, t) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(t('ownerHorseReadFileError')));
    reader.readAsDataURL(file);
  });
}

function countHorseImages(values) {
  return values.horseCertificateImages?.length || 0;
}

function isAllowedHorseFile(fieldName, file) {
  const extension = String(file.name || '').split('.').pop()?.toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const isJpgOrPng = type === 'image/jpeg' || type === 'image/png' || extension === 'jpg' || extension === 'jpeg' || extension === 'png';
  const isPdf = type === 'application/pdf' || extension === 'pdf';

  return isJpgOrPng || isPdf;
}

function isPreviewableHorseImage(file) {
  const source = file?.dataUrl || file?.url || '';
  return String(file?.type || '').startsWith('image/') || String(source).startsWith('data:image/') || /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(String(source));
}

function getHorseDocumentUrl(file) {
  return String(file?.dataUrl || file?.url || '').trim();
}

export default function OwnerDashboard(props) {
  if (getUserRole(props.currentUser) !== 'OWNER') {
    return <OwnerPendingDashboard {...props} />;
  }

  return <ApprovedOwnerDashboard {...props} />;
}

function ApprovedOwnerDashboard({ currentUser, onLogout, onUserUpdated }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (hasRegistrationPaymentReturn(params)) return 'register';
    const section = params.get('section');
    return isOwnerSection(section) ? section : 'overview';
  });
  const [isHorseFormOpen, setIsHorseFormOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyHorseForm());
  const [formErrors, setFormErrors] = useState({});
  const [editingHorse, setEditingHorse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [horseFormError, setHorseFormError] = useState('');
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [isLoadingHorseDetail, setIsLoadingHorseDetail] = useState(false);
  const [horseDetailError, setHorseDetailError] = useState('');

  const { dashboard, dashboardError, isDashboardLoading, loadDashboard } = useOwnerDashboard();
  const { horses, horseError, isHorsesLoading, loadHorses, saveHorse, removeHorse } = useHorses();

  const isLoading = isDashboardLoading || isHorsesLoading;
  const ownerName = dashboard?.ownerName || currentUser?.fullName || currentUser?.email || 'Owner';
  const error = pageError || dashboardError || horseError;

  async function reloadOwnerData() {
    setPageError('');

    try {
      await Promise.all([loadDashboard(), loadHorses()]);
    } catch (err) {
      setPageError(getErrorText(err, t('ownerDashboardLoadError')));
    }
  }

  function handleNavigate(section) {
    if (isOwnerSection(section)) {
      setActiveSection(section);
    }
  }

  function handleStartCreateHorse() {
    setActiveSection('horses');
    setEditingHorse(null);
    setFormValues(emptyHorseForm());
    setFormErrors({});
    setPageError('');
    setHorseFormError('');
    setMessage('');
    setIsHorseFormOpen(true);
  }

  function handleHorseChange(event) {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: ''
    }));

    setHorseFormError('');
    setPageError('');
    setMessage('');
  }

  function handleViewHorse(horse) {
    const horseId = getHorseId(horse);

    if (!horseId) {
      setPageError('Không tìm thấy ID ngựa.');
      return;
    }

    const detailUrl = `/owner/horses/${encodeURIComponent(
      horseId
    )}/detail`;

    window.location.assign(detailUrl);
  }

  function handleEditHorse(horse) {
    setEditingHorse(horse);

    setFormValues({
      horseName: getHorseName(horse),
      dayOfBirth: horse.dayOfBirth || horse.horseDateOfBirth || '',
      weight: horse.weight ?? '',
      colour: horse.colour || '',
      sex: horse.sex || 'MALE',
      breeding: horse.breeding || '',
      trainer: horse.trainer || '',
      healthCertificateExpiryDate: horse.healthCertificateExpiryDate || '',
      officialHorseProfileUrl: horse.officialHorseProfileUrl || '',
      horseCertificateImages: Array.isArray(horse.horseCertificateImages) ? horse.horseCertificateImages : []
    });

    setActiveSection('horses');
    setIsHorseFormOpen(true);
    setFormErrors({});
    setMessage('');
    setHorseFormError('');
    setPageError('');
  }

  function handleCancelHorseEdit() {
    setEditingHorse(null);
    setIsHorseFormOpen(false);
    setFormValues(emptyHorseForm());
    setFormErrors({});
    setMessage('');
    setHorseFormError('');
    setPageError('');
    setSelectedHorse(null);
    setHorseDetailError('');
  }


  async function handleHorseFilesChange(fieldName, event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    setHorseFormError('');
    setPageError('');
    setMessage('');

    const invalidFile = files.find((file) => !isAllowedHorseFile(fieldName, file));
    if (invalidFile) {
      setFormErrors((current) => ({
        ...current,
        [fieldName]: t('ownerHorseInvalidFile')
      }));
      return;
    }

    if (files.length > 1) {
      setFormErrors((current) => ({
        ...current,
        [fieldName]: t('ownerHorseSingleFileOnly')
      }));
      return;
    }

    try {
      const images = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await readImageFile(file, t);
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
            file
          };
        })
      );

      setFormValues((current) => ({
        ...current,
        [fieldName]: images
      }));

      setFormErrors((current) => ({
        ...current,
        [fieldName]: '',
        totalImages: ''
      }));
    } catch (err) {
      setFormErrors((current) => ({
        ...current,
        [fieldName]: getErrorText(err, t('ownerHorseReadFileError'))
      }));
    }
  }

  function handleRemoveHorseImage(fieldName, imageIndex) {
    setFormValues((current) => ({
      ...current,
      [fieldName]: (current[fieldName] || []).filter((_, index) => index !== imageIndex)
    }));

    setFormErrors((current) => ({
      ...current,
      [fieldName]: '',
      totalImages: ''
    }));

    setHorseFormError('');
  }

  async function handleHorseSubmit(event) {
    event.preventDefault();

    const errors = validateHorseForm(formValues);
    setFormErrors(errors);
    setPageError('');
    setHorseFormError('');
    setMessage('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      await saveHorse(toHorsePayload(formValues), editingHorse);

      setMessage(
        editingHorse
          ? t('ownerHorseSaveSuccessUpdate')
          : t('ownerHorseSaveSuccessCreate')
      );

      setEditingHorse(null);
      setFormValues(emptyHorseForm());
      setIsHorseFormOpen(false);
      setSelectedHorse(null);

      await reloadOwnerData();
    } catch (err) {
      setHorseFormError(getErrorText(err, t('ownerHorseSaveError')));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteHorse(horse) {
    const horseId = getHorseId(horse);
    const horseName = getHorseName(horse) || String(horseId || 'Horse');

    const confirmDelete = window.confirm(
      t('ownerHorseDeleteConfirm', { name: horseName })
    );

    if (!confirmDelete) {
      return;
    }

    setPageError('');
    setHorseFormError('');
    setMessage('');

    try {
      await removeHorse(horse);
      setMessage(t('ownerHorseDeleteSuccess'));

      if (editingHorse && getHorseId(editingHorse) === horseId) {
        handleCancelHorseEdit();
      }

      if (selectedHorse && getHorseId(selectedHorse) === horseId) {
        setSelectedHorse(null);
      }

      await reloadOwnerData();
    } catch (err) {
      setPageError(getErrorText(err, t('ownerHorseDeleteError')));
    }
  }

  return (
    <AppShell
      variant="owner"
      title={t('ownerDashboardTitle', { name: ownerName })}
      subtitle={t('ownerDashboardSubtitle')}
      profileName={ownerName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'OWNER')}
      activeSection={activeSection}
      navItems={ownerNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={
        <button className="refresh-button" type="button" onClick={reloadOwnerData} disabled={isLoading}>
          <RefreshCw size={15} aria-hidden="true" />
          {isLoading ? `${t('loading')}...` : t('refresh')}
        </button>
      }
    >
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      {activeSection === 'overview' && (
        <OwnerOverview
          dashboard={dashboard}
          horses={horses}
          onGoHorses={() => setActiveSection('horses')}
          onGoInvitations={() => setActiveSection('register')}
          onGoProfile={() => setActiveSection('profile')}
        />
      )}

      {activeSection === 'horses' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
            <div>
              <p className="eyebrow">{t('ownerHorseSectionEyebrow')}</p>
              <h2>{t('ownerHorseSectionTitle')}</h2>
            </div>
            <button className="primary-button compact-button" type="button" onClick={handleStartCreateHorse}>
              + {t('ownerHorseAddNew')}
            </button>
          </div>

          {isHorseFormOpen && (
            <OwnerHorseForm
              formValues={formValues}
              errors={formErrors}
              submitError={horseFormError}
              editingHorse={editingHorse}
              isSaving={isSaving}
              onChange={handleHorseChange}
              onSubmit={handleHorseSubmit}
              onCancelEdit={handleCancelHorseEdit}
              onFilesChange={handleHorseFilesChange}
              onRemoveImage={handleRemoveHorseImage}
            />
          )}

          {horseDetailError && <div className="admin-alert error" role="alert">{horseDetailError}</div>}

          {selectedHorse && (
            <section className="owner-panel horse-detail-panel">
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">{t('ownerHorseDetailEyebrow')}</p>
                  <h2>{getHorseName(selectedHorse) || t('ownerHorseDetailEyebrow')}</h2>
                  <p>{isLoadingHorseDetail ? t('ownerHorseDetailLoading') : t('ownerHorseDetailLoaded')}</p>
                </div>
                <button className="outline-button compact-button" type="button" onClick={() => setSelectedHorse(null)}>
                  {t('close')}
                </button>
              </div>

              {(() => {
                const performance = getHorsePerformance(selectedHorse);
                return (
                  <div className="detail-grid">
                    <span>{t('ownerRacePerformanceSummary')}</span>
                    <strong>{t('ownerRaceTotalRace')}: {performance.totalRaces}</strong>

                    <span>{t('ownerRaceWins')}</span>
                    <strong>{performance.top1}</strong>

                    <span>Top 1 / 2 / 3</span>
                    <strong>{performance.top1} / {performance.top2} / {performance.top3}</strong>

                    <span>{t('ownerRaceWinRate')}</span>
                    <strong>{formatPercent(performance.winRate, t('ownerRaceNoData'))}</strong>

                    <span>{t('ownerRaceTop3Rate')}</span>
                    <strong>{formatPercent(performance.top3Rate, t('ownerRaceNoData'))}</strong>

                    <span>{t('ownerRaceViolation')}</span>
                    <strong>{performance.violationCount} / DQ {performance.disqualifiedCount}</strong>
                  </div>
                );
              })()}

              <div className="detail-grid">
                <span>ID</span>
                <strong>{getHorseId(selectedHorse) || 'N/A'}</strong>

                <span>{t('ownerHorseBreeding')}</span>
                <strong>{selectedHorse.breeding || t('notUpdated')}</strong>

                <span>{t('ownerHorseSex')}</span>
                <strong>
                  {selectedHorse.sex === 'MALE'
                    ? t('ownerHorseSexMale')
                    : selectedHorse.sex === 'FEMALE'
                      ? t('ownerHorseSexFemale')
                      : formatDisplayLabel(selectedHorse.sex, t('notUpdated'))}
                </strong>

                <span>{t('ownerHorseColour')}</span>
                <strong>{selectedHorse.colour || t('notUpdated')}</strong>

                <span>{t('ownerHorseAge')}</span>
                <strong>{selectedHorse.age || t('notUpdated')}</strong>

                <span>{t('ownerHorseDayOfBirth')}</span>
                <strong>{selectedHorse.dayOfBirth || t('notUpdated')}</strong>

                <span>{t('ownerHorseWeight')}</span>
                <strong>{selectedHorse.weight ? `${selectedHorse.weight} kg` : t('notUpdated')}</strong>

                <span>{t('ownerHorseTrainer')}</span>
                <strong>{selectedHorse.trainer || t('notUpdated')}</strong>

                <span>{t('ownerHorseOfficialProfileUrl')}</span>
                <strong>{selectedHorse.officialHorseProfileUrl || t('notUpdated')}</strong>

                {selectedHorse.officialHorseProfileUrl && (
                  <>
                    <span>{t('ownerHorseOfficialWebsite')}</span>
                    <strong>
                      <a
                        className="table-button"
                        href={selectedHorse.officialHorseProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('ownerHorseOpenWebsite')}
                      </a>
                    </strong>
                  </>
                )}

                <span>{t('ownerHorseHealthExpiry')}</span>
                <strong>{selectedHorse.healthCertificateExpiryDate || t('notUpdated')}</strong>

                <span>{t('status')}</span>
                <strong>
                  <span className={`status-badge ${String(selectedHorse.status || '').toLowerCase()}`}>
                    {selectedHorse.status ? t(`status_${String(selectedHorse.status).toUpperCase()}`) : t('notUpdated')}
                  </span>
                </strong>

                <span>{t('ownerHorseRegistrationCount')}</span>
                <strong>{selectedHorse.registrationCount ?? 0}</strong>

                <span>{t('ownerHorseParticipated')}</span>
                <strong>{selectedHorse.participated ? t('ownerHorseYes') : t('ownerHorseNo')}</strong>

                {selectedHorse.rejectionReason && (
                  <>
                    <span>{t('ownerHorseRejectedReason')}</span>
                    <strong>{selectedHorse.rejectionReason}</strong>
                  </>
                )}
              </div>

              <div className="horse-detail-document-grid">
                {[
                  [t('ownerHorseHealthCertificate'), selectedHorse.horseCertificateImages],
                ].map(([label, images]) => (
                  <div className="horse-detail-document-card" key={label}>
                    <h3>{label}</h3>
                    {Array.isArray(images) && images.length > 0 ? (
                      <div className="horse-detail-image-list">
                        {images.map((image, index) => {
                          const documentUrl = getHorseDocumentUrl(image);
                          const documentName = image.name || `${label} ${index + 1}`;

                          return (
                            <article className="horse-detail-document-item" key={`${label}-${documentName}-${index}`}>
                              {isPreviewableHorseImage(image) && documentUrl ? (
                                <a href={documentUrl} target="_blank" rel="noreferrer" title={t('ownerHorseOpenImage')}>
                                  <img
                                    src={documentUrl}
                                    alt={`${label} ${index + 1}`}
                                  />
                                </a>
                              ) : (
                                <div className="horse-upload-empty">PDF</div>
                              )}
                              <div>
                                <strong>{documentName}</strong>
                                {documentUrl ? (
                                  <a className="table-button" href={documentUrl} target="_blank" rel="noreferrer">
                                    {t('ownerHorseViewFile')}
                                  </a>
                                ) : (
                                  <p>{t('ownerHorseMissingFileUrl')}</p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p>{t('ownerHorseNoFile')}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <OwnerHorseTable
            horses={horses}
            isLoading={isHorsesLoading}
            onViewHorse={handleViewHorse}
            onEditHorse={handleEditHorse}
            onDeleteHorse={handleDeleteHorse}
          />
        </section>
      )}

      {activeSection === 'register' && (
        <OwnerRegisterRace
          horses={horses}
          onBackToHorses={() => setActiveSection('horses')}
          onViewTransactions={() => setActiveSection('transactions')}
        />
      )}

      {activeSection === 'races' && (
        <OwnerRaces currentUser={currentUser} />
      )}

      {activeSection === 'transactions' && (
        <OwnerMoneyTransactions />
      )}

      {activeSection === 'profile' && (
        <OwnerProfile
          user={currentUser}
          onUserUpdated={onUserUpdated}
        />
      )}
    </AppShell>
  );
}
