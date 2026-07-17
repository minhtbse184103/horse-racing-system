import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel } from '../../lib';
import { updateMyAccount, updateStoredUser } from '../../services/authService';
import { getMyOwnerProfile } from '../../services/ownerApplicationService';
import { useLanguage } from '../../context/LanguageContext';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function getAccountValues(user) {
  return {
    username: user?.username || user?.email || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || user?.roleName || 'OWNER'
  };
}

function ProfileField({ label, value, children, fallback = 'Not updated' }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{children || value || fallback}</strong>
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
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
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
      const ownerProfile = await getMyOwnerProfile();
      if (!ownerProfile || ownerProfile.status !== 'APPROVED') {
        throw new Error(t('ownerProfileNoApproved'));
      }

      setProfile(ownerProfile);
    } catch (err) {
      setError(err?.message || t('ownerProfileLoadError'));
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
      setError(t('usernameRequired'));
      return;
    }

    if (!nextEmail) {
      setError(t('emailRequired'));
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
      setMessage(t('ownerProfileUpdated'));
      setError('');
      onUserUpdated?.(updatedUser);
    } catch (err) {
      setError(err?.message || t('ownerProfileUpdateError'));
    }
  }

  if (isLoading) {
    return <div className="admin-alert success" role="status">{t('ownerProfileLoading')}</div>;
  }

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel">
        <form onSubmit={handleSaveAccount} noValidate>
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">{t('ownerProfileAccountInfo')}</p>
              <h2>{t('ownerProfileLoginContact')}</h2>
              <p>{t('ownerProfileContactEditable')}</p>
            </div>
            {!isEditingAccount && (
              <button className="primary-button compact-button" type="button" onClick={() => setIsEditingAccount(true)}>{t('ownerProfileEditAccount')}</button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label={t('username')} name="username" value={accountValues.username} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label={t('email')} name="email" type="email" value={accountValues.email} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label={t('phone')} name="phone" value={accountValues.phone} disabled={!isEditingAccount} onChange={handleAccountChange} />
            <EditableField label={t('role')} name="role" value={formatDisplayLabel(accountValues.role)} disabled onChange={handleAccountChange} />
          </div>

          {isEditingAccount && (
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={handleCancelAccount}>{t('cancel')}</button>
              <button className="primary-button sm:w-auto" type="submit">{t('ownerProfileSaveChanges')}</button>
            </div>
          )}
        </form>
      </section>

      {profile && (
        <section className="owner-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">{t('ownerProfileProfessional')}</p>
              <h2>{t('ownerProfileStableInfo')}</h2>
              <p>{t('ownerProfileReadonly')}</p>
            </div>
            <span className="status-badge approved">{t('ownerProfileApproved')}</span>
          </div>

          <div className="owner-profile-window">
            <div className="owner-profile-avatar">{(profile.stableName || accountUser?.username || 'O').charAt(0).toUpperCase()}</div>
            <div>
              <h3>{profile.stableName}</h3>
              <p>{formatDisplayLabel(profile.status)} - {t('ownerProfileOwnerSince', { date: formatDate(profile.ownerSince) })}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label={t('ownerProfileStableName')} value={profile.stableName} fallback={t('notUpdated')} />
            <ProfileField label={t('ownerProfileStableAddress')} value={profile.stableAddress} fallback={t('notUpdated')} />
            <ProfileField label={t('ownerProfileTotalHorses')} value={profile.totalHorsesOwned} fallback={t('notUpdated')} />
            <ProfileField label={t('ownerProfileSubmittedAt')} value={formatDate(profile.submittedAt)} fallback={t('notUpdated')} />
            <ProfileField label={t('ownerProfileReviewedAt')} value={formatDate(profile.reviewedAt)} fallback={t('notUpdated')} />
            <ProfileField label={t('ownerProfileOwnerSinceLabel')} value={formatDate(profile.ownerSince)} fallback={t('notUpdated')} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.stableCertificateUrl && <a className="outline-button compact-button inline-flex" href={profile.stableCertificateUrl} target="_blank" rel="noreferrer">{t('ownerProfileViewStableCertificate')}</a>}
            {profile.horseOwnershipProofUrl && <a className="outline-button compact-button inline-flex" href={profile.horseOwnershipProofUrl} target="_blank" rel="noreferrer">{t('ownerProfileViewOwnershipProof')}</a>}
          </div>
        </section>
      )}
    </section>
  );
}
