import React, { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Sparkles,
  Zap,
  Users,
  CircleDollarSign,
  TrendingUp,
  Star,
  Check,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarClock,
  ArrowRightLeft,
  Ban,
  Building2,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { subscriptionApi, ApiError } from '../../api';
import type { AdminPlanOverview, AdminSubscriberRow, PlanInput } from '../../api';
import { toast } from '../../store/useToast';
import { Dropdown } from '../ui/Dropdown';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + ' vnđ';

const formatLimit = (n: number) => (n < 0 ? 'Không giới hạn' : n.toLocaleString('vi-VN'));

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(ts),
  );

/** Presentation derives from rank/price, not fixed codes (catalogue is dynamic). */
const planIcon = (plan: { price: number; trial: boolean }, isTop: boolean): LucideIcon => {
  if (isTop) return Crown;
  if (plan.trial || plan.price === 0) return Sparkles;
  return Zap;
};

const planBox = (isTop: boolean, isTrial: boolean): string => {
  if (isTop) return 'bg-[#17140F] text-white';
  if (isTrial) return 'bg-[#17140F]/5 text-[#17140F]';
  return 'bg-[#B8924A]/15 text-[#B8924A]';
};

/** Normalise a plan's cycle price to a ~monthly figure so plans with different
 * durations (14 / 30 / 365 ngày) contribute comparably to the MRR estimate. */
const monthlyEquivalent = (price: number, durationDays: number) =>
  durationDays > 0 ? Math.round((price * 30) / durationDays) : 0;

const EMPTY_FORM: PlanInput = {
  name: '',
  description: '',
  price: 0,
  durationDays: 30,
  maxShops: 1,
  maxProducts: 10,
  recommended: false,
  features: [],
};

