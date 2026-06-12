import { useState } from 'react';
import AppShell from '../common/AppShell';
import OwnerOverview from './OwnerOverview';
import OwnerHorseForm from './OwnerHorseForm';
import OwnerHorseTable from './OwnerHorseTable';
import OwnerRegisterRace from './OwnerRegisterRace';
import { useHorses } from '../../hooks/useHorses';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { emptyHorseForm, formatDisplayLabel, getHorseId, getHorseName, toHorsePayload } from '../../lib';
import { validateHorseForm } from '../../utils/validators';
import { getOwnerHorseById } from '../../services/ownerService';

const ownerNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'horses', label: 'Ngựa của tôi', icon: '🐎' },
  { key: 'register', label: 'Đăng ký thi đấu', icon: '📝' }
];

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isOwnerSection(section) {
  return section === 'overview' || section === 'horses' || section === 'register';
}

export default function OwnerDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
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
      breed: horse.breed || '',
      gender: horse.gender || 'MALE',
      color: horse.color || '',
      dayOfBirth: horse.dayOfBirth || '',
      weight: horse.weight ?? '',
      healthCertExpiry: horse.healthCertExpiry || '',
      imgUrl: horse.imgUrl || ''
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
                <strong>{selectedHorse.breed || 'Chưa cập nhật'}</strong>

                <span>Giới tính</span>
                <strong>{formatDisplayLabel(selectedHorse.gender, 'Chưa cập nhật')}</strong>

                <span>Màu lông</span>
                <strong>{selectedHorse.color || 'Chưa cập nhật'}</strong>

                <span>Ngày sinh</span>
                <strong>{selectedHorse.dayOfBirth || 'Chưa cập nhật'}</strong>

                <span>Cân nặng</span>
                <strong>{selectedHorse.weight ? `${selectedHorse.weight} kg` : 'Chưa cập nhật'}</strong>

                <span>Hạn chứng nhận sức khỏe</span>
                <strong>{selectedHorse.healthCertExpiry || 'Chưa cập nhật'}</strong>

                <span>Health Certificate URL</span>
                <strong className="break-anywhere">
                  {selectedHorse.imgUrl ? (
                    <a href={selectedHorse.imgUrl} target="_blank" rel="noreferrer">{selectedHorse.imgUrl}</a>
                  ) : 'Chưa cập nhật'}
                </strong>

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
    </AppShell>
  );
}
