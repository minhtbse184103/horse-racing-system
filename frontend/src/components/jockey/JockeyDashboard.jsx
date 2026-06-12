import { useEffect, useMemo, useState } from 'react';
import defaultJockeyAvatar from '../../assets/default-jockey-avatar.svg';
import AppShell from '../common/AppShell';
import StatCard from '../common/StatCard';
import {
  acceptJockeyInvitation,
  createJockeyProfile,
  deactivateJockeyProfile,
  getJockeyInvitations,
  getJockeyProfile,
  rejectJockeyInvitation,
  updateJockeyProfile
} from '../../services/jockeyService';
import { formatDate, formatDisplayLabel } from '../../lib';

const jockeyNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'profile', label: 'Hồ sơ', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Lời mời', icon: '✉️' }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

function emptyProfileForm() {
  return {
    licenseNo: '',
    weight: '',
    ranking: 'BEGINNER',
    imgUrl: ''
  };
}

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isJockeySection(section) {
  return section === 'overview' || section === 'profile' || section === 'invitations';
}

function isMissingProfileError(error) {
  return error instanceof Error && /profile does not exist|not found/i.test(error.message);
}

function toProfileForm(profile) {
  return {
    licenseNo: String(profile.licenseNo || ''),
    weight: profile.weight == null ? '' : String(profile.weight),
    ranking: String(profile.ranking || 'BEGINNER').toUpperCase(),
    imgUrl: profile.imgUrl ? String(profile.imgUrl) : ''
  };
}

function validateProfileForm(form) {
  const errors = {};
  const licenseNo = form.licenseNo.trim();
  const weight = Number(form.weight);
  const imgUrl = form.imgUrl.trim();

  if (!licenseNo) {
    errors.licenseNo = 'Số giấy phép là bắt buộc.';
  } else if (licenseNo.length < 5 || licenseNo.length > 50) {
    errors.licenseNo = 'Số giấy phép phải có từ 5 đến 50 ký tự.';
  } else if (!/^[A-Za-z0-9-]+$/.test(licenseNo)) {
    errors.licenseNo = 'Số giấy phép chỉ được chứa chữ cái, chữ số và dấu gạch nối.';
  }

  if (!form.weight) {
    errors.weight = 'Cân nặng là bắt buộc.';
  } else if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
    errors.weight = 'Cân nặng của jockey phải từ 35 đến 90 kg.';
  }

  if (!rankingOptions.includes(form.ranking)) {
    errors.ranking = 'Xếp hạng phải là BEGINNER, INTERMEDIATE, PROFESSIONAL hoặc ELITE.';
  }

  if (imgUrl && !/^https?:\/\/.+/i.test(imgUrl)) {
    errors.imgUrl = 'URL ảnh phải bắt đầu bằng http:// hoặc https://';
  }

  return errors;
}

function toPayload(form) {
  return {
    licenseNo: form.licenseNo.trim(),
    weight: Number(form.weight),
    ranking: form.ranking,
    imgUrl: form.imgUrl.trim()
  };
}

function statusClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/\s+/g, '_');
}

function displayValue(value, fallback = 'Chưa cập nhật') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function formatTournamentDateRange(invitation) {
  const startDate = invitation.tournamentStartDate;
  const endDate = invitation.tournamentEndDate;

  if (!startDate && !endDate) return 'N/A';
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  return formatDate(startDate || endDate);
}

function getInvitationId(invitation) {
  return invitation.invitationId;
}

function countByStatus(invitations, status) {
  return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === status).length;
}

