import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  RefreshCw,
  Search,
  XCircle
} from 'lucide-react';
import {
  approveJockeyProfile,
  getJockeyProfilesUnderReview,
  rejectJockeyProfile
} from '../../../services/adminProfileReviewService';

function ReviewModal({ review, onClose, onConfirm, isProcessing }) {
  const [feedback, setFeedback] = useState('');
  const isRejecting = review?.action === 'reject';

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
          Jockey Review
        </p>
        <h2 className="mt-2 text-2xl font-black text-brown-900">
          {isRejecting ? 'Reject Profile' : 'Approve Profile'}
        </h2>

        <p className="mt-3 text-sm font-semibold text-slate-500">
          {review.profile.fullName} · {review.profile.licenseNo}
        </p>

        {isRejecting && (
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">
              Rejection Feedback
            </span>
            <textarea
              className="min-h-28 resize-none rounded-lg border border-brown-700/15 bg-white p-3 text-sm font-semibold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              maxLength={500}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Explain what the jockey must correct..."
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
              isRejecting ? 'bg-danger' : 'bg-green-700'
            } disabled:opacity-50`}
            type="button"
            disabled={isProcessing || (isRejecting && !feedback.trim())}
            onClick={() => onConfirm(feedback.trim())}
          >
            {isProcessing
              ? 'Processing...'
              : isRejecting
                ? 'Reject Profile'
                : 'Approve Profile'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function JockeyReview() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getJockeyProfilesUnderReview();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load jockey reviews.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return profiles;

    return profiles.filter((profile) =>
      [
        profile.jockeyId,
        profile.fullName,
        profile.email,
        profile.licenseNo,
        profile.ranking
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [profiles, search]);

  async function confirmReview(feedback) {
    const { action, profile } = review;

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      if (action === 'approve') {
        await approveJockeyProfile(profile.jockeyId);
        setMessage(`${profile.fullName} was approved.`);
      } else {
        await rejectJockeyProfile(profile.jockeyId, feedback);
        setMessage(`${profile.fullName} was rejected.`);
      }

      setReview(null);
      setSelectedProfile(null);
      await loadProfiles();
    } catch (err) {
      setError(err.message || 'Unable to review jockey profile.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Profile Reviews
          </p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Jockey Reviews
          </h1>
          <p className="mt-3 font-medium text-slate-500">
            Verify jockey licenses, rankings, weight, and proof images.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm"
          type="button"
          disabled={isLoading}
          onClick={loadProfiles}
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
              {filteredProfiles.length} of {profiles.length} profiles
            </p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Search name, email, license, or ranking"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Loading profiles...</p>
        ) : filteredProfiles.length === 0 ? (
          <p className="px-5 py-10 text-slate-500">
            No jockey profiles are awaiting review.
          </p>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filteredProfiles.map((profile) => (
              <article
                className="rounded-lg border border-brown-700/10 bg-white p-5 shadow-sm"
                key={profile.jockeyId}
              >
                <div className="flex items-start gap-4">
                  <img
                    className="size-20 rounded-lg border border-brown-700/10 object-cover"
                    src={profile.imgUrl}
                    alt={`${profile.fullName} proof`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-lg font-extrabold">
                      {profile.fullName}
                    </h3>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                      {profile.email}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold text-brown-700">
                      {profile.status}
                    </span>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-xs font-extrabold uppercase text-slate-500">
                      License
                    </dt>
                    <dd className="mt-1 break-words text-sm font-extrabold">
                      {profile.licenseNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-extrabold uppercase text-slate-500">
                      Weight
                    </dt>
                    <dd className="mt-1 text-sm font-extrabold">
                      {profile.weight} kg
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-extrabold uppercase text-slate-500">
                      Ranking
                    </dt>
                    <dd className="mt-1 break-words text-sm font-extrabold">
                      {profile.ranking}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2.5 text-sm font-extrabold text-brown-700"
                    type="button"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-3 py-2.5 text-sm font-extrabold text-green-700"
                    type="button"
                    onClick={() => setReview({ action: 'approve', profile })}
                  >
                    <BadgeCheck size={16} />
                    Approve
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2.5 text-sm font-extrabold text-danger"
                    type="button"
                    onClick={() => setReview({ action: 'reject', profile })}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProfile && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProfile(null)}
        >
          <section
            className="w-full max-w-2xl rounded-lg bg-cream-100 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="max-h-[60vh] w-full rounded-lg object-contain"
              src={selectedProfile.imgUrl}
              alt={`${selectedProfile.fullName} proof`}
            />
            <button
              className="mt-4 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700"
              type="button"
              onClick={() => setSelectedProfile(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      <ReviewModal
        review={review}
        onClose={() => !isProcessing && setReview(null)}
        onConfirm={confirmReview}
        isProcessing={isProcessing}
      />
    </section>
  );
}
