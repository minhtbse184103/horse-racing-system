import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel } from '../../lib';
import { updateMyAccount, updateStoredUser } from '../../services/authService';
import { getMyKyc } from '../../services/kycService';
import { getMyWallet } from '../../services/walletService';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function getAccountValues(user) {
  return {
    username: user?.username || user?.email || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.roleName || user?.role || 'JOCKEY'
  };
}

function ProfileField({ label, value }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || 'Not updated'}</strong>
    </div>
  );
}

function EditableField({ label, name, value, disabled, onChange, type = 'text' }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-brown-900">{label}</span>
      <input className={inputClass} name={name} type={type} value={value} onChange={onChange} disabled={disabled} readOnly={disabled} />
    </label>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'NOT_SUBMITTED').toUpperCase();
  return <span className={`status-badge ${normalized.toLowerCase()}`}>{formatDisplayLabel(normalized)}</span>;
}

function money(value, currency = 'VND') {
  return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
}

export default function JockeyProfileView({ user, profile, isLoading, onReload, onUserUpdated }) {
  const [accountUser, setAccountUser] = useState(user);
  const [account, setAccount] = useState(() => getAccountValues(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const snapshot = useMemo(() => getAccountValues(accountUser), [accountUser]);
  const licenceFiles = Array.isArray(profile?.files) ? profile.files : [];

  useEffect(() => {
    setAccountUser(user);
    setAccount(getAccountValues(user));
    setIsEditing(false);
  }, [user]);

  useEffect(() => {
    Promise.allSettled([getMyKyc(), getMyWallet()]).then(([kycResult, walletResult]) => {
      setKyc(kycResult.status === 'fulfilled' ? kycResult.value : null);
      setWallet(walletResult.status === 'fulfilled' ? walletResult.value : null);
    });
  }, [user?.userID, user?.id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setAccount((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  function cancelEdit() {
    setAccount(snapshot);
    setIsEditing(false);
    setError('');
  }

  async function saveAccount(event) {
    event.preventDefault();
    const username = account.username.trim();
    const email = account.email.trim();
    const phone = account.phone.trim();
    if (!username || !email) {
      setError('Username and email are required.');
      return;
    }

    setIsSaving(true);
    try {
      const persisted = await updateMyAccount({ fullName: username, email, phone });
      const updated = {
        ...accountUser,
        ...persisted,
        username: persisted?.username || username,
        email: persisted?.email || email,
        phone: persisted?.phone || phone
      };
      updateStoredUser(updated);
      setAccountUser(updated);
      setAccount(getAccountValues(updated));
      setIsEditing(false);
      setMessage('Account information updated.');
      setError('');
      onUserUpdated?.(updated);
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update account information.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="admin-alert success" role="status">Loading Jockey profile...</div>;
  if (!profile) return <div className="admin-alert error" role="alert">No approved Jockey profile was found.</div>;

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel">
        <form onSubmit={saveAccount} noValidate>
          <div className="owner-panel-header">
            <div><p className="eyebrow">Account Information</p><h2>Login and contact details</h2><p>Username, email, and phone number can be updated here.</p></div>
            {!isEditing && <button className="primary-button compact-button" type="button" onClick={() => setIsEditing(true)}>Edit Account</button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label="Username" name="username" value={account.username} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label="Email" name="email" type="email" value={account.email} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label="Phone Number" name="phone" value={account.phone} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label="Role" name="role" value={formatDisplayLabel(account.role)} disabled onChange={handleChange} />
          </div>
          {isEditing && (
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={cancelEdit} disabled={isSaving}>Cancel</button>
              <button className="primary-button sm:w-auto" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}
        </form>
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">Verified Jockey Information</p><h2>Professional profile</h2><p>This information was approved by an administrator and cannot be edited directly.</p></div>
          <StatusBadge status={profile.verificationStatus || profile.status || 'APPROVED'} />
        </div>
        <div className="owner-profile-window">
          <div className="owner-profile-avatar">{(accountUser?.username || 'J').charAt(0).toUpperCase()}</div>
          <div><h3>{accountUser?.username || accountUser?.email}</h3><p>Approved Jockey since {formatDate(profile.reviewedAt)}</p></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ProfileField label="Weight" value={profile.weight != null ? `${profile.weight} kg` : null} />
          <ProfileField label="Licence Type" value={formatDisplayLabel(profile.licenceType)} />
          <ProfileField label="Licence Expiry Date" value={formatDate(profile.expiryDate)} />
          <ProfileField label="Issuing Authority" value={profile.issuingAuthority} />
          <ProfileField label="Trainer Name" value={profile.trainerName} />
          <ProfileField label="Trainer Email" value={profile.trainerEmail} />
          <ProfileField label="Academy / Stable Address" value={profile.academyStableAddress} />
          <ProfileField label="Racing Record" value={`${profile.totalWins || 0} wins / ${profile.totalRaces || 0} races`} />
          <ProfileField label="Biography" value={profile.biography} />
          <ProfileField label="Reviewed At" value={formatDate(profile.reviewedAt)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {profile.verificationLink && <a className="outline-button compact-button inline-flex" href={profile.verificationLink.split(/\r?\n/)[0]} target="_blank" rel="noreferrer">Open Verification Link</a>}
          {licenceFiles.map((file, index) => <a className="outline-button compact-button inline-flex" href={file.fileUrl} target="_blank" rel="noreferrer" key={file.fileId || file.fileUrl || index}>View Licence Document {index + 1}</a>)}
          <button className="outline-button compact-button" type="button" onClick={() => onReload?.()}>Refresh Profile</button>
        </div>
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">Identity Verification</p><h2>Didit KYC information</h2><p>KYC is separate from Jockey approval and is used for wallet access.</p></div>
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
        ) : <div className="admin-alert success" role="status">Identity information appears here after KYC is verified.</div>}
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">Wallet Summary</p><h2>Wallet access</h2><p>The wallet is managed independently from the professional Jockey profile.</p></div>
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