function getProfileNotice(profile, isLoadingProfile) {
  if (isLoadingProfile) return null;
  if (!profile) {
    return {
      type: 'error',
      text: 'Bạn chưa có hồ sơ jockey. Hãy tạo hồ sơ trước khi chấp nhận lời mời.'
    };
  }

  const status = String(profile.status || '').toUpperCase();

  if (status === 'UNDER_REVIEW') {
    return {
      type: 'warning',
      text: 'Hồ sơ của bạn chưa được xác minh. Vui lòng chờ admin xét duyệt.'
    };
  }

  if (status === 'REJECTED') {
    return {
      type: 'error',
      text: `Hồ sơ của bạn đã bị từ chối.${profile.rejectionReason ? ` Lý do: ${profile.rejectionReason}` : ''}`
    };
  }

  if (status !== 'ACTIVE') {
    return {
      type: 'error',
      text: `Hồ sơ đang ở trạng thái ${formatDisplayLabel(profile.status)}, nên chưa thể chấp nhận lời mời.`
    };
  }

  return null;
}

export default function JockeyDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm());
  const [profileErrors, setProfileErrors] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [pageError, setPageError] = useState('');
  const [profileSubmitError, setProfileSubmitError] = useState('');
  const [message, setMessage] = useState('');

  const jockeyName = currentUser?.fullName || currentUser?.email || 'Jockey';
  const isLoading = isLoadingProfile || isLoadingInvitations;
  const profileStatus = String(profile?.status || '').toUpperCase();
  const isProfileActive = Boolean(profile) && profileStatus === 'ACTIVE';
  const profileNotice = getProfileNotice(profile, isLoadingProfile);

  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);

  const latestInvitations = useMemo(() => invitations.slice(0, 5), [invitations]);

  async function loadProfile() {
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

  async function loadInvitations() {
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

  async function reloadData() {
    setMessage('');
    setProfileSubmitError('');
    await Promise.all([loadProfile(), loadInvitations()]);
  }

  useEffect(() => {
    reloadData();
  }, []);

  function handleNavigate(section) {
    if (isJockeySection(section)) {
      setActiveSection(section);
      setPageError('');
      setProfileSubmitError('');
      setMessage('');
    }
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: '' }));
    setProfileSubmitError('');
    setPageError('');
    setMessage('');
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    setProfileSubmitError('');
    setPageError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      const savedProfile = profile
        ? await updateJockeyProfile(toPayload(profileForm))
        : await createJockeyProfile(toPayload(profileForm));

      setProfile(savedProfile);
      setProfileForm(toProfileForm(savedProfile));
      setMessage('Đã lưu hồ sơ. Hồ sơ chưa được xác minh, vui lòng chờ admin xét duyệt.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể lưu hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeactivateProfile() {
    const confirmed = window.confirm('Bạn có chắc muốn vô hiệu hóa hồ sơ jockey hiện tại? Sau đó bạn sẽ không thể chấp nhận lời mời.');
    if (!confirmed) return;

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    setIsSavingProfile(true);

    try {
      await deactivateJockeyProfile();
      setProfile(null);
      setProfileForm(emptyProfileForm());
      setMessage('Đã vô hiệu hóa hồ sơ jockey.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể vô hiệu hóa hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleInvitationAction(invitation, action) {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    const confirmed = window.confirm(action === 'accept' ? 'Bạn có chắc muốn chấp nhận lời mời này?' : 'Bạn có chắc muốn từ chối lời mời này?');
    if (!confirmed) return;

    setActionId(invitationId);
    setPageError('');
    setMessage('');

    try {
      if (action === 'accept') {
        await acceptJockeyInvitation(invitationId);
        setMessage('Đã chấp nhận lời mời. Đơn đăng ký hiện ở trạng thái ACCEPTED và đang chờ admin xác nhận.');
      } else {
        await rejectJockeyInvitation(invitationId);
        setMessage('Đã từ chối lời mời.');
      }
      await loadInvitations();
    } catch (error) {
      setPageError(getErrorText(error, action === 'accept' ? 'Không thể chấp nhận lời mời.' : 'Không thể từ chối lời mời.'));
    } finally {
      setActionId(null);
    }
  }

  function renderProfileForm() {
    const profileImagePreview = profileForm.imgUrl.trim() || defaultJockeyAvatar;

    return (
      <form className="owner-panel owner-form" onSubmit={handleProfileSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Hồ sơ jockey</p>
            <h2>{profile ? 'Cập nhật hồ sơ jockey' : 'Tạo hồ sơ jockey'}</h2>
            <p>Thông tin này giúp owner xem xét hồ sơ của bạn trước khi gửi lời mời.</p>
          </div>
          {profile && <span className={`status-badge ${statusClass(profile.status)}`}>{formatDisplayLabel(profile.status)}</span>}
        </div>

        {profileSubmitError && <div className="admin-alert error modal-alert" role="alert">{profileSubmitError}</div>}
        {profileNotice && <div className={`admin-alert ${profileNotice.type} soft-alert`} role="alert">{profileNotice.text}</div>}

        <div className="jockey-profile-preview">
          <div className="jockey-avatar facebook-avatar">
            <img
              src={profileImagePreview}
              alt="Ảnh đại diện jockey"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = defaultJockeyAvatar;
              }}
            />
          </div>
          <div>
            <h3>{profile?.fullName || jockeyName}</h3>
            <p>{profile?.email || currentUser?.email || 'Chưa có email'}</p>
          </div>
        </div>

        <label className="field-label" htmlFor="jockeyLicenseNo">
          License Number <span className="required">*</span>
        </label>
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
            <label className="field-label" htmlFor="jockeyWeight">
              Weight <span className="required">*</span>
            </label>
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
            <label className="field-label" htmlFor="jockeyRanking">
              Ranking <span className="required">*</span>
            </label>
            <select
              className={profileErrors.ranking ? 'input has-error' : 'input'}
              id="jockeyRanking"
              name="ranking"
              value={profileForm.ranking}
              onChange={handleProfileChange}
              disabled={isSavingProfile}
            >
              {rankingOptions.map((ranking) => <option key={ranking} value={ranking}>{formatDisplayLabel(ranking)}</option>)}
            </select>
            {profileErrors.ranking && <p className="field-error">{profileErrors.ranking}</p>}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="jockeyImage">
            Profile Image URL
          </label>

          <input
            className={profileErrors.imgUrl ? 'input has-error' : 'input'}
            id="jockeyImage"
            name="imgUrl"
            type="text"
            placeholder="https://example.com/avatar.jpg"
            value={profileForm.imgUrl}
            onChange={handleProfileChange}
            disabled={isSavingProfile}
          />

          {profileErrors.imgUrl && (
            <p className="field-error">{profileErrors.imgUrl}</p>
          )}
        </div>

        <div className="admin-form-actions">
          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Đang lưu...' : profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
          </button>
          {profile && (
            <button className="outline-button danger-action" type="button" onClick={handleDeactivateProfile} disabled={isSavingProfile}>
              Deactivate Profile
            </button>
          )}
        </div>
      </form>
    );
  }

  function renderInvitationList(limit) {
    const items = typeof limit === 'number' ? latestInvitations.slice(0, limit) : filteredInvitations;

    if (isLoadingInvitations) return <p className="table-empty">Đang tải lời mời...</p>;
    if (items.length === 0) return <p className="table-empty">Không có lời mời phù hợp với bộ lọc hiện tại.</p>;

    return (
      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Giải đấu</th>
              <th>Thời gian</th>
              <th>Ngựa</th>
              <th>Owner</th>
              <th>Ngày tạo</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Đăng ký</th>
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
                  <td>{formatTournamentDateRange(invitation)}</td>
                  <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                  <td>{invitation.ownerName || invitation.ownerId || 'N/A'}</td>
                  <td>{formatDate(invitation.createdAt)}</td>
                  <td>{formatDate(invitation.expiredAt)}</td>
                  <td><span className={`status-badge ${statusClass(invitation.status)}`}>{formatDisplayLabel(invitation.status)}</span></td>
                  <td><span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>{formatDisplayLabel(invitation.registrationStatus)}</span></td>
                  <td>
                    {isPending ? (
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(invitation, 'accept')}
                          disabled={acceptDisabled}
                          title={!isProfileActive ? 'Hồ sơ chưa ở trạng thái ACTIVE nên không thể chấp nhận lời mời này.' : 'Chấp nhận lời mời'}
                        >
                          Accept
                        </button>
                        <button type="button" className="danger-action" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={actionId === invitationId}>
                          Reject
                        </button>
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
      variant="jockey"
      title={`Hello, ${jockeyName}`}
      subtitle="Tạo hồ sơ jockey, theo dõi lời mời từ owner và phản hồi lời mời thi đấu."
      profileName={jockeyName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'JOCKEY')}
      activeSection={activeSection}
      navItems={jockeyNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={(
        <button className="refresh-button" type="button" onClick={reloadData} disabled={isLoading}>
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      )}
    >
      {pageError && <div className="admin-alert error" role="alert">{pageError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {profileNotice && activeSection !== 'profile' && <div className={`admin-alert ${profileNotice.type}`} role="alert">{profileNotice.text}</div>}

      {activeSection === 'overview' && (
        <section className="owner-stack">
          <section className="owner-stats-grid">
            <StatCard label="Trạng thái hồ sơ" value={profile ? formatDisplayLabel(profile.status) : 'Chưa có hồ sơ'} description={profile ? `Giấy phép: ${profile.licenseNo || 'Chưa cập nhật'}` : 'Tạo hồ sơ jockey'} highlight />
            <StatCard label="Xếp hạng" value={formatDisplayLabel(profile?.ranking)} description="Xếp hạng hiện tại trong hồ sơ" />
            <StatCard label="Lời mời đang chờ phản hồi" value={countByStatus(invitations, 'PENDING')} description="Lời mời đang chờ bạn phản hồi" />
            <StatCard label="Lời mời đã chấp nhận" value={countByStatus(invitations, 'ACCEPTED')} description="Lời mời bạn đã chấp nhận" />
          </section>

          <section className="owner-overview-grid">
            <div className="owner-panel hero-owner-panel">
              <div>
                <p className="eyebrow">Bảng điều khiển jockey</p>
                <h2>Quản lý hồ sơ và lời mời</h2>
                <p>Hồ sơ của bạn phải được admin xác minh trước khi có thể chấp nhận lời mời thi đấu.</p>
              </div>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>Mở hồ sơ</button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>Xem lời mời</button>
              </div>
            </div>

            <div className="owner-panel compact-panel">
              <div className="owner-panel-header">
                <div>
                  <h2>Lời mời mới nhất</h2>
                  <p>Hiển thị tối đa năm lời mời mới nhất.</p>
                </div>
              </div>
              <div className="owner-mini-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">Chưa có lời mời.</p>
                ) : latestInvitations.map((invitation) => (
                  <div key={invitation.invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                    <span>{invitation.tournamentName || `Tournament ${invitation.tournamentId || ''}`}</span>
                    <strong>{formatDisplayLabel(invitation.status)}</strong>
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
              <p className="eyebrow">Hồ sơ</p>
              <h2>Hồ sơ jockey</h2>
            </div>
            <button className="outline-button compact-button" type="button" onClick={loadProfile} disabled={isLoadingProfile}>Tải lại hồ sơ</button>
          </div>
          {renderProfileForm()}
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Lời mời</p>
                <h2>Lời mời đã nhận</h2>
                <p>Jockey có thể chấp nhận hoặc từ chối các lời mời đang ở trạng thái PENDING.</p>
              </div>
              <div className="inline-filter-row">
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatDisplayLabel(status)}</option>)}
                </select>
                <span className="owner-count-pill">{filteredInvitations.length} invitations</span>
              </div>
            </div>
            {renderInvitationList()}
          </section>
        </section>
      )}
    </AppShell>
  );
}
