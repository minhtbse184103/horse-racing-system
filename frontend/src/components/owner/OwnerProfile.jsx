import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel, getUserId } from '../../lib';
import { updateStoredUser } from '../../services/authService';
import { updateMockUserAccount } from '../../services/mockAuthStore';
import { getMyOwnerApplication } from '../../services/ownerApplicationService';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';
const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function getAccountValues(user) {
  return {
    username: user?.username || user?.email || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || user?.roleName || 'OWNER'
  };
}

function getIdentityImage(profile) {
  return profile?.identityDocumentImage || profile?.nationalIdImage || profile?.passportImage || '';
}

function getIdentityFileName(profile) {
  return profile?.identityDocumentFileName || profile?.nationalIdFileName || profile?.passportFileName || '';
}

function ProfileField({ label, value, children }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{children || value || 'Chưa cập nhật'}</strong>
    </div>
  );
}

function EditableField({ label, name, value, disabled, onChange, type = 'text' }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-brown-900">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={disabled}
      />
    </label>
  );
}

export default function OwnerProfile({ user, onUserUpdated }) {
  const [profile, setProfile] = useState(null);
  const [accountUser, setAccountUser] = useState(user);
  const [accountValues, setAccountValues] = useState(() => getAccountValues(user));
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const identityImage = getIdentityImage(profile);
  const identityFileName = getIdentityFileName(profile);
  const accountSnapshot = useMemo(() => getAccountValues(accountUser), [accountUser]);

  async function loadProfile() {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const application = await getMyOwnerApplication(user);
      if (!application || application.status !== 'APPROVED') {
        setProfile(null);
        setError('Không tìm thấy OwnerProfile đã được duyệt cho tài khoản này.');
        return;
      }

      setProfile(application);
    } catch (err) {
      setError(err.message || 'Không thể tải OwnerProfile.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setAccountUser(user);
    setAccountValues(getAccountValues(user));
    setIsEditingAccount(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [user?.userID, user?.id]);

  function handleAccountChange(event) {
    const { name, value } = event.target;
    setAccountValues((current) => ({ ...current, [name]: value }));
    setMessage('');
    setError('');
  }

  function handleCancelAccount() {
    setAccountValues(accountSnapshot);
    setIsEditingAccount(false);
    setMessage('');
    setError('');
  }

  function handleSaveAccount(event) {
    event.preventDefault();

    const nextEmail = accountValues.email.trim();
    const nextPhone = accountValues.phone.trim();

    if (!nextEmail) {
      setError('Email là bắt buộc.');
      return;
    }

    const persistedUser = updateMockUserAccount(getUserId(accountUser), {
      email: nextEmail,
      phone: nextPhone
    });
    const updatedUser = {
      ...accountUser,
      ...persistedUser,
      email: nextEmail,
      phone: nextPhone
    };

    updateStoredUser(updatedUser);
    setAccountUser(updatedUser);
    setAccountValues(getAccountValues(updatedUser));
    setIsEditingAccount(false);
    setMessage('Đã cập nhật thông tin tài khoản.');
    setError('');
    onUserUpdated?.(updatedUser);
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordValues((current) => ({ ...current, [name]: value }));
    setPasswordError('');
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPasswordValues(emptyPasswordForm);
    setPasswordError('');
  }

  function handleUpdatePassword() {
    if (!passwordValues.currentPassword || !passwordValues.newPassword || !passwordValues.confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setPasswordError('Confirm New Password không khớp.');
      return;
    }

    closePasswordModal();
    setMessage('Đã gửi yêu cầu cập nhật mật khẩu.');
    setError('');
  }

  if (isLoading) {
    return <div className="admin-alert success" role="status">Đang tải Owner Profile...</div>;
  }

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel">
        <form onSubmit={handleSaveAccount} noValidate>
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Account Information</p>
              <h2>Account Information</h2>
              <p>Editable login contact details for this owner account.</p>
            </div>
            {!isEditingAccount && (
              <button className="primary-button compact-button" type="button" onClick={() => setIsEditingAccount(true)}>
                Edit Account
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label="Username" name="username" value={accountValues.username} disabled onChange={handleAccountChange} />
            <EditableField
              label="Email"
              name="email"
              type="email"
              value={accountValues.email}
              disabled={!isEditingAccount}
              onChange={handleAccountChange}
            />
            <EditableField
              label="Phone Number"
              name="phone"
              value={accountValues.phone}
              disabled={!isEditingAccount}
              onChange={handleAccountChange}
            />
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Role</span>
              <input className={inputClass} value={formatDisplayLabel(accountValues.role)} readOnly disabled />
            </label>
          </div>

          {isEditingAccount && (
            <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 mt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={handleCancelAccount}>
                Cancel
              </button>
              <button className="primary-button sm:w-auto" type="submit">
                Save Changes
              </button>
            </div>
          )}
        </form>
      </section>

      {profile && (
        <section className="owner-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Verified Owner Information</p>
              <h2>Verified Owner Information</h2>
              <p>This information was verified by an administrator and cannot be edited directly.</p>
            </div>
            <span className="status-badge approved">Verified by Admin</span>
          </div>

          <div className="owner-profile-window">
            <div className="owner-profile-avatar">
              {(profile.fullName || accountUser?.email || 'O').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3>{profile.fullName}</h3>
              <p>{formatDisplayLabel(profile.status)} · Owner since {formatDate(profile.ownerSince)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label="Full Name" value={profile.fullName} />
            <ProfileField label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
            <ProfileField label="Gender" value={profile.gender} />
            <ProfileField label="Nationality" value={profile.nationality} />
            <ProfileField label="Address" value={profile.address} />
            <ProfileField label="Identity Number" value={profile.identityNumber || profile.nationalIdNumber || profile.passportNumber} />
          </div>

          <div className="mt-5 rounded-2xl border border-brown-700/10 bg-white/70 p-4">
            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">National ID / Passport Image</span>
            <strong className="mt-1 block break-words text-brown-900">{identityFileName || 'Chưa cập nhật'}</strong>
            {identityImage ? (
              <a className="outline-button compact-button mt-3 inline-flex" href={identityImage} target="_blank" rel="noreferrer">
                View Image
              </a>
            ) : (
              <p className="mt-2">Chưa có ảnh National ID / Passport.</p>
            )}
          </div>
        </section>
      )}

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Security</p>
            <h2>Security</h2>
            <p>Manage password separately from profile information.</p>
          </div>
          <button className="primary-button compact-button" type="button" onClick={() => setIsPasswordModalOpen(true)}>
            Change Password
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProfileField label="Password" value="************" />
        </div>
      </section>

      {isPasswordModalOpen && (
        <div className="horse-form-overlay" role="presentation" onClick={closePasswordModal}>
          <section className="horse-form-modal" role="dialog" aria-modal="true" aria-labelledby="owner-password-title" onClick={(event) => event.stopPropagation()}>
            <div className="owner-panel-header horse-modal-header">
              <div>
                <p className="eyebrow">Security</p>
                <h2 id="owner-password-title">Change Password</h2>
                <p>Enter a new password without displaying the current password.</p>
              </div>
              <button className="outline-button compact-button" type="button" onClick={closePasswordModal}>
                Cancel
              </button>
            </div>

            <div className="owner-form">
              {passwordError && <div className="admin-alert error modal-alert" role="alert">{passwordError}</div>}

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-extrabold text-brown-900">Current Password</span>
                  <input className={inputClass} name="currentPassword" type="password" value={passwordValues.currentPassword} onChange={handlePasswordChange} />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-extrabold text-brown-900">New Password</span>
                  <input className={inputClass} name="newPassword" type="password" value={passwordValues.newPassword} onChange={handlePasswordChange} />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-extrabold text-brown-900">Confirm New Password</span>
                  <input className={inputClass} name="confirmPassword" type="password" value={passwordValues.confirmPassword} onChange={handlePasswordChange} />
                </label>
              </div>

              <div className="admin-form-actions sticky-modal-actions sm:flex sm:justify-end">
                <button className="outline-button" type="button" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button className="primary-button sm:w-auto" type="button" onClick={handleUpdatePassword}>
                  Update Password
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
