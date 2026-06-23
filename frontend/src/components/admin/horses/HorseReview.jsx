import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ExternalLink, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import { approveHorse, getPendingHorses, rejectHorse } from '../../../services/adminHorseReviewService';
import { formatDate, getHorseId, getHorseName } from '../../../lib';

function getImages(horse, fieldName) {
  return Array.isArray(horse?.[fieldName]) ? horse[fieldName] : [];
}

function isPending(horse) {
  return String(horse?.status || '').toUpperCase() === 'PENDING';
}

function DocumentPreview({ horse }) {
  const documents = getImages(horse, 'horseCertificateImages');

  return (
    <div className="horse-detail-document-grid">
      <div className="horse-detail-document-card">
        <h3>Health Certificate</h3>
        {documents.length > 0 ? (
          <div className="horse-detail-image-list">
            {documents.map((document, index) => {
              const url = document.dataUrl || document.url;
              const isImage = String(document.type || '').startsWith('image/') || String(url || '').match(/\.(jpg|jpeg|png)(\?|$)/i);
              return isImage ? (
                <img key={`${document.name || index}`} src={url} alt={`Health Certificate ${index + 1}`} />
              ) : (
                <a key={`${document.name || index}`} className="outline-button compact-button" href={url} target="_blank" rel="noreferrer">
                  View Health Certificate
                </a>
              );
            })}
          </div>
        ) : (
          <p>Chua import file.</p>
        )}
      </div>
    </div>
  );
}

function StatusBlock({ horse }) {
  const status = String(horse?.status || 'PENDING').toUpperCase();

  if (status === 'ACTIVE') {
    return <span className="status-badge active">Approved</span>;
  }

  if (status === 'REJECTED') {
    return (
      <div className="grid gap-3">
        <span className="status-badge rejected">Rejected</span>
        {horse.rejectionReason && (
          <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
            {horse.rejectionReason}
          </div>
        )}
      </div>
    );
  }

  return <span className="status-badge pending">PENDING</span>;
}

function ReviewDialog({ review, onClose, onConfirm, isProcessing }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [review]);

  if (!review) return null;

  const isRejecting = review.action === 'reject';
  const horseName = getHorseName(review.horse) || `Horse ${getHorseId(review.horse)}`;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-lg bg-cream-100 p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-brown-900">
          {isRejecting ? 'Reject Horse' : 'Approve Horse'}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {horseName} will be {isRejecting ? 'rejected and returned with a reason' : 'approved and marked ACTIVE'}.
        </p>

        {isRejecting && (
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-extrabold text-brown-900">Rejection Reason *</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-semibold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what does not match the official horse profile."
            />
          </label>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-50"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>

          <button
            className={`rounded-lg px-4 py-3 font-extrabold text-white transition disabled:opacity-50 ${
              isRejecting ? 'bg-danger hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
            }`}
            type="button"
            disabled={isProcessing || (isRejecting && !reason.trim())}
            onClick={() => onConfirm(reason.trim())}
          >
            {isProcessing ? 'Dang xu ly...' : isRejecting ? 'Confirm Reject' : 'Approve'}
          </button>
        </div>
      </section>
    </div>
  );
}

