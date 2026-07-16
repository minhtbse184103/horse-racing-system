import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel } from '../../lib';
import { updateMyAccount, updateStoredUser } from '../../services/authService';
import { getMyOwnerProfile } from '../../services/ownerApplicationService';
import { getMyKyc } from '../../services/kycService';
import { getMyWallet } from '../../services/walletService';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function getAccountValues(user) {
  return {
    username: user?.username || user?.email || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || user?.roleName || 'OWNER'
  };
}

function ProfileField({ label, value, children }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{children || value || 'Not updated'}</strong>
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

function StatusBadge({ status }) {
  const normalized = String(status || 'NOT_SUBMITTED').toLowerCase();
  return <span className={`status-badge ${normalized}`}>{formatDisplayLabel(status || 'NOT_SUBMITTED')}</span>;
}

function money(value, currency = 'VND') {
  return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
}

export default function OwnerProfile({ user, onUserUpdated }) {
  const [profile, setProfile] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [accountUser, setAccountUser] = useState(user);
  const [accountValues, setAccountValues] = useState(() => getAccountValues(user));
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const accountSnapshot = useMemo(() => getAccountValues(accountUser), [accountUser]);

  async function loadProfile() {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const [ownerResult, kycResult, walletResult] = await Promise.allSettled([
        getMyOwnerProfile(),
        getMyKyc(),
        getMyWallet()
      ]);

      if (ownerResult.status === 'rejected') throw ownerResult.reason;
      if (!ownerResult.value || ownerResult.value.status !== 'APPROVED') {
        throw new Error('No approved Owner profile was found for this account.');
      }

      setProfile(ownerResult.value);
      setKyc(kycResult.status === 'fulfilled' ? kycResult.value : null);
      setWallet(walletResult.status === 'fulfilled' ? walletResult.value : null);
    } catch (err) {
      setError(err?.message || 'Unable to load the Owner profile.');
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

  async function handleSaveAccount(event) {
    event.preventDefault();
    const nextUsername = accountValues.username.trim();
    const nextEmail = accountValues.email.trim();
    const nextPhone = accountValues.phone.trim();

    if (!nextUsername) {
      setError('Username is required.');
      return;
    }

    if (!nextEmail) {
      setError('Email is required.');
      return;
    }

    try {
      const persistedUser = await updateMyAccount({ fullName: nextUsername, email: nextEmail, phone: nextPhone });
      const updatedUser = {
        ...accountUser,
        ...persistedUser,
        username: persistedUser?.username || nextUsername,
        email: persistedUser?.email || nextEmail,
        phone: persistedUser?.phone || nextPhone
      };
      updateStoredUser(updatedUser);
      setAccountUser(updatedUser);
      setAccountValues(getAccountValues(updatedUser));
      setIsEditingAccount(false);
      setMessage('Account information updated.');
      setError('');
      onUserUpdated?.(updatedUser);
    } catch (err) {
      setError(err?.message || 'Unable to update account information.');
    }
  }

  if (isLoading) {
    return <div className="admin-alert success" role="status">Loading Owner profile...</div>;
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
              <h2>Login and contact details</h2>
              <p>Email and phone number can be updated here.</p>
            </div>
            {!isEditingAccount && (
              <button className="primary-button compact-button" type="button" onClick={() => setIsEditingAccount(true)}>Edit Account</button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label="Username" name="username" value={accountValues.username} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label="Email" name="email" type="email" value={accountValues.email} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label="Phone Number" name="phone" value={accountValues.phone} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label="Role" name="role" value={formatDisplayLabel(accountValues.role)} disabled onChange={handleAccountChange} />
          </div>

          {isEditingAccount && (
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={handleCancelAccount}>Cancel</button>
              <button className="primary-button sm:w-auto" type="submit">Save Changes</button>
            </div>
          )}
        </form>
      </section>

      {profile && (
        <section className="owner-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Owner Professional Profile</p>
              <h2>Stable and ownership information</h2>
              <p>This application was approved by an administrator and cannot be edited directly.</p>
            </div>
            <span className="status-badge approved">Owner Approved</span>
          </div>

          <div className="owner-profile-window">
            <div className="owner-profile-avatar">{(profile.stableName || accountUser?.username || 'O').charAt(0).toUpperCase()}</div>
            <div>
              <h3>{profile.stableName}</h3>
              <p>{formatDisplayLabel(profile.status)} - Owner since {formatDate(profile.ownerSince)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label="Stable Name" value={profile.stableName} />
            <ProfileField label="Stable Address" value={profile.stableAddress} />
            <ProfileField label="Total Horses Owned" value={profile.totalHorsesOwned} />
            <ProfileField label="Application Submitted" value={formatDate(profile.submittedAt)} />
            <ProfileField label="Application Reviewed" value={formatDate(profile.reviewedAt)} />
            <ProfileField label="Owner Since" value={formatDate(profile.ownerSince)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.stableCertificateUrl && <a className="outline-button compact-button inline-flex" href={profile.stableCertificateUrl} target="_blank" rel="noreferrer">View Stable Certificate</a>}
            {profile.horseOwnershipProofUrl && <a className="outline-button compact-button inline-flex" href={profile.horseOwnershipProofUrl} target="_blank" rel="noreferrer">View Horse Ownership Proof</a>}
          </div>
        </section>
      )}

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Identity Verification</p>
            <h2>Didit KYC information</h2>
            <p>KYC verifies the account holder for wallet access. It is separate from Owner approval.</p>
          </div>
          <StatusBadge status={kyc?.status} />
        </div>

        {kyc?.status === 'VERIFIED' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField label="Verified Full Name" value={kyc.verifiedFullName} />
            <ProfileField label="Date of Birth" value={formatDate(kyc.verifiedDateOfBirth)} />
            <ProfileField label="Identity Document" value={`${kyc.documentType || 'Identity document'}${kyc.documentLastFour ? ` **** ${kyc.documentLastFour}` : ''}`} />
            <ProfileField label="Document Expiry Date" value={kyc.documentExpiryDate ? formatDate(kyc.documentExpiryDate) : 'No expiry provided'} />
            <ProfileField label="Verified By" value={kyc.provider || 'DIDIT'} />
            <ProfileField label="Verified At" value={formatDate(kyc.verifiedAt)} />
          </div>
        ) : (
          <div className="admin-alert success" role="status">Identity information appears here after Didit returns a VERIFIED decision.</div>
        )}
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Wallet Summary</p>
            <h2>Wallet access</h2>
            <p>The backend opens the wallet only after successful KYC verification.</p>
          </div>
          <StatusBadge status={wallet?.status || 'NOT_OPENED'} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileField label="Currency" value={wallet?.currency || 'VND'} />
          <ProfileField label="Available Balance" value={wallet ? money(wallet.availableBalance, wallet.currency) : 'Wallet not opened'} />
          <ProfileField label="Locked Balance" value={wallet ? money(wallet.lockedBalance, wallet.currency) : 'Wallet not opened'} />
        </div>
      </section>
    </section>
  );
}
