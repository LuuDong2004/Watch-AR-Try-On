import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Package,
  Sparkles,
  Star,
} from 'lucide-react';
import { leadApi, watchApi } from '../../api';
import type { Lead, Watch } from '../../api';
import { useSession } from '../../auth/session';

interface ShopDashboardProps {
  onNavigateToLeads: () => void;
  onNavigateToProducts: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_LEFT = 40;
const CHART_RIGHT = 460;
const CHART_TOP = 20;
const CHART_BOTTOM = 170;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value) + ' vnđ';

const getLeadTime = (lead: Lead) => {
  if (lead.createdAt) return lead.createdAt;
  const parsed = lead.timestamp ? Date.parse(lead.timestamp) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ShopDashboard({
  onNavigateToLeads,
  onNavigateToProducts,
}: ShopDashboardProps) {
  const user = useSession((state) => state.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user?.shopId) {
      setLeads([]);
      setWatches([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError('');

    Promise.all([watchApi.list(user.shopId), leadApi.list()])
      .then(([watchList, leadList]) => {
        if (cancelled) return;
        setWatches(watchList);
        setLeads(leadList.filter((lead) => lead.shopId === user.shopId));
      })
      .catch(() => {
        if (cancelled) return;
        setWatches([]);
        setLeads([]);
        setLoadError('Không thể tải dữ liệu tổng quan của cửa hàng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.shopId]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const rangeStart = todayStart - 6 * DAY_MS;
    const activeWatches = watches.filter((watch) => (watch.status || 'active') === 'active');
    const arWatches = activeWatches.filter((watch) => watch.hasAR);
    const newLeads = leads.filter((lead) => lead.status === 'new');
    const appointmentLeads = leads.filter((lead) => lead.type === 'appointment');
    const bookedAppointments = appointmentLeads.filter((lead) => lead.status === 'booked');
    const triedOnLeads = leads.filter((lead) => lead.hasTriedOn);
    const triedOnLastSevenDays = triedOnLeads.filter((lead) => getLeadTime(lead) >= rangeStart);

    const chartDays = Array.from({ length: 7 }, (_, index) => {
      const start = rangeStart + index * DAY_MS;
      const end = start + DAY_MS;
      const date = new Date(start);
      const dailyLeads = leads.filter((lead) => {
        const createdAt = getLeadTime(lead);
        return createdAt >= start && createdAt < end;
      });

      return {
        label: new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        }).format(date),
        total: dailyLeads.length,
        triedOn: dailyLeads.filter((lead) => lead.hasTriedOn).length,
      };
    });

    const maxChartValue = Math.max(
      1,
      ...chartDays.flatMap((day) => [day.total, day.triedOn]),
    );
    const chartX = (index: number) =>
      CHART_LEFT + (index * (CHART_RIGHT - CHART_LEFT)) / Math.max(chartDays.length - 1, 1);
    const chartY = (value: number) =>
      CHART_BOTTOM - (value / maxChartValue) * (CHART_BOTTOM - CHART_TOP);
    const totalPoints = chartDays
      .map((day, index) => `${chartX(index)},${chartY(day.total)}`)
      .join(' ');
    const triedOnPoints = chartDays
      .map((day, index) => `${chartX(index)},${chartY(day.triedOn)}`)
      .join(' ');

    const leadCountByWatch = leads.reduce<Record<string, number>>((counts, lead) => {
      if (lead.watchId) counts[lead.watchId] = (counts[lead.watchId] || 0) + 1;
      return counts;
    }, {});
    const topWatches = [...watches]
      .sort((left, right) => {
        const leadDifference =
          (leadCountByWatch[right.id] || 0) - (leadCountByWatch[left.id] || 0);
        if (leadDifference !== 0) return leadDifference;
        return (right.createdAt || 0) - (left.createdAt || 0);
      })
      .slice(0, 5);

    return {
      activeWatches,
      arWatches,
      newLeads,
      appointmentLeads,
      bookedAppointments,
      triedOnLeads,
      triedOnLastSevenDays,
      chartDays,
      maxChartValue,
      totalPoints,
      triedOnPoints,
      chartX,
      chartY,
      leadCountByWatch,
      topWatches,
    };
  }, [leads, watches]);

  const currentDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const urgentLeads = dashboardData.newLeads.slice(0, 3);
  const hasChartData = dashboardData.chartDays.some(
    (day) => day.total > 0 || day.triedOn > 0,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F4EF] text-sm text-[#8A8170]">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#F6F4EF] p-6 font-sans text-[#17140F] md:p-8">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#17140F] md:text-3xl">
            Tổng Quan Cửa Hàng
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Dữ liệu sản phẩm, liên hệ và lịch hẹn được cập nhật trực tiếp từ hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-[#e5e0d8] bg-white px-4 py-2 text-xs font-semibold capitalize text-gray-400 shadow-sm">
          <Calendar className="h-3.5 w-3.5" />
          {currentDate}
        </div>
      </header>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          {loadError}
        </div>
      )}

      <section className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Sản phẩm đang bán',
            value: dashboardData.activeWatches.length,
            detail: `${dashboardData.arWatches.length} sản phẩm hỗ trợ AR`,
            color: 'text-blue-600',
            Icon: Package,
          },
          {
            label: 'Yêu cầu có thử AR',
            value: dashboardData.triedOnLeads.length,
            detail: `${dashboardData.triedOnLastSevenDays.length} yêu cầu trong 7 ngày qua`,
            color: 'text-[#B8924A]',
            Icon: Sparkles,
          },
          {
            label: 'Liên hệ mới',
            value: dashboardData.newLeads.length,
            detail: `${leads.length} tổng yêu cầu`,
            color: 'text-amber-500',
            Icon: Mail,
          },
          {
            label: 'Lịch hẹn đã xếp',
            value: dashboardData.bookedAppointments.length,
            detail: `${dashboardData.appointmentLeads.length} tổng lịch hẹn`,
            color: 'text-green-600',
            Icon: CalendarCheck,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center justify-between rounded-2xl border border-[#e5e0d8] bg-white p-5 shadow-sm transition hover:shadow"
          >
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {card.label}
              </p>
              <h3 className="mb-1 text-xl font-bold text-[#17140F] md:text-2xl">{card.value}</h3>
              <p className="text-[10px] font-semibold text-gray-500">{card.detail}</p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-[#F6F4EF] ${card.color}`}
            >
              <card.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </section>

      <section className="mb-8 grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-sm lg:col-span-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-sm font-bold">Tương tác 7 ngày qua</h3>
              <p className="text-[10px] text-gray-400">
                Tổng yêu cầu khách hàng và số yêu cầu có ghi nhận đã thử AR.
              </p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#17140F]" />
                Yêu cầu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#B8924A]" />
                Đã thử AR
              </span>
            </div>
          </div>

          <div className="relative h-64 w-full">
            <svg viewBox="0 0 500 200" className="h-full w-full" role="img" aria-label="Biểu đồ tương tác 7 ngày qua">
              {[CHART_TOP, (CHART_TOP + CHART_BOTTOM) / 2, CHART_BOTTOM].map((y, index) => (
                <g key={y}>
                  <line
                    x1={CHART_LEFT}
                    y1={y}
                    x2="480"
                    y2={y}
                    stroke="#f0ede8"
                    strokeWidth="1"
                  />
                  <text x="30" y={y + 3} fill="#9ca3af" fontSize="8" textAnchor="end">
                    {index === 0
                      ? dashboardData.maxChartValue
                      : index === 1
                        ? Math.round(dashboardData.maxChartValue / 2)
                        : 0}
                  </text>
                </g>
              ))}

              <polyline
                fill="none"
                stroke="#17140F"
                strokeWidth="2.5"
                points={dashboardData.totalPoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                fill="none"
                stroke="#B8924A"
                strokeWidth="3"
                points={dashboardData.triedOnPoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {dashboardData.chartDays.map((day, index) => (
                <g key={day.label}>
                  <circle
                    cx={dashboardData.chartX(index)}
                    cy={dashboardData.chartY(day.total)}
                    r="3.5"
                    fill="#17140F"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={dashboardData.chartX(index)}
                    cy={dashboardData.chartY(day.triedOn)}
                    r="3.5"
                    fill="#B8924A"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={dashboardData.chartX(index)}
                    y="192"
                    fill="#9ca3af"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {day.label}
                  </text>
                </g>
              ))}
            </svg>

            {!hasChartData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-xs text-gray-400">
                Chưa có tương tác trong 7 ngày qua.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-sm lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">Liên hệ mới cần xử lý</h3>
            <button
              type="button"
              onClick={onNavigateToLeads}
              className="text-[10px] font-bold text-[#B8924A] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {urgentLeads.length > 0 ? (
              urgentLeads.map((lead) => (
                <button
                  type="button"
                  key={lead.id}
                  onClick={onNavigateToLeads}
                  className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-3 text-left text-xs transition hover:border-[#B8924A]"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-[#17140F]">{lead.name}</span>
                    <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                      MỚI
                    </span>
                  </div>
                  <p className="mb-1 truncate text-[10px] font-semibold text-[#B8924A]">
                    {lead.watchName || (lead.type === 'appointment' ? 'Đặt lịch showroom' : 'Yêu cầu tư vấn')}
                  </p>
                  <p className="line-clamp-1 text-[10px] italic text-gray-500">
                    {lead.message || lead.phone}
                  </p>
                </button>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center text-gray-400">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-xs">Không có liên hệ mới cần xử lý.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e0d8] pb-3">
          <div>
            <h3 className="font-display text-sm font-bold">Sản phẩm được quan tâm nhiều nhất</h3>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Xếp hạng theo số yêu cầu khách hàng gắn với từng sản phẩm.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="text-[10px] font-bold text-[#B8924A] hover:underline"
          >
            Xem sản phẩm
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[9px] uppercase tracking-wider text-gray-400">
                <th className="py-2.5">Tên sản phẩm</th>
                <th className="py-2.5">Giá bán</th>
                <th className="py-2.5 text-center">Đánh giá</th>
                <th className="py-2.5 text-center">Hiển thị</th>
                <th className="py-2.5 text-right">Yêu cầu khách hàng</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topWatches.length > 0 ? (
                dashboardData.topWatches.map((watch) => (
                  <tr key={watch.id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                    <td className="flex items-center gap-3 py-3 font-semibold text-[#17140F]">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#e5e0d8] bg-[#F6F4EF] shadow-sm">
                        <img src={watch.image} alt={watch.name} className="h-full w-full object-cover" />
                      </div>
                      <span>{watch.name}</span>
                    </td>
                    <td className="py-3 font-medium text-gray-600">{formatVND(watch.price)}</td>
                    <td className="py-3 text-center font-bold text-[#B8924A]">
                      <span className="inline-flex items-center justify-center gap-1">
                        {watch.rating ?? 0}
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          watch.hasAR
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {watch.hasAR ? 'Có AR' : 'Ảnh 2D'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-gray-700">
                      {dashboardData.leadCountByWatch[watch.id] || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-gray-400">
                    Cửa hàng chưa có sản phẩm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
