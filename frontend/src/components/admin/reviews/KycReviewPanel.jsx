import UrlImagePreview from '../../common/UrlImagePreview';

const KYC_LABELS = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending KYC',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired'
};

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Not updated' : String(value);
}

function formatDateTime(value) {
  if (!value) return 'Not updated';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
}

function getKycStatus(kyc) {
  return String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
}

export function getKycStatusLabel(kyc) {
  const status = getKycStatus(kyc);
  return KYC_LABELS[status] || displayValue(status);
}

export function canApproveRoleWithKyc(kyc) {
  const status = getKycStatus(kyc);
  if (status === 'PENDING') return true;
  if (status !== 'VERIFIED') return false;

  if (!kyc?.expiresAt) return true;
  const expiresAt = new Date(kyc.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > new Date();
}

export function getKycReviewHint(kyc) {
  const status = getKycStatus(kyc);
  if (status === 'PENDING') return 'Approving this role will also verify KYC and open the wallet.';
  if (status === 'VERIFIED') {
    return canApproveRoleWithKyc(kyc)
      ? 'KYC is already verified; approving this role will ensure the wallet is open.'
      : 'KYC is verified but expired. Ask the user to submit KYC again.';
  }
  if (status === 'NOT_SUBMITTED') return 'The user must submit KYC before this role can be approved.';
  if (status === 'REJECTED') return 'KYC was rejected. The user must resubmit KYC before approval.';
  if (status === 'EXPIRED') return 'KYC is expired. The user must resubmit KYC before approval.';
  return 'KYC must be pending or verified before approval.';
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{displayValue(value)}</strong>
    </div>
  );
}

function KycImageCard({ label, url }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {url ? (
        <>
          <UrlImagePreview
            url={url}
            alt={label}
            className="mt-3 max-h-[260px] w-full rounded-lg object-contain"
          />
          <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={url} target="_blank" rel="noreferrer">
            Open image
          </a>
        </>
      ) : (
        <strong className="mt-1 block text-brown-900">Not updated</strong>
      )}
    </div>
  );
}

export default function KycReviewPanel({ kyc }) {
  const status = getKycStatus(kyc);
  const canApprove = canApproveRoleWithKyc(kyc);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-black text-brown-900">KYC verification</h3>
        <span className={`status-badge ${status.toLowerCase()}`}>{getKycStatusLabel(kyc)}</span>
      </div>

      <div className={`mt-3 rounded-2xl border p-4 text-sm font-bold ${canApprove ? 'border-green-700/20 bg-green-50 text-green-800' : 'border-danger/20 bg-danger-bg text-danger'}`}>
        {getKycReviewHint(kyc)}
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <InfoCard label="KYC ID" value={kyc?.verificationId} />
        <InfoCard label="KYC full name" value={kyc?.fullName} />
        <InfoCard label="KYC email" value={kyc?.email} />
        <InfoCard label="Date of birth" value={formatDateTime(kyc?.dateOfBirth)} />
        <InfoCard label="Gender" value={kyc?.gender} />
        <InfoCard label="Nationality" value={kyc?.nationality} />
        <InfoCard label="Address" value={kyc?.address} />
        <InfoCard label="Identity number" value={kyc?.identityNumber} />
        <InfoCard label="Submitted at" value={formatDateTime(kyc?.submittedAt)} />
        <InfoCard label="Reviewed at" value={formatDateTime(kyc?.reviewedAt)} />
        <InfoCard label="Expires at" value={formatDateTime(kyc?.expiresAt)} />
      </div>

      {kyc?.rejectionReason && (
        <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
          KYC rejection reason: {kyc.rejectionReason}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <KycImageCard label="Identity front" url={kyc?.identityFrontUrl} />
        <KycImageCard label="Identity back" url={kyc?.identityBackUrl} />
        <KycImageCard label="Selfie" url={kyc?.selfieUrl} />
      </div>
    </div>
  );
}
