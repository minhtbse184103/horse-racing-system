import { useEffect, useState } from 'react';
import {
  cancelRace,
  createRace,
  getRacesByRound,
  updateRace
} from '../../../services/eventService';
import { formatDisplayLabel } from '../../../lib';

const CONFIGURABLE_STATUSES = [
  'Draft',
  'OpenForRegistration',
  'ClosedRegistration'
];

function emptyRaceForm() {
  return {
    startTime: '',
    endTime: '',
    distance: 1200
  };
}

function formatStatus(status) {
  return formatDisplayLabel(status);
}

function getStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'bg-amber-100 text-amber-800';
    case 'openforregistration':
      return 'bg-green-100 text-green-800';
    case 'closedregistration':
      return 'bg-stone-200 text-stone-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-cream-200 text-brown-700';
  }
}

export default function RaceManagement({ tournament, rounds }) {
  const [selectedRoundId, setSelectedRoundId] = useState(
    rounds[0]?.roundId || ''
  );
  const [races, setRaces] = useState([]);
  const [formValues, setFormValues] = useState(emptyRaceForm());
  const [editingRace, setEditingRace] = useState(null);
  const [raceToCancel, setRaceToCancel] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canConfigure = CONFIGURABLE_STATUSES.includes(tournament.status);
  const selectedRound = rounds.find(
    (round) => String(round.roundId) === String(selectedRoundId)
  );

  useEffect(() => {
    if (rounds.length > 0) {
      setSelectedRoundId(rounds[0].roundId);
    }
  }, [rounds]);

  useEffect(() => {
    if (selectedRoundId) {
      loadRaces(selectedRoundId);
    } else {
      setRaces([]);
    }
  }, [selectedRoundId]);

  async function loadRaces(roundId) {
    setIsLoading(true);
    setError('');

    try {
      const data = await getRacesByRound(roundId);
      setRaces(Array.isArray(data) ? data : []);
    } catch (err) {
      setRaces([]);
      setError(err.message || 'Không thể tải danh sách cuộc đua.');
    } finally {
      setIsLoading(false);
    }
  }

  function selectRound(roundId) {
    setSelectedRoundId(roundId);
    setMessage('');
    setError('');
  }

  function openCreateForm() {
    setEditingRace(null);
    setFormValues(emptyRaceForm());
    setError('');
    setMessage('');
    setIsFormOpen(true);
  }

  function openEditForm(race) {
    setEditingRace(race);
    setFormValues({
      startTime: race.startTime?.slice(0, 16) || '',
      endTime: race.endTime?.slice(0, 16) || '',
      distance: race.distance || 1200
    });
    setError('');
    setMessage('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;

    setEditingRace(null);
    setFormValues(emptyRaceForm());
    setIsFormOpen(false);
    setError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedRoundId) {
      setError('Vui lòng chọn vòng đấu trước.');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    const payload = {
      startTime: formValues.startTime,
      endTime: formValues.endTime,
      distance: Number(formValues.distance)
    };

    try {
      if (editingRace) {
        await updateRace(editingRace.raceId, payload);
        setMessage('Đã cập nhật cuộc đua thành công.');
      } else {
        await createRace({
          roundId: Number(selectedRoundId),
          ...payload
        });
        setMessage('Đã tạo cuộc đua thành công.');
      }

      setEditingRace(null);
      setFormValues(emptyRaceForm());
      setIsFormOpen(false);
      await loadRaces(selectedRoundId);
    } catch (err) {
      setError(err.message || 'Không thể lưu cuộc đua.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelRace() {
    if (!raceToCancel) return;

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await cancelRace(raceToCancel.raceId);
      setMessage('Đã hủy cuộc đua thành công.');
      setRaceToCancel(null);
      await loadRaces(selectedRoundId);
    } catch (err) {
      setError(err.message || 'Không thể hủy cuộc đua.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] border-t border-brown-700/10 pt-4">
      <div className="mb-4 flex items-end justify-between gap-4 max-sm:grid">
        <div>
          <span className="text-xs font-extrabold uppercase text-slate-500">
            Race Setup
          </span>
          <h3 className="mt-1 text-xl font-extrabold text-brown-900">
            {selectedRound?.roundName || 'Chọn vòng đấu'}
          </h3>
        </div>

        <button
          className="rounded-xl border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_8px_20px_rgba(108,63,36,0.2)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          type="button"
          onClick={openCreateForm}
          disabled={!canConfigure || !selectedRoundId}
        >
          + Create Race
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {rounds.map((round) => (
          <button
            key={round.roundId}
            className={`grid gap-1 rounded-xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              String(selectedRoundId) === String(round.roundId)
                ? 'border-brown-700 bg-cream-200 shadow-sm'
                : 'border-brown-700/15 bg-white/60 hover:border-brown-700/40 hover:bg-cream-200/50'
            }`}
            type="button"
            onClick={() => selectRound(round.roundId)}
          >
            <span className="text-xs font-extrabold uppercase text-slate-500">
              Round {round.roundOrder}
            </span>
            <strong className="text-sm text-brown-900">
              {round.roundName}
            </strong>
          </button>
        ))}
      </div>

      <div>
        {error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}
      </div>

      <div className="min-h-0 overflow-auto rounded-xl border border-brown-700/10 bg-white/60 shadow-[0_12px_30px_rgba(78,44,25,0.08)]">
        {isLoading ? (
          <p className="px-6 py-10 text-slate-500">Đang tải cuộc đua...</p>
        ) : races.length === 0 ? (
          <div className="grid min-h-40 place-items-center content-center gap-2 px-6 text-center">
            <strong className="text-brown-900">Chưa có cuộc đua trong vòng này</strong>
            <span className="text-slate-500">
              Create the first race for {selectedRound?.roundName}.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {['Cuộc đua', 'Lịch trình', 'Cự ly', 'Trạng thái', 'Thao tác'].map(
                    (heading) => (
                      <th
                        className="border-b border-brown-700/10 px-3 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-brown-700"
                        key={heading}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {races.map((race) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={race.raceId}
                  >
                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <strong className="block break-words text-[0.82rem] font-extrabold leading-snug text-brown-900">
                        {race.raceName}
                      </strong>
                      <small className="mt-1 block text-[0.68rem] font-bold text-slate-500">
                        ID #{race.raceId}
                      </small>
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <span className="block text-[0.78rem] font-extrabold text-brown-900">
                        {race.startTime?.replace('T', ' ')}
                      </span>
                      <small className="mt-1 block text-[0.68rem] font-bold text-slate-500">
                        to {race.endTime?.replace('T', ' ')}
                      </small>
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold text-brown-900">
                      {race.distance}m
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                          race.status
                        )}`}
                      >
                        {formatStatus(race.status)}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="rounded-xl border border-brown-700/15 bg-white/90 px-3 py-2 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
                          type="button"
                          disabled={!canConfigure || race.status !== 'Draft'}
                          onClick={() => openEditForm(race)}
                        >
                          Edit
                        </button>

                        <button
                          className="rounded-xl border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-extrabold text-danger shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
                          type="button"
                          disabled={!canConfigure || race.status !== 'Draft'}
                          onClick={() => setRaceToCancel(race)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={closeForm}
        >
          <form
            className="w-full max-w-xl overflow-y-auto rounded-lg border border-brown-700/20 bg-cream-100 p-7 shadow-2xl max-sm:max-h-[calc(100vh-24px)] max-sm:p-5"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-brown-500">
                  {selectedRound?.roundName}
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-brown-900">
                  {editingRace ? 'Chỉnh sửa cuộc đua' : 'Tạo cuộc đua'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Race name and order are generated automatically.
                </p>
              </div>

              <button
                className="grid size-9 shrink-0 place-items-center rounded-full border border-brown-700/20 bg-white/70 text-xl text-slate-500 transition hover:bg-cream-200"
                type="button"
                aria-label="Đóng biểu mẫu cuộc đua"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Thời gian bắt đầu</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="startTime"
                  type="datetime-local"
                  value={formValues.startTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Thời gian kết thúc</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="endTime"
                  type="datetime-local"
                  value={formValues.endTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900 sm:col-span-2">
                <span>Cự ly tính bằng mét</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="distance"
                  type="number"
                  min="1"
                  value={formValues.distance}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="rounded-lg border border-brown-700/20 bg-white/70 px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={closeForm}
                disabled={isSaving}
              >
                Close
              </button>

              <button
                className="rounded-lg border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white transition hover:bg-brown-900 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Đang lưu...'
                  : editingRace
                    ? 'Lưu thay đổi'
                    : 'Tạo cuộc đua'}
              </button>
            </div>
          </form>
        </div>
      )}

      {raceToCancel && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={() => setRaceToCancel(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-danger max-sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-danger-bg text-xl font-black text-danger">
                !
              </span>

              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">
                  Race #{raceToCancel.raceId}
                </span>
                <h2 className="text-xl font-extrabold text-brown-900">
                  Cancel Race
                </h2>
              </div>
            </div>

            <p className="my-5 leading-relaxed text-slate-500">
              This race will be marked as cancelled and cannot be edited.
            </p>

            <dl className="grid overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10">
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Cuộc đua</dt>
                <dd className="m-0 text-sm font-extrabold text-brown-900">
                  {raceToCancel.raceName}
                </dd>
              </div>

              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Cự ly</dt>
                <dd className="m-0 text-sm font-extrabold text-brown-900">
                  {raceToCancel.distance}m
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="rounded-lg border border-brown-700/20 bg-white/70 px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200"
                type="button"
                onClick={() => setRaceToCancel(null)}
              >
                Go Back
              </button>

              <button
                className="rounded-lg border border-danger bg-danger px-4 py-3 font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={isSaving}
                onClick={handleCancelRace}
              >
                Cancel Race
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
