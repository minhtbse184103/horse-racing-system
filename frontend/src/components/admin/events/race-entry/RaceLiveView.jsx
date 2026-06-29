import { useEffect } from 'react';
import { Radio, Trophy, WifiOff } from 'lucide-react';
import useRaceLiveView from './useRaceLiveView';

export default function RaceLiveView({ raceId, active, onResult }) {
  const { connectionState, error, lastTick, result } = useRaceLiveView(raceId, active);

  // result.status is the real backend status (RaceResultIngestResponse),
  // not a hardcoded "COMPLETED" string — bubble it up so the workspace's
  // local race.status can be patched immediately instead of staying
  // IN_PROGRESS until the next full tournament reload (see
  // useTournamentWorkspace.updateRaceStatus).
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

      {result ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
          <Trophy size={16} />
          <p className="text-sm font-extrabold">Race đã kết thúc — kết quả đã được ghi nhận.</p>
        </div>
      ) : lastTick ? (
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-brown-900/5 p-3 text-xs font-mono text-brown-900">
          {JSON.stringify(lastTick, null, 2)}
        </pre>
      ) : connectionState === 'connected' ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">Chưa nhận được dữ liệu vị trí nào.</p>
      ) : null}
    </div>
  );
}
