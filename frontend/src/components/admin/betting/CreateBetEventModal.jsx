import { useEffect, useState } from 'react';
import { CalendarClock, Loader2, Plus, Zap, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { betProductName } from '../../../lib';
import {
  dateTime,
  Field,
  fromDateTimeLocal,
  IconButton,
  inputClass,
  latestBetCloseAt,
  MAX_OPEN_BEFORE_RACE_MS,
  toDateTimeLocal
} from './bettingUi';

export default function CreateBetEventModal({ products, onLoadRaces, onCancel, onCreate }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => ({
    raceId: '',
    betProductId: '',
    openMode: 'NOW',
    openAt: '',
    closeAt: '',
    operatorFeeRate: '10'
  }));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [races, setRaces] = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState('');

  const selectedRace = races.find((race) => Number(race.raceId) === Number(form.raceId));

  useEffect(() => {
    if (!selectedRace?.raceStartTime) return;
    const defaultCloseAt = toDateTimeLocal(latestBetCloseAt(selectedRace.raceStartTime));
    // Chỉ bù giá trị mặc định nếu đang trống, không ghi đè giờ Admin đã chủ động chỉnh.
    setForm((current) => current.closeAt
      ? current
      : { ...current, closeAt: defaultCloseAt });
  }, [selectedRace?.raceId, selectedRace?.raceStartTime]);

  useEffect(() => {
    if (!form.betProductId) {
      setRaces([]);
      setRacesError('');
      return undefined;
    }

    let active = true;
    setRacesLoading(true);
    setRacesError('');
    onLoadRaces(form.betProductId)
      .then((eligibleRaces) => {
        if (active) setRaces(eligibleRaces || []);
      })
      .catch((loadError) => {
        if (!active) return;
        setRaces([]);
        setRacesError(loadError.message || 'Không thể tải Race đủ điều kiện.');
      })
      .finally(() => {
        if (active) setRacesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form.betProductId, onLoadRaces]);

  function update(field, value) {
    if (field === 'raceId') {
      const race = races.find((item) => Number(item.raceId) === Number(value));
      const raceStart = race ? new Date(race.raceStartTime) : null;
      setForm((current) => ({
        ...current,
        raceId: value,
        openAt: current.openMode === 'NOW' ? toDateTimeLocal(new Date()) : '',
        closeAt: raceStart
          ? toDateTimeLocal(latestBetCloseAt(raceStart))
          : ''
      }));
      setError('');
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'betProductId' ? { raceId: '', openAt: '', closeAt: '' } : {})
    }));
    setError('');
  }

  function updateOpenMode(openMode) {
    setForm((current) => ({
      ...current,
      openMode,
      openAt: openMode === 'NOW' ? toDateTimeLocal(new Date()) : ''
    }));
    setError('');
  }

  function validate() {
    const openAt = form.openMode === 'NOW' ? new Date() : new Date(form.openAt);
    const closeAt = new Date(form.closeAt);
    const raceStart = selectedRace ? new Date(selectedRace.raceStartTime) : null;
    const fee = Number(form.operatorFeeRate);
    if (!form.betProductId) return 'Vui lòng chọn sản phẩm cược.';
    if (!form.raceId) return 'Vui lòng chọn Race.';
    if (form.openMode === 'SCHEDULE' && !form.openAt) return 'Vui lòng nhập thời gian tự động mở cược.';
    if (!form.closeAt) return 'Vui lòng nhập thời gian đóng cược.';
    if (!(openAt < closeAt)) return 'Open time phải trước close time.';
    if (raceStart && closeAt > latestBetCloseAt(raceStart)) return 'Cược phải đóng tối thiểu 5 phút trước race start.';
    if (raceStart && openAt < new Date(raceStart.getTime() - MAX_OPEN_BEFORE_RACE_MS)) return 'Không được mở cược quá 12 giờ trước race start.';
    if (!Number.isFinite(fee) || fee < 0 || fee > 50) return 'Phí tổ chức phải từ 0% đến 50%.';
    return '';
  }

  const raceStart = selectedRace ? new Date(selectedRace.raceStartTime) : null;
  const closeTimeMax = raceStart
    ? toDateTimeLocal(latestBetCloseAt(raceStart))
    : '';
  const openTimeMin = raceStart
    ? toDateTimeLocal(new Date(Math.max(
      Math.ceil(Date.now() / 60000) * 60000,
      raceStart.getTime() - MAX_OPEN_BEFORE_RACE_MS
    )))
    : toDateTimeLocal(new Date(Math.ceil(Date.now() / 60000) * 60000));

  async function submit() {
    const validation = validate();
    setError(validation);
    if (validation) return;
    setIsSaving(true);
    try {
      await onCreate({
        raceId: Number(form.raceId),
        betProductId: Number(form.betProductId),
        openAt: form.openMode === 'NOW' ? null : fromDateTimeLocal(form.openAt),
        openNow: form.openMode === 'NOW',
        closeAt: fromDateTimeLocal(form.closeAt),
        operatorFeeRate: Number(form.operatorFeeRate) / 100
      });
    } catch (err) {
      setError(err.message || 'Không thể tạo betting event.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-950/55 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brown-200 bg-white shadow-[0_30px_90px_rgba(43,23,16,0.32)]">
        <header className="flex items-start justify-between gap-4 border-b border-brown-100 bg-cream-50 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brown-500">Betting Event</p>
            <h2 className="mt-1 text-2xl font-black text-brown-950">Tạo betting event</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Cấu hình cửa nhận cược cho Race đã khóa danh sách tham dự.</p>
          </div>
          <IconButton label="Đóng" icon={X} onClick={onCancel} />
        </header>

        <div className="grid gap-4 p-6 lg:grid-cols-2">
          <Field label="Product">
            <select className={inputClass} value={form.betProductId} onChange={(event) => update('betProductId', event.target.value)}>
              <option value="">Chọn product</option>
              {products.filter((product) => product.active).map((product) => (
                <option key={product.betProductId} value={product.betProductId}>
                  {betProductName(product.code, t, product.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Race">
            <select
              className={inputClass}
              value={form.raceId}
              onChange={(event) => update('raceId', event.target.value)}
              disabled={!form.betProductId || racesLoading || Boolean(racesError)}
            >
              <option value="">
                {!form.betProductId
                  ? 'Chọn product trước'
                  : racesLoading
                    ? 'Đang tải Race...'
                    : races.length === 0
                      ? 'Không có Race đủ điều kiện'
                      : 'Chọn Race'}
              </option>
              {races.map((race) => (
                <option key={race.raceId} value={race.raceId}>
                  {race.raceName} · {dateTime(race.raceStartTime)}
                </option>
              ))}
            </select>
            {racesError && <span className="text-xs font-bold text-red-600">{racesError}</span>}
          </Field>
          <div className="grid gap-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Cách mở cược</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  form.openMode === 'NOW'
                    ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100'
                    : 'border-brown-200 bg-white hover:bg-cream-50'
                }`}
                onClick={() => updateOpenMode('NOW')}
              >
                <Zap className="mt-0.5 shrink-0 text-emerald-700" size={19} />
                <span>
                  <strong className="block text-sm font-black text-brown-950">Open now</strong>
                  <small className="mt-1 block font-semibold text-slate-500">Tạo event và nhận cược ngay lập tức.</small>
                </span>
              </button>
              <button
                type="button"
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  form.openMode === 'SCHEDULE'
                    ? 'border-gold-400 bg-amber-50 ring-4 ring-amber-100'
                    : 'border-brown-200 bg-white hover:bg-cream-50'
                }`}
                onClick={() => updateOpenMode('SCHEDULE')}
              >
                <CalendarClock className="mt-0.5 shrink-0 text-amber-700" size={19} />
                <span>
                  <strong className="block text-sm font-black text-brown-950">Schedule</strong>
                  <small className="mt-1 block font-semibold text-slate-500">Hệ thống tự mở event khi đến open time.</small>
                </span>
              </button>
            </div>
          </div>
          <Field label="Open time">
            <input
              type="datetime-local"
              min={form.openMode === 'SCHEDULE' ? openTimeMin : undefined}
              max={form.closeAt || closeTimeMax || undefined}
              className={inputClass}
              value={form.openAt}
              onChange={(event) => update('openAt', event.target.value)}
              disabled={form.openMode === 'NOW'}
            />
            {selectedRace && (
              <span className="text-xs font-semibold text-slate-500">
                {form.openMode === 'NOW'
                  ? 'Backend sẽ ghi nhận thời điểm hiện tại chính xác khi tạo event.'
                  : 'Event ở trạng thái DRAFT và tự chuyển OPEN tại thời gian này, trong 12 giờ cuối trước Race.'}
              </span>
            )}
          </Field>
          <Field label="Close time">
            <input
              type="datetime-local"
              min={form.openAt || toDateTimeLocal(new Date())}
              max={closeTimeMax || undefined}
              className={inputClass}
              value={form.closeAt}
              onChange={(event) => update('closeAt', event.target.value)}
            />
            {selectedRace && (
              <span className="text-xs font-semibold text-slate-500">
                Mặc định trước Race 5 phút. Admin có thể chọn đóng sớm hơn; muộn nhất {dateTime(closeTimeMax)}.
              </span>
            )}
          </Field>
          <Field label="Operator fee (%)">
            <input type="number" min="0" max="50" step="0.1" className={inputClass} value={form.operatorFeeRate} onChange={(event) => update('operatorFeeRate', event.target.value)} />
          </Field>
          {selectedRace && (
            <div className="rounded-xl border border-brown-200 bg-cream-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Race đã chọn</p>
              <strong className="mt-2 block text-brown-950">{selectedRace.raceName}</strong>
              <span className="mt-1 block text-sm font-semibold text-slate-500">{selectedRace.trackName} · {dateTime(selectedRace.raceStartTime)}</span>
            </div>
          )}
        </div>

        {error && <p className="mx-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <footer className="flex flex-col-reverse gap-3 border-t border-brown-100 px-6 py-5 sm:flex-row sm:justify-end">
          <button className="min-h-11 rounded-xl border border-brown-200 bg-white px-5 text-sm font-black text-brown-700 transition hover:bg-cream-100 disabled:opacity-60" type="button" onClick={onCancel} disabled={isSaving}>Hủy</button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brown-700 px-5 text-sm font-black text-white transition hover:bg-brown-800 disabled:opacity-60" type="button" onClick={submit} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {isSaving
              ? 'Đang tạo...'
              : form.openMode === 'NOW'
                ? 'Tạo & mở ngay'
                : 'Tạo lịch event'}
          </button>
        </footer>
      </section>
    </div>
  );
}
