import { useMemo, useState } from 'react';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';
const acceptedTypes = '.pdf,.jpg,.jpeg,.png';
const steps = ['Personal Information', 'Stable Information', 'Horse Ownership Proof', 'Review & Submit'];

function makeInitialValues(user, application) {
  return {
    fullName: application?.fullName || user?.fullName || '',
    dateOfBirth: application?.dateOfBirth || '',
    gender: application?.gender || 'MALE',
    nationality: application?.nationality || 'Vietnamese',
    address: application?.address || '',
    stableName: application?.stableName || '',
    stableAddress: application?.stableAddress || '',
    totalHorsesOwned: application?.totalHorsesOwned || '',
    identityDocumentFile: null,
    stableCertificateFile: null,
    horseOwnershipProofFile: null,
    email: user?.email || application?.applicantEmail || '',
    phone: user?.phone || application?.applicantPhone || ''
  };
}

function isAllowedFile(file) {
  const extension = String(file?.name || '').split('.').pop()?.toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  return (
    type === 'application/pdf' ||
    type === 'image/jpeg' ||
    type === 'image/png' ||
    ['pdf', 'jpg', 'jpeg', 'png'].includes(extension)
  );
}

function required(value) {
  return String(value || '').trim().length > 0;
}

function FieldError({ children }) {
  if (!children) return null;
  return <span className="text-xs font-bold text-danger">{children}</span>;
}

function FileField({ label, helper, name, file, error, disabled, onChange, onRemove }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-extrabold text-brown-900">{label} *</span>
      <div className="identity-upload-box">
        <div>
          <strong>{file?.name || 'No file selected'}</strong>
          <p>{helper}</p>
          <small>Supported formats: PDF, JPG, JPEG, PNG.</small>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="outline-button compact-button cursor-pointer">
            {file ? 'Replace' : 'Choose File'}
            <input className="sr-only" type="file" accept={acceptedTypes} name={name} onChange={onChange} disabled={disabled} />
          </label>
          {file && (
            <button className="outline-button danger-action compact-button" type="button" onClick={() => onRemove(name)} disabled={disabled}>
              Remove
            </button>
          )}
        </div>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function SummaryRow({ label, value, file }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {file ? (
        <a className="outline-button compact-button mt-2 inline-flex" href={URL.createObjectURL(file)} target="_blank" rel="noreferrer">
          View {file.name}
        </a>
      ) : (
        <strong className="mt-1 block break-words text-brown-900">{value || 'Not updated'}</strong>
      )}
    </div>
  );
}

