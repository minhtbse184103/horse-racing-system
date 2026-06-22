import { useMemo, useState } from 'react';
import { uploadFile } from '../../services/uploadService.js';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function makeInitialValues(user, application) {
  const firstFile = application?.files?.[0] || {};

  return {
    applicantFullName: user?.fullName || user?.username || '',
    applicantEmail: user?.email || '',
    trainerName: application?.trainerName || '',
    trainerEmail: application?.trainerEmail || '',
    academyStableAddress: application?.academyStableAddress || '',
    issuingAuthority: application?.issuingAuthority || '',
    verificationLink: application?.verificationLink || firstFile.fileUrl || '',
    licenceType: application?.licenceType || 'PRO',
    expiryDate: application?.expiryDate || '',
    weight: application?.weight == null ? '55' : String(application.weight),
    ranking: application?.ranking || 'BEGINNER',
    biography: application?.biography || '',
    licenseFileUrl: firstFile.fileUrl || '',
    licenseFileName: firstFile.fileUrl ? firstFile.fileUrl.split('/').pop() : '',
    licenseFileType: firstFile.fileType || 'IMAGE'
  };
}

function toFileType(file) {
  if (!file) return 'IMAGE';
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type.startsWith('image/')) return 'IMAGE';
  return 'DOCUMENT';
}

