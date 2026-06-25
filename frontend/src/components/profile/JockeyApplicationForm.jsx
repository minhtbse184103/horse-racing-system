import { useMemo, useState } from 'react';
import { uploadFile } from '../../services/uploadService.js';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function makeInitialValues(user, application) {
  const files = Array.isArray(application?.files) ? application.files : [];
  const verificationLinks = String(application?.verificationLink || '')
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);

  return {
    fullName: application?.jockeyFullName || application?.fullName || user?.fullName || user?.username || '',
    applicantEmail: user?.email || '',
    trainerName: application?.trainerName || '',
    trainerEmail: application?.trainerEmail || '',
    academyStableAddress: application?.academyStableAddress || '',
    issuingAuthority: application?.issuingAuthority || '',
    verificationLinks: verificationLinks.length > 0 ? verificationLinks : [''],
    licenceType: application?.licenceType || 'PRO',
    expiryDate: application?.expiryDate || '',
    weight: application?.weight == null ? '55' : String(application.weight),
    ranking: application?.ranking || 'BEGINNER',
    biography: application?.biography || '',
    licenseFiles: files.map((file) => ({
      url: file.fileUrl || '',
      name: file.fileUrl ? file.fileUrl.split('/').pop() : 'Licence image',
      fileType: file.fileType || 'IMAGE',
      previewUrl: file.fileUrl || ''
    })).filter((file) => file.url)
  };
}

