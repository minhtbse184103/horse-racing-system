import { needsKycSubmission } from '../../services/kycService';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';

export const initialKycValues = {
  fullName: '',
  dateOfBirth: '',
  gender: 'MALE',
  nationality: 'Vietnamese',
  address: '',
  identityNumber: '',
  identityFrontFile: null,
  identityBackFile: null,
  selfieFile: null
};

export function makeInitialKycValues(user, kyc) {
  return {
    fullName: kyc?.fullName || user?.fullName || user?.username || '',
    dateOfBirth: kyc?.dateOfBirth || '',
    gender: kyc?.gender || 'MALE',
    nationality: kyc?.nationality || 'Vietnamese',
    address: kyc?.address || '',
    identityNumber: '',
    identityFrontFile: null,
    identityBackFile: null,
    selfieFile: null
  };
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isAdult(value) {
  const date = parseLocalDate(value);
  if (!date) return false;
  const today = startOfToday();
  const adultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return date <= adultDate;
}

function todayInputValue() {
  return startOfToday().toISOString().slice(0, 10);
}

export function validateKycValues(values, kyc) {
  if (!needsKycSubmission(kyc)) return {};

  const errors = {};
  if (!String(values.fullName || '').trim()) errors.kycFullName = 'KYC full name is required.';
  if (!values.dateOfBirth) {
    errors.kycDateOfBirth = 'KYC date of birth is required.';
  } else {
    const birthDate = parseLocalDate(values.dateOfBirth);
    if (!birthDate || birthDate >= startOfToday()) {
      errors.kycDateOfBirth = 'KYC date of birth must be in the past.';
    } else if (!isAdult(values.dateOfBirth)) {
      errors.kycDateOfBirth = 'You must be at least 18 years old to submit KYC.';
    }
  }
  if (!String(values.gender || '').trim()) errors.kycGender = 'KYC gender is required.';
  if (!String(values.nationality || '').trim()) errors.kycNationality = 'KYC nationality is required.';
  if (!String(values.address || '').trim()) errors.kycAddress = 'KYC address is required.';
  if (!/^\d{12}$/.test(String(values.identityNumber || '').trim())) {
    errors.kycIdentityNumber = 'Identity number must contain exactly 12 digits.';
  }
  if (!values.identityFrontFile) errors.kycIdentityFrontFile = 'Identity front image is required.';
  if (!values.identityBackFile) errors.kycIdentityBackFile = 'Identity back image is required.';
  if (!values.selfieFile) errors.kycSelfieFile = 'Selfie image is required.';
  return errors;
}

function FieldError({ children }) {
  if (!children) return null;
  return <span className="text-xs font-bold text-danger">{children}</span>;
}

function isKycImage(file) {
  const type = String(file?.type || '').toLowerCase();
  return type === 'image/jpeg' || type === 'image/png';
}

function FileInput({ label, name, file, error, disabled, onChange, onRemove }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-extrabold text-brown-900">{label} *</span>
      <div className="identity-upload-box">
        <div>
          <strong>{file?.name || 'No image selected'}</strong>
          <p>Upload JPG or PNG image for KYC review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="outline-button compact-button cursor-pointer">
            {file ? 'Replace' : 'Choose Image'}
            <input
              className="sr-only"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              name={name}
              onChange={onChange}
              disabled={disabled}
            />
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

export default function KycInlineSection({ kyc, values, setValues, errors, setErrors, disabled }) {
  const status = String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
  const mustSubmit = needsKycSubmission(kyc);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      kyc: { ...current.kyc, [name]: value }
    }));
    setErrors((current) => ({ ...current, [`kyc${name.charAt(0).toUpperCase()}${name.slice(1)}`]: '' }));
  }

  function handleFileChange(event) {
    const { name } = event.target;
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) return;
    if (!isKycImage(file)) {
      setErrors((current) => ({ ...current, [`kyc${name.charAt(0).toUpperCase()}${name.slice(1)}`]: 'KYC only supports JPG or PNG images.' }));
      return;
    }
    setValues((current) => ({
      ...current,
      kyc: { ...current.kyc, [name]: file }
    }));
    setErrors((current) => ({ ...current, [`kyc${name.charAt(0).toUpperCase()}${name.slice(1)}`]: '' }));
  }

  function handleRemoveFile(name) {
    setValues((current) => ({
      ...current,
      kyc: { ...current.kyc, [name]: null }
    }));
  }

  return (
    <section className="rounded-lg border border-brown-700/10 bg-white/55 p-4 md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">KYC Verification</p>
          <h3 className="text-xl font-black text-brown-900">Identity verification</h3>
        </div>
        <span className={`status-badge ${status.toLowerCase()}`}>{status.replace(/_/g, ' ')}</span>
      </div>

      {!mustSubmit ? (
        <div className="mt-4 rounded-2xl border border-green-700/20 bg-green-50 p-4 text-sm font-bold text-green-800">
          {status === 'PENDING'
            ? 'Your KYC is already pending. This application will be reviewed together with that KYC record.'
            : 'Your KYC is already verified. You do not need to submit KYC again.'}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {status === 'REJECTED' && kyc?.rejectionReason && (
            <div className="rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger md:col-span-2">
              Previous KYC rejection reason: {kyc.rejectionReason}
            </div>
          )}
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">KYC Full Name *</span>
            <input className={inputClass} name="fullName" value={values.fullName} onChange={handleChange} disabled={disabled} />
            <FieldError>{errors.kycFullName}</FieldError>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">KYC Date of Birth *</span>
            <input className={inputClass} name="dateOfBirth" type="date" max={todayInputValue()} value={values.dateOfBirth} onChange={handleChange} disabled={disabled} />
            <FieldError>{errors.kycDateOfBirth}</FieldError>
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-extrabold text-brown-900">Identity Number *</span>
            <input className={inputClass} name="identityNumber" value={values.identityNumber} onChange={handleChange} maxLength={12} disabled={disabled} />
            <FieldError>{errors.kycIdentityNumber}</FieldError>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Gender *</span>
            <select className={inputClass} name="gender" value={values.gender} onChange={handleChange} disabled={disabled}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <FieldError>{errors.kycGender}</FieldError>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Nationality *</span>
            <input className={inputClass} name="nationality" value={values.nationality} onChange={handleChange} disabled={disabled} />
            <FieldError>{errors.kycNationality}</FieldError>
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-extrabold text-brown-900">Residential Address *</span>
            <input className={inputClass} name="address" value={values.address} onChange={handleChange} disabled={disabled} />
            <FieldError>{errors.kycAddress}</FieldError>
          </label>
          <FileInput label="Identity Front" name="identityFrontFile" file={values.identityFrontFile} error={errors.kycIdentityFrontFile} disabled={disabled} onChange={handleFileChange} onRemove={handleRemoveFile} />
          <FileInput label="Identity Back" name="identityBackFile" file={values.identityBackFile} error={errors.kycIdentityBackFile} disabled={disabled} onChange={handleFileChange} onRemove={handleRemoveFile} />
          <div className="md:col-span-2">
            <FileInput label="Selfie" name="selfieFile" file={values.selfieFile} error={errors.kycSelfieFile} disabled={disabled} onChange={handleFileChange} onRemove={handleRemoveFile} />
          </div>
        </div>
      )}
    </section>
  );
}
