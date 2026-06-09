import { useState } from 'react';
import AppShell from '../common/AppShell';
import OwnerOverview from './OwnerOverview';
import OwnerHorseForm from './OwnerHorseForm';
import OwnerHorseTable from './OwnerHorseTable';
import OwnerRegisterRace from './OwnerRegisterRace';
import { useHorses } from '../../hooks/useHorses';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { emptyHorseForm, getHorseId, getHorseName, toHorsePayload } from '../../lib';
import { validateHorseForm } from '../../utils/validators';

const ownerNavItems = [
  { key: 'overview', label: 'Dashboard', icon: '📊' },
  { key: 'horses', label: 'My Horses', icon: '🐎' },
  { key: 'register', label: 'Register Race', icon: '📝' }
];

export default function OwnerDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [formValues, setFormValues] = useState(emptyHorseForm());
  const [formErrors, setFormErrors] = useState({});
  const [editingHorse, setEditingHorse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');

  const { dashboard, dashboardError, isDashboardLoading, loadDashboard } = useOwnerDashboard();
  const { horses, horseError, isHorsesLoading, loadHorses, saveHorse, removeHorse } = useHorses();

  const isLoading = isDashboardLoading || isHorsesLoading;
  const ownerName = dashboard?.ownerName || currentUser?.fullName || currentUser?.email;
  const error = pageError || dashboardError || horseError;

  async function reloadOwnerData() {
    setPageError('');
    try {
      await Promise.all([loadDashboard(), loadHorses()]);
    } catch (err) {
      setPageError(err.message || 'Không thể tải dashboard chủ ngựa.');
    }
  }

  function handleHorseChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    setPageError('');
    setMessage('');
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
      status: horse.status || 'ACTIVE'
    });
    setActiveSection('horses');
    setFormErrors({});
    setMessage('');
    setPageError('');
  }

  function handleCancelHorseEdit() {
    setEditingHorse(null);
    setFormValues(emptyHorseForm());
    setFormErrors({});
    setMessage('');
    setPageError('');
  }

  async function handleHorseSubmit(event) {
    event.preventDefault();

    const errors = validateHorseForm(formValues);
    setFormErrors(errors);
    setPageError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await saveHorse(toHorsePayload(formValues), editingHorse);
      setMessage(editingHorse ? 'Cập nhật hồ sơ ngựa thành công.' : 'Thêm hồ sơ ngựa thành công.');
      setEditingHorse(null);
      setFormValues(emptyHorseForm());
      await reloadOwnerData();
    } catch (err) {
      setPageError(err.message || 'Không thể lưu hồ sơ ngựa. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteHorse(horse) {
    const horseId = getHorseId(horse);
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa hồ sơ ngựa "${getHorseName(horse) || horseId}" không?\nHồ sơ đã có lịch sử tham gia race hoặc kết quả thi đấu sẽ không được xóa.`
    );

    if (!confirmDelete) return;

    setPageError('');
    setMessage('');

    try {
      await removeHorse(horse);
      setMessage('Xóa hồ sơ ngựa thành công.');
      if (editingHorse && getHorseId(editingHorse) === horseId) {
        handleCancelHorseEdit();
      }
      await reloadOwnerData();
    } catch (err) {
      setPageError(err.message || 'Không thể xóa hồ sơ ngựa.');
    }
  }

  return (
    <AppShell
      variant="owner"
      title={`Xin chào, ${ownerName}`}
      subtitle="Quản lý hồ sơ ngựa và theo dõi tình trạng đăng ký thi đấu."
      profileName={ownerName}
      profileRole={currentUser?.role || 'OWNER'}
      activeSection={activeSection}
      navItems={ownerNavItems}
      onNavigate={setActiveSection}
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
        <OwnerOverview dashboard={dashboard} horses={horses} onGoHorses={() => setActiveSection('horses')} />
      )}

      {activeSection === 'horses' && (
        <section className="owner-content-grid">
          <OwnerHorseForm
            formValues={formValues}
            errors={formErrors}
            editingHorse={editingHorse}
            isSaving={isSaving}
            onChange={handleHorseChange}
            onSubmit={handleHorseSubmit}
            onCancelEdit={handleCancelHorseEdit}
          />

          <OwnerHorseTable
            horses={horses}
            isLoading={isHorsesLoading}
            onEditHorse={handleEditHorse}
            onDeleteHorse={handleDeleteHorse}
          />
        </section>
      )}

      {activeSection === 'register' && <OwnerRegisterRace onBackToHorses={() => setActiveSection('horses')} />}
    </AppShell>
  );
}
