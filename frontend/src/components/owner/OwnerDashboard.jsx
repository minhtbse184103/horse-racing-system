import { useState } from 'react';
import { Wallet } from 'lucide-react';
import AppShell from '../common/AppShell';
import OwnerOverview from './OwnerOverview';
import OwnerHorseForm from './OwnerHorseForm';
import OwnerHorseTable from './OwnerHorseTable';
import OwnerRegisterRace from './OwnerRegisterRace';
import OwnerProfile from './OwnerProfile';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import { useHorses } from '../../hooks/useHorses';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { emptyHorseForm, formatDisplayLabel, getHorseId, getHorseName, toHorsePayload } from '../../lib';
import { validateHorseForm } from '../../utils/validators';
import { getOwnerHorseById } from '../../services/ownerService';

const ownerNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'horses', label: 'Ngựa của tôi', icon: '🐎' },
  { key: 'register', label: 'Đăng ký thi đấu', icon: '📝' },
  { key: 'profile', label: 'Profile', icon: '👤' }
  ,
  { key: 'wallet', labelKey: 'wallet', icon: Wallet },
];

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isOwnerSection(section) {
  return section === 'overview' || section === 'horses' || section === 'register' || section === 'wallet' || section === 'profile';
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Khong the doc file.'));
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

export default function OwnerDashboard({ currentUser, onLogout, onUserUpdated }) {
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
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
      setPageError(getErrorText(err, 'Không thể tải bảng điều khiển owner.'));
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

  async function handleViewHorse(horse) {
    const horseId = getHorseId(horse);

    if (!horseId) {
      setHorseDetailError('Không tìm thấy mã ngựa.');
      return;
    }

    setIsLoadingHorseDetail(true);
    setHorseDetailError('');
    setSelectedHorse(horse);
    setPageError('');
    setHorseFormError('');

    try {
      const detail = await getOwnerHorseById(horseId);
      setSelectedHorse(detail);
    } catch (err) {
      setHorseDetailError(getErrorText(err, 'Không thể tải chi tiết ngựa.'));
    } finally {
      setIsLoadingHorseDetail(false);
    }
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
        [fieldName]: 'File chi ho tro PDF, JPG hoac PNG.'
      }));
      return;
    }

    if (files.length > 1) {
      setFormErrors((current) => ({
        ...current,
        [fieldName]: 'Upload one Health Certificate file only.'
      }));
      return;
    }

    try {
      const images = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await readImageFile(file);
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
        [fieldName]: getErrorText(err, 'Khong the doc file.')
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
          ? 'Đã cập nhật hồ sơ ngựa và gửi ở trạng thái PENDING để admin phê duyệt.'
          : 'Đã gửi hồ sơ ngựa ở trạng thái PENDING để admin phê duyệt.'
      );

      setEditingHorse(null);
      setFormValues(emptyHorseForm());
      setIsHorseFormOpen(false);
      setSelectedHorse(null);

      await reloadOwnerData();
    } catch (err) {
      setHorseFormError(getErrorText(err, 'Không thể lưu hồ sơ ngựa. Vui lòng kiểm tra thông tin và thử lại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteHorse(horse) {
    const horseId = getHorseId(horse);
    const horseName = getHorseName(horse) || String(horseId || 'ngựa này');

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the horse profile "${horseName}"?\nProfiles with race history or race results cannot be deleted.`
    );

    if (!confirmDelete) {
      return;
    }

    setPageError('');
    setHorseFormError('');
    setMessage('');

    try {
      await removeHorse(horse);
      setMessage('Đã xóa hồ sơ ngựa thành công.');

      if (editingHorse && getHorseId(editingHorse) === horseId) {
        handleCancelHorseEdit();
      }

      if (selectedHorse && getHorseId(selectedHorse) === horseId) {
        setSelectedHorse(null);
      }

      await reloadOwnerData();
    } catch (err) {
      setPageError(getErrorText(err, 'Không thể xóa hồ sơ ngựa.'));
    }
  }

  return (
    <AppShell
      variant="owner"
      title={`Xin chào, ${ownerName}`}
      subtitle="Quản lý hồ sơ ngựa và theo dõi trạng thái đăng ký thi đấu."
      profileName={ownerName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'OWNER')}
      activeSection={activeSection}
      navItems={ownerNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={
        <button className="refresh-button" type="button" onClick={reloadOwnerData} disabled={isLoading}>
          {isLoading ? 'Đang tải...' : 'Làm mới'}
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
              <p className="eyebrow">Hồ sơ ngựa</p>
              <h2>Quản lý ngựa của tôi</h2>
            </div>
            <button className="primary-button compact-button" type="button" onClick={handleStartCreateHorse}>
              + Add New Horse
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
                  <p className="eyebrow">Chi tiết ngựa</p>
                  <h2>{getHorseName(selectedHorse) || 'Chi tiết ngựa'}</h2>
                  <p>{isLoadingHorseDetail ? 'Đang tải chi tiết mới nhất...' : 'Đã tải chi tiết hồ sơ ngựa.'}</p>
                </div>
                <button className="outline-button compact-button" type="button" onClick={() => setSelectedHorse(null)}>
                  Đóng
                </button>
              </div>

              <div className="detail-grid">
                <span>ID</span>
                <strong>{getHorseId(selectedHorse) || 'N/A'}</strong>

                <span>Giống ngựa</span>
                <strong>{selectedHorse.breeding || 'Chưa cập nhật'}</strong>

                <span>Giới tính</span>
                <strong>{formatDisplayLabel(selectedHorse.sex, 'Chưa cập nhật')}</strong>

                <span>Màu lông</span>
                <strong>{selectedHorse.colour || 'Chưa cập nhật'}</strong>

                <span>Age</span>
                <strong>{selectedHorse.age || 'Chưa cập nhật'}</strong>

                <span>Day of Birth</span>
                <strong>{selectedHorse.dayOfBirth || 'Chua cap nhat'}</strong>

                <span>Weight</span>
                <strong>{selectedHorse.weight ? `${selectedHorse.weight} kg` : 'Chua cap nhat'}</strong>

                <span>Trainer</span>
                <strong>{selectedHorse.trainer || 'Chua cap nhat'}</strong>

                <span>Official Horse Profile URL</span>
                <strong>{selectedHorse.officialHorseProfileUrl || 'Chưa cập nhật'}</strong>

                {selectedHorse.officialHorseProfileUrl && (
                  <>
                    <span>Official Website</span>
                    <strong>
                      <a
                        className="table-button"
                        href={selectedHorse.officialHorseProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở website
                      </a>
                    </strong>
                  </>
                )}

                <span>Health Certificate Expiry Date</span>
                <strong>{selectedHorse.healthCertificateExpiryDate || 'Chưa cập nhật'}</strong>

                <span>Trạng thái</span>
                <strong>
                  <span className={`status-badge ${String(selectedHorse.status || '').toLowerCase()}`}>
                    {formatDisplayLabel(selectedHorse.status)}
                  </span>
                </strong>

                <span>Đăng ký</span>
                <strong>{selectedHorse.registrationCount ?? 0}</strong>

                <span>Đã thi đấu</span>
                <strong>{selectedHorse.participated ? 'Có' : 'Không'}</strong>

                {selectedHorse.rejectionReason && (
                  <>
                    <span>Lý do từ chối</span>
                    <strong>{selectedHorse.rejectionReason}</strong>
                  </>
                )}
              </div>

              <div className="horse-detail-document-grid">
                {[
                  ['Health Certificate', selectedHorse.horseCertificateImages],
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
                                <a href={documentUrl} target="_blank" rel="noreferrer" title="Mở ảnh trong tab mới">
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
                                    Xem file
                                  </a>
                                ) : (
                                  <p>Không tìm thấy đường dẫn file.</p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p>Chưa import file.</p>
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
        <OwnerRegisterRace horses={horses} onBackToHorses={() => setActiveSection('horses')} />
      )}

      {activeSection === 'profile' && (
        <OwnerProfile
          user={currentUser}
          onUserUpdated={onUserUpdated}
        />
      )}

      {activeSection === 'wallet' && (
        <WalletTransferPanel currentUser={currentUser} role="OWNER" />
      )}
    </AppShell>
  );
}
