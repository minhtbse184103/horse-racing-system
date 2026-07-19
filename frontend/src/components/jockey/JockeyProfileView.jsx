import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel } from '../../lib';
import { updateMyAccount, updateStoredUser } from '../../services/authService';
import { getMyWallet } from '../../services/walletService';
import { useLanguage } from '../../context/LanguageContext';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function getAccountValues(user) {
  return {
    username: user?.username || user?.email || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.roleName || user?.role || 'JOCKEY'
  };
}

function ProfileField({ label, value, fallback }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || fallback}</strong>
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

function StatusBadge({ status, t }) {
  const normalized = String(status || 'NOT_SUBMITTED').toUpperCase();
  const translated = t(`status_${normalized}`);
  return <span className={`status-badge ${normalized.toLowerCase()}`}>{translated === `status_${normalized}` ? formatDisplayLabel(normalized) : translated}</span>;
}

function money(value, currency = 'VND') {
  return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
}

export default function JockeyProfileView({ user, profile, isLoading, onReload, onUserUpdated }) {
  const { t } = useLanguage();
  const [accountUser, setAccountUser] = useState(user);
  const [account, setAccount] = useState(() => getAccountValues(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    getMyWallet()
      .then(setWallet)
      .catch(() => setWallet(null));
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
      setError(t('jockeyAccountRequired'));
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
      setMessage(t('jockeyAccountUpdated'));
      setError('');
      onUserUpdated?.(updated);
    } catch (saveError) {
      setError(saveError?.message || t('jockeyAccountUpdateError'));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="admin-alert success" role="status">{t('jockeyProfileLoading')}</div>;
  if (!profile) return <div className="admin-alert error" role="alert">{t('jockeyProfileNotFound')}</div>;

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel">
        <form onSubmit={saveAccount} noValidate>
          <div className="owner-panel-header">
            <div><p className="eyebrow">{t('jockeyAccountInfo')}</p><h2>{t('jockeyLoginContact')}</h2><p>{t('jockeyAccountHelp')}</p></div>
            {!isEditing && <button className="primary-button compact-button" type="button" onClick={() => setIsEditing(true)}>{t('jockeyEditAccount')}</button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label={t('jockeyUsername')} name="username" value={account.username} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label={t('jockeyEmail')} name="email" type="email" value={account.email} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label={t('jockeyPhoneNumber')} name="phone" value={account.phone} disabled={!isEditing || isSaving} onChange={handleChange} />
            <EditableField label={t('jockeyRole')} name="role" value={formatDisplayLabel(account.role)} disabled onChange={handleChange} />
          </div>
          {isEditing && (
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={cancelEdit} disabled={isSaving}>{t('jockeyCancel')}</button>
              <button className="primary-button sm:w-auto" type="submit" disabled={isSaving}>{isSaving ? t('jockeySaving') : t('jockeySaveChanges')}</button>
            </div>
          )}
        </form>
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">{t('jockeyVerifiedInfo')}</p><h2>{t('jockeyProfessionalProfile')}</h2><p>{t('jockeyProfessionalProfileHelp')}</p></div>
          <StatusBadge status={profile.verificationStatus || profile.status || 'APPROVED'} t={t} />
        </div>
        <div className="owner-profile-window">
          <div className="owner-profile-avatar">{(accountUser?.username || 'J').charAt(0).toUpperCase()}</div>
          <div><h3>{accountUser?.username || accountUser?.email}</h3><p>{t('jockeyApprovedSince', { date: formatDate(profile.reviewedAt) })}</p></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ProfileField label={t('jockeyWeight')} value={profile.weight != null ? `${profile.weight} kg` : null} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyLicenceType')} value={formatDisplayLabel(profile.licenceType)} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyLicenceExpiry')} value={formatDate(profile.expiryDate)} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyIssuingAuthority')} value={profile.issuingAuthority} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyTrainerName')} value={profile.trainerName} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyTrainerEmail')} value={profile.trainerEmail} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyAcademyAddress')} value={profile.academyStableAddress} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyRacingRecord')} value={t('jockeyRacingRecordValue', { wins: profile.totalWins || 0, races: profile.totalRaces || 0 })} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyBiography')} value={profile.biography} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyReviewedAt')} value={formatDate(profile.reviewedAt)} fallback={t('jockeyNotUpdated')} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {profile.verificationLink && <a className="outline-button compact-button inline-flex" href={profile.verificationLink.split(/\r?\n/)[0]} target="_blank" rel="noreferrer">{t('jockeyOpenVerification')}</a>}
          {licenceFiles.map((file, index) => <a className="outline-button compact-button inline-flex" href={file.fileUrl} target="_blank" rel="noreferrer" key={file.fileId || file.fileUrl || index}>{t('jockeyViewLicence', { number: index + 1 })}</a>)}
          <button className="outline-button compact-button" type="button" onClick={() => onReload?.()}>{t('jockeyRefreshProfile')}</button>
        </div>
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">{t('jockeyWalletSummary')}</p><h2>{t('jockeyWalletAccess')}</h2><p>{t('jockeyWalletHelp')}</p></div>
          <StatusBadge status={wallet?.status || 'NOT_OPENED'} t={t} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileField label={t('jockeyCurrency')} value={wallet?.currency || 'VND'} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyAvailableBalance')} value={wallet ? money(wallet.availableBalance, wallet.currency) : t('jockeyWalletNotOpened')} fallback={t('jockeyNotUpdated')} />
          <ProfileField label={t('jockeyLockedBalance')} value={wallet ? money(wallet.lockedBalance, wallet.currency) : t('jockeyWalletNotOpened')} fallback={t('jockeyNotUpdated')} />
        </div>
      </section>
    </section>
  );
}
