import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  User as UserIcon,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { paymentApi, ApiError } from '../../api';
import type { AdminTransaction, PaymentStatus, RevenueStats } from '../../api';
import { toast } from '../../store/useToast';

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ';
const formatShort = (value: number) =>
  value >= 1_000_000 ? (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr'
    : value >= 1_000 ? Math.round(value / 1_000) + 'k'
      : String(value);
const formatDateTime = (ts?: number | null) => (ts ? new Date(ts).toLocaleString('vi-VN') : '—');
const monthLabel = (m: string) => {
  const [, mm] = m.split('-');
  return `Th${Number(mm)}`;
};

const STATUS_META: Record<PaymentStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' },
  EXPIRED: { label: 'Hết hạn', cls: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' },
  FAILED: { label: 'Thất bại', cls: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
};

const initialsOf = (name?: string | null, email?: string | null) =>
  (name || email || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

type Filter = 'ALL' | PaymentStatus;

/** Admin transactions + revenue dashboard for the PayOS subscription payments. */
export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [noteModal, setNoteModal] = useState<{ tx: AdminTransaction; action: 'cancel' | 'refund' } | null>(null);
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      setError(null);
      const [txs, rev] = await Promise.all([paymentApi.adminTransactions(), paymentApi.adminRevenue()]);
      setTransactions(txs);
      setRevenue(rev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? transactions : transactions.filter((t) => t.status === filter)),
    [transactions, filter],
  );

  const maxMonthly = useMemo(
    () => Math.max(1, ...(revenue?.monthly.map((m) => m.revenue) ?? [1])),
    [revenue],
  );

  const handleMarkPaid = async (tx: AdminTransaction) => {
    const ok = await toast.confirm(
      `Đánh dấu giao dịch của ${tx.userName || tx.userEmail} (${formatVND(tx.amount)}) là ĐÃ THANH TOÁN? Gói sẽ được kích hoạt và cấp quyền bán hàng.`,
      { title: 'Xác nhận đã thanh toán', confirmText: 'Kích hoạt' },
    );
    if (!ok) return;
    try {
      setBusyId(tx.id);
      await paymentApi.adminMarkPaid(tx.id);
      toast.success('Đã kích hoạt gói cho người dùng.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể cập nhật giao dịch.');
    } finally {
      setBusyId(null);
    }
  };

  const submitNote = async () => {
    if (!noteModal) return;
    const { tx, action } = noteModal;
    try {
      setBusyId(tx.id);
      if (action === 'refund') await paymentApi.adminRefund(tx.id, note.trim() || undefined);
      else await paymentApi.adminCancel(tx.id, note.trim() || undefined);
      toast.success(action === 'refund' ? 'Đã đánh dấu hoàn tiền.' : 'Đã hủy giao dịch.');
      setNoteModal(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể cập nhật giao dịch.');
    } finally {
      setBusyId(null);
    }
  };

  const stats = revenue && [
    { label: 'Tổng doanh thu', value: formatVND(revenue.totalRevenue), Icon: Wallet, tone: 'text-[#B8924A]' },
    { label: 'Doanh thu tháng này', value: formatVND(revenue.revenueThisMonth), Icon: TrendingUp, tone: 'text-emerald-600' },
    { label: '30 ngày gần nhất', value: formatVND(revenue.revenueLast30Days), Icon: BarChart3, tone: 'text-blue-600' },
    { label: 'Giao dịch thành công', value: String(revenue.paidCount), Icon: BadgeCheck, tone: 'text-emerald-600' },
    { label: 'Đang chờ', value: String(revenue.pendingCount), Icon: Clock3, tone: 'text-amber-600' },
  ];

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PAID', label: 'Đã thanh toán' },
    { id: 'PENDING', label: 'Chờ thanh toán' },
    { id: 'REFUNDED', label: 'Hoàn tiền' },
    { id: 'FAILED', label: 'Thất bại' },
  ];

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#F6F4EF] p-6 font-sans text-[#17140F] md:p-8">
      <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Giao dịch &amp; Doanh thu</h1>
          <p className="mt-1 text-xs text-gray-500">
            Theo dõi toàn bộ thanh toán gói dịch vụ qua cổng QR (PayOS) và quản lý doanh thu của sàn.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#ded7ca] bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] shadow-sm transition hover:border-[#B8924A] hover:text-[#9A7434]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </header>

      {/* Revenue stat cards */}
      {stats && (
        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#e5e0d8] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
                <s.Icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <p className="mt-2 font-display text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Monthly chart + by-plan breakdown */}
      {revenue && (
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-[#e5e0d8] bg-white p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Doanh thu 6 tháng gần nhất</p>
            <div className="flex h-44 items-end justify-between gap-3">
              {revenue.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-[#9A7434]">{m.revenue > 0 ? formatShort(m.revenue) : ''}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#B8924A] to-[#D5B46B] transition-all"
                      style={{ height: `${Math.max(2, (m.revenue / maxMonthly) * 100)}%` }}
                      title={`${formatVND(m.revenue)} · ${m.count} giao dịch`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e5e0d8] bg-white p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Doanh thu theo gói</p>
            {revenue.byPlan.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Chưa có doanh thu.</p>
            ) : (
              <ul className="space-y-3">
                {revenue.byPlan.map((p) => (
                  <li key={p.planCode} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-[#17140F]">
                      <CreditCard className="h-3.5 w-3.5 text-[#B8924A]" /> {p.planName}
                    </span>
                    <span className="text-right">
                      <span className="block font-bold">{formatVND(p.revenue)}</span>
                      <span className="text-[10px] text-gray-400">{p.count} giao dịch</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Transactions table */}
      <section className="rounded-3xl border border-[#e5e0d8] bg-white p-6 text-xs shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                filter === f.id ? 'bg-[#17140F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-semibold text-gray-400">{filtered.length} giao dịch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[9px] uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Người mua</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Đang tải…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="py-10 text-center text-red-500">{error}</td></tr>}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                  <CreditCard className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                  Chưa có giao dịch nào.
                </td></tr>
              )}
              {!loading && !error && filtered.map((tx) => {
                const meta = STATUS_META[tx.status];
                return (
                  <tr key={tx.id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#17140F]/5 text-[10px] font-bold text-[#17140F]">
                          {initialsOf(tx.userName, tx.userEmail)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-bold text-[#17140F]"><UserIcon className="h-3 w-3 text-gray-400" />{tx.userName || '—'}</p>
                          <p className="flex items-center gap-1.5 text-gray-500"><Mail className="h-3 w-3 text-gray-400" />{tx.userEmail || '—'}</p>
                          <p className="mt-0.5 font-mono text-[9px] text-gray-300">#{tx.orderCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B8924A]/15 px-2.5 py-1 font-bold text-[#9A7434]">
                        <CreditCard className="h-3 w-3" /> {tx.planName}
                      </span>
                      {tx.providerRef && <p className="mt-1 font-mono text-[9px] text-gray-400">Ref: {tx.providerRef}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatVND(tx.amount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">
                      <p>Tạo: {formatDateTime(tx.createdAt)}</p>
                      {tx.paidAt && <p className="text-emerald-600">Trả: {formatDateTime(tx.paidAt)}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {(tx.status === 'PENDING' || tx.status === 'FAILED' || tx.status === 'EXPIRED') && (
                          <button
                            onClick={() => handleMarkPaid(tx)}
                            disabled={busyId === tx.id}
                            title="Đánh dấu đã thanh toán & kích hoạt gói"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === tx.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Kích hoạt
                          </button>
                        )}
                        {tx.status === 'PENDING' && (
                          <button
                            onClick={() => { setNoteModal({ tx, action: 'cancel' }); setNote(''); }}
                            disabled={busyId === tx.id}
                            title="Hủy giao dịch"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-bold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Hủy
                          </button>
                        )}
                        {tx.status === 'PAID' && (
                          <button
                            onClick={() => { setNoteModal({ tx, action: 'refund' }); setNote(''); }}
                            disabled={busyId === tx.id}
                            title="Hoàn tiền"
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 font-bold text-violet-600 transition hover:bg-violet-50 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Hoàn tiền
                          </button>
                        )}
                        {(tx.status === 'CANCELLED' || tx.status === 'REFUNDED') && (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cancel / refund note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setNoteModal(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5">
              {noteModal.action === 'refund'
                ? <RotateCcw className="h-5 w-5 text-violet-600" />
                : <XCircle className="h-5 w-5 text-gray-500" />}
              <h3 className="font-display text-lg font-bold text-[#17140F]">
                {noteModal.action === 'refund' ? 'Hoàn tiền giao dịch' : 'Hủy giao dịch'}
              </h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {noteModal.action === 'refund' ? 'Hoàn tiền' : 'Hủy'} giao dịch{' '}
              <span className="font-semibold">{formatVND(noteModal.tx.amount)}</span> · gói{' '}
              <span className="font-semibold">{noteModal.tx.planName}</span> của{' '}
              {noteModal.tx.userName || noteModal.tx.userEmail}.
            </p>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Ghi chú (tuỳ chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Khách yêu cầu hoàn tiền do đăng ký nhầm gói…"
              className="mt-1.5 w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-3 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setNoteModal(null)} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                Đóng
              </button>
              <button
                onClick={submitNote}
                disabled={busyId === noteModal.tx.id}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${
                  noteModal.action === 'refund' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-[#17140F] hover:bg-black'
                }`}
              >
                {busyId === noteModal.tx.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
