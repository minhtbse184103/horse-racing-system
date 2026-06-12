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
import { getOwnerHorseById } from '../../services/ownerService';
const ownerNavItems = [
  { key: 'overview', label: 'Dashboard', icon: '📊' },
  { key: 'horses', label: 'My Horses', icon: '🐎' },
  { key: 'register', label: 'Register Race', icon: '📝' }
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
    }
    catch (err) {
      setPageError(getErrorText(err, 'Unable to load the owner dashboard.'));
    }
  }
  function handleNavigate(section) {
    if (isOwnerSection(section))
      setActiveSection(section);
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
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    setHorseFormError('');
    setPageError('');
    setMessage('');
  }

  async function handleViewHorse(horse) {
    const horseId = getHorseId(horse);
    if (!horseId) {
      setHorseDetailError('Horse ID was not found.');
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
    }
    catch (err) {
      setHorseDetailError(getErrorText(err, 'Unable to load horse details.'));
    }
    finally {
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
      imgUrl:
        horse.imgUrl && !/^https?:\/\//i.test(String(horse.imgUrl))
          ? horse.imgUrl
          : emptyHorseForm().imgUrl
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
    if (Object.keys(errors).length > 0)
      return;
    setIsSaving(true);
    try {
      await saveHorse(toHorsePayload(formValues), editingHorse);
      setMessage(editingHorse ? 'Horse profile was updated and submitted as PENDING for admin approval.' : 'Horse profile was submitted as PENDING for admin approval.');
      setEditingHorse(null);
      setFormValues(emptyHorseForm());
      setIsHorseFormOpen(false);
      setSelectedHorse(null);
      await reloadOwnerData();
    }
    catch (err) {
      setHorseFormError(getErrorText(err, 'Unable to save the horse profile. Please check the information and try again.'));
    }
    finally {
      setIsSaving(false);
    }
  }
  async function handleDeleteHorse(horse) {
    const horseId = getHorseId(horse);
    const horseName = getHorseName(horse) || String(horseId || 'this horse');
    const confirmDelete = window.confirm(`Are you sure you want to delete the horse profile "${horseName}"?\nProfiles with race history or race results cannot be deleted.`);
    if (!confirmDelete)
      return;
    setPageError('');
    setHorseFormError('');
    setMessage('');
    try {
      await removeHorse(horse);
      setMessage('Horse profile was deleted successfully.');
      if (editingHorse && getHorseId(editingHorse) === horseId) {
        handleCancelHorseEdit();
      }
      if (selectedHorse && getHorseId(selectedHorse) === horseId) {
        setSelectedHorse(null);
      }
      await reloadOwnerData();
    }
    catch (err) {
      setPageError(getErrorText(err, 'Unable to delete the horse profile.'));
    }
  }
  return (<AppShell variant="owner" title={`Hello, ${ownerName}`} subtitle="Manage horse profiles and track race registration status." profileName={ownerName} profileRole={String(currentUser?.role || currentUser?.roleName || 'OWNER')} activeSection={activeSection} navItems={ownerNavItems} onNavigate={handleNavigate} onLogout={onLogout} headerAction={<button className="refresh-button" type="button" onClick={reloadOwnerData} disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Refresh'}
  </button>}>
    {error && <div className="admin-alert error" role="alert">{error}</div>}
    {message && <div className="admin-alert success" role="status">{message}</div>}

    {activeSection === 'overview' && (<OwnerOverview dashboard={dashboard} horses={horses} onGoHorses={() => setActiveSection('horses')} onGoInvitations={() => setActiveSection('register')} />)}

    {activeSection === 'horses' && (<section className="owner-stack">
      <div className="owner-section-toolbar">
        <div>
          <p className="eyebrow">Horse profile</p>
          <h2>Manage My Horses</h2>
        </div>
        <button className="primary-button compact-button" type="button" onClick={handleStartCreateHorse}>
          + Add New Horse
        </button>
      </div>

      {isHorseFormOpen && (<OwnerHorseForm
        formValues={formValues}
        errors={formErrors}
        submitError={horseFormError}
        editingHorse={editingHorse}
        isSaving={isSaving}
        onChange={handleHorseChange}
        onSubmit={handleHorseSubmit}
        onCancelEdit={handleCancelHorseEdit}
      />)}

      {horseDetailError && <div className="admin-alert error" role="alert">{horseDetailError}</div>}

      {selectedHorse && (<section className="owner-panel horse-detail-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Horse detail</p>
            <h2>{getHorseName(selectedHorse) || 'Horse Details'}</h2>
            <p>{isLoadingHorseDetail ? 'Loading the latest details from the backend...' : 'Details loaded from GET /api/owner/horses/{horseId}.'}</p>
          </div>
          <button className="outline-button compact-button" type="button" onClick={() => setSelectedHorse(null)}>Close</button>
        </div>
        <div className="detail-grid">
          <span>ID</span><strong>{getHorseId(selectedHorse) || 'N/A'}</strong>
          <span>Breed</span><strong>{selectedHorse.breed || 'Not updated'}</strong>
          <span>Gender</span><strong>{selectedHorse.gender || 'Not updated'}</strong>
          <span>Coat Color</span><strong>{selectedHorse.color || 'Not updated'}</strong>
          <span>Birth Date</span><strong>{selectedHorse.dayOfBirth || 'Not updated'}</strong>
          <span>Weight</span><strong>{selectedHorse.weight ? `${selectedHorse.weight} kg` : 'Not updated'}</strong>
          <span>Health Expiry</span><strong>{selectedHorse.healthCertExpiry || 'Not updated'}</strong>
          <span>Status</span><strong><span className={`status-badge ${String(selectedHorse.status || '').toLowerCase()}`}>{selectedHorse.status || 'N/A'}</span></strong>
          <span>Registration</span><strong>{selectedHorse.registrationCount ?? 0}</strong>
          <span>Has Raced</span><strong>{selectedHorse.participated ? 'Yes' : 'No'}</strong>
          {selectedHorse.rejectionReason && <>
            <span>Rejection Reason</span><strong>{selectedHorse.rejectionReason}</strong>
          </>}
        </div>
      </section>)}

      <OwnerHorseTable horses={horses} isLoading={isHorsesLoading} onViewHorse={handleViewHorse} onEditHorse={handleEditHorse} onDeleteHorse={handleDeleteHorse} />
    </section>)}

    {activeSection === 'register' && <OwnerRegisterRace horses={horses} onBackToHorses={() => setActiveSection('horses')} />}
  </AppShell>);
}
