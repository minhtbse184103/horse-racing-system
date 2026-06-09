import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AppShell from '../common/AppShell';
import OwnerOverview from './OwnerOverview';
import OwnerHorseForm from './OwnerHorseForm';
import OwnerHorseTable from './OwnerHorseTable';
import OwnerRegisterRace from './OwnerRegisterRace';
import { useHorses } from '../../hooks/useHorses';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { emptyHorseForm, getHorseId, getHorseName, toHorsePayload } from '../../lib';
import { validateHorseForm } from '../../utils/validators';
import type { AuthUser, FormErrors, Horse, HorseFormValues, NavItem } from '../../types';

const ownerNavItems: NavItem[] = [
  { key: 'overview', label: 'Dashboard', icon: '📊' },
  { key: 'horses', label: 'My Horses', icon: '🐎' },
  { key: 'register', label: 'Register Race', icon: '📝' }
];

type OwnerSection = 'overview' | 'horses' | 'register';

interface OwnerDashboardProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isOwnerSection(section: string): section is OwnerSection {
  return section === 'overview' || section === 'horses' || section === 'register';
}

export default function OwnerDashboard({ currentUser, onLogout }: OwnerDashboardProps) {
  const [activeSection, setActiveSection] = useState<OwnerSection>('overview');
  const [isHorseFormOpen, setIsHorseFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<HorseFormValues>(emptyHorseForm());
  const [formErrors, setFormErrors] = useState<FormErrors<HorseFormValues>>({});
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');

  const { dashboard, dashboardError, isDashboardLoading, loadDashboard } = useOwnerDashboard();
  const { horses, horseError, isHorsesLoading, loadHorses, saveHorse, removeHorse } = useHorses();

  const isLoading = isDashboardLoading || isHorsesLoading;
  const ownerName = dashboard?.ownerName || currentUser?.fullName || currentUser?.email || 'Owner';
  const error = pageError || dashboardError || horseError;

  async function reloadOwnerData(): Promise<void> {
    setPageError('');
    try {
      await Promise.all([loadDashboard(), loadHorses()]);
    } catch (err) {
      setPageError(getErrorText(err, 'Không thể tải dashboard chủ ngựa.'));
    }
  }

  function handleNavigate(section: string): void {
    if (isOwnerSection(section)) setActiveSection(section);
  }

  function handleStartCreateHorse(): void {
    setActiveSection('horses');
    setEditingHorse(null);
    setFormValues(emptyHorseForm());
    setFormErrors({});
    setPageError('');
    setMessage('');
    setIsHorseFormOpen(true);
  }

  function handleHorseChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    setPageError('');
    setMessage('');
  }

  function handleEditHorse(horse: Horse): void {
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
    setIsHorseFormOpen(true);
    setFormErrors({});
    setMessage('');
    setPageError('');
  }

  function handleCancelHorseEdit(): void {
    setEditingHorse(null);
    setIsHorseFormOpen(false);
    setFormValues(emptyHorseForm());
    setFormErrors({});
    setMessage('');
    setPageError('');
  }

  async function handleHorseSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const errors = validateHorseForm(formValues);
    setFormErrors(errors);
    setPageError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await saveHorse(toHorsePayload(formValues), editingHorse);
      setMessage(editingHorse ? 'Cập nhật hồ sơ ngựa thành công.' : 'Thêm ngựa mới thành công.');
      setEditingHorse(null);
      setFormValues(emptyHorseForm());
      setIsHorseFormOpen(false);
      await reloadOwnerData();
    } catch (err) {
      setPageError(getErrorText(err, 'Không thể lưu hồ sơ ngựa. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteHorse(horse: Horse): Promise<void> {
    const horseId = getHorseId(horse);
    const horseName = getHorseName(horse) || String(horseId || 'này');
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa hồ sơ ngựa "${horseName}" không?\nHồ sơ đã có lịch sử tham gia race hoặc kết quả thi đấu sẽ không được xóa.`
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
      setPageError(getErrorText(err, 'Không thể xóa hồ sơ ngựa.'));
    }
  }

  return (
    <AppShell
      variant="owner"
      title={`Xin chào, ${ownerName}`}
      subtitle="Quản lý hồ sơ ngựa và theo dõi tình trạng đăng ký thi đấu."
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
        <OwnerOverview dashboard={dashboard} horses={horses} onGoHorses={() => setActiveSection('horses')} />
      )}

      {activeSection === 'horses' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
            <div>
              <p className="eyebrow">Horse profile</p>
              <h2>Quản lý ngựa của tôi</h2>
            </div>
            <button className="primary-button compact-button" type="button" onClick={handleStartCreateHorse}>
              + Thêm ngựa mới
            </button>
          </div>

          {isHorseFormOpen && (
            <OwnerHorseForm
              formValues={formValues}
              errors={formErrors}
              editingHorse={editingHorse}
              isSaving={isSaving}
              onChange={handleHorseChange}
              onSubmit={handleHorseSubmit}
              onCancelEdit={handleCancelHorseEdit}
            />
          )}

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
