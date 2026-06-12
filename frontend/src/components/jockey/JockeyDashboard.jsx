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
import { formatDate } from '../../lib';

const jockeyNavItems = [
  { key: 'overview', label: 'Dashboard', icon: '📊' },
  { key: 'profile', label: 'Profile', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Invitations', icon: '✉️' }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

function emptyProfileForm() {
  return {
    licenseNo: '',
    weight: '',
    ranking: 'BEGINNER',
    imgUrl: defaultJockeyAvatar
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
    imgUrl: profile.imgUrl && !/^https?:\/\//i.test(String(profile.imgUrl)) ? String(profile.imgUrl) : defaultJockeyAvatar
  };
}

function validateProfileForm(form) {
  const errors = {};
  const licenseNo = form.licenseNo.trim();
  const weight = Number(form.weight);

  if (!licenseNo) {
    errors.licenseNo = 'License number is required.';
  } else if (licenseNo.length < 5 || licenseNo.length > 50) {
    errors.licenseNo = 'License number must be between 5 and 50 characters.';
  } else if (!/^[A-Za-z0-9-]+$/.test(licenseNo)) {
    errors.licenseNo = 'License number may contain only letters, numbers, and hyphens.';
  }

  if (!form.weight) {
    errors.weight = 'Weight is required.';
  } else if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
    errors.weight = 'Jockey weight must be between 35 and 90 kg.';
  }

  if (!rankingOptions.includes(form.ranking)) {
    errors.ranking = 'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL, or ELITE.';
  }

  return errors;
}

function toPayload(form) {
  return {
    licenseNo: form.licenseNo.trim(),
    weight: Number(form.weight),
    ranking: form.ranking,
    imgUrl: defaultJockeyAvatar
  };
}

function statusClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/\s+/g, '_');
}

