import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AppShell from '../common/AppShell';
import type { NavItem } from '../common/AppShell';
import type { AuthUser } from '../../services/authService';
import type { JockeyInvitation, JockeyProfile, JockeyProfilePayload } from '../../services/jockeyService';
import {
  acceptJockeyInvitation,
  createJockeyProfile,
  deleteJockeyProfile,
  getJockeyInvitations,
  getJockeyProfile,
  rejectJockeyInvitation,
  updateJockeyProfile
} from '../../services/jockeyService';
import { formatDate } from '../../lib';

type JockeySection = 'profile' | 'invitations';

type JockeyProfileForm = {
  licenseNo: string;
  weight: string;
  ranking: string;
  imgUrl: string;
};

type JockeyProfileErrors = Partial<Record<keyof JockeyProfileForm, string>>;

const jockeyNavItems: NavItem[] = [
  { key: 'profile', label: 'Profile', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Invitations', icon: '✉️' }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];

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
  return section === 'profile' || section === 'invitations';
}

function isMissingProfileError(error: unknown): boolean {
  return error instanceof Error && /profile does not exist|không.*hồ sơ/i.test(error.message);
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
  } else if (!/^https?:\/\/.+/.test(imgUrl)) {
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

export default function JockeyDashboard({ currentUser, onLogout }: JockeyDashboardProps) {
  const [activeSection, setActiveSection] = useState<JockeySection>('profile');
  const [profile, setProfile] = useState<JockeyProfile | null>(null);
  const [profileForm, setProfileForm] = useState<JockeyProfileForm>(emptyProfileForm());
  const [profileErrors, setProfileErrors] = useState<JockeyProfileErrors>({});
  const [invitations, setInvitations] = useState<JockeyInvitation[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');

  const jockeyName = currentUser?.fullName || currentUser?.email || 'Jockey';
  const isLoading = isLoadingProfile || isLoadingInvitations;

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
    if (activeSection === 'profile') {
      await loadProfile();
      return;
    }
    await loadInvitations();
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeSection === 'invitations') {
      loadInvitations();
    }
  }, [activeSection]);

  function handleNavigate(section: string): void {
    if (isJockeySection(section)) {
      setActiveSection(section);
      setPageError('');
      setMessage('');
    }
  }

  function handleProfileChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: '' }));
    setPageError('');
    setMessage('');
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    setPageError('');
    setMessage('');
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      const savedProfile = profile ? await updateJockeyProfile(toPayload(profileForm)) : await createJockeyProfile(toPayload(profileForm));
      setProfile(savedProfile);
      setProfileForm(toProfileForm(savedProfile));
      setMessage(profile ? 'Cập nhật hồ sơ jockey thành công. Hồ sơ có thể cần admin duyệt lại.' : 'Tạo hồ sơ jockey thành công. Vui lòng chờ admin duyệt ACTIVE.');
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể lưu hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteProfile(): Promise<void> {
    const confirmed = window.confirm('Bạn có chắc muốn xóa hồ sơ jockey hiện tại không?');
    if (!confirmed) return;

    setPageError('');
    setMessage('');
    setIsSavingProfile(true);
    try {
      await deleteJockeyProfile();
      setProfile(null);
      setProfileForm(emptyProfileForm());
      setMessage('Đã xóa hồ sơ jockey.');
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể xóa hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleInvitationAction(invitation: JockeyInvitation, action: 'accept' | 'reject'): Promise<void> {
    if (!invitation.invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    setActionId(invitation.invitationId);
    setPageError('');
    setMessage('');
    try {
      if (action === 'accept') {
        await acceptJockeyInvitation(invitation.invitationId);
        setMessage('Đã chấp nhận lời mời. Registration đã chuyển sang ACCEPTED để admin duyệt.');
      } else {
        await rejectJockeyInvitation(invitation.invitationId);
        setMessage('Đã từ chối lời mời.');
      }
      await loadInvitations();
    } catch (error) {
      setPageError(getErrorText(error, action === 'accept' ? 'Chấp nhận lời mời thất bại.' : 'Từ chối lời mời thất bại.'));
    } finally {
      setActionId(null);
    }
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

      {activeSection === 'profile' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
            <div>
              <p className="eyebrow">Jockey profile</p>
              <h2>Hồ sơ jockey</h2>
            </div>
            {profile && <span className={`status-badge ${statusClass(profile.status)}`}>{displayValue(profile.status)}</span>}
          </div>

          <div className="owner-content-grid">
            <section className="owner-panel">
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">Profile form</p>
                  <h2>{profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ mới'}</h2>
                  <p>Backend yêu cầu license, cân nặng 35-90kg, ranking hợp lệ và Image URL dạng HTTP/HTTPS.</p>
                </div>
              </div>

              <form className="owner-form" onSubmit={handleProfileSubmit} noValidate>
                <label className="field-label" htmlFor="licenseNo">License number <span className="required">*</span></label>
                <input
                  id="licenseNo"
                  name="licenseNo"
                  className={profileErrors.licenseNo ? 'input has-error' : 'input'}
                  value={profileForm.licenseNo}
                  onChange={handleProfileChange}
                  placeholder="VD: JCK-2026-001"
                  disabled={isSavingProfile}
                />
                {profileErrors.licenseNo && <p className="field-error">{profileErrors.licenseNo}</p>}

                <div className="owner-form-row">
                  <div>
                    <label className="field-label" htmlFor="weight">Cân nặng (kg) <span className="required">*</span></label>
                    <input
                      id="weight"
                      name="weight"
                      type="number"
                      min="35"
                      max="90"
                      step="0.1"
                      className={profileErrors.weight ? 'input has-error' : 'input'}
                      value={profileForm.weight}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                    {profileErrors.weight && <p className="field-error">{profileErrors.weight}</p>}
                  </div>
                  <div>
                    <label className="field-label" htmlFor="ranking">Ranking <span className="required">*</span></label>
                    <select
                      id="ranking"
                      name="ranking"
                      className={profileErrors.ranking ? 'input has-error' : 'input'}
                      value={profileForm.ranking}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    >
                      {rankingOptions.map((ranking) => (
                        <option key={ranking} value={ranking}>{ranking}</option>
                      ))}
                    </select>
                    {profileErrors.ranking && <p className="field-error">{profileErrors.ranking}</p>}
                  </div>
                </div>

                <label className="field-label" htmlFor="imgUrl">Image URL <span className="required">*</span></label>
                <input
                  id="imgUrl"
                  name="imgUrl"
                  type="url"
                  className={profileErrors.imgUrl ? 'input has-error' : 'input'}
                  value={profileForm.imgUrl}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/jockey.jpg"
                  disabled={isSavingProfile}
                />
                {profileErrors.imgUrl && <p className="field-error">{profileErrors.imgUrl}</p>}

                <div className="admin-form-actions">
                  <button className="primary-button" type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Đang lưu...' : profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
                  </button>
                  {profile && (
                    <button className="outline-button" type="button" onClick={handleDeleteProfile} disabled={isSavingProfile}>
                      Xóa hồ sơ
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="owner-panel">
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">Current profile</p>
                  <h2>Thông tin hiện tại</h2>
                </div>
              </div>
              {isLoadingProfile ? (
                <p className="table-empty">Đang tải hồ sơ...</p>
              ) : profile ? (
                <div className="horse-card read-only-row">
                  <div className="horse-avatar">
                    {profile.imgUrl ? <img src={profile.imgUrl} alt={displayValue(profile.fullName, 'Jockey')} /> : '🏇'}
                  </div>
                  <div className="horse-info">
                    <div className="horse-title-row password-row">
                      <h3>{displayValue(profile.fullName, jockeyName)}</h3>
                      <span className={`status-badge ${statusClass(profile.status)}`}>{displayValue(profile.status)}</span>
                    </div>
                    <div className="horse-meta-grid">
                      <span>Email</span><strong>{displayValue(profile.email)}</strong>
                      <span>License</span><strong>{displayValue(profile.licenseNo)}</strong>
                      <span>Weight</span><strong>{displayValue(profile.weight)} kg</strong>
                      <span>Ranking</span><strong>{displayValue(profile.ranking)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="owner-empty-state">
                  <div>🧑‍✈️</div>
                  <h3>Chưa có hồ sơ jockey</h3>
                  <p>Tạo hồ sơ trước, sau đó admin chuyển trạng thái ACTIVE thì bạn mới chấp nhận được lời mời.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
            <div>
              <p className="eyebrow">Race invitations</p>
              <h2>Lời mời từ owner</h2>
            </div>
            <span className="owner-count-pill">{invitations.length} lời mời</span>
          </div>

          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Invitation list</p>
                <h2>Danh sách lời mời</h2>
                <p>Chỉ lời mời PENDING còn hạn mới có thể accept/reject.</p>
              </div>
            </div>

            {isLoadingInvitations ? (
              <p className="table-empty">Đang tải lời mời...</p>
            ) : invitations.length === 0 ? (
              <div className="owner-empty-state">
                <div>✉️</div>
                <h3>Chưa có lời mời</h3>
                <p>Khi owner gửi lời mời tham gia tournament, lời mời sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Tournament</th>
                      <th>Horse</th>
                      <th>Owner</th>
                      <th>Deadline</th>
                      <th>Invitation</th>
                      <th>Registration</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((invitation) => {
                      const pending = String(invitation.status || '').toUpperCase() === 'PENDING';
                      const disabled = Boolean(actionId) || !pending;
                      return (
                        <tr key={String(invitation.invitationId || `${invitation.registrationId}-${invitation.createdAt}`)}>
                          <td>{displayValue(invitation.tournamentName, `#${displayValue(invitation.tournamentId)}`)}</td>
                          <td>{displayValue(invitation.horseName, `#${displayValue(invitation.horseId)}`)}</td>
                          <td>{displayValue(invitation.ownerName, `#${displayValue(invitation.ownerId)}`)}</td>
                          <td>{formatDate(invitation.expiredAt)}</td>
                          <td><span className={`status-badge ${statusClass(invitation.status)}`}>{displayValue(invitation.status)}</span></td>
                          <td><span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>{displayValue(invitation.registrationStatus)}</span></td>
                          <td>
                            <div className="table-actions">
                              <button type="button" onClick={() => handleInvitationAction(invitation, 'accept')} disabled={disabled}>
                                Accept
                              </button>
                              <button className="danger-action" type="button" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={disabled}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}
    </AppShell>
  );
}
