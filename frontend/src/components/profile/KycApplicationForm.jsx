import { useState } from 'react';
import KycInlineSection, { makeInitialKycValues, validateKycValues } from './KycInlineSection';

export default function KycApplicationForm({ user, kyc, formError = '', isSubmitting, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({
    kyc: makeInitialKycValues(user, kyc)
  }));
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateKycValues(values.kyc, kyc);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values.kyc);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brown-900/45 px-4 py-6 backdrop-blur-sm">
      <form className="mx-auto w-full max-w-4xl rounded-[28px] border border-brown-700/10 bg-cream-100 p-5 shadow-[0_28px_80px_rgba(43,23,16,0.3)] md:p-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="eyebrow">KYC Verification</p>
            <h2 className="text-3xl font-black text-brown-900">Submit identity verification</h2>
            <p className="mt-2 max-w-2xl font-medium leading-7 text-slate-500">
              Submit your identity information for admin review. After approval, your wallet can be opened.
            </p>
          </div>
          <span className={`status-badge ${String(kyc?.status || 'NOT_SUBMITTED').toLowerCase()}`}>
            {String(kyc?.status || 'NOT_SUBMITTED').replace(/_/g, ' ')}
          </span>
        </div>

        {formError && <div className="admin-alert error mt-5" role="alert">{formError}</div>}

        <div className="mt-5">
          <KycInlineSection
            kyc={kyc}
            values={values.kyc}
            setValues={setValues}
            errors={errors}
            setErrors={setErrors}
            disabled={isSubmitting}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="primary-button sm:w-auto" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit KYC'}
          </button>
        </div>
      </form>
    </div>
  );
}
