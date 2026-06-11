import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  RefreshCw,
  Search,
  Weight,
  XCircle
} from 'lucide-react';
import {
  approveHorse,
  getPendingHorses,
  rejectHorse
} from '../../../services/adminHorseReviewService';

function formatDate(value) {
  if (!value) return 'Not provided';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function isCertificateExpired(value) {
  if (!value) return true;

  const expiry = new Date(`${value}T23:59:59`);
  return expiry < new Date();
}

function ReviewModal({ review, isProcessing, onClose, onConfirm }) {
  const [feedback, setFeedback] = useState('');
  const rejecting = review?.action === 'reject';

  if (!review) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-lg rounded-lg border border-brown-700/15 bg-cream-100 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
          Horse Review
        </p>

        <h2 className="mt-2 text-2xl font-black text-brown-900">
          {rejecting ? 'Reject Horse' : 'Approve Horse'}
        </h2>

        <p className="mt-3 font-semibold text-slate-500">
          {review.horse.horseName} · Horse #{review.horse.horseId}
        </p>

        {rejecting && (
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">
              Rejection Feedback
            </span>

            <textarea
              className="min-h-28 resize-none rounded-lg border border-brown-700/15 bg-white p-3 text-sm font-semibold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              maxLength={500}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Explain what the owner must correct..."
            />

            <span className="text-right text-xs font-bold text-slate-500">
              {feedback.length}/500
            </span>
          </label>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={`rounded-lg px-4 py-3 font-extrabold text-white ${
              rejecting ? 'bg-danger' : 'bg-green-700'
            } disabled:opacity-50`}
            type="button"
            disabled={isProcessing || (rejecting && !feedback.trim())}
            onClick={() => onConfirm(feedback.trim())}
          >
            {isProcessing
              ? 'Processing...'
              : rejecting
                ? 'Reject Horse'
                : 'Approve Horse'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function HorseReview() {
  const [horses, setHorses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadHorses();
  }, []);

  async function loadHorses() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getPendingHorses();
      setHorses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load pending horses.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredHorses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return horses;

    return horses.filter((horse) =>
      [
        horse.horseId,
        horse.ownerId,
        horse.horseName,
        horse.breed,
        horse.gender,
        horse.color
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [horses, search]);

  async function confirmReview(feedback) {
    const { action, horse } = review;

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      if (action === 'approve') {
        await approveHorse(horse.horseId);
        setMessage(`${horse.horseName} was approved.`);
      } else {
        await rejectHorse(horse.horseId, feedback);
        setMessage(`${horse.horseName} was rejected.`);
      }

      setReview(null);
      setSelectedHorse(null);
      await loadHorses();
    } catch (err) {
      setError(err.message || 'Unable to review horse.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Horse Verification
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Horse Reviews
          </h1>

          <p className="mt-3 font-medium text-slate-500">
            Review horse information, health certificates, and proof images.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm"
          type="button"
          disabled={isLoading}
          onClick={loadHorses}
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-cream-100 shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 p-5 max-sm:grid">
          <div>
            <h2 className="text-xl font-extrabold">Awaiting Review</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredHorses.length} of {horses.length} horses
            </p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />

            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Search horse, owner ID, breed, or color"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Loading horses...</p>
        ) : filteredHorses.length === 0 ? (
          <p className="px-5 py-10 text-slate-500">
            No horses are awaiting review.
          </p>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filteredHorses.map((horse) => {
              const expired = isCertificateExpired(horse.healthCertExpiry);

              return (
                <article
                  className="rounded-lg border border-brown-700/10 bg-white p-5 shadow-sm"
                  key={horse.horseId}
                >
                  <div className="flex items-start gap-4">
                    <img
                      className="size-24 rounded-lg border border-brown-700/10 object-cover"
                      src={horse.imgUrl}
                      alt={`${horse.horseName} proof`}
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-extrabold">
                        {horse.horseName}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Owner #{horse.ownerId} · Horse #{horse.horseId}
                      </p>

                      <span className="mt-3 inline-flex rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold text-brown-700">
                        {horse.status}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-extrabold uppercase text-slate-500">
                        Breed
                      </dt>
                      <dd className="mt-1 font-extrabold">
                        {horse.breed || 'N/A'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-extrabold uppercase text-slate-500">
                        Gender
                      </dt>
                      <dd className="mt-1 font-extrabold">
                        {horse.gender || 'N/A'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-extrabold uppercase text-slate-500">
                        Color
                      </dt>
                      <dd className="mt-1 font-extrabold">
                        {horse.color || 'N/A'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid gap-3 rounded-lg bg-cream-200/60 p-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Weight size={18} className="text-brown-500" />
                      <div>
                        <span className="block text-xs font-extrabold uppercase text-slate-500">
                          Weight
                        </span>
                        <strong>{horse.weight} kg</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays
                        size={18}
                        className={expired ? 'text-danger' : 'text-green-700'}
                      />
                      <div>
                        <span className="block text-xs font-extrabold uppercase text-slate-500">
                          Health Certificate
                        </span>
                        <strong className={expired ? 'text-danger' : ''}>
                          {formatDate(horse.healthCertExpiry)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {expired && (
                    <p className="mt-3 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-bold text-danger">
                      Health certificate is missing or expired. Approval will fail.
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2.5 text-sm font-extrabold text-brown-700"
                      type="button"
                      onClick={() => setSelectedHorse(horse)}
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-3 py-2.5 text-sm font-extrabold text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      disabled={expired || !horse.imgUrl}
                      onClick={() => setReview({ action: 'approve', horse })}
                    >
                      <BadgeCheck size={16} />
                      Approve
                    </button>

                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2.5 text-sm font-extrabold text-danger"
                      type="button"
                      onClick={() => setReview({ action: 'reject', horse })}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedHorse && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedHorse(null)}
        >
          <section
            className="w-full max-w-2xl rounded-lg bg-cream-100 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-black">
              {selectedHorse.horseName}
            </h2>

            <img
              className="max-h-[60vh] w-full rounded-lg object-contain"
              src={selectedHorse.imgUrl}
              alt={`${selectedHorse.horseName} proof`}
            />

            <button
              className="mt-4 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700"
              type="button"
              onClick={() => setSelectedHorse(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      <ReviewModal
        review={review}
        isProcessing={isProcessing}
        onClose={() => !isProcessing && setReview(null)}
        onConfirm={confirmReview}
      />
    </section>
  );
}