export default function JockeyApplicationForm({ user, application, mode = 'submit', onSubmit, onCancel, isSubmitting }) {
  const [values, setValues] = useState(() => makeInitialValues(user, application));
  const [errors, setErrors] = useState({});
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const isReady = useMemo(() => {
    const weight = Number(values.weight);

    return (
      values.trainerName.trim() &&
      values.fullName.trim() &&
      values.trainerEmail.trim() &&
      values.issuingAuthority.trim() &&
      values.licenceType.trim() &&
      values.expiryDate &&
      Number.isFinite(weight) &&
      weight >= 35 &&
      weight <= 90 &&
      values.ranking.trim() &&
      values.licenseFiles.length > 0 &&
      values.licenseFiles.length <= 5
    );
  }, [values]);

  function validate() {
    const nextErrors = {};
    const weight = Number(values.weight);

    if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required.';
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
    const links = values.verificationLinks.map((link) => link.trim()).filter(Boolean);
    const invalidLink = links.find((link) => !/^https?:\/\/.+/i.test(link));
    if (invalidLink) {
      nextErrors.verificationLinks = 'Every verification link must start with http:// or https://.';
    }
    if (values.licenseFiles.length === 0) nextErrors.licenseFiles = 'At least one jockey licence image is required.';
    if (values.licenseFiles.length > 5) nextErrors.licenseFiles = 'You can upload at most 5 licence images.';

    setErrors(nextErrors);
    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleVerificationLinkChange(index, nextValue) {
    setValues((current) => ({
      ...current,
      verificationLinks: current.verificationLinks.map((link, linkIndex) =>
        linkIndex === index ? nextValue : link
      )
    }));
    setErrors((current) => ({ ...current, verificationLinks: '' }));
  }

  function handleAddVerificationLink() {
    setValues((current) => ({
      ...current,
      verificationLinks: [...current.verificationLinks, '']
    }));
  }

  function handleRemoveVerificationLink(index) {
    setValues((current) => ({
      ...current,
      verificationLinks: current.verificationLinks.length === 1
        ? ['']
        : current.verificationLinks.filter((_, linkIndex) => linkIndex !== index)
    }));
    setErrors((current) => ({ ...current, verificationLinks: '' }));
  }

  async function handleLicenseFileChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    if (values.licenseFiles.length + files.length > 5) {
      setErrors((current) => ({ ...current, licenseFiles: 'You can upload at most 5 licence images.' }));
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setErrors((current) => ({ ...current, licenseFiles: 'Only image files are supported.' }));
      return;
    }

    setIsUploadingLicense(true);

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const uploaded = await uploadFile(file, 'jockey-license');
          const uploadedUrl = uploaded.url || '';
          return {
            url: uploadedUrl,
            name: uploaded.originalFilename || file.name,
            fileType: 'IMAGE',
            previewUrl: uploadedUrl
          };
        })
      );

      setValues((current) => ({
        ...current,
        licenseFiles: [...current.licenseFiles, ...uploadedFiles].slice(0, 5)
      }));
      setErrors((current) => ({ ...current, licenseFiles: '' }));
    } catch (error) {
      setErrors((current) => ({ ...current, licenseFiles: error.message || 'Cannot upload licence images.' }));
    } finally {
      setIsUploadingLicense(false);
    }
  }

  function handleRemoveLicense(index) {
    setValues((current) => ({
      ...current,
      licenseFiles: current.licenseFiles.filter((_, fileIndex) => fileIndex !== index)
    }));
    setErrors((current) => ({ ...current, licenseFiles: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      fullName: values.fullName.trim(),
      trainerName: values.trainerName.trim(),
      trainerEmail: values.trainerEmail.trim(),
      academyStableAddress: values.academyStableAddress.trim(),
      issuingAuthority: values.issuingAuthority.trim(),
      verificationLink: values.verificationLinks.map((link) => link.trim()).filter(Boolean).join('\n'),
      licenceType: values.licenceType.trim(),
      expiryDate: values.expiryDate,
      weight: Number(values.weight),
      ranking: values.ranking.trim(),
      biography: values.biography.trim(),
      files: values.licenseFiles.map((file) => ({
        fileUrl: file.url,
        fileType: file.fileType
      }))
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
              <span className="text-sm font-extrabold text-brown-900">Full Name</span>
              <input className={inputClass} name="fullName" value={values.fullName} onChange={handleChange} disabled={isSubmitting} />
              {renderError('fullName')}
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

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Verification Link</span>
              <div className="grid gap-2">
                {values.verificationLinks.map((link, index) => (
                  <div className="flex gap-2 max-sm:flex-col" key={`verification-link-${index}`}>
                    <input
                      className={inputClass}
                      placeholder="https://authority.example/verify/your-license"
                      value={link}
                      onChange={(event) => handleVerificationLinkChange(index, event.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      className="outline-button compact-button"
                      type="button"
                      onClick={() => handleRemoveVerificationLink(index)}
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button className="outline-button compact-button justify-self-start" type="button" onClick={handleAddVerificationLink} disabled={isSubmitting}>
                Add Link
              </button>
              <span className="text-xs font-semibold text-slate-500">Enter verification links manually. Uploaded licence images will not be copied here automatically.</span>
              {renderError('verificationLinks')}
            </div>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Biography</span>
              <textarea className={`${inputClass} min-h-28 resize-none`} name="biography" value={values.biography} onChange={handleChange} disabled={isSubmitting} />
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Jockey Licence File</span>
              <div className="identity-upload-box">
                <div>
                  <strong>Upload licence proof</strong>
                  <p>Upload up to 5 images of your jockey licence for admin review.</p>
                  <small>Supported formats: JPG, PNG, WebP. {values.licenseFiles.length}/5 uploaded.</small>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="outline-button compact-button cursor-pointer">
                    {isUploadingLicense ? 'Uploading...' : 'Choose Images'}
                    <input className="sr-only" type="file" accept="image/*" multiple onChange={handleLicenseFileChange} disabled={isSubmitting || isUploadingLicense || values.licenseFiles.length >= 5} />
                  </label>
                </div>
              </div>
              {values.licenseFiles.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {values.licenseFiles.map((file, index) => (
                    <div className="identity-preview-card flex h-full min-h-[19rem] flex-col" key={file.url || index}>
                      <img
                        className="h-56 w-full rounded-lg bg-white object-contain"
                        src={file.previewUrl || file.url}
                        alt={`Jockey licence preview ${index + 1}`}
                      />
                      <div className="mt-auto flex min-h-12 items-center justify-between gap-2 pt-3">
                        <a className="min-w-0 flex-1 truncate font-bold text-green-700 underline" href={file.url} target="_blank" rel="noreferrer">
                          {file.name || `Licence image ${index + 1}`}
                        </a>
                        <button className="outline-button danger-action compact-button w-24 shrink-0" type="button" onClick={() => handleRemoveLicense(index)} disabled={isSubmitting}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {renderError('licenseFiles')}
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
