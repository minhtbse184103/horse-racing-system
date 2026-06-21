import { CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react';

export default function TournamentLifecycleActions({ tournament, processing, onAction }) {
  if (tournament.status === 'OPEN_FOR_REGISTRATION') {
    return (
      <button type="button" disabled={processing} onClick={() => onAction(tournament, 'close')} className="mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">
        {processing ? <LoaderCircle className="animate-spin" size={14} /> : <LockKeyhole size={14} />} Đóng Registration
      </button>
    );
  }

  if (tournament.status === 'REGISTRATION_CLOSED' || tournament.status === 'IN_PROGRESS') {
    return (
      <button type="button" disabled={processing} onClick={() => onAction(tournament, 'complete')} className="mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">
        {processing ? <LoaderCircle className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Hoàn tất Tournament
      </button>
    );
  }

  return null;
}
