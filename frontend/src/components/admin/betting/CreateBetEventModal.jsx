import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { betProductName } from '../../../lib';
import { dateTime, Field, fromDateTimeLocal, IconButton, inputClass } from './bettingUi';

export default function CreateBetEventModal({ products, onLoadRaces, onCancel, onCreate }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => ({
    raceId: '',
    betProductId: '',
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
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'betProductId' ? { raceId: '', openAt: '', closeAt: '' } : {}),
      ...(field === 'raceId' ? { openAt: '', closeAt: '' } : {})
    }));
    setError('');
  }

  function validate() {
    const openAt = new Date(form.openAt);
    const closeAt = new Date(form.closeAt);
    const raceStart = selectedRace ? new Date(selectedRace.raceStartTime) : null;
    const fee = Number(form.operatorFeeRate);
    if (!form.betProductId) return 'Vui lòng chọn sản phẩm cược.';
    if (!form.raceId) return 'Vui lòng chọn Race.';
    if (!form.openAt) return 'Vui lòng nhập thời gian mở cược.';
    if (!form.closeAt) return 'Vui lòng nhập thời gian đóng cược.';
    if (!(openAt < closeAt)) return 'Open time phải trước close time.';
    if (raceStart && !(closeAt < raceStart)) return 'Close time phải trước race start.';
    if (raceStart && closeAt > new Date(raceStart.getTime() - 60000)) return 'Cược phải đóng tối thiểu 1 phút trước race start.';
    if (raceStart && openAt < new Date(raceStart.getTime() - 12 * 60 * 60000)) return 'Không được mở cược quá 12 giờ trước race start.';
    if (!Number.isFinite(fee) || fee < 0 || fee > 50) return 'Phí tổ chức phải từ 0% đến 50%.';
    return '';
  }

  async function submit() {
    const validation = validate();
    setError(validation);
    if (validation) return;
    setIsSaving(true);
    try {
      await onCreate({
        raceId: Number(form.raceId),
        betProductId: Number(form.betProductId),
        openAt: fromDateTimeLocal(form.openAt),
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
            <p className="mt-1 text-sm font-semibold text-slate-500">Cấu hình cửa nhận cược cho một Race đã có RaceEntry.</p>
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
          <Field label="Open time">
            <input type="datetime-local" className={inputClass} value={form.openAt} onChange={(event) => update('openAt', event.target.value)} />
          </Field>
          <Field label="Close time">
            <input type="datetime-local" className={inputClass} value={form.closeAt} onChange={(event) => update('closeAt', event.target.value)} />
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
            {isSaving ? 'Đang tạo...' : 'Tạo event'}
          </button>
        </footer>
      </section>
    </div>
  );
}
