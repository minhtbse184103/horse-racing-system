import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AppShell from '../common/AppShell';
import StatCard from '../common/StatCard';
import type { NavItem } from '../common/AppShell';
import type { AuthUser, Id } from '../../services/authService';
import type { JockeyInvitation, JockeyProfile, JockeyProfilePayload } from '../../services/jockeyService';
import {
  acceptJockeyInvitation,
  createJockeyProfile,
  deactivateJockeyProfile,
  getJockeyInvitations,
  getJockeyProfile,
  rejectJockeyInvitation,
  updateJockeyProfile
} from '../../services/jockeyService';
import { formatDate } from '../../lib';

type JockeySection = 'overview' | 'profile' | 'invitations';

type JockeyProfileForm = {
  licenseNo: string;
  weight: string;
  ranking: string;
  imgUrl: string;
};

type JockeyProfileErrors = Partial<Record<keyof JockeyProfileForm, string>>;

const jockeyNavItems: NavItem[] = [
  { key: 'overview', label: 'Dashboard', icon: '📊' },
  { key: 'profile', label: 'Profile', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Invitations', icon: '✉️' }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

interface JockeyDashboardProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

function emptyProfileForm(): JockeyProfileForm {
  return {
    licenseNo: '',
    weight: '',
    ranking: 'BEGINNER',
    imgUrl: ''
  };
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isJockeySection(section: string): section is JockeySection {
  return section === 'overview' || section === 'profile' || section === 'invitations';
}

function isMissingProfileError(error: unknown): boolean {
  return error instanceof Error && /profile does not exist|jockey chưa có|không.*hồ sơ|not found/i.test(error.message);
}

function toProfileForm(profile: JockeyProfile): JockeyProfileForm {
  return {
    licenseNo: String(profile.licenseNo || ''),
    weight: profile.weight == null ? '' : String(profile.weight),
    ranking: String(profile.ranking || 'BEGINNER').toUpperCase(),
    imgUrl: String(profile.imgUrl || '')
  };
}

function validateProfileForm(form: JockeyProfileForm): JockeyProfileErrors {
  const errors: JockeyProfileErrors = {};
  const licenseNo = form.licenseNo.trim();
  const weight = Number(form.weight);
  const imgUrl = form.imgUrl.trim();

  if (!licenseNo) {
    errors.licenseNo = 'License number không được để trống.';
  } else if (licenseNo.length < 5 || licenseNo.length > 50) {
    errors.licenseNo = 'License number phải từ 5 đến 50 ký tự.';
  } else if (!/^[A-Za-z0-9-]+$/.test(licenseNo)) {
    errors.licenseNo = 'License number chỉ được chứa chữ, số và dấu gạch ngang.';
  }

  if (!form.weight) {
    errors.weight = 'Cân nặng không được để trống.';
  } else if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
    errors.weight = 'Cân nặng jockey phải từ 35 đến 90 kg.';
  }

  if (!rankingOptions.includes(form.ranking)) {
    errors.ranking = 'Ranking phải là BEGINNER, INTERMEDIATE, PROFESSIONAL hoặc ELITE.';
  }

  if (!imgUrl) {
    errors.imgUrl = 'Image URL không được để trống.';
  } else if (!/^https?:\/\/.+/i.test(imgUrl)) {
    errors.imgUrl = 'Image URL phải bắt đầu bằng http:// hoặc https://.';
  }

  return errors;
}

function toPayload(form: JockeyProfileForm): JockeyProfilePayload {
  return {
    licenseNo: form.licenseNo.trim(),
    weight: Number(form.weight),
    ranking: form.ranking,
    imgUrl: form.imgUrl.trim()
  };
}

function statusClass(status: unknown): string {
  return String(status || 'unknown').toLowerCase().replace(/\s+/g, '_');
}

function displayValue(value: unknown, fallback = 'Chưa cập nhật'): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function getInvitationId(invitation: JockeyInvitation): Id | undefined {
  return invitation.invitationId;
}

function countByStatus(invitations: JockeyInvitation[], status: string): number {
  return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === status).length;
}

export default function JockeyDashboard({ currentUser, onLogout }: JockeyDashboardProps) {
  const [activeSection, setActiveSection] = useState<JockeySection>('overview');
  const [profile, setProfile] = useState<JockeyProfile | null>(null);
  const [profileForm, setProfileForm] = useState<JockeyProfileForm>(emptyProfileForm());
  const [profileErrors, setProfileErrors] = useState<JockeyProfileErrors>({});
  const [invitations, setInvitations] = useState<JockeyInvitation[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionId, setActionId] = useState<Id | null>(null);
  const [pageError, setPageError] = useState('');
  const [profileSubmitError, setProfileSubmitError] = useState('');
  const [message, setMessage] = useState('');

  const jockeyName = currentUser?.fullName || currentUser?.email || 'Jockey';
  const isLoading = isLoadingProfile || isLoadingInvitations;
  const profileStatus = String(profile?.status || '').toUpperCase();
  const isProfileActive = Boolean(profile) && profileStatus === 'ACTIVE';
  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);
  const latestInvitations = useMemo(() => invitations.slice(0, 5), [invitations]);

  async function loadProfile(): Promise<void> {
    setIsLoadingProfile(true);
    setPageError('');
    try {
      const data = await getJockeyProfile();
      setProfile(data || null);
      setProfileForm(data ? toProfileForm(data) : emptyProfileForm());
    } catch (error) {
      if (isMissingProfileError(error)) {
        setProfile(null);
        setProfileForm(emptyProfileForm());
        return;
      }
      setPageError(getErrorText(error, 'Không thể tải hồ sơ jockey.'));
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function loadInvitations(): Promise<void> {
    setIsLoadingInvitations(true);
    setPageError('');
    try {
      const data = await getJockeyInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể tải lời mời jockey.'));
    } finally {
      setIsLoadingInvitations(false);
    }
  }

  async function reloadData(): Promise<void> {
    setMessage('');
    setProfileSubmitError('');
    await Promise.all([loadProfile(), loadInvitations()]);
  }

  useEffect(() => {
    reloadData();
  }, []);

  function handleNavigate(section: string): void {
    if (isJockeySection(section)) {
      setActiveSection(section);
      setPageError('');
      setProfileSubmitError('');
      setMessage('');
    }
  }

  function handleProfileChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: '' }));
    setProfileSubmitError('');
    setPageError('');
    setMessage('');
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      const savedProfile = profile ? await updateJockeyProfile(toPayload(profileForm)) : await createJockeyProfile(toPayload(profileForm));
      setProfile(savedProfile);
      setProfileForm(toProfileForm(savedProfile));
      setMessage(profile ? 'Cập nhật hồ sơ jockey thành công.' : 'Tạo hồ sơ jockey thành công. Nếu hệ thống cần duyệt, hãy chờ admin chuyển profile sang ACTIVE.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể lưu hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeactivateProfile(): Promise<void> {
    const confirmed = window.confirm('Bạn có chắc muốn deactivate/xóa hồ sơ jockey hiện tại không? Sau đó bạn sẽ không accept được invitation.');
    if (!confirmed) return;

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    setIsSavingProfile(true);
    try {
      await deactivateJockeyProfile();
      setProfile(null);
      setProfileForm(emptyProfileForm());
      setMessage('Đã deactivate/xóa hồ sơ jockey theo endpoint backend hiện có.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể deactivate hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleInvitationAction(invitation: JockeyInvitation, action: 'accept' | 'reject'): Promise<void> {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    const confirmed = window.confirm(action === 'accept' ? 'Bạn có chắc muốn chấp nhận lời mời này không?' : 'Bạn có chắc muốn từ chối lời mời này không?');
    if (!confirmed) return;

    setActionId(invitationId);
    setPageError('');
    setMessage('');
    try {
      if (action === 'accept') {
        await acceptJockeyInvitation(invitationId);
        setMessage('Đã chấp nhận lời mời. Registration đã chuyển sang ACCEPTED và chờ admin duyệt CONFIRMED.');
      } else {
        await rejectJockeyInvitation(invitationId);
        setMessage('Đã từ chối lời mời.');
      }
      await loadInvitations();
    } catch (error) {
      setPageError(getErrorText(error, action === 'accept' ? 'Chấp nhận lời mời thất bại.' : 'Từ chối lời mời thất bại.'));
    } finally {
      setActionId(null);
    }
  }

  function renderProfileForm() {
    return (
      <form className="owner-panel owner-form" onSubmit={handleProfileSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Jockey profile</p>
            <h2>{profile ? 'Cập nhật hồ sơ jockey' : 'Tạo hồ sơ jockey'}</h2>
            <p>Thông tin này dùng để owner biết hồ sơ jockey và để hệ thống kiểm tra khi accept invitation.</p>
          </div>
          {profile && <span className={`status-badge ${statusClass(profile.status)}`}>{displayValue(profile.status)}</span>}
        </div>

        {profileSubmitError && <div className="admin-alert error modal-alert" role="alert">{profileSubmitError}</div>}

        {!profile && !isLoadingProfile && (
          <div className="admin-alert error soft-alert" role="alert">Bạn chưa có profile jockey. Hãy tạo profile trước khi nhận lời mời.</div>
        )}

        {profile && !isProfileActive && (
          <div className="admin-alert error soft-alert" role="alert">Profile hiện không ACTIVE nên nút accept invitation sẽ bị khóa.</div>
        )}

        <div className="jockey-profile-preview">
          <div className="jockey-avatar">
            {profileForm.imgUrl ? <img src={profileForm.imgUrl} alt="Jockey profile" /> : '🧑‍✈️'}
          </div>
          <div>
            <h3>{profile?.fullName || jockeyName}</h3>
            <p>{profile?.email || currentUser?.email || 'Chưa có email'}</p>
          </div>
        </div>

        <label className="field-label" htmlFor="jockeyLicenseNo">License number <span className="required">*</span></label>
        <input
          className={profileErrors.licenseNo ? 'input has-error' : 'input'}
          id="jockeyLicenseNo"
          name="licenseNo"
          type="text"
          placeholder="Ví dụ: JOC-001"
          value={profileForm.licenseNo}
          onChange={handleProfileChange}
          disabled={isSavingProfile}
        />
        {profileErrors.licenseNo && <p className="field-error">{profileErrors.licenseNo}</p>}

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="jockeyWeight">Cân nặng <span className="required">*</span></label>
            <input
              className={profileErrors.weight ? 'input has-error' : 'input'}
              id="jockeyWeight"
              name="weight"
              type="number"
              min="35"
              max="90"
              step="0.1"
              placeholder="55.5"
              value={profileForm.weight}
              onChange={handleProfileChange}
              disabled={isSavingProfile}
            />
            {profileErrors.weight && <p className="field-error">{profileErrors.weight}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="jockeyRanking">Ranking <span className="required">*</span></label>
            <select
              className={profileErrors.ranking ? 'input has-error' : 'input'}
              id="jockeyRanking"
              name="ranking"
              value={profileForm.ranking}
              onChange={handleProfileChange}
              disabled={isSavingProfile}
            >
              {rankingOptions.map((ranking) => <option key={ranking} value={ranking}>{ranking}</option>)}
            </select>
            {profileErrors.ranking && <p className="field-error">{profileErrors.ranking}</p>}
          </div>
        </div>

        <label className="field-label" htmlFor="jockeyImgUrl">Image URL <span className="required">*</span></label>
        <input
          className={profileErrors.imgUrl ? 'input has-error' : 'input'}
          id="jockeyImgUrl"
          name="imgUrl"
          type="url"
          placeholder="https://example.com/jockey.jpg"
          value={profileForm.imgUrl}
          onChange={handleProfileChange}
          disabled={isSavingProfile}
        />
        {profileErrors.imgUrl && <p className="field-error">{profileErrors.imgUrl}</p>}

        <div className="admin-form-actions">
          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Đang lưu...' : profile ? 'Cập nhật profile' : 'Tạo profile'}
          </button>
          {profile && (
            <button className="outline-button danger-action" type="button" onClick={handleDeactivateProfile} disabled={isSavingProfile}>
              Deactivate / Xóa profile
            </button>
          )}
        </div>
      </form>
    );
  }

  function renderInvitationList(limit?: number) {
    const items = typeof limit === 'number' ? latestInvitations.slice(0, limit) : filteredInvitations;

    if (isLoadingInvitations) {
      return <p className="table-empty">Đang tải lời mời...</p>;
    }

    if (items.length === 0) {
      return <p className="table-empty">Chưa có lời mời phù hợp.</p>;
    }

    return (
      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Giải đấu</th>
              <th>Ngựa</th>
              <th>Owner</th>
              <th>Tạo lúc</th>
              <th>Hết hạn</th>
              <th>Status</th>
              <th>Registration</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((invitation) => {
              const invitationId = getInvitationId(invitation);
              const isPending = String(invitation.status || '').toUpperCase() === 'PENDING';
              const acceptDisabled = !isPending || !isProfileActive || actionId === invitationId;
              return (
                <tr key={invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                  <td>{invitationId || 'N/A'}</td>
                  <td>
                    <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>
                    {invitation.message && <p className="table-subtext">{invitation.message}</p>}
                  </td>
                  <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                  <td>{invitation.ownerName || invitation.ownerId || 'N/A'}</td>
                  <td>{formatDate(invitation.createdAt)}</td>
                  <td>{formatDate(invitation.expiredAt)}</td>
                  <td><span className={`status-badge ${statusClass(invitation.status)}`}>{invitation.status || 'N/A'}</span></td>
                  <td><span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>{invitation.registrationStatus || 'N/A'}</span></td>
                  <td>
                    {isPending ? (
                      <div className="table-actions">
                        <button type="button" onClick={() => handleInvitationAction(invitation, 'accept')} disabled={acceptDisabled} title={!isProfileActive ? 'Profile chưa ACTIVE nên không thể accept.' : 'Accept invitation'}>Accept</button>
                        <button type="button" className="danger-action" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={actionId === invitationId}>Reject</button>
                      </div>
                    ) : (
                      <span className="readonly-note">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AppShell
      variant="owner"
      title={`Xin chào, ${jockeyName}`}
      subtitle="Tạo hồ sơ jockey, theo dõi lời mời từ chủ ngựa và phản hồi lời mời thi đấu."
      profileName={jockeyName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'JOCKEY')}
      activeSection={activeSection}
      navItems={jockeyNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={
        <button className="refresh-button" type="button" onClick={reloadData} disabled={isLoading}>
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      }
    >
      {pageError && <div className="admin-alert error" role="alert">{pageError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      {activeSection === 'overview' && (
        <section className="owner-stack">
          <section className="owner-stats-grid">
            <StatCard label="Profile status" value={profile?.status || 'NO PROFILE'} description={profile ? `License: ${profile.licenseNo || 'Chưa cập nhật'}` : 'Bạn cần tạo profile jockey'} highlight />
            <StatCard label="Ranking" value={profile?.ranking || 'N/A'} description="Ranking hiện tại trong profile" />
            <StatCard label="Pending invitations" value={countByStatus(invitations, 'PENDING')} description="Lời mời đang chờ phản hồi" />
            <StatCard label="Accepted invitations" value={countByStatus(invitations, 'ACCEPTED')} description="Lời mời đã chấp nhận" />
          </section>

          <section className="owner-overview-grid">
            <div className="owner-panel hero-owner-panel">
              <div>
                <p className="eyebrow">Jockey dashboard</p>
                <h2>Quản lý profile và lời mời thi đấu</h2>
                <p>Trang này tổng hợp dữ liệu từ profile và invitation vì backend chưa có endpoint dashboard riêng cho jockey.</p>
              </div>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>Mở profile</button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>Xem invitations</button>
              </div>
            </div>

            <div className="owner-panel compact-panel">
              <div className="owner-panel-header">
                <div>
                  <h2>Lời mời mới nhất</h2>
                  <p>Hiển thị tối đa 5 lời mời gần nhất từ backend.</p>
                </div>
              </div>
              <div className="owner-mini-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">Chưa có lời mời nào.</p>
                ) : latestInvitations.map((invitation) => (
                  <div key={invitation.invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                    <span>{invitation.tournamentName || `Tournament ${invitation.tournamentId || ''}`}</span>
                    <strong>{invitation.status || 'N/A'}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      )}

      {activeSection === 'profile' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Hồ sơ jockey</h2>
            </div>
            <button className="outline-button compact-button" type="button" onClick={loadProfile} disabled={isLoadingProfile}>Tải lại profile</button>
          </div>
          {renderProfileForm()}
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack">
          {!profile && !isLoadingProfile && (
            <div className="admin-alert error" role="alert">Bạn chưa có profile jockey nên không thể accept invitation. Hãy tạo profile trước.</div>
          )}
          {profile && !isProfileActive && (
            <div className="admin-alert error" role="alert">Profile của bạn đang là {profile.status || 'N/A'}, không phải ACTIVE nên không thể accept invitation.</div>
          )}
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Invitations</p>
                <h2>Lời mời được nhận</h2>
                <p>Jockey có thể accept hoặc reject lời mời đang ở trạng thái PENDING.</p>
              </div>
              <div className="inline-filter-row">
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả status' : status}</option>)}
                </select>
                <span className="owner-count-pill">{filteredInvitations.length} lời mời</span>
              </div>
            </div>
            {renderInvitationList()}
          </section>
        </section>
      )}
    </AppShell>
  );
}