function displayValue(value, fallback = 'Not updated') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
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
      text: 'You do not have a jockey profile yet. Create one before accepting invitations.'
    };
  }

  const status = String(profile.status || '').toUpperCase();

  if (status === 'UNDER_REVIEW') {
    return {
      type: 'warning',
      text: 'Your profile has not been verified yet. Please wait for admin verification.'
    };
  }

  if (status === 'REJECTED') {
    return {
      type: 'error',
      text: `Your profile was rejected.${profile.rejectionReason ? ` Reason: ${profile.rejectionReason}` : ''}`
    };
  }

  if (status !== 'ACTIVE') {
    return {
      type: 'error',
      text: `Your profile status is ${profile.status || 'N/A'}, so invitations cannot be accepted yet.`
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
      setPageError(getErrorText(error, 'Unable to load the jockey profile.'));
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
      setPageError(getErrorText(error, 'Unable to load jockey invitations.'));
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
      setMessage('Profile saved. Your profile has not been verified yet. Please wait for admin verification.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Unable to save the jockey profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeactivateProfile() {
    const confirmed = window.confirm('Are you sure you want to deactivate the current jockey profile? You will not be able to accept invitations afterward.');
    if (!confirmed) return;

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    setIsSavingProfile(true);

    try {
      await deactivateJockeyProfile();
      setProfile(null);
      setProfileForm(emptyProfileForm());
      setMessage('Jockey profile was deactivated.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Unable to deactivate the jockey profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleInvitationAction(invitation, action) {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) {
      setPageError('Invitation ID was not found.');
      return;
    }

    const confirmed = window.confirm(action === 'accept' ? 'Are you sure you want to accept this invitation?' : 'Are you sure you want to reject this invitation?');
    if (!confirmed) return;

    setActionId(invitationId);
    setPageError('');
    setMessage('');

    try {
      if (action === 'accept') {
        await acceptJockeyInvitation(invitationId);
        setMessage('Invitation accepted. The registration is now ACCEPTED and waiting for admin confirmation.');
      } else {
        await rejectJockeyInvitation(invitationId);
        setMessage('Invitation rejected.');
      }
      await loadInvitations();
    } catch (error) {
      setPageError(getErrorText(error, action === 'accept' ? 'Unable to accept the invitation.' : 'Unable to reject the invitation.'));
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
            <h2>{profile ? 'Update Jockey Profile' : 'Create Jockey Profile'}</h2>
            <p>This information helps owners review your jockey profile before sending invitations.</p>
          </div>
          {profile && <span className={`status-badge ${statusClass(profile.status)}`}>{displayValue(profile.status)}</span>}
        </div>

        {profileSubmitError && <div className="admin-alert error modal-alert" role="alert">{profileSubmitError}</div>}
        {profileNotice && <div className={`admin-alert ${profileNotice.type} soft-alert`} role="alert">{profileNotice.text}</div>}

        <div className="jockey-profile-preview">
          <div className="jockey-avatar facebook-avatar">
            <img src={defaultJockeyAvatar} alt="Default jockey avatar" />
          </div>
          <div>
            <h3>{profile?.fullName || jockeyName}</h3>
            <p>{profile?.email || currentUser?.email || 'No email yet'}</p>
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
          placeholder="Example: JOC-001"
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
              {rankingOptions.map((ranking) => <option key={ranking} value={ranking}>{ranking}</option>)}
            </select>
            {profileErrors.ranking && <p className="field-error">{profileErrors.ranking}</p>}
          </div>
        </div>

        <div className="readonly-field-card full-width">
          <span>Profile Image</span>
          <strong>Default imported avatar</strong>
          <small>The jockey profile uses a local white Facebook-style avatar instead of an external image link.</small>
        </div>

        <div className="admin-form-actions">
          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
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

    if (isLoadingInvitations) return <p className="table-empty">Loading invitations...</p>;
    if (items.length === 0) return <p className="table-empty">No invitations match the current filters.</p>;

    return (
      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tournament</th>
              <th>Horse</th>
              <th>Owner</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Registration</th>
              <th>Actions</th>
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
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(invitation, 'accept')}
                          disabled={acceptDisabled}
                          title={!isProfileActive ? 'Profile is not ACTIVE yet, so this invitation cannot be accepted.' : 'Accept invitation'}
                        >
                          Accept
                        </button>
                        <button type="button" className="danger-action" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={actionId === invitationId}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="readonly-note">Processed</span>
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
      subtitle="Create your jockey profile, track owner invitations, and respond to race invitations."
      profileName={jockeyName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'JOCKEY')}
      activeSection={activeSection}
      navItems={jockeyNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={(
        <button className="refresh-button" type="button" onClick={reloadData} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      )}
    >
      {pageError && <div className="admin-alert error" role="alert">{pageError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {profileNotice && activeSection !== 'profile' && <div className={`admin-alert ${profileNotice.type}`} role="alert">{profileNotice.text}</div>}

      {activeSection === 'overview' && (
        <section className="owner-stack">
          <section className="owner-stats-grid">
            <StatCard label="Profile status" value={profile?.status || 'NO PROFILE'} description={profile ? `License: ${profile.licenseNo || 'Not updated'}` : 'Create a jockey profile'} highlight />
            <StatCard label="Ranking" value={profile?.ranking || 'N/A'} description="Current ranking in your profile" />
            <StatCard label="Pending invitations" value={countByStatus(invitations, 'PENDING')} description="Invitations waiting for your response" />
            <StatCard label="Accepted invitations" value={countByStatus(invitations, 'ACCEPTED')} description="Invitations you accepted" />
          </section>

          <section className="owner-overview-grid">
            <div className="owner-panel hero-owner-panel">
              <div>
                <p className="eyebrow">Jockey dashboard</p>
                <h2>Manage Profile and Invitations</h2>
                <p>Your profile must be verified by an admin before you can accept race invitations.</p>
              </div>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>Open Profile</button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>View Invitations</button>
              </div>
            </div>

            <div className="owner-panel compact-panel">
              <div className="owner-panel-header">
                <div>
                  <h2>Latest Invitations</h2>
                  <p>Showing up to five latest invitations from the backend.</p>
                </div>
              </div>
              <div className="owner-mini-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">No invitations yet.</p>
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
              <h2>Jockey Profile</h2>
            </div>
            <button className="outline-button compact-button" type="button" onClick={loadProfile} disabled={isLoadingProfile}>Reload Profile</button>
          </div>
          {renderProfileForm()}
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Invitations</p>
                <h2>Received Invitations</h2>
                <p>Jockeys can accept or reject invitations that are still PENDING.</p>
              </div>
              <div className="inline-filter-row">
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>)}
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