export default function JockeyApplicationForm({ user, application, mode = 'submit', onSubmit, onCancel, isSubmitting }) {
  const [values, setValues] = useState(() => makeInitialValues(user, application));
  const [errors, setErrors] = useState({});
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const isReady = useMemo(() => {
    const weight = Number(values.weight);

    return (
      values.trainerName.trim() &&
      values.trainerEmail.trim() &&
      values.issuingAuthority.trim() &&
      values.licenceType.trim() &&
      values.expiryDate &&
      Number.isFinite(weight) &&
      weight >= 35 &&
      weight <= 90 &&
      values.ranking.trim() &&
      values.licenseFileUrl
    );
  }, [values]);

  function validate() {
    const nextErrors = {};
    const weight = Number(values.weight);

    if (!values.trainerName.trim()) nextErrors.trainerName = 'Trainer name is required.';
    if (!values.trainerEmail.trim()) nextErrors.trainerEmail = 'Trainer email is required.';
    if (values.trainerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.trainerEmail)) {
      nextErrors.trainerEmail = 'Trainer email is invalid.';
    }
    if (!values.issuingAuthority.trim()) nextErrors.issuingAuthority = 'Issuing authority is required.';
    if (!values.licenceType.trim()) nextErrors.licenceType = 'Licence type is required.';
    if (!values.expiryDate) nextErrors.expiryDate = 'Expiry date is required.';
    if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
      nextErrors.weight = 'Jockey weight must be between 35 and 90 kg.';
    }
    if (!values.ranking.trim()) nextErrors.ranking = 'Ranking is required.';
    if (values.verificationLink && !/^https?:\/\/.+/i.test(values.verificationLink)) {
      nextErrors.verificationLink = 'Verification link must start with http:// or https://.';
    }
    if (!values.licenseFileUrl) nextErrors.licenseFileUrl = 'Jockey licence file is required.';

    setErrors(nextErrors);
    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleLicenseFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrors((current) => ({ ...current, licenseFileUrl: 'Only image or PDF files are supported.' }));
      return;
    }

    setIsUploadingLicense(true);

    try {
      const uploaded = await uploadFile(file, 'jockey-license');
      setValues((current) => ({
        ...current,
        licenseFileUrl: uploaded.url,
        licenseFileName: uploaded.originalFilename || file.name,
        licenseFileType: toFileType(file),
        verificationLink: current.verificationLink || uploaded.url
      }));
      setErrors((current) => ({ ...current, licenseFileUrl: '', verificationLink: '' }));
    } catch (error) {
      setErrors((current) => ({ ...current, licenseFileUrl: error.message || 'Cannot upload licence file.' }));
    } finally {
      setIsUploadingLicense(false);
    }
  }

  function handleRemoveLicense() {
    setValues((current) => ({
      ...current,
      licenseFileUrl: '',
      licenseFileName: '',
      licenseFileType: 'IMAGE'
    }));
    setErrors((current) => ({ ...current, licenseFileUrl: 'Jockey licence file is required.' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      trainerName: values.trainerName.trim(),
      trainerEmail: values.trainerEmail.trim(),
      academyStableAddress: values.academyStableAddress.trim(),
      issuingAuthority: values.issuingAuthority.trim(),
      verificationLink: values.verificationLink.trim(),
      licenceType: values.licenceType.trim(),
      expiryDate: values.expiryDate,
      weight: Number(values.weight),
      ranking: values.ranking.trim(),
      biography: values.biography.trim(),
      files: [
        {
          fileUrl: values.licenseFileUrl,
          fileType: values.licenseFileType
        }
      ]
    });
  }

  function renderError(name) {
    if (!errors[name]) return null;
    return <span className="text-xs font-bold text-danger">{errors[name]}</span>;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Jockey Application</p>
            <h2 className="text-3xl font-black text-brown-900">
              {mode === 'resubmit' ? 'Apply Again as Jockey' : 'Become a Jockey'}
            </h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">
              Submit licence and trainer information for administrator approval. After approval, sign in again to enter the Jockey workspace.
            </p>
          </div>
          <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Applicant Name</span>
              <input className={inputClass} value={values.applicantFullName || 'Chua cap nhat'} readOnly disabled />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Applicant Email</span>
              <input className={inputClass} value={values.applicantEmail || 'Chua cap nhat'} readOnly disabled />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Trainer Name</span>
              <input className={inputClass} name="trainerName" value={values.trainerName} onChange={handleChange} disabled={isSubmitting} />
              {renderError('trainerName')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Trainer Email</span>
              <input className={inputClass} name="trainerEmail" type="email" value={values.trainerEmail} onChange={handleChange} disabled={isSubmitting} />
              {renderError('trainerEmail')}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Academy / Stable Address</span>
              <input className={inputClass} name="academyStableAddress" value={values.academyStableAddress} onChange={handleChange} disabled={isSubmitting} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Issuing Authority</span>
              <input className={inputClass} name="issuingAuthority" value={values.issuingAuthority} onChange={handleChange} disabled={isSubmitting} />
              {renderError('issuingAuthority')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Licence Type</span>
              <select className={inputClass} name="licenceType" value={values.licenceType} onChange={handleChange} disabled={isSubmitting}>
                <option value="PRO">PRO</option>
                <option value="AMATEUR">AMATEUR</option>
                <option value="TRAINEE">TRAINEE</option>
              </select>
              {renderError('licenceType')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Expiry Date</span>
              <input className={inputClass} name="expiryDate" type="date" value={values.expiryDate} onChange={handleChange} disabled={isSubmitting} />
              {renderError('expiryDate')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Weight (kg)</span>
              <input className={inputClass} name="weight" type="number" min="35" max="90" step="0.01" value={values.weight} onChange={handleChange} disabled={isSubmitting} />
              {renderError('weight')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Ranking</span>
              <select className={inputClass} name="ranking" value={values.ranking} onChange={handleChange} disabled={isSubmitting}>
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ELITE">ELITE</option>
              </select>
              {renderError('ranking')}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Verification Link</span>
              <input className={inputClass} name="verificationLink" placeholder="https://authority.example/verify/your-license" value={values.verificationLink} onChange={handleChange} disabled={isSubmitting} />
              {renderError('verificationLink')}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Biography</span>
              <textarea className={`${inputClass} min-h-28 resize-none`} name="biography" value={values.biography} onChange={handleChange} disabled={isSubmitting} />
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Jockey Licence File</span>
              <div className="identity-upload-box">
                <div>
                  <strong>Upload licence proof</strong>
                  <p>Upload an image or PDF of your jockey licence for admin review.</p>
                  <small>Supported formats: JPG, PNG, PDF.</small>
                  {values.licenseFileName && <small>{values.licenseFileName}</small>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="outline-button compact-button cursor-pointer">
                    {isUploadingLicense ? 'Uploading...' : 'Choose File'}
                    <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={handleLicenseFileChange} disabled={isSubmitting || isUploadingLicense} />
                  </label>
                  {values.licenseFileUrl && (
                    <button className="outline-button danger-action compact-button" type="button" onClick={handleRemoveLicense} disabled={isSubmitting}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {values.licenseFileUrl && (
                <div className="identity-preview-card">
                  <a className="font-bold text-green-700 underline" href={values.licenseFileUrl} target="_blank" rel="noreferrer">
                    View uploaded licence
                  </a>
                </div>
              )}
              {renderError('licenseFileUrl')}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
            <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="primary-button sm:w-auto" type="submit" disabled={!isReady || isSubmitting || isUploadingLicense}>
              {isSubmitting ? 'Submitting...' : mode === 'resubmit' ? 'Submit Again' : 'Submit Application'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