export default function OwnerApplicationForm({ user, application, onSubmit, onCancel, isSubmitting }) {
  const [values, setValues] = useState(() => makeInitialValues(user, application));
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);

  const isLastStep = step === steps.length - 1;
  const currentErrors = useMemo(() => errors, [errors]);

  function validateStep(targetStep = step) {
    const nextErrors = {};

    if (targetStep === 0) {
      if (!required(values.fullName)) nextErrors.fullName = 'Full Name is required.';
      if (!required(values.dateOfBirth)) nextErrors.dateOfBirth = 'Date of Birth is required.';
      if (!required(values.gender)) nextErrors.gender = 'Gender is required.';
      if (!required(values.nationality)) nextErrors.nationality = 'Nationality is required.';
      if (!required(values.address)) nextErrors.address = 'Residential Address is required.';
      if (!values.identityDocumentFile) nextErrors.identityDocumentFile = 'Identity Document is required.';
    }

    if (targetStep === 1) {
      if (!required(values.stableName)) nextErrors.stableName = 'Stable Name is required.';
      if (!required(values.stableAddress)) nextErrors.stableAddress = 'Stable Address is required.';
      if (!values.stableCertificateFile) nextErrors.stableCertificateFile = 'Stable Certificate is required.';
    }

    if (targetStep === 2) {
      if (!required(values.totalHorsesOwned)) nextErrors.totalHorsesOwned = 'Total Horses Owned is required.';
      if (Number(values.totalHorsesOwned) < 1) nextErrors.totalHorsesOwned = 'Total Horses Owned must be at least 1.';
      if (!values.horseOwnershipProofFile) nextErrors.horseOwnershipProofFile = 'Horse Ownership Proof is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleFileChange(event) {
    const { name } = event.target;
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;
    if (!isAllowedFile(file)) {
      setErrors((current) => ({ ...current, [name]: 'File only supports PDF, JPG, JPEG, PNG.' }));
      return;
    }

    setValues((current) => ({ ...current, [name]: file }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleRemoveFile(name) {
    setValues((current) => ({ ...current, [name]: null }));
    setErrors((current) => ({ ...current, [name]: 'This file is required.' }));
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((current) => Math.min(steps.length - 1, current + 1));
    }
  }

  function handleBack() {
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Owner Application</p>
            <h2 className="text-3xl font-black text-brown-900">Become an Owner</h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">Submit your owner, stable, and horse ownership documents for admin review.</p>
          </div>
          <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-4">
          {steps.map((label, index) => (
            <div className={`rounded-lg border px-3 py-2 text-sm font-extrabold ${index === step ? 'border-brown-500 bg-white text-brown-900' : 'border-brown-700/10 bg-cream-200/60 text-slate-500'}`} key={label}>
              {index + 1}. {label}
            </div>
          ))}
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Email</span>
                <input className={inputClass} value={values.email} readOnly disabled />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Phone Number</span>
                <input className={inputClass} value={values.phone || 'Not updated'} readOnly disabled />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Full Name *</span>
                <input className={inputClass} name="fullName" value={values.fullName} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.fullName}</FieldError>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Date of Birth *</span>
                <input className={inputClass} name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.dateOfBirth}</FieldError>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Gender *</span>
                <select className={inputClass} name="gender" value={values.gender} onChange={handleChange} disabled={isSubmitting}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError>{currentErrors.gender}</FieldError>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Nationality *</span>
                <input className={inputClass} name="nationality" value={values.nationality} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.nationality}</FieldError>
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-extrabold text-brown-900">Residential Address *</span>
                <input className={inputClass} name="address" value={values.address} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.address}</FieldError>
              </label>
              <div className="md:col-span-2">
                <FileField label="Identity Document" helper="Upload Citizen ID Card or Passport." name="identityDocumentFile" file={values.identityDocumentFile} error={currentErrors.identityDocumentFile} disabled={isSubmitting} onChange={handleFileChange} onRemove={handleRemoveFile} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Stable Name *</span>
                <input className={inputClass} name="stableName" value={values.stableName} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.stableName}</FieldError>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Stable Address *</span>
                <input className={inputClass} name="stableAddress" value={values.stableAddress} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.stableAddress}</FieldError>
              </label>
              <FileField label="Stable Certificate" helper="Upload the ownership certificate of your stable or farm." name="stableCertificateFile" file={values.stableCertificateFile} error={currentErrors.stableCertificateFile} disabled={isSubmitting} onChange={handleFileChange} onRemove={handleRemoveFile} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Total Horses Owned *</span>
                <input className={inputClass} name="totalHorsesOwned" type="number" min="1" value={values.totalHorsesOwned} onChange={handleChange} disabled={isSubmitting} />
                <FieldError>{currentErrors.totalHorsesOwned}</FieldError>
              </label>
              <FileField label="Horse Ownership Proof" helper="Upload horse registration documents, ownership certificate, approved horse list, or another official ownership document." name="horseOwnershipProofFile" file={values.horseOwnershipProofFile} error={currentErrors.horseOwnershipProofFile} disabled={isSubmitting} onChange={handleFileChange} onRemove={handleRemoveFile} />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5">
              <section>
                <h3 className="text-xl font-black text-brown-900">Personal Information</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Full Name" value={values.fullName} />
                  <SummaryRow label="Date of Birth" value={values.dateOfBirth} />
                  <SummaryRow label="Gender" value={values.gender} />
                  <SummaryRow label="Nationality" value={values.nationality} />
                  <SummaryRow label="Address" value={values.address} />
                  <SummaryRow label="View Identity Document" file={values.identityDocumentFile} />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-black text-brown-900">Stable Information</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Stable Name" value={values.stableName} />
                  <SummaryRow label="Stable Address" value={values.stableAddress} />
                  <SummaryRow label="View Stable Certificate" file={values.stableCertificateFile} />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-black text-brown-900">Horse Ownership</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Total Horses Owned" value={values.totalHorsesOwned} />
                  <SummaryRow label="View Horse Ownership Proof" file={values.horseOwnershipProofFile} />
                </div>
              </section>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
            {step > 0 && (
              <button className="outline-button" type="button" onClick={handleBack} disabled={isSubmitting}>
                Back
              </button>
            )}
            {!isLastStep ? (
              <button className="primary-button sm:w-auto" type="button" onClick={handleNext} disabled={isSubmitting}>
                Next
              </button>
            ) : (
              <button className="primary-button sm:w-auto" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Owner Application'}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
