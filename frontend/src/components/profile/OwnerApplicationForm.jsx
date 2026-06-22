import { useMemo, useState } from 'react';
import { uploadFile } from '../../services/uploadService.js';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

function makeInitialValues(user, application) {
  return {
    fullName: application?.fullName || user?.fullName || '',
    dateOfBirth: application?.dateOfBirth || '',
    gender: application?.gender || 'Male',
    nationality: application?.nationality || 'Vietnamese',
    address: application?.address || '',
    identityDocumentImage: application?.identityDocumentImage || application?.nationalIdImage || application?.passportImage || '',
    identityDocumentFileName: application?.identityDocumentFileName || application?.nationalIdFileName || application?.passportFileName || '',
    email: user?.email || application?.applicantEmail || '',
    phone: user?.phone || application?.applicantPhone || ''
  };
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

export default function OwnerApplicationForm({ user, application, onSubmit, onCancel, isSubmitting }) {
  const [values, setValues] = useState(() => makeInitialValues(user, application));
  const [errors, setErrors] = useState({});
  const [isUploadingIdentity, setIsUploadingIdentity] = useState(false);

  const isReady = useMemo(
    () =>
      values.fullName.trim() &&
      values.dateOfBirth &&
      values.gender &&
      values.nationality.trim() &&
      values.address.trim() &&
      values.identityDocumentImage,
    [values]
  );

  function validate() {
    const nextErrors = {};

    if (!values.fullName.trim()) nextErrors.fullName = 'Full Name là bắt buộc.';
    if (!values.dateOfBirth) nextErrors.dateOfBirth = 'Date of Birth là bắt buộc.';
    if (!values.gender) nextErrors.gender = 'Gender là bắt buộc.';
    if (!values.nationality.trim()) nextErrors.nationality = 'Nationality là bắt buộc.';
    if (!values.address.trim()) nextErrors.address = 'Address là bắt buộc.';
    if (!values.identityDocumentImage) nextErrors.identityDocumentImage = 'Ảnh National ID / Passport là bắt buộc.';

    setErrors(nextErrors);
    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, identityDocumentImage: 'Chỉ được import file ảnh.' }));
      return;
    }

    setIsUploadingIdentity(true);

    try {
      const uploaded = await uploadFile(file, 'owner-identity');
      setValues((current) => ({
        ...current,
        identityDocumentImage: uploaded.url,
        identityDocumentFileName: uploaded.originalFilename || file.name
      }));
      setErrors((current) => ({ ...current, identityDocumentImage: '' }));
    } catch (error) {
      setErrors((current) => ({ ...current, identityDocumentImage: error.message || 'Không thể đọc file ảnh.' }));
    } finally {
      setIsUploadingIdentity(false);
    }
  }

  function handleRemoveImage() {
    setValues((current) => ({ ...current, identityDocumentImage: '', identityDocumentFileName: '' }));
    setErrors((current) => ({ ...current, identityDocumentImage: 'Ảnh National ID / Passport là bắt buộc.' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
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
            <p className="eyebrow">Owner Application</p>
            <h2 className="text-3xl font-black text-brown-900">Become an Owner</h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">
              Submit your personal information for administrator approval. Email and phone are taken from your account.
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
              <span className="text-sm font-extrabold text-brown-900">Date of Birth</span>
              <input className={inputClass} name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={handleChange} disabled={isSubmitting} />
              {renderError('dateOfBirth')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Gender</span>
              <select className={inputClass} name="gender" value={values.gender} onChange={handleChange} disabled={isSubmitting}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {renderError('gender')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Nationality</span>
              <input className={inputClass} name="nationality" value={values.nationality} onChange={handleChange} disabled={isSubmitting} />
              {renderError('nationality')}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">Address</span>
              <input className={inputClass} name="address" value={values.address} onChange={handleChange} disabled={isSubmitting} />
              {renderError('address')}
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">National ID / Passport Image</span>
              <div className="identity-upload-box">
                <div>
                  <strong>Import ảnh giấy tờ</strong>
                  <p>Upload ảnh National ID hoặc Passport. Không nhập số giấy tờ bằng text field.</p>
                  <small>Supported formats: JPG, JPEG, PNG.</small>
                  {values.identityDocumentFileName && <small>{values.identityDocumentFileName}</small>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="outline-button compact-button cursor-pointer">
                    {isUploadingIdentity ? 'Uploading...' : 'Choose Image'}
                    <input className="sr-only" type="file" accept="image/*" onChange={handleImageChange} disabled={isSubmitting || isUploadingIdentity} />
                  </label>
                  {values.identityDocumentImage && (
                    <button className="outline-button danger-action compact-button" type="button" onClick={handleRemoveImage} disabled={isSubmitting}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {values.identityDocumentImage && (
                <div className="identity-preview-card">
                  <img src={values.identityDocumentImage} alt="National ID or Passport preview" />
                </div>
              )}
              {renderError('identityDocumentImage')}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Email</span>
              <input className={inputClass} value={values.email} readOnly disabled />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">Phone Number</span>
              <input className={inputClass} value={values.phone || 'Chưa cập nhật'} readOnly disabled />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
            <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="primary-button sm:w-auto" type="submit" disabled={!isReady || isSubmitting || isUploadingIdentity}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
