import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Clock,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Ticket,
  Trophy,
  X,
  Settings2
} from 'lucide-react';
import { getRaces } from '../../../services/eventService';
import {
  closeAdminBetEvent,
  createAdminBetEvent,
  getAdminBetEventDetail,
  getAdminBetEvents,
  getAdminBetProducts,
  getAdminBetSettlementDetail,
  getAdminBetSettlements,
  openAdminBetEvent,
  settleAdminBetEvent,
  updateAdminBetProduct
} from '../../../services/bettingService';
import BettingEventDetailDrawer from './BettingEventDetailDrawer';
import CreateBetEventModal from './CreateBetEventModal';
import ProductEditor from './ProductEditor';
import {
  dateTime,
  eventStatuses,
  IconButton,
  inputClass,
  money,
  ProductBadge,
  SectionShell,
  StatCard,
  StatusBadge
} from './bettingUi';

export default function BettingManagement() {
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [races, setRaces] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedSettlementDetail, setSelectedSettlementDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [productList, eventList, raceList, settlementList] = await Promise.all([
        getAdminBetProducts(),
        getAdminBetEvents(),
        getRaces(),
        getAdminBetSettlements()
      ]);
      setProducts(productList || []);
      setEvents(eventList || []);
      setRaces(raceList || []);
      setSettlements(settlementList || []);
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
    pool: events.reduce((total, event) => total + Number(event.totalStake || 0), 0),
    operatorFee: settlements.reduce((total, settlement) => total + Number(settlement.operatorFee || 0), 0)
  }), [events, settlements]);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return events.filter((event) => {
      const status = String(event.status || '').toUpperCase();
      const haystack = [
        event.betEventId,
        event.raceName,
        event.trackName,
        event.productCode,
        event.productName,
        event.status
      ].join(' ').toLowerCase();
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

  async function openEventDetail(eventId) {
    setSelectedSettlementDetail(null);
    setSelectedDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      setSelectedDetail(await getAdminBetEventDetail(eventId));
    } catch (err) {
      setDetailError(err.message || 'Không thể tải chi tiết betting event.');
      setSelectedDetail({ event: events.find((event) => event.betEventId === eventId) });
    } finally {
      setDetailLoading(false);
    }
  }

  async function openSettlementDetail(settlementId) {
    setSelectedSettlementDetail(null);
    setSelectedDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      setSelectedSettlementDetail(await getAdminBetSettlementDetail(settlementId));
    } catch (err) {
      setDetailError(err.message || 'Không thể tải chi tiết settlement.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function executeEventAction() {
    if (!confirmAction) return;
    setError('');
    setMessage('');
    try {
      if (confirmAction.action === 'OPEN') await openAdminBetEvent(confirmAction.event.betEventId);
      if (confirmAction.action === 'CLOSE') await closeAdminBetEvent(confirmAction.event.betEventId);
      if (confirmAction.action === 'SETTLE') await settleAdminBetEvent(confirmAction.event.betEventId);
      const successMessage = {
        OPEN: 'Đã mở betting event.',
        CLOSE: 'Đã đóng betting event.',
        SETTLE: 'Đã settle tiền cược cho event.'
      };
      setMessage(successMessage[confirmAction.action] || 'Đã xử lý betting event.');
      setConfirmAction(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể xử lý betting event.');
      setConfirmAction(null);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-[118rem] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-brown-200/70 bg-white p-6 shadow-[0_18px_50px_rgba(76,45,25,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brown-500">Admin Betting</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-brown-950">Betting Management</h1>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-500">
              Quản lý sản phẩm cược, lịch mở cược theo Race, theo dõi pool và kiểm tra settlement history từ hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brown-200 bg-white px-4 text-sm font-black text-brown-700 shadow-sm transition hover:bg-cream-100 disabled:opacity-60" type="button" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={isLoading ? 'animate-spin' : ''} size={17} /> Làm mới
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brown-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-brown-800" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={17} /> Tạo event
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <StatCard label="Open events" value={stats.open} description="Đang nhận cược" icon={Clock} tone="text-emerald-700" />
        <StatCard label="Closed events" value={stats.closed} description="Đã đóng chờ settle" icon={Ticket} tone="text-amber-700" />
        <StatCard label="Settled events" value={stats.settled} description="Đã settlement" icon={Check} tone="text-sky-700" />
        <StatCard label="Total pool" value={money(stats.pool)} description="Tổng stake đang ghi nhận" icon={CircleDollarSign} tone="text-brown-700" />
        <StatCard label="Operator fee" value={money(stats.operatorFee)} description="Doanh thu phí hệ thống" icon={Trophy} tone="text-purple-700" />
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700" role="status">{message}</div>}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(24rem,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionShell
            eyebrow="Betting Events"
            title="Event ledger"
            description="Theo dõi các cửa cược theo từng Race. Dùng bộ lọc nhanh để kiểm tra trạng thái, pool và thời gian đóng cược."
            action={(
              <div className="flex items-center gap-2 rounded-xl border border-brown-200 bg-cream-50 px-3 py-2 text-sm font-black text-brown-700">
                <Ticket size={16} /> {filteredEvents.length}/{events.length} events
              </div>
            )}
          >
            <div className="border-b border-brown-100 p-5">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
                <label className="relative min-w-0">
                  <span className="sr-only">Tìm betting event</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className={`${inputClass} w-full pl-11`}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm Race, đường đua, product, Status..."
                  />
                </label>
                <label className="relative">
                  <span className="sr-only">Lọc Status</span>
                  <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select className={`${inputClass} w-full pl-11`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {eventStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[7%]" />
                  <col className="w-[30%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="sticky top-0 z-[1] bg-cream-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-4 xl:px-4">ID</th>
                    <th className="px-3 py-4 xl:px-4">Race</th>
                    <th className="px-3 py-4 xl:px-4">Product</th>
                    <th className="px-3 py-4 text-center xl:px-4">Status</th>
                    <th className="px-3 py-4 xl:px-4">Close at</th>
                    <th className="px-3 py-4 text-right xl:px-4">Pool</th>
                    <th className="px-3 py-4 text-center xl:px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td className="px-5 py-14 text-center font-black text-brown-700" colSpan={7}>
                        <Loader2 className="mx-auto mb-2 animate-spin" size={22} /> Đang tải betting...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td className="px-5 py-14 text-center" colSpan={7}>
                        <div className="mx-auto max-w-sm">
                          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-cream-100 text-brown-700"><Ticket size={22} /></div>
                          <h3 className="mt-3 text-lg font-black text-brown-950">Không có betting event phù hợp</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">Thử đổi Status hoặc từ khóa tìm kiếm.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEvents.map((event) => {
                    const status = String(event.status || '').toUpperCase();
                    return (
                      <tr className="transition hover:bg-cream-50/70" key={event.betEventId}>
                        <td className="px-3 py-4 align-middle text-xs font-black text-brown-950 xl:px-4">#{event.betEventId}</td>
                        <td className="px-3 py-4 align-middle xl:px-4">
                          <button className="block min-w-0 text-left" type="button" onClick={() => openEventDetail(event.betEventId)}>
                            <strong className="block truncate text-base font-black text-brown-950" title={event.raceName}>{event.raceName}</strong>
                            <span className="mt-1 block truncate text-xs font-semibold text-slate-500" title={`${event.trackName} · ${dateTime(event.raceStartTime)}`}>
                              {event.trackName} · {dateTime(event.raceStartTime)}
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-4 align-middle xl:px-4"><ProductBadge code={event.productCode} /></td>
                        <td className="px-3 py-4 text-center align-middle xl:px-4"><StatusBadge status={event.status} /></td>
                        <td className="px-3 py-4 align-middle text-xs font-bold text-slate-600 xl:px-4" title={dateTime(event.closeAt)}>{dateTime(event.closeAt)}</td>
                        <td className="px-3 py-4 text-right align-middle font-black text-brown-950 xl:px-4" title={money(event.totalStake)}>{money(event.totalStake)}</td>
                        <td className="px-3 py-4 align-middle xl:px-4">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <IconButton label="Xem chi tiết" icon={Eye} onClick={() => openEventDetail(event.betEventId)} />
                            {status === 'DRAFT' && <IconButton label="Open event" icon={Check} onClick={() => setConfirmAction({ action: 'OPEN', event })} tone="primary" />}
                            {status === 'OPEN' && <IconButton label="Close event" icon={X} onClick={() => setConfirmAction({ action: 'CLOSE', event })} tone="danger" />}
                            {status === 'CLOSED' && <IconButton label="Settle event" icon={CircleDollarSign} onClick={() => setConfirmAction({ action: 'SETTLE', event })} tone="primary" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Settlement History"
            title="Betting settlement"
            description="Lịch sử settle đã ghi nhận operator fee và payout pool. Chọn một dòng để xem ticket liên quan."
          >
            <div className="divide-y divide-brown-100">
              {settlements.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-xl bg-cream-100 text-brown-700"><CircleDollarSign size={22} /></div>
                  <h3 className="mt-3 text-lg font-black text-brown-950">Chưa có settlement</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Settlement sẽ xuất hiện sau khi event cược được xử lý.</p>
                </div>
              ) : settlements.slice(0, 8).map((settlement) => (
                <button
                  key={settlement.betSettlementId}
                  className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-cream-50 md:grid-cols-[minmax(0,1fr)_10rem_10rem_3rem] md:items-center"
                  type="button"
                  onClick={() => openSettlementDetail(settlement.betSettlementId)}
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-brown-950">{settlement.raceName}</strong>
                    <small className="font-semibold text-slate-500">{settlement.productCode} · {dateTime(settlement.settledAt)}</small>
                  </span>
                  <span>
                    <small className="block text-xs font-black uppercase text-slate-500">Operator fee</small>
                    <strong className="text-amber-700">{money(settlement.operatorFee)}</strong>
                  </span>
                  <span>
                    <small className="block text-xs font-black uppercase text-slate-500">Total stake</small>
                    <strong className="text-brown-950">{money(settlement.totalStake)}</strong>
                  </span>
                  <Eye className="justify-self-end text-brown-500" size={18} />
                </button>
              ))}
            </div>
          </SectionShell>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <SectionShell
            eyebrow="Betting Products"
            title="Product controls"
            description="Chọn một sản phẩm để mở bảng cấu hình stake, fee và trạng thái."
          >
            <div className="grid gap-4 p-5">
              {products.length === 0 && !isLoading ? (
                <div className="rounded-xl border border-dashed border-brown-200 bg-cream-50 p-6 text-center font-bold text-slate-500">Chưa có sản phẩm cược.</div>
              ) : products.map((product) => (
                <button
                  key={product.betProductId}
                  type="button"
                  onClick={() => setEditingProduct(product)}
                  className="group rounded-xl border border-brown-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brown-300 hover:bg-cream-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-gold-400/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brown-700 text-white shadow-sm">
                      <Settings2 size={19} />
                    </span>
                    <StatusBadge status={product.active ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                  <div className="mt-4 min-w-0">
                    <ProductBadge code={product.code} />
                    <h3 className="mt-3 truncate text-xl font-black text-brown-950">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                      {product.description || 'Mở popup để chỉnh cấu hình sản phẩm cược.'}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-brown-100 bg-white p-3">
                    <span>
                      <small className="block text-[0.65rem] font-black uppercase tracking-wide text-slate-500">Min stake</small>
                      <strong className="text-sm font-black text-brown-950">{money(product.minStake)}</strong>
                    </span>
                    <span>
                      <small className="block text-[0.65rem] font-black uppercase tracking-wide text-slate-500">Fee</small>
                      <strong className="text-sm font-black text-brown-950">{(Number(product.operatorFeeRate || 0) * 100).toFixed(1).replace('.0', '')}%</strong>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </SectionShell>
        </aside>
      </div>

      {createOpen && (
        <CreateBetEventModal
          products={products}
          races={races}
          onCancel={() => setCreateOpen(false)}
          onCreate={createEvent}
        />
      )}

      {(selectedDetail || selectedSettlementDetail || detailLoading || detailError) && (
        <BettingEventDetailDrawer
          detail={selectedDetail}
          settlementDetail={selectedSettlementDetail}
          isLoading={detailLoading}
          error={detailError}
          onClose={() => {
            setSelectedDetail(null);
            setSelectedSettlementDetail(null);
            setDetailError('');
          }}
          onViewSettlement={openSettlementDetail}
        />
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brown-950/55 px-4 py-6 backdrop-blur-sm">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brown-200 bg-white shadow-[0_30px_90px_rgba(43,23,16,0.32)]">
            <header className="flex items-start justify-between gap-4 border-b border-brown-100 bg-cream-50 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brown-500">Product Control</p>
                <h2 className="mt-1 text-2xl font-black text-brown-950">Cấu hình sản phẩm cược</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Cập nhật stake limit, operator fee và trạng thái active.</p>
              </div>
              <IconButton label="Đóng" icon={X} onClick={() => setEditingProduct(null)} />
            </header>
            <div className="p-6">
              <ProductEditor
                product={editingProduct}
                onSave={async (productId, payload) => {
                  await saveProduct(productId, payload);
                  setEditingProduct(null);
                }}
              />
            </div>
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brown-950/55 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-brown-200 bg-white p-6 shadow-[0_30px_90px_rgba(43,23,16,0.32)]">
            <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={26} />
            </div>
            <h2 className="mt-4 text-2xl font-black text-brown-950">Xác nhận thao tác</h2>
            <p className="mt-2 font-semibold leading-6 text-slate-500">
              {{
                OPEN: `Bạn có chắc muốn mở event #${confirmAction.event.betEventId} không?`,
                CLOSE: `Bạn có chắc muốn đóng event #${confirmAction.event.betEventId} không?`,
                SETTLE: `Bạn có chắc muốn settle tiền cược cho event #${confirmAction.event.betEventId} không?`
              }[confirmAction.action] || `Bạn có chắc muốn xử lý event #${confirmAction.event.betEventId} không?`}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="min-h-11 rounded-xl border border-brown-200 bg-white px-5 text-sm font-black text-brown-700 transition hover:bg-cream-100" type="button" onClick={() => setConfirmAction(null)}>Hủy</button>
              <button className="min-h-11 rounded-xl bg-brown-700 px-5 text-sm font-black text-white transition hover:bg-brown-800" type="button" onClick={executeEventAction}>Xác nhận</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
