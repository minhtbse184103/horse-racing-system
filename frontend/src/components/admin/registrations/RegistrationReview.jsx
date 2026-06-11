import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  confirmRegistration,
  getAcceptedRegistrations,
  getRegistrationHistory,
  rejectRegistration
} from '../../../services/adminRegistrationService';

function formatStatus(status) {
  return String(status || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function getStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'accepted':
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-cream-200 text-brown-700';
  }
}

export default function RegistrationReview() {
  const [activeTab, setActiveTab] = useState('accepted');
  const [accepted, setAccepted] = useState([]);
  const [history, setHistory] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewConfirmation, setReviewConfirmation] = useState(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    setIsLoading(true);
    setError('');

    try {
      const [acceptedData, historyData] = await Promise.all([
        getAcceptedRegistrations(),
        getRegistrationHistory()
      ]);

      setAccepted(Array.isArray(acceptedData) ? acceptedData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(err.message || 'Unable to load registrations.');
    } finally {
      setIsLoading(false);
    }
  }

  async function reviewRegistration(registrationId, action) {
    setProcessingId(registrationId);
    setReviewConfirmation(null);
    setError('');
    setMessage('');

    try {
      if (action === 'confirm') {
        await confirmRegistration(registrationId);
        setMessage('Registration confirmed successfully.');
      } else {
        await rejectRegistration(registrationId);
        setMessage('Registration rejected successfully.');
      }

      await loadRegistrations();
    } catch (err) {
      setError(err.message || 'Unable to review registration.');
    } finally {
      setProcessingId(null);
    }
  }

  const registrations = activeTab === 'accepted' ? accepted : history;
  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return registrations;

    return registrations.filter((registration) =>
      [
        registration.registrationId,
        registration.tournamentName,
        registration.horseName,
        registration.ownerName,
        registration.jockeyName,
        registration.status
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [registrations, search]);
  const isRejecting = reviewConfirmation?.action === 'reject';

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin
          </p>
          <h1 className="text-4xl font-black text-brown-900 md:text-5xl">
            Registration Review
          </h1>
          <p className="mt-3 text-slate-500">
            Review registrations accepted by jockeys and view review history.
          </p>
        </div>

        <button
          className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/40 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          type="button"
          onClick={loadRegistrations}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          className={`rounded-xl border px-5 py-3 font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'accepted'
              ? 'border-brown-700 bg-brown-700 text-white shadow-lg'
              : 'border-brown-700/20 bg-white/70 text-brown-700 hover:bg-cream-200'
          }`}
          type="button"
          onClick={() => setActiveTab('accepted')}
        >
          Pending Review ({accepted.length})
        </button>

        <button
          className={`rounded-xl border px-5 py-3 font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'history'
              ? 'border-brown-700 bg-brown-700 text-white shadow-lg'
              : 'border-brown-700/20 bg-white/70 text-brown-700 hover:bg-cream-200'
          }`}
          type="button"
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4 max-sm:grid">
          <div>
            <h2 className="text-xl font-extrabold text-brown-900">
              {activeTab === 'accepted' ? 'Pending Review' : 'Review History'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredRegistrations.length} of {registrations.length}{' '}
              registrations
            </p>
          </div>
          <label className="relative block w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Search tournament, horse, owner, jockey, or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-6 py-10 text-slate-500">Loading registrations...</p>
        ) : registrations.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">No registrations found.</p>
        ) : filteredRegistrations.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No registrations match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'ID',
                    'Tournament',
                    'Horse',
                    'Owner',
                    'Jockey',
                    'Status',
                    'Updated'
                  ].map((heading) => (
                    <th
                      className="border-b border-brown-700/10 px-2 py-4 text-left text-[0.68rem] font-extrabold uppercase tracking-wide text-brown-700"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                  {activeTab === 'accepted' && (
                    <th className="border-b border-brown-700/10 px-2 py-4 text-left text-[0.68rem] font-extrabold uppercase tracking-wide text-brown-700">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.map((registration) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={registration.registrationId}
                  >
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold text-brown-900">
                      #{registration.registrationId}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.tournamentName || 'N/A'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.horseName || 'N/A'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.ownerName || 'N/A'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.jockeyName || 'N/A'}
                    </td>
                    <td className="border-b border-brown-700/10 px-2 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                          registration.status
                        )}`}
                      >
                        {formatStatus(registration.status)}
                      </span>
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-2 py-4 text-[0.7rem] font-bold leading-snug text-slate-500">
                      {registration.updatedAt
                        ? new Date(registration.updatedAt).toLocaleString()
                        : 'N/A'}
                    </td>

                    {activeTab === 'accepted' && (
                      <td className="border-b border-brown-700/10 px-2 py-4">
                        <div className="grid gap-2">
                          <button
                            className="rounded-xl border border-green-700/20 bg-green-50 px-2 py-2 text-xs font-extrabold text-green-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
                            type="button"
                            disabled={
                              processingId === registration.registrationId
                            }
                            onClick={() =>
                              setReviewConfirmation({
                                registration,
                                action: 'confirm'
                              })
                            }
                          >
                            Confirm
                          </button>

                          <button
                            className="rounded-xl border border-danger/20 bg-danger-bg px-2 py-2 text-xs font-extrabold text-danger shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
                            type="button"
                            disabled={
                              processingId === registration.registrationId
                            }
                            onClick={() =>
                              setReviewConfirmation({
                                registration,
                                action: 'reject'
                              })
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {reviewConfirmation && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={() => setReviewConfirmation(null)}
        >
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-lg border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 max-sm:p-5 ${
              isRejecting ? 'before:bg-danger' : 'before:bg-green-700'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-brown-700/20 bg-white/70 text-xl text-slate-500 transition hover:bg-cream-200"
              type="button"
              aria-label="Close confirmation"
              onClick={() => setReviewConfirmation(null)}
            >
              ×
            </button>

            <div className="flex items-center gap-4 pr-10">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-full text-xl font-black ${
                  isRejecting
                    ? 'bg-danger-bg text-danger'
                    : 'bg-green-100 text-green-700'
                }`}
                aria-hidden="true"
              >
                {reviewConfirmation.action === 'confirm' ? '✓' : '!'}
              </span>
              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">
                  Registration #{reviewConfirmation.registration.registrationId}
                </span>
                <h2
                  className="text-xl font-extrabold text-brown-900"
                  id="confirmation-title"
                >
                  {reviewConfirmation.action === 'confirm'
                    ? 'Confirm registration'
                    : 'Reject registration'}
                </h2>
              </div>
            </div>

            <p className="my-5 leading-relaxed text-slate-500">
              {reviewConfirmation.action === 'confirm'
                ? 'This registration will become eligible for race assignment.'
                : 'This registration will be moved to review history as rejected.'}
            </p>

            <dl className="grid overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10">
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Tournament</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {reviewConfirmation.registration.tournamentName || 'N/A'}
                </dd>
              </div>
              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Horse</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {reviewConfirmation.registration.horseName || 'N/A'}
                </dd>
              </div>
              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Jockey</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {reviewConfirmation.registration.jockeyName || 'N/A'}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="min-h-11 rounded-lg border border-brown-700/20 bg-white/70 px-4 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200"
                type="button"
                onClick={() => setReviewConfirmation(null)}
              >
                Cancel
              </button>

              <button
                className={`min-h-11 rounded-lg border px-4 py-2 font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isRejecting
                    ? 'border-danger bg-danger hover:bg-red-700'
                    : 'border-green-700 bg-green-700 hover:bg-green-800'
                }`}
                type="button"
                disabled={
                  processingId === reviewConfirmation.registration.registrationId
                }
                onClick={() =>
                  reviewRegistration(
                    reviewConfirmation.registration.registrationId,
                    reviewConfirmation.action
                  )
                }
              >
                {reviewConfirmation.action === 'confirm'
                  ? 'Confirm registration'
                  : 'Reject registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
