import { useEffect, useMemo, useState } from 'react';
import defaultJockeyAvatar from '../../../assets/default-jockey-avatar.svg';
import UrlImagePreview from '../../common/UrlImagePreview';
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

function isHttpUrl(value) {
  return /^https?:\/\/.+/i.test(String(value || '').trim());
}

function getValidImageUrls(profile) {
  return Array.isArray(profile?.imageUrls)
    ? profile.imageUrls.filter(isHttpUrl)
    : [];
}

function getVerificationLinks(profile) {
  return String(profile?.verificationLink || '')
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Chưa cập nhật' : String(value);
}

function DetailItem({ label, value, children }) {
  return (
    <div>
      <dt className="text-xs font-extrabold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-extrabold text-brown-900">
        {children || displayValue(value)}
      </dd>
    </div>
  );
}

function ReviewModal({ review, onClose, onConfirm, isProcessing }) {
  const [feedback, setFeedback] = useState('');
  const isRejecting = review?.action === 'reject';

  useEffect(() => {
    setFeedback('');
  }, [review]);

  if (!review) return null;

  const licenseImageMissing = getValidImageUrls(review.profile).length === 0;
  const approvalBlocked = !isRejecting && licenseImageMissing;

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
          {isRejecting ? 'Từ chối hồ sơ' : 'Phê duyệt hồ sơ'}
        </h2>

        <p className="mt-3 text-sm font-semibold text-slate-500">
          {review.profile.fullName} · {review.profile.licenseNo}
        </p>

        {approvalBlocked && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3">
            <strong className="block text-sm font-extrabold text-danger">Approval blocked</strong>
            <p className="mt-1 text-sm font-semibold text-danger">
              Jockey chưa gửi URL ảnh giấy phép hợp lệ. Hãy reject để jockey bổ sung license image URL.
            </p>
          </div>
        )}

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
              placeholder="Giải thích nội dung jockey cần chỉnh sửa..."
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
            disabled={isProcessing || approvalBlocked || (isRejecting && !feedback.trim())}
            onClick={() => onConfirm(feedback.trim())}
          >
            {isProcessing
              ? 'Đang xử lý...'
              : isRejecting
                ? 'Từ chối hồ sơ'
                : 'Phê duyệt hồ sơ'}
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
      setError(err.message || 'Không thể tải danh sách duyệt jockey.');
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
        await approveJockeyProfile(profile.reviewId);
        setMessage(`${profile.fullName} was approved.`);
      } else {
        await rejectJockeyProfile(profile.reviewId, feedback);
        setMessage(`${profile.fullName} was rejected.`);
      }

      setReview(null);
      setSelectedProfile(null);
      await loadProfiles();
    } catch (err) {
      setError(err.message || 'Không thể xét duyệt hồ sơ jockey.');
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
            <h2 className="text-xl font-extrabold">Đang chờ xét duyệt</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredProfiles.length} of {profiles.length} profiles, including approved records
            </p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm theo tên, email, giấy phép hoặc xếp hạng"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Đang tải hồ sơ...</p>
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
                    src={getValidImageUrls(profile)[0] || defaultJockeyAvatar}
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
                  <div className="col-span-3">
                    <dt className="text-xs font-extrabold uppercase text-slate-500">
                      Jockey License Images
                    </dt>
                    <dd className="mt-1 break-words text-sm font-extrabold">
                      {getValidImageUrls(profile).length > 0
                        ? `${getValidImageUrls(profile).length} image(s) uploaded`
                        : 'Chưa gửi URL hợp lệ'}
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
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-3 py-2.5 text-sm font-extrabold text-green-700 disabled:cursor-not-allowed disabled:border-brown-700/10 disabled:bg-stone-100 disabled:text-slate-500 disabled:opacity-60"
                    type="button"
                    disabled={getValidImageUrls(profile).length === 0 || String(profile.status || '').toUpperCase() !== 'PENDING'}
                    title={String(profile.status || '').toUpperCase() !== 'PENDING' ? 'Hồ sơ này đã được xử lý.' : getValidImageUrls(profile).length === 0 ? 'Cần có URL ảnh giấy phép jockey hợp lệ trước khi phê duyệt.' : 'Phê duyệt hồ sơ jockey'}
                    onClick={() => setReview({ action: 'approve', profile })}
                  >
                    <BadgeCheck size={16} />
                    Approve
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2.5 text-sm font-extrabold text-danger"
                    type="button"
                    disabled={String(profile.status || '').toUpperCase() !== 'PENDING'}
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
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-cream-100 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 max-sm:grid">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
                  Jockey Application Detail
                </p>
                <h2 className="mt-2 text-2xl font-black text-brown-900">
                  {selectedProfile.fullName}
                </h2>
                <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                  {selectedProfile.email}
                </p>
              </div>
              <span className="rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold text-brown-700">
                {selectedProfile.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 rounded-lg border border-brown-700/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Jockey ID" value={selectedProfile.jockeyId} />
              <DetailItem label="Licence Type" value={selectedProfile.licenceType || selectedProfile.licenseNo} />
              <DetailItem label="Expiry Date" value={selectedProfile.expiryDate} />
              <DetailItem label="Weight" value={selectedProfile.weight ? `${selectedProfile.weight} kg` : ''} />
              <DetailItem label="Ranking" value={selectedProfile.ranking} />
              <DetailItem label="Trainer Name" value={selectedProfile.trainerName} />
              <DetailItem label="Trainer Email" value={selectedProfile.trainerEmail} />
              <DetailItem label="Academy / Stable Address" value={selectedProfile.academyStableAddress} />
              <DetailItem label="Issuing Authority" value={selectedProfile.issuingAuthority} />
              <DetailItem label="Submitted At" value={selectedProfile.submittedAt} />
              <DetailItem label="Reviewed At" value={selectedProfile.reviewedAt} />
              <DetailItem label="Reviewed By" value={selectedProfile.reviewedByName || selectedProfile.reviewedBy} />
              <div className="sm:col-span-2 lg:col-span-3">
                <DetailItem label="Biography" value={selectedProfile.biography} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <DetailItem label="Verification Links">
                  {getVerificationLinks(selectedProfile).length > 0 ? (
                    <div className="grid gap-1">
                      {getVerificationLinks(selectedProfile).map((link, index) => (
                        <a className="break-all text-green-700 underline" href={link} target="_blank" rel="noreferrer" key={`${link}-${index}`}>
                          {link}
                        </a>
                      ))}
                    </div>
                  ) : 'Chưa cập nhật'}
                </DetailItem>
              </div>
            </dl>

            <p className="mt-5 break-words text-sm font-semibold text-slate-500">
              {getValidImageUrls(selectedProfile).length} licence image(s)
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {getValidImageUrls(selectedProfile).length > 0 ? (
                getValidImageUrls(selectedProfile).map((url, index) => (
                  <div className="rounded-lg border border-brown-700/10 bg-white p-3" key={url}>
                    <UrlImagePreview
                      url={url}
                      alt={`${selectedProfile.fullName} proof ${index + 1}`}
                      className="max-h-[42vh] w-full rounded-lg object-contain"
                    />
                    <a className="mt-3 inline-flex max-w-full break-all text-sm font-bold text-green-700 underline" href={url} target="_blank" rel="noreferrer">
                      Open image {index + 1}
                    </a>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-6 text-center text-sm font-bold text-danger sm:col-span-2">
                  Chưa gửi URL hợp lệ
                </p>
              )}
            </div>
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