function HorseDetail({ horse, onClose, onApprove, onReject, isProcessing }) {
  const officialUrl = String(horse.officialHorseProfileUrl || '').trim();

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-cream-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">Horse Registration Detail</p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{getHorseName(horse) || 'Horse detail'}</h2>
          </div>
          <StatusBlock horse={horse} />
        </div>

        <dl className="mt-4 grid gap-3 rounded-lg border border-brown-700/10 bg-white/70 p-4 text-sm md:grid-cols-2">
          <div><dt className="font-extrabold uppercase text-slate-500">Horse Name</dt><dd className="mt-1 font-black text-brown-900">{getHorseName(horse) || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Age</dt><dd className="mt-1 font-black text-brown-900">{horse.age || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Weight</dt><dd className="mt-1 font-black text-brown-900">{horse.weight ? `${horse.weight} kg` : 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Colour</dt><dd className="mt-1 font-black text-brown-900">{horse.colour || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Sex</dt><dd className="mt-1 font-black text-brown-900">{horse.sex || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Breeding</dt><dd className="mt-1 font-black text-brown-900">{horse.breeding || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Trainer</dt><dd className="mt-1 font-black text-brown-900">{horse.trainer || 'N/A'}</dd></div>
          <div><dt className="font-extrabold uppercase text-slate-500">Health Certificate Expiry Date</dt><dd className="mt-1 font-black text-brown-900">{formatDate(horse.healthCertificateExpiryDate || horse.healthCertExpiry)}</dd></div>
          <div className="md:col-span-2">
            <dt className="font-extrabold uppercase text-slate-500">Official Horse Profile URL</dt>
            <dd className="mt-1 break-words font-black text-brown-900">{officialUrl || 'N/A'}</dd>
            {officialUrl && (
              <a className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700" href={officialUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Open Official Website
              </a>
            )}
          </div>
        </dl>

        <DocumentPreview horse={horse} />

        {isPending(horse) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-extrabold text-green-700" type="button" disabled={isProcessing} onClick={() => onApprove(horse)}>
              <BadgeCheck size={16} />
              Approve
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-extrabold text-danger" type="button" disabled={isProcessing} onClick={() => onReject(horse)}>
              <XCircle size={16} />
              Reject
            </button>
          </div>
        )}

        <button className="mt-4 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700" type="button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}

export default function HorseReview() {
  const [horses, setHorses] = useState([]);
  const [search, setSearch] = useState('');
  const [review, setReview] = useState(null);
  const [selectedHorse, setSelectedHorse] = useState(null);
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
      setError(err.message || 'Khong the tai ho so ngua.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredHorses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return horses;

    return horses.filter((horse) => [
      getHorseId(horse),
      getHorseName(horse),
      horse.breeding,
      horse.colour,
      horse.sex,
      horse.trainer,
      horse.ownerId,
      horse.status
    ]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [horses, search]);

  async function confirmReview(reason) {
    const { action, horse } = review;
    const horseId = getHorseId(horse);

    if (!horseId) {
      setError('Khong tim thay ma ngua.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      const updated = action === 'approve'
        ? await approveHorse(horseId)
        : await rejectHorse(horseId, reason);

      setMessage(action === 'approve' ? 'Horse was approved and marked ACTIVE.' : 'Horse was rejected.');
      setReview(null);
      setSelectedHorse(updated);
      await loadHorses();
    } catch (err) {
      setError(err.message || 'Khong the xet duyet ho so ngua.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">Duyet ngua</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Horse Review</h1>
          <p className="mt-3 font-medium text-slate-500">
            Admin manually compares submitted information with the official horse profile URL before approving or rejecting.
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

      {error && <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">{error}</div>}
      {message && <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700">{message}</div>}

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-cream-100 shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 p-5 max-sm:grid">
          <div>
            <h2 className="text-xl font-extrabold">Horse Submissions</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredHorses.length} of {horses.length} horse profiles</p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Search by name, owner, status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Dang tai ho so ngua...</p>
        ) : filteredHorses.length === 0 ? (
          <p className="px-5 py-10 text-slate-500">Khong co ho so ngua nao.</p>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filteredHorses.map((horse) => {
              const horseId = getHorseId(horse);
              const horseName = getHorseName(horse) || `Horse ${horseId}`;

              return (
                <article className="rounded-lg border border-brown-700/10 bg-white p-5 shadow-sm" key={horseId}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-extrabold">{horseName}</h3>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-500">Owner ID: {horse.ownerId || 'N/A'}</p>
                      <span className="mt-3 inline-flex rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold text-brown-700">{horse.status || 'PENDING'}</span>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Age</dt><dd className="mt-1 text-sm font-extrabold">{horse.age || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Weight</dt><dd className="mt-1 text-sm font-extrabold">{horse.weight ? `${horse.weight} kg` : 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Colour</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.colour || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Sex</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.sex || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Breeding</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.breeding || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Trainer</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.trainer || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Submitted</dt><dd className="mt-1 text-sm font-extrabold">{formatDate(horse.submittedAt || horse.createdAt)}</dd></div>
                  </dl>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2.5 text-sm font-extrabold text-brown-700" type="button" onClick={() => setSelectedHorse(horse)}>
                      <Eye size={16} />
                      View Detail
                    </button>
                    {isPending(horse) ? (
                      <>
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-3 py-2.5 text-sm font-extrabold text-green-700" type="button" onClick={() => setReview({ action: 'approve', horse })}>
                          <BadgeCheck size={16} />
                          Approve
                        </button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2.5 text-sm font-extrabold text-danger" type="button" onClick={() => setReview({ action: 'reject', horse })}>
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <StatusBlock horse={horse} />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedHorse && (
        <HorseDetail
          horse={selectedHorse}
          isProcessing={isProcessing}
          onClose={() => setSelectedHorse(null)}
          onApprove={(horse) => setReview({ action: 'approve', horse })}
          onReject={(horse) => setReview({ action: 'reject', horse })}
        />
      )}

      <ReviewDialog
        review={review}
        onClose={() => !isProcessing && setReview(null)}
        onConfirm={confirmReview}
        isProcessing={isProcessing}
      />
    </section>
  );
}
