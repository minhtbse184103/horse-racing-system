import { useEffect } from 'react';
import { Radio, WifiOff } from 'lucide-react';
import LiveRaceDisplay from '../live/LiveRaceDisplay';
import useRaceLiveView from './useRaceLiveView';

export default function RaceLiveView({ raceId, active, onResult }) {
  const { connectionState, error, lastTick, result } = useRaceLiveView(raceId, active);

  // result.status is the real backend status (RaceResultIngestResponse),
  // not a hardcoded "COMPLETED" string — bubble it up so the workspace's
  // local race.status can be patched immediately instead of staying
  // IN_PROGRESS until the next full tournament reload. After the review
  // workflow change, Unity result moves the race to PENDING_REVIEW.
  useEffect(() => {
    if (result?.status) {
      onResult?.(result.status);
    }
  }, [result, onResult]);

  if (!active) return null;

  return (
    <div className="mt-3 rounded-lg border border-brown-700/10 bg-white/80 p-4">
      <div className="flex items-center gap-2">
        {connectionState === 'connected' ? (
          <Radio size={15} className="text-emerald-600" />
        ) : (
          <WifiOff size={15} className="text-slate-400" />
        )}
        <p className="text-xs font-extrabold text-slate-500">
          {connectionState === 'connecting' && 'Đang kết nối realtime...'}
          {connectionState === 'connected' && !result && 'Đang theo dõi trực tiếp'}
          {connectionState === 'error' && (error || 'Mất kết nối realtime.')}
        </p>
      </div>

      {(lastTick || result || connectionState === 'connected') && (
        <LiveRaceDisplay tick={lastTick} result={result} />
      )}
    </div>
  );
}