interface PlanModalState {
  mode: 'create' | 'edit';
  plan: AdminPlanOverview | null;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlanOverview[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<PlanModalState | null>(null);
  const [subRow, setSubRow] = useState<AdminSubscriberRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [planList, subList] = await Promise.all([
        subscriptionApi.adminOverview(),
        subscriptionApi.adminSubscribers(),
      ]);
      setPlans(planList);
      setSubscribers(subList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu gói dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const maxSort = useMemo(
    () => plans.reduce((m, p) => Math.max(m, p.sortOrder), 0),
    [plans],
  );

  const { totalSubs, mrr, paidSubs, paidRate } = useMemo(() => {
    const total = plans.reduce((s, p) => s + p.subscribers, 0);
    const monthlyRevenue = plans.reduce(
      (s, p) => s + monthlyEquivalent(p.price, p.durationDays) * p.subscribers,
      0,
    );
    const paid = plans.filter((p) => p.price > 0).reduce((s, p) => s + p.subscribers, 0);
    return {
      totalSubs: total,
      mrr: monthlyRevenue,
      paidSubs: paid,
      paidRate: total ? Math.round((paid / total) * 100) : 0,
    };
  }, [plans]);

  const metrics = [
    {
      label: 'Tổng người đăng ký',
      val: totalSubs.toLocaleString('vi-VN'),
      sub: `${plans.length} gói đang vận hành`,
      Icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Doanh thu định kỳ (MRR)',
      val: formatVND(mrr),
      sub: 'Ước tính quy đổi theo tháng',
      Icon: CircleDollarSign,
      color: 'text-[#B8924A]',
    },
    {
      label: 'Tỷ lệ trả phí',
      val: `${paidRate}%`,
      sub: `${paidSubs.toLocaleString('vi-VN')} người dùng trả phí`,
      Icon: TrendingUp,
      color: 'text-green-600',
    },
  ];

  const handleDeletePlan = async (plan: AdminPlanOverview) => {
    const ok = await toast.confirm(`Xóa gói "${plan.name}"? Hành động này không thể hoàn tác.`, {
      title: 'Xóa gói dịch vụ?',
      confirmText: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    try {
      setBusyId(plan.code);
      await subscriptionApi.adminDeletePlan(plan.code);
      await loadData();
      toast.success('Đã xóa gói dịch vụ.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xóa gói.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Quản Lý Gói Dịch Vụ</h1>
          <p className="text-xs text-gray-500 mt-1">
            Tạo, chỉnh sửa gói và quản lý cửa hàng đang dùng gói trả phí trên TrueWrist
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setPlanModal({ mode: 'create', plan: null })}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17140F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm gói
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e0d8] bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] shadow-sm transition hover:border-[#B8924A] hover:text-[#9A7434]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#B8924A]' : ''}`} />
            Làm mới
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Metric cards */}
      <section className="grid sm:grid-cols-3 gap-6 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#e5e0d8] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{m.label}</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#17140F] mb-1">{loading ? '—' : m.val}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">{m.sub}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-[#F6F4EF] flex items-center justify-center border border-gray-100 ${m.color}`}>
              <m.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Plans table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
        <h3 className="font-display text-sm font-bold mb-4 border-b border-[#e5e0d8] pb-3">Danh sách gói</h3>

        {loading && <p className="py-12 text-center text-gray-400 text-xs">Đang tải…</p>}
        {!loading && !error && plans.length === 0 && (
          <p className="py-12 text-center text-gray-400 text-xs">Chưa có gói dịch vụ nào.</p>
        )}

        {!loading && plans.length > 0 && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                  <th className="py-3 px-4">Gói</th>
                  <th className="py-3 px-4">Giá / chu kỳ</th>
                  <th className="py-3 px-4 text-center">Người đăng ký</th>
                  <th className="py-3 px-4 text-center">Tỷ trọng</th>
                  <th className="py-3 px-4 text-right">Doanh thu/tháng</th>
                  <th className="py-3 px-4 text-center">Giới hạn</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => {
                  const isTop = p.sortOrder >= maxSort && p.price > 0;
                  const Icon = planIcon(p, isTop);
                  const share = totalSubs ? Math.round((p.subscribers / totalSubs) * 100) : 0;
                  const monthlyRevenue = monthlyEquivalent(p.price, p.durationDays) * p.subscribers;
                  return (
                    <tr key={p.code} className="border-b border-gray-50 hover:bg-gray-50/50 transition align-top">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${planBox(isTop, p.trial)}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-display font-bold text-sm text-[#17140F] flex items-center gap-1.5">
                              {p.name}
                              {p.trial && (
                                <span className="inline-flex items-center bg-gray-100 text-gray-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Mặc định
                                </span>
                              )}
                              {p.recommended && (
                                <span className="inline-flex items-center gap-1 bg-[#B8924A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                  <Star className="h-2.5 w-2.5 fill-current" /> Đề xuất
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 max-w-[240px] truncate">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#17140F]">{p.price === 0 ? 'Miễn phí' : formatVND(p.price)}</span>
                        <span className="block text-[10px] text-gray-400">{p.durationDays} ngày</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                        {p.subscribers.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
                            <div className="h-full bg-[#B8924A]" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 w-8 text-right">{share}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#B8924A]">
                        {monthlyRevenue === 0 ? '—' : formatVND(monthlyRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[11px] text-gray-600">
                        <span className="font-semibold">{formatLimit(p.maxShops)}</span> cửa hàng
                        <span className="block text-gray-400">{formatLimit(p.maxProducts)} sản phẩm</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPlanModal({ mode: 'edit', plan: p })}
                            disabled={busyId === p.code}
                            title="Chỉnh sửa gói"
                            aria-label="Chỉnh sửa gói"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#B8924A]/30 text-[#B8924A] hover:bg-[#B8924A]/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDeletePlan(p)}
                            disabled={busyId === p.code || p.trial}
                            title={p.trial ? 'Không thể xóa gói mặc định' : 'Xóa gói'}
                            aria-label="Xóa gói"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Paid subscribers */}
      <section className="mt-6 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e0d8] pb-3">
          <div>
            <h3 className="font-display text-sm font-bold">Cửa hàng đang dùng gói trả phí</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Gia hạn, đổi gói hoặc hủy gói cho từng cửa hàng</p>
          </div>
          <span className="rounded-full bg-[#B8924A]/10 px-3 py-1 text-[11px] font-bold text-[#9A7434]">
            {subscribers.length} cửa hàng
          </span>
        </div>

        {loading && <p className="py-10 text-center text-gray-400 text-xs">Đang tải…</p>}
        {!loading && subscribers.length === 0 && (
          <p className="py-10 text-center text-gray-400 text-xs">Chưa có cửa hàng nào dùng gói trả phí.</p>
        )}

        {!loading && subscribers.length > 0 && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Cửa hàng</th>
                  <th className="py-3 px-4">Gói</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Ngày hết hạn</th>
                  <th className="py-3 px-4 text-center">Còn lại</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.userId} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#17140F]">{s.userName}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {s.userEmail}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {s.shopName || <span className="text-gray-400 italic">Chưa tạo cửa hàng</span>}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#17140F]">{s.planName}</span>
                      <span className="block text-[10px] text-[#B8924A] font-semibold">{formatVND(s.price)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {s.status === 'ACTIVE' ? (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">Hoạt động</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[9px]">Hết hạn</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500">{formatDate(s.expiresAt)}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-700">{s.daysRemaining} ngày</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSubRow(s)}
                        disabled={busyId === s.userId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e0d8] px-3 py-1.5 text-[11px] font-bold text-[#17140F] hover:border-[#B8924A] hover:text-[#9A7434] disabled:opacity-40"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Quản lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-6 text-[10px] text-gray-400">
        Gói dùng thử mặc định không thể xóa. Không thể xóa gói khi vẫn còn cửa hàng đang sử dụng.
      </p>

      {planModal && (
        <PlanFormModal
          state={planModal}
          onClose={() => setPlanModal(null)}
          onSaved={async () => {
            setPlanModal(null);
            await loadData();
          }}
        />
      )}

      {subRow && (
        <SubscriberModal
          row={subRow}
          plans={plans}
          onClose={() => setSubRow(null)}
          onDone={async () => {
            setSubRow(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

// --- Plan create/edit modal -------------------------------------------------

function PlanFormModal({
  state,
  onClose,
  onSaved,
}: {
  state: PlanModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = state.mode === 'edit' && state.plan;
  const isTrial = !!state.plan?.trial;
  const [form, setForm] = useState<PlanInput>(() =>
    state.plan
      ? {
          name: state.plan.name,
          description: state.plan.description,
          price: state.plan.price,
          durationDays: state.plan.durationDays,
          maxShops: state.plan.maxShops,
          maxProducts: state.plan.maxProducts,
          recommended: state.plan.recommended,
          sortOrder: state.plan.sortOrder,
          features: state.plan.features,
        }
      : { ...EMPTY_FORM },
  );
  const [featureText, setFeatureText] = useState(() => (state.plan?.features ?? []).join('\n'));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PlanInput>(key: K, value: PlanInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên gói.');
      return;
    }
    if (form.durationDays <= 0) {
      toast.error('Thời hạn gói phải lớn hơn 0 ngày.');
      return;
    }
    const payload: PlanInput = {
      ...form,
      name: form.name.trim(),
      price: isTrial ? 0 : Math.max(0, form.price),
      features: featureText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };
    try {
      setSaving(true);
      if (editing && state.plan) {
        await subscriptionApi.adminUpdatePlan(state.plan.code, payload);
        toast.success('Đã cập nhật gói dịch vụ.');
      } else {
        await subscriptionApi.adminCreatePlan(payload);
        toast.success('Đã tạo gói dịch vụ mới.');
      }
      await onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể lưu gói.');
    } finally {
      setSaving(false);
    }
  };

  const numField = (label: string, key: keyof PlanInput, hint?: string, disabled?: boolean) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={String(form[key] as number)}
        disabled={disabled}
        onChange={(e) => set(key, (Number(e.target.value) || 0) as PlanInput[typeof key])}
        className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none disabled:opacity-60"
      />
      {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#e5e0d8] bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b border-[#e5e0d8] bg-white px-6 py-4">
          <h3 className="font-display text-lg font-bold text-[#17140F]">
            {editing ? 'Chỉnh sửa gói' : 'Thêm gói dịch vụ'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Tên gói *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="VD: Gói Quý"
              className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Mô tả</label>
            <input
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Mô tả ngắn về gói"
              className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {numField('Giá (vnđ)', 'price', isTrial ? 'Gói mặc định luôn miễn phí' : undefined, isTrial)}
            {numField('Thời hạn (ngày)', 'durationDays')}
            {numField('Giới hạn cửa hàng', 'maxShops', '-1 = không giới hạn')}
            {numField('Giới hạn sản phẩm', 'maxProducts', '-1 = không giới hạn')}
            {numField('Thứ tự hiển thị', 'sortOrder', 'Số lớn hơn = gói cao cấp hơn')}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Quyền lợi (mỗi dòng 1 mục)
            </label>
            <textarea
              value={featureText}
              onChange={(e) => setFeatureText(e.target.value)}
              rows={5}
              placeholder={'Tối đa 3 cửa hàng\nHỗ trợ AR Try-on'}
              className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm leading-6 focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-[#17140F]">
            <input
              type="checkbox"
              checked={form.recommended}
              onChange={(e) => set('recommended', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#B8924A] focus:ring-[#B8924A]"
            />
            Đánh dấu là gói đề xuất
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-3xl border-t border-[#e5e0d8] bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#17140F] px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {editing ? 'Lưu thay đổi' : 'Tạo gói'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Subscriber management modal --------------------------------------------

function SubscriberModal({
  row,
  plans,
  onClose,
  onDone,
}: {
  row: AdminSubscriberRow;
  plans: AdminPlanOverview[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const paidPlans = plans.filter((p) => p.price > 0);
  const [planCode, setPlanCode] = useState(row.planCode);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, okMsg: string) => {
    try {
      setBusy(true);
      await fn();
      toast.success(okMsg);
      await onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-3xl border border-[#e5e0d8] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e0d8] px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#17140F]">Quản lý gói cửa hàng</h3>
            <p className="text-[11px] text-gray-500">{row.userName} · {row.shopName || 'Chưa có cửa hàng'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Change plan */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Đổi gói</p>
            <div className="flex gap-2">
              <Dropdown
                value={planCode}
                onChange={setPlanCode}
                wrapperClassName="flex-1"
                ariaLabel="Đổi gói"
                className="rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none"
                options={paidPlans.map((p) => ({
                  value: p.code,
                  label: `${p.name} — ${formatVND(p.price)} / ${p.durationDays} ngày`,
                }))}
              />
              <button
                type="button"
                disabled={busy || planCode === row.planCode}
                onClick={() => void run(() => subscriptionApi.adminChangePlan(row.userId, planCode), 'Đã đổi gói cho cửa hàng.')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#17140F] px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-40"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Đổi
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">Đổi gói sẽ đặt lại chu kỳ theo thời hạn của gói mới.</p>
          </div>

          {/* Extend */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Gia hạn thêm</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={String(days)}
                  onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">ngày</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => subscriptionApi.adminExtend(row.userId, days), `Đã gia hạn thêm ${days} ngày.`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8924A] px-3 py-2 text-xs font-bold text-[#9A7434] hover:bg-[#B8924A]/10 disabled:opacity-40"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Gia hạn
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">Hết hạn hiện tại: {formatDate(row.expiresAt)} ({row.daysRemaining} ngày còn lại).</p>
          </div>

          {/* Cancel */}
          <div className="border-t border-[#e5e0d8] pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const ok = await toast.confirm(
                  `Hủy gói trả phí của ${row.userName}? Cửa hàng sẽ mất quyền lợi gói ngay lập tức.`,
                  { title: 'Hủy gói?', confirmText: 'Hủy gói', danger: true },
                );
                if (ok) void run(() => subscriptionApi.adminCancel(row.userId), 'Đã hủy gói của cửa hàng.');
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Ban className="h-4 w-4" /> Hủy gói trả phí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
