import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, LoaderCircle, RefreshCw, Search, Users, X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import { includesSearchTerm } from '../operations/operationHelpers';

export default function AssignmentDialog({
  tournament,
  race,
  candidates,
  entries,
  entriesLoading,
  entriesError,
  entriesReady,
  queueLoading,
  queueError,
  onRetryEntries,
  onRetryQueue,
  onAssign,
  onClose
}) {
  const [search, setSearch] = useState('');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const entryContextLoading = entriesLoading || !entriesReady;
  const entryContextUnavailable = entryContextLoading || Boolean(entriesError);
  const isFull = entriesReady && entries.length >= race.maxRunners;
  const filteredCandidates = useMemo(() => candidates.filter((candidate) => includesSearchTerm([
    candidate.registrationNo,
    candidate.horse,
    candidate.owner,
    candidate.jockey
  ], search)), [candidates, search]);

  async function confirmAssignment() {
    if (entryContextUnavailable) {
      setError('Vui lòng chờ tải đúng RaceEntry của Race này trước khi phân công.');
      return;
    }
    if (selectedRegistrationId == null) {
      setError('Vui lòng chọn một Registration hợp lệ trước.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onAssign(selectedRegistrationId);
      onClose();
    } catch (assignmentError) {
      setError(assignmentError.message || 'Không thể phân công Registration này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[70] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm" onMouseDown={isSubmitting ? undefined : onClose}>
      <motion.div {...modalPanel} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="race-assignment-title">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-5 md:p-6">
          <div className="min-w-0"><p className="text-xs font-black uppercase text-brown-500">Phân công RaceEntry chính thức</p><h3 id="race-assignment-title" className="mt-1 truncate text-2xl font-black text-brown-900">{race.name}</h3><p className="mt-1 truncate text-sm font-semibold text-slate-500">{tournament.name} · {race.track} · {race.distance}m</p></div>
          <button type="button" disabled={isSubmitting} onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200 disabled:opacity-50" aria-label="Đóng"><X size={17} /></button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${isFull ? 'bg-red-100 text-red-800' : entryContextUnavailable ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{entryContextLoading ? 'Đang kiểm tra sức chứa' : `${entries.length}/${race.maxRunners} người tham gia`}</span><span className="text-xs font-semibold text-slate-500">Chỉ Registration APPROVED và PAID</span></div>
            <label className="relative sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-10 w-full rounded-lg border border-brown-700/15 bg-white py-2 pl-9 pr-3 text-sm font-bold outline-none focus:border-brown-500" placeholder="Tìm người tham gia hợp lệ" /></label>
          </div>

          {(isFull || error) && <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} />{error || 'Race này đã đầy. Không thể phân công thêm Registration.'}</div>}
          {entryContextLoading && <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"><LoaderCircle className="mt-0.5 shrink-0 animate-spin" size={17} />Đang tải RaceEntry hiện tại của Race này trước khi cho phép phân công.</div>}
          {entriesError && <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"><span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 shrink-0" size={17} />{entriesError}</span><button type="button" onClick={onRetryEntries} className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-extrabold text-red-800 hover:bg-red-100">Thử lại</button></div>}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {queueLoading ? (
              <div className="col-span-full grid min-h-44 place-items-center text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={24} /><p className="mt-3 font-black text-brown-900">Đang tải Registration hợp lệ</p></div></div>
            ) : queueError ? (
              <div className="col-span-full grid min-h-44 place-items-center rounded-lg border border-red-200 bg-red-50 p-6 text-center"><div><AlertTriangle className="mx-auto text-danger" size={23} /><h4 className="mt-3 font-black text-brown-900">Danh sách phân công không khả dụng</h4><p className="mt-1 text-sm font-semibold text-slate-500">{queueError}</p><button type="button" onClick={onRetryQueue} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brown-700 px-4 text-xs font-extrabold text-white"><RefreshCw size={14} /> Thử lại</button></div></div>
            ) : (
              <>
                {filteredCandidates.map((candidate) => {
                  const selected = selectedRegistrationId === candidate.registrationId;
                  return <button type="button" key={candidate.registrationId} disabled={isFull || isSubmitting || entryContextUnavailable} onClick={() => { setSelectedRegistrationId(candidate.registrationId); setError(''); }} className={`min-w-0 rounded-lg border p-4 text-left shadow-[0_6px_18px_rgba(78,44,25,0.06)] transition ${selected ? 'border-gold-400 bg-gold-400/10 ring-4 ring-gold-400/10' : 'border-white/80 bg-white/85 hover:border-gold-400/35 hover:shadow-[0_12px_28px_rgba(78,44,25,0.1)]'} disabled:opacity-50`}><p className="truncate text-xs font-black uppercase text-brown-500">{candidate.registrationNo}</p><h4 className="mt-1 truncate font-black text-brown-900">{candidate.horse}</h4><p className="mt-1 truncate text-xs font-semibold text-slate-500">{candidate.owner} · {candidate.jockey || 'Chưa có Jockey'}</p></button>;
                })}
                {filteredCandidates.length === 0 && !isFull && <div className="col-span-full grid min-h-44 place-items-center rounded-lg border border-dashed border-brown-700/20 p-6 text-center"><div><Users className="mx-auto text-brown-500" size={23} /><h4 className="mt-3 font-black text-brown-900">Không có Registration hợp lệ</h4><p className="mt-1 text-sm font-semibold text-slate-500">Registration phải có Status APPROVED, Payment Status PAID, chưa được phân công và thuộc Tournament này.</p></div></div>}
              </>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-brown-700/10 bg-white/75 p-4 md:px-5">
          <p className="mr-auto text-xs font-semibold text-slate-500">{entryContextLoading ? 'Đang xác nhận sức chứa Race.' : selectedRegistrationId == null ? 'Chọn một Registration để tiếp tục.' : 'Backend sẽ phân công ngẫu nhiên một vị trí xuất phát còn trống.'}</p>
          <button type="button" disabled={isSubmitting} onClick={onClose} className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Hủy</button>
          <button type="button" disabled={selectedRegistrationId == null || isFull || queueLoading || isSubmitting || entryContextUnavailable} onClick={confirmAssignment} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white hover:bg-brown-900 disabled:cursor-not-allowed disabled:bg-stone-300">{isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />} Phân công RaceEntry</button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
