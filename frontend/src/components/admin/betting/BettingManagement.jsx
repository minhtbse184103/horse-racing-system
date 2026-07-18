import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Clock,
  Eye,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Ticket,
  X
} from 'lucide-react';
import { formatDisplayLabel, formatNumber } from '../../../lib';
import { getRaces } from '../../../services/eventService';
import {
  closeAdminBetEvent,
  createAdminBetEvent,
  getAdminBetEvents,
  getAdminBetProducts,
  openAdminBetEvent,
  updateAdminBetProduct
} from '../../../services/bettingService';

const eventStatuses = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED'];

function money(value) {
  return `${formatNumber(Number(value || 0))} VND`;
}

function dateTime(value) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{formatDisplayLabel(status)}</span>;
}

function ProductBadge({ code }) {
  return <span className="rounded-md border border-brown-700/10 bg-cream-200 px-2.5 py-1 text-xs font-black text-brown-700">{String(code || '').toUpperCase()}</span>;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
        <Icon className="text-brown-500" size={18} />
      </div>
      <strong className="mt-2 block text-3xl font-black text-brown-900">{value}</strong>
    </div>
  );
}

function ProductEditor({ product, onSave }) {
  const [form, setForm] = useState(() => ({
    name: product.name || '',
    description: product.description || '',
    minStake: product.minStake || 10000,
    maxDailyStake: product.maxDailyStake || 1000000,
    operatorFeeRate: Number(product.operatorFeeRate || 0) * 100,
    active: Boolean(product.active)
  }));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function validate() {
    const minStake = Number(form.minStake);
    const maxDailyStake = Number(form.maxDailyStake);
    const operatorFeeRate = Number(form.operatorFeeRate);
    if (!form.name.trim()) return 'Tên sản phẩm là bắt buộc.';
    if (!Number.isFinite(minStake) || minStake < 10000) return 'Min stake phải từ 10,000 VND.';
    if (!Number.isFinite(maxDailyStake) || maxDailyStake < minStake) return 'Max daily stake không được nhỏ hơn min stake.';
    if (!Number.isFinite(operatorFeeRate) || operatorFeeRate < 0 || operatorFeeRate > 50) return 'Phí tổ chức phải từ 0% đến 50%.';
    return '';
  }

  async function save() {
    const validation = validate();
    setError(validation);
    if (validation) return;
    setIsSaving(true);
    try {
      await onSave(product.betProductId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        minStake: Number(form.minStake),
        maxDailyStake: Number(form.maxDailyStake),
        operatorFeeRate: Number(form.operatorFeeRate) / 100,
        active: Boolean(form.active)
      });
    } catch (err) {
      setError(err.message || 'Không thể lưu sản phẩm cược.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-lg border border-brown-700/10 bg-white/75 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <ProductBadge code={product.code} />
          <h3 className="mt-3 text-xl font-black text-brown-900">{product.name}</h3>
        </div>
        <StatusBadge status={product.active ? 'ACTIVE' : 'INACTIVE'} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-extrabold text-brown-900">Tên sản phẩm</span>
          <input className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.name} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-extrabold text-brown-900">Mô tả</span>
          <textarea className="min-h-20 rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.description} onChange={(event) => update('description', event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Min stake</span>
          <input type="number" min="10000" step="10000" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.minStake} onChange={(event) => update('minStake', event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Max daily stake</span>
          <input type="number" min="10000" step="10000" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.maxDailyStake} onChange={(event) => update('maxDailyStake', event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Operator fee (%)</span>
          <input type="number" min="0" max="50" step="0.1" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.operatorFeeRate} onChange={(event) => update('operatorFeeRate', event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Trạng thái</span>
          <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={form.active ? 'true' : 'false'} onChange={(event) => update('active', event.target.value === 'true')}>
            <option value="true">ACTIVE</option>
            <option value="false">INACTIVE</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}
      <button className="primary-button owner-hero-action mt-5" type="button" onClick={save} disabled={isSaving}>
        <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu sản phẩm'}
      </button>
    </article>
  );
}

function CreateEventModal({ products, races, onCancel, onCreate }) {
  const [form, setForm] = useState(() => ({
    raceId: '',
    betProductId: '',
    openAt: '',
    closeAt: '',
    operatorFeeRate: '10'
  }));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedRace = races.find((race) => Number(race.raceId) === Number(form.raceId));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function validate() {
    const openAt = new Date(form.openAt);
    const closeAt = new Date(form.closeAt);
    const raceStart = selectedRace ? new Date(selectedRace.raceStartTime) : null;
    const fee = Number(form.operatorFeeRate);
    if (!form.raceId) return 'Vui lòng chọn race.';
    if (!form.betProductId) return 'Vui lòng chọn sản phẩm cược.';
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Betting Event</p>
            <h2 className="text-2xl font-black text-brown-900">Tạo betting event</h2>
          </div>
          <button className="refresh-button" type="button" onClick={onCancel}><X size={17} /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-extrabold text-brown-900">Race</span>
            <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none" value={form.raceId} onChange={(event) => update('raceId', event.target.value)}>
              <option value="">Chọn race</option>
              {races.map((race) => <option key={race.raceId} value={race.raceId}>{race.raceName} · {dateTime(race.raceStartTime)}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Product</span>
            <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none" value={form.betProductId} onChange={(event) => update('betProductId', event.target.value)}>
              <option value="">Chọn product</option>
              {products.filter((product) => product.active).map((product) => <option key={product.betProductId} value={product.betProductId}>{product.code} · {product.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Operator fee (%)</span>
            <input type="number" min="0" max="50" step="0.1" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none" value={form.operatorFeeRate} onChange={(event) => update('operatorFeeRate', event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Open time</span>
            <input type="datetime-local" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none" value={form.openAt} onChange={(event) => update('openAt', event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Close time</span>
            <input type="datetime-local" className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold outline-none" value={form.closeAt} onChange={(event) => update('closeAt', event.target.value)} />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg border border-danger/20 bg-danger-bg p-3 text-sm font-bold text-danger">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isSaving}>Hủy</button>
          <button className="primary-button owner-hero-action" type="button" onClick={submit} disabled={isSaving}>
            <Plus size={16} /> {isSaving ? 'Đang tạo...' : 'Tạo event'}
          </button>
        </div>
      </section>
    </div>
  );
}

function EventDetail({ event }) {
  if (!event) return null;
  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">Pool detail</p>
          <h2>{event.raceName}</h2>
          <p>{event.trackName} · {dateTime(event.raceStartTime)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProductBadge code={event.productCode} />
          <StatusBadge status={event.status} />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_9rem_8rem] gap-3 border-b border-brown-700/10 px-4 py-3 text-xs font-black uppercase text-slate-500 max-lg:hidden">
          <span>Stall</span>
          <span>Horse</span>
          <span>Jockey</span>
          <span>Pool</span>
          <span>Odds</span>
        </div>
        <div className="divide-y divide-brown-700/10">
          {(event.entries || []).map((entry) => (
            <div className="grid gap-3 px-4 py-4 lg:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_9rem_8rem]" key={entry.raceEntryId}>
              <strong>#{entry.startingStall}</strong>
              <span className="min-w-0"><strong className="block truncate text-brown-900">{entry.horseName}</strong><small className="font-bold text-slate-500">Owner: {entry.ownerName || 'N/A'}</small></span>
              <span className="truncate font-bold text-slate-600">{entry.jockeyName || 'N/A'}</span>
              <strong>{money(entry.poolStake)}</strong>
              <strong className="text-emerald-700">{entry.estimatedOdds ? Number(entry.estimatedOdds).toFixed(2) : '-'}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BettingManagement() {
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [races, setRaces] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [productList, eventList, raceList] = await Promise.all([
        getAdminBetProducts(),
        getAdminBetEvents(),
        getRaces()
      ]);
      setProducts(productList || []);
      setEvents(eventList || []);
      setRaces(raceList || []);
      setSelectedEvent((current) => current ? (eventList || []).find((event) => event.betEventId === current.betEventId) || current : null);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu betting.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    open: events.filter((event) => String(event.status).toUpperCase() === 'OPEN').length,
    closed: events.filter((event) => String(event.status).toUpperCase() === 'CLOSED').length,
    settled: events.filter((event) => String(event.status).toUpperCase() === 'SETTLED').length,
    pool: events.reduce((total, event) => total + Number(event.totalStake || 0), 0)
  }), [events]);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return events.filter((event) => {
      const status = String(event.status || '').toUpperCase();
      const haystack = [event.betEventId, event.raceName, event.trackName, event.productCode, event.productName, event.status].join(' ').toLowerCase();
      return (statusFilter === 'ALL' || status === statusFilter) && (!keyword || haystack.includes(keyword));
    });
  }, [events, search, statusFilter]);

  async function saveProduct(productId, payload) {
    const updated = await updateAdminBetProduct(productId, payload);
    setProducts((current) => current.map((product) => product.betProductId === updated.betProductId ? updated : product));
    setMessage('Đã cập nhật sản phẩm cược.');
  }

  async function createEvent(payload) {
    await createAdminBetEvent(payload);
    setCreateOpen(false);
    setMessage('Đã tạo betting event.');
    await loadData();
  }

  async function executeEventAction() {
    if (!confirmAction) return;
    setError('');
    setMessage('');
    try {
      if (confirmAction.action === 'OPEN') await openAdminBetEvent(confirmAction.event.betEventId);
      if (confirmAction.action === 'CLOSE') await closeAdminBetEvent(confirmAction.event.betEventId);
      setMessage(`Đã ${confirmAction.action.toLowerCase()} betting event.`);
      setConfirmAction(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể xử lý betting event.');
      setConfirmAction(null);
    }
  }

  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label="Open events" value={stats.open} icon={Clock} />
        <StatCard label="Closed events" value={stats.closed} icon={Ticket} />
        <StatCard label="Settled events" value={stats.settled} icon={Check} />
        <StatCard label="Total pool" value={money(stats.pool)} icon={CircleDollarSign} />
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Betting Products</p>
            <h2>Cấu hình sản phẩm cược</h2>
            <p>Admin có thể chỉnh max daily stake, min stake, fee và active cho từng sản phẩm.</p>
          </div>
          <button className="refresh-button" type="button" onClick={loadData} disabled={isLoading}><RefreshCw size={17} /></button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => <ProductEditor key={product.betProductId} product={product} onSave={saveProduct} />)}
        </div>
      </section>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Betting Events</p>
            <h2>Quản lý event cược</h2>
            <p>Tạo event, mở/đóng nhận cược và settle sau khi có kết quả chính thức.</p>
          </div>
          <button className="primary-button owner-hero-action" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Tạo event
          </button>
        </div>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}
        {isLoading && <div className="admin-alert success" role="status">Đang tải betting...</div>}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm race, product, status..." />
          </div>
          <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-extrabold text-brown-900 outline-none" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {eventStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
          <div className="grid grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_10rem_10rem_9rem] gap-3 border-b border-brown-700/10 px-4 py-3 text-xs font-black uppercase text-slate-500 max-2xl:hidden">
            <span>ID</span><span>Race</span><span>Product</span><span>Status</span><span>Close at</span><span>Pool</span><span>Action</span>
          </div>
          <div className="divide-y divide-brown-700/10">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center font-bold text-slate-500">Không có betting event phù hợp.</div>
            ) : filteredEvents.map((event) => {
              const status = String(event.status || '').toUpperCase();
              return (
                <div key={event.betEventId} className="grid gap-3 px-4 py-4 2xl:grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_10rem_10rem_9rem]">
                  <strong>#{event.betEventId}</strong>
                  <span className="min-w-0"><strong className="block truncate text-brown-900">{event.raceName}</strong><small className="font-bold text-slate-500">{event.trackName} · {dateTime(event.raceStartTime)}</small></span>
                  <ProductBadge code={event.productCode} />
                  <StatusBadge status={event.status} />
                  <strong>{dateTime(event.closeAt)}</strong>
                  <strong>{money(event.totalStake)}</strong>
                  <div className="flex flex-wrap gap-2">
                    <button className="refresh-button" type="button" title="View detail" onClick={() => setSelectedEvent(event)}><Eye size={16} /></button>
                    {(status === 'DRAFT' || status === 'CLOSED') && <button className="refresh-button" type="button" title="Open" onClick={() => setConfirmAction({ action: 'OPEN', event })}><Check size={16} /></button>}
                    {status === 'OPEN' && <button className="refresh-button" type="button" title="Close" onClick={() => setConfirmAction({ action: 'CLOSE', event })}><X size={16} /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <EventDetail event={selectedEvent} />

      {createOpen && (
        <CreateEventModal
          products={products}
          races={races}
          onCancel={() => setCreateOpen(false)}
          onCreate={createEvent}
        />
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
            <AlertTriangle className="text-amber-600" size={28} />
            <h2 className="mt-3 text-2xl font-black text-brown-900">Xác nhận thao tác</h2>
            <p className="mt-2 font-medium text-slate-500">
              Bạn có chắc muốn {confirmAction.action.toLowerCase()} event #{confirmAction.event.betEventId} không?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="outline-button" type="button" onClick={() => setConfirmAction(null)}>Hủy</button>
              <button className="primary-button owner-hero-action" type="button" onClick={executeEventAction}>Xác nhận</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
