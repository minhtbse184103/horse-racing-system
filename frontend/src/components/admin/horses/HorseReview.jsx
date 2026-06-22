import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import defaultHorseImage from '../../../assets/default-horse.svg';
import { approveHorse, getPendingHorses, rejectHorse } from '../../../services/adminHorseReviewService';
import { formatDate, getHorseId, getHorseName } from '../../../lib';

function getImages(horse, fieldName) {
  return Array.isArray(horse?.[fieldName]) ? horse[fieldName] : [];
}

function hasRequiredDocuments(horse) {
  return (
    getImages(horse, 'horsePassportImages').length > 0 &&
    getImages(horse, 'horseCertificateImages').length > 0 &&
    getImages(horse, 'horseImages').length > 0
  );
}

function getHorseCover(horse) {
  const firstImage = getImages(horse, 'horseImages').find((image) => image?.dataUrl || image?.url);
  return firstImage?.dataUrl || firstImage?.url || defaultHorseImage;
}

function DocumentPreviewGrid({ horse }) {
  return (
    <div className="horse-detail-document-grid">
      {[
        ['Horse Passport', getImages(horse, 'horsePassportImages')],
        ['Horse Certificate', getImages(horse, 'horseCertificateImages')],
        ['Horse Image', getImages(horse, 'horseImages')]
      ].map(([label, images]) => (
        <div className="horse-detail-document-card" key={label}>
          <h3>{label}</h3>
          {images.length > 0 ? (
            <div className="horse-detail-image-list">
              {images.map((image, index) => (
                <img
                  key={`${label}-${image.name || index}`}
                  src={image.dataUrl || image.url}
                  alt={`${label} ${index + 1}`}
                />
              ))}
            </div>
          ) : (
            <p>Chưa import ảnh.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewDialog({ review, onClose, onConfirm, isProcessing }) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setFeedback('');
  }, [review]);

  if (!review) return null;

  const isRejecting = review.action === 'reject';
  const horseName = getHorseName(review.horse) || `Horse ${getHorseId(review.horse)}`;
  const approvalBlocked = !hasRequiredDocuments(review.horse);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-lg bg-cream-100 p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-brown-900">
          {isRejecting ? 'Từ chối hồ sơ ngựa' : 'Phê duyệt hồ sơ ngựa'}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {horseName} will be {isRejecting ? 'được trả lại cho owner cùng phản hồi của bạn' : 'được phê duyệt và chuyển sang trạng thái ACTIVE'}.
        </p>

        {!isRejecting && approvalBlocked && (
          <div className="mt-5 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3">
            <strong className="block text-sm font-extrabold text-danger">Approval blocked</strong>
            <p className="mt-1 text-sm font-semibold text-danger">
              Hồ sơ cần đủ Horse Passport, Horse Certificate và Horse Image trước khi phê duyệt.
            </p>
          </div>
        )}

        {isRejecting && (
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-extrabold text-brown-900">Rejection Reason</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-semibold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Giải thích nội dung owner cần chỉnh sửa trước khi gửi lại."
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
            disabled={isProcessing || (!isRejecting && approvalBlocked) || (isRejecting && !feedback.trim())}
            onClick={() => onConfirm(feedback.trim())}
          >
            {isProcessing ? 'Đang xử lý...' : isRejecting ? 'Từ chối ngựa' : 'Phê duyệt ngựa'}
          </button>
        </div>
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
      setError(err.message || 'Không thể tải hồ sơ ngựa đang chờ duyệt.');
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
      horse.passportNumber,
      horse.breed,
      horse.color,
      horse.gender,
      horse.ownerId
    ]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [horses, search]);

  async function confirmReview(feedback) {
    const { action, horse } = review;
    const horseId = getHorseId(horse);

    if (!horseId) {
      setError('Không tìm thấy mã ngựa.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      if (action === 'approve') {
        await approveHorse(horseId);
        setMessage(`${getHorseName(horse) || `Horse ${horseId}`} was approved and marked ACTIVE.`);
      } else {
        await rejectHorse(horseId, feedback);
        setMessage(`${getHorseName(horse) || `Horse ${horseId}`} was rejected and returned to the owner.`);
      }

      setReview(null);
      setSelectedHorse(null);
      await loadHorses();
    } catch (err) {
      setError(err.message || 'Không thể xét duyệt hồ sơ ngựa.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">Duyệt ngựa</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Ngựa đang chờ phê duyệt</h1>
          <p className="mt-3 font-medium text-slate-500">
            Horses added by owners arrive here as PENDING and require an admin decision before they can be used for race registration.
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
            <h2 className="text-xl font-extrabold">Đang chờ phê duyệt</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredHorses.length} of {horses.length} horse profiles</p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm theo tên ngựa, passport, giống hoặc mã owner"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-slate-500">Đang tải hồ sơ ngựa...</p>
        ) : filteredHorses.length === 0 ? (
          <p className="px-5 py-10 text-slate-500">Không có hồ sơ ngựa nào đang chờ phê duyệt.</p>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filteredHorses.map((horse) => {
              const horseId = getHorseId(horse);
              const horseName = getHorseName(horse) || `Horse ${horseId}`;
              const approvalBlocked = !hasRequiredDocuments(horse);

              return (
                <article className="rounded-lg border border-brown-700/10 bg-white p-5 shadow-sm" key={horseId}>
                  <div className="flex items-start gap-4">
                    <img className="size-20 rounded-lg border border-brown-700/10 object-cover" src={getHorseCover(horse)} alt={horseName} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-extrabold">{horseName}</h3>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-500">Passport: {horse.passportNumber || 'N/A'}</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-500">Owner ID: {horse.ownerId || 'N/A'}</p>
                      <span className="mt-3 inline-flex rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold text-brown-700">{horse.status || 'PENDING'}</span>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Giống ngựa</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.breed || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Giới tính</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.gender || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Màu lông</dt><dd className="mt-1 break-words text-sm font-extrabold">{horse.color || 'N/A'}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Ngày sinh</dt><dd className="mt-1 text-sm font-extrabold">{formatDate(horse.dayOfBirth)}</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Cân nặng</dt><dd className="mt-1 text-sm font-extrabold">{horse.weight || 'N/A'} kg</dd></div>
                    <div><dt className="text-xs font-extrabold uppercase text-slate-500">Submitted</dt><dd className="mt-1 text-sm font-extrabold">{formatDate(horse.submittedAt || horse.createdAt)}</dd></div>
                  </dl>

                  <div className="mt-4 grid gap-2 rounded-lg border border-brown-700/10 bg-cream-200/40 p-3 text-sm font-bold text-slate-500">
                    <span>Horse Passport: {getImages(horse, 'horsePassportImages').length} ảnh</span>
                    <span>Horse Certificate: {getImages(horse, 'horseCertificateImages').length} ảnh</span>
                    <span>Horse Image: {getImages(horse, 'horseImages').length} ảnh</span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2.5 text-sm font-extrabold text-brown-700"
                      type="button"
                      onClick={() => setSelectedHorse(horse)}
                    >
                      <Eye size={16} />
                      View Detail
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-green-50 px-3 py-2.5 text-sm font-extrabold text-green-700 disabled:cursor-not-allowed disabled:border-brown-700/10 disabled:bg-stone-100 disabled:text-slate-500 disabled:opacity-60"
                      type="button"
                      disabled={approvalBlocked}
                      title={approvalBlocked ? 'Cần đủ Horse Passport, Horse Certificate và Horse Image.' : 'Phê duyệt hồ sơ ngựa'}
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
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={() => setSelectedHorse(null)}>
          <section className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-cream-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">Horse Registration Detail</p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{getHorseName(selectedHorse) || 'Horse detail'}</h2>
            <dl className="mt-4 grid gap-3 rounded-lg border border-brown-700/10 bg-white/70 p-4 text-sm md:grid-cols-2">
              <div><dt className="font-extrabold uppercase text-slate-500">Passport Number</dt><dd className="mt-1 font-black text-brown-900">{selectedHorse.passportNumber || 'N/A'}</dd></div>
              <div><dt className="font-extrabold uppercase text-slate-500">Status</dt><dd className="mt-1 font-black text-brown-900">{selectedHorse.status || 'PENDING'}</dd></div>
              <div><dt className="font-extrabold uppercase text-slate-500">Country Of Birth</dt><dd className="mt-1 font-black text-brown-900">{selectedHorse.countryOfBirth || 'N/A'}</dd></div>
              <div><dt className="font-extrabold uppercase text-slate-500">Submitted Date</dt><dd className="mt-1 font-black text-brown-900">{formatDate(selectedHorse.submittedAt || selectedHorse.createdAt)}</dd></div>
              <div className="md:col-span-2"><dt className="font-extrabold uppercase text-slate-500">Description</dt><dd className="mt-1 font-black text-brown-900">{selectedHorse.description || 'N/A'}</dd></div>
            </dl>
            <DocumentPreviewGrid horse={selectedHorse} />
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

      <ReviewDialog
        review={review}
        onClose={() => !isProcessing && setReview(null)}
        onConfirm={confirmReview}
        isProcessing={isProcessing}
      />
    </section>
  );
}
