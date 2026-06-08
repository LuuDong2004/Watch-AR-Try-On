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
  type LucideIcon,
} from 'lucide-react';
import { subscriptionApi, ApiError } from '../../api';
import type { AdminPlanOverview, SubscriptionPlanCode } from '../../api';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const formatLimit = (n: number) => (n < 0 ? 'Không giới hạn' : n.toLocaleString('vi-VN'));

const PLAN_ICON: Record<SubscriptionPlanCode, LucideIcon> = {
  TRIAL: Sparkles,
  ESSENTIAL: Zap,
  PREMIUM: Crown,
};

const PLAN_BOX: Record<SubscriptionPlanCode, string> = {
  TRIAL: 'bg-[#17140F]/5 text-[#17140F]',
  ESSENTIAL: 'bg-[#B8924A]/15 text-[#B8924A]',
  PREMIUM: 'bg-[#17140F] text-white',
};

/** Normalise a plan's cycle price to a ~monthly figure so plans with different
 * durations (14 / 30 / 365 ngày) contribute comparably to the MRR estimate. */
const monthlyEquivalent = (price: number, durationDays: number) =>
  durationDays > 0 ? Math.round((price * 30) / durationDays) : 0;

export default function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlanOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await subscriptionApi.adminOverview();
      setPlans(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu gói dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Quản Lý Gói Dịch Vụ</h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi danh mục gói và số người đăng ký thực tế trên TrueWrist
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#e5e0d8] bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] shadow-sm transition hover:border-[#B8924A] hover:text-[#9A7434]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#B8924A]' : ''}`} />
          Làm mới
        </button>
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
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => {
                  const Icon = PLAN_ICON[p.code];
                  const share = totalSubs ? Math.round((p.subscribers / totalSubs) * 100) : 0;
                  const monthlyRevenue = monthlyEquivalent(p.price, p.durationDays) * p.subscribers;
                  return (
                    <tr key={p.code} className="border-b border-gray-50 hover:bg-gray-50/50 transition align-top">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${PLAN_BOX[p.code]}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-display font-bold text-sm text-[#17140F] flex items-center gap-1.5">
                              {p.name}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Plan feature breakdown */}
      {!loading && plans.length > 0 && (
        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => {
            const Icon = PLAN_ICON[p.code];
            return (
              <article key={p.code} className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${PLAN_BOX[p.code]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-sm text-[#17140F]">{p.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {p.price === 0 ? 'Miễn phí' : `${formatVND(p.price)} / ${p.durationDays} ngày`}
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-[11px]">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <Check className="h-3.5 w-3.5 text-[#B8924A] flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      )}

      <p className="mt-6 text-[10px] text-gray-400">
        Danh mục gói được cấu hình ở phía máy chủ. Số liệu người đăng ký phản ánh các gói còn hiệu lực.
      </p>
    </div>
  );
}
