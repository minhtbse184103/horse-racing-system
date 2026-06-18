import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDisplayLabel } from '../../lib';
import { getMyOwnerApplication, updateMyOwnerProfile } from '../../services/ownerApplicationService';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function makeValues(user, profile) {
  return {
    fullName: profile?.fullName || user?.fullName || '',
    dateOfBirth: profile?.dateOfBirth || '',
    gender: profile?.gender || 'Male',
    nationality: profile?.nationality || '',
    address: profile?.address || '',
    identityDocumentImage: profile?.identityDocumentImage || profile?.nationalIdImage || profile?.passportImage || '',
    identityDocumentFileName: profile?.identityDocumentFileName || profile?.nationalIdFileName || profile?.passportFileName || '',
    email: profile?.applicantEmail || user?.email || '',
    phone: profile?.applicantPhone || user?.phone || ''
  };
}

function ProfileField({ label, value, children }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{children || value || 'Chưa cập nhật'}</strong>
    </div>
  );
}

export default function OwnerProfile({ user, onProfileSaved }) {
  const [profile, setProfile] = useState(null);
  const [values, setValues] = useState(() => makeValues(user, null));
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canSave = useMemo(
  () =>
    values.fullName.trim() &&
    values.dateOfBirth &&
    values.gender &&
    values.nationality.trim() &&
    values.address.trim(),
  [values]
);

  async function loadProfile() {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const application = await getMyOwnerApplication(user);
      if (!application || application.status !== 'APPROVED') {
        setProfile(null);
        setValues(makeValues(user, null));
        setError('Không tìm thấy OwnerProfile đã được duyệt cho tài khoản này.');
        return;
      }

      setProfile(application);
      setValues(makeValues(user, application));
    } catch (err) {
      setError(err.message || 'Không thể tải OwnerProfile.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [user?.userID, user?.id]);

  function validate() {
    const nextErrors = {};

    if (!values.fullName.trim()) nextErrors.fullName = 'Full Name là bắt buộc.';
    if (!values.dateOfBirth) nextErrors.dateOfBirth = 'Date of Birth là bắt buộc.';
    if (!values.gender) nextErrors.gender = 'Gender là bắt buộc.';
    if (!values.nationality.trim()) nextErrors.nationality = 'Nationality là bắt buộc.';
    if (!values.address.trim()) nextErrors.address = 'Address là bắt buộc.';

    setErrors(nextErrors);
    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
    setError('');
  }

  function handleCancelEdit() {
    setValues(makeValues(user, profile));
    setErrors({});
    setIsEditing(false);
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await updateMyOwnerProfile(user, values);
      setProfile(updated);
      setValues(makeValues(user, updated));
      setIsEditing(false);
      setMessage('Đã cập nhật Owner Profile thành công. Email và số điện thoại vẫn giữ nguyên.');
      onProfileSaved?.(updated);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật Owner Profile.');
    } finally {
      setIsSaving(false);
    }
  }

  function renderError(name) {
    if (!errors[name]) return null;
    return <span className="text-xs font-bold text-danger">{errors[name]}</span>;
  }

  if (isLoading) {
    return <div className="admin-alert success" role="status">Đang tải Owner Profile...</div>;
  }

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Owner Profile</p>
            <h2>Thông tin owner</h2>
            <p>Thông tin này lấy từ form đăng ký làm Owner đã được admin duyệt.</p>
          </div>
          {!isEditing && profile && (
            <button className="primary-button compact-button" type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing && profile && (
          <>
            <div className="owner-profile-window">
              <div className="owner-profile-avatar">
                {(profile.fullName || user?.email || 'O').charAt(0).toUpperCase()}
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
              <ProfileField label="Email" value={profile.applicantEmail || user?.email} />
              <ProfileField label="Phone Number" value={profile.applicantPhone || user?.phone} />
              <ProfileField label="Submitted At" value={formatDate(profile.submittedAt)} />
              <ProfileField label="Approved At" value={formatDate(profile.approvedAt)} />
              <ProfileField label="Owner Since" value={formatDate(profile.ownerSince)} />
            </div>

            <div className="mt-5 rounded-2xl border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">National ID / Passport Image</span>
              {profile.identityDocumentImage ? (
                <div className="mt-3 identity-preview-card large">
                  <img src={profile.identityDocumentImage} alt="Owner National ID or Passport" />
                </div>
              ) : (
                <strong className="mt-1 block text-brown-900">Chưa cập nhật</strong>
              )}
              {profile.identityDocumentFileName && <small className="mt-2 block font-bold text-slate-500">{profile.identityDocumentFileName}</small>}
            </div>
          </>
        )}

        {isEditing && (
          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Full Name</span>
                <input className={inputClass} name="fullName" value={values.fullName} onChange={handleChange} disabled={isSaving} />
                {renderError('fullName')}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Date of Birth</span>
                <input className={inputClass} name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={handleChange} disabled={isSaving} />
                {renderError('dateOfBirth')}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Gender</span>
                <select className={inputClass} name="gender" value={values.gender} onChange={handleChange} disabled={isSaving}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {renderError('gender')}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Nationality</span>
                <input className={inputClass} name="nationality" value={values.nationality} onChange={handleChange} disabled={isSaving} />
                {renderError('nationality')}
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-extrabold text-brown-900">Address</span>
                <input className={inputClass} name="address" value={values.address} onChange={handleChange} disabled={isSaving} />
                {renderError('address')}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Email</span>
                <input className={inputClass} value={values.email} readOnly disabled />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Phone Number</span>
                <input className={inputClass} value={values.phone || 'Chưa cập nhật'} readOnly disabled />
              </label>

              <div className="grid gap-2 md:col-span-2">
                <span className="text-sm font-extrabold text-brown-900">National ID / Passport Image</span>

                <div className="identity-upload-box readonly">
                  <div>
                    <strong>Ảnh giấy tờ không được chỉnh sửa</strong>
                    <p>National ID / Passport image chỉ được gửi lúc đăng ký làm Owner. Owner không thể tự thay đổi ảnh này.</p>
                    {values.identityDocumentFileName && <small>{values.identityDocumentFileName}</small>}
                  </div>
                </div>

                {values.identityDocumentImage ? (
                  <div className="identity-preview-card">
                    <img src={values.identityDocumentImage} alt="National ID or Passport preview" />
                  </div>
                ) : (
                  <div className="admin-alert error">Chưa có ảnh National ID / Passport.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </button>
              <button className="primary-button sm:w-auto" type="submit" disabled={!canSave || isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
