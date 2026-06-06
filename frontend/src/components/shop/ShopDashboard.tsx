import React, { useState, useEffect } from 'react';
import { Calendar, CalendarCheck, Eye, Sparkles, Mail, CheckCircle2, Star } from 'lucide-react';
import { watchApi, leadApi } from '../../api';
import type { Lead, Watch } from '../../api';
import { useSession } from '../../auth/session';

interface ShopDashboardProps {
  onNavigateToLeads: () => void;
  onNavigateToProducts: () => void;
}

export default function ShopDashboard({ onNavigateToLeads, onNavigateToProducts }: ShopDashboardProps) {
  const user = useSession((s) => s.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.shopId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([watchApi.list(user.shopId), leadApi.list()])
      .then(([w, l]) => {
        if (cancelled) return;
        setWatches(w);
        setLeads(l);
      })
      .catch(() => { /* ignore — show empty state */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.shopId]);

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(n);
  };

  // Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const totalTryons = leads.filter((l) => l.hasTriedOn).length + 86; // add some simulated baseline stats
  const scheduledAppointments = leads.filter((l) => l.type === 'appointment' && l.status === 'booked').length;

  const urgentLeads = leads.filter((l) => l.status === 'new').slice(0, 3);
  const topWatches = watches.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-[#F6F4EF] min-h-screen w-full flex items-center justify-center text-sm text-[#8A8170]">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      {/* Dashboard Welcome Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Hộp Tin Tổng Quan</h1>
          <p className="text-xs text-gray-500 mt-1">Giám sát hoạt động 3D/AR, lượt đặt lịch hẹn và leads từ showrooms</p>
        </div>
        <div className="text-xs text-gray-400 bg-white border border-[#e5e0d8] px-4 py-2 rounded-xl shadow-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Hôm nay: 30 Tháng 05, 2026
        </div>
      </header>

      {/* Grid: 4 Metric Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Số lượt xem 3D', val: '1,420', change: '+12.4%', color: 'text-blue-600', Icon: Eye },
          { label: 'Số lượt thử AR', val: totalTryons, change: '+25.8%', color: 'text-[#B8924A]', Icon: Sparkles },
          { label: 'Liên hệ / Leads mới', val: newLeads, change: `${newLeads} leads đợi phản hồi`, color: 'text-amber-500', Icon: Mail },
          { label: 'Lịch hẹn showroom', val: scheduledAppointments, change: 'Trong tuần này', color: 'text-green-600', Icon: CalendarCheck }
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-[#e5e0d8] shadow-sm flex items-center justify-between hover:shadow transition"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{card.label}</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#17140F] mb-1">{card.val}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">{card.change}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-[#F6F4EF] flex items-center justify-center border border-gray-100 ${card.color}`}>
              <card.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Grid: Chart and urgent alerts */}
      <section className="grid lg:grid-cols-12 gap-8 mb-8">
        {/* Statistics Chart (7 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display text-sm font-bold">Thống kê tương tác 7 ngày qua</h3>
              <p className="text-[10px] text-gray-400">So sánh tần suất thử AR và phát sinh yêu cầu tư vấn</p>
            </div>
            {/* Chart Legend */}
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#B8924A]" />Thử AR</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#17140F]" />Gửi liên hệ</span>
            </div>
          </div>

          {/* Luxury Custom SVG Chart */}
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#f3f4f6" strokeWidth="1" />

              {/* TryOn Line (Gold) */}
              <polyline
                fill="none"
                stroke="#B8924A"
                strokeWidth="3.5"
                points="40,150 110,130 180,90 250,110 320,60 390,75 460,30"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Lead Line (Navy) */}
              <polyline
                fill="none"
                stroke="#17140F"
                strokeWidth="2.5"
                points="40,180 110,175 180,160 250,165 320,135 390,140 460,115"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4"
              />

              {/* Chart Dots for Try-On */}
              <circle cx="40" cy="150" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="110" cy="130" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="180" cy="90" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="250" cy="110" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="320" cy="60" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="390" cy="75" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="460" cy="30" r="4.5" fill="#B8924A" stroke="#fff" strokeWidth="1.5" />

              {/* Chart X axis text */}
              <text x="40" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">24/5</text>
              <text x="110" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">25/5</text>
              <text x="180" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">26/5</text>
              <text x="250" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">27/5</text>
              <text x="320" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">28/5</text>
              <text x="390" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">29/5</text>
              <text x="460" y="192" fill="#9ca3af" fontSize="8" textAnchor="middle">30/5</text>
            </svg>
          </div>
        </div>

        {/* Urgent Actions Alert Leads list (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-sm font-bold">Liên hệ mới khẩn cấp</h3>
            <button onClick={onNavigateToLeads} className="text-[10px] text-[#B8924A] hover:underline font-bold">
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {urgentLeads.length > 0 ? (
              urgentLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={onNavigateToLeads}
                  className="p-3 bg-[#F6F4EF] rounded-xl border border-[#e5e0d8] hover:border-[#B8924A] transition cursor-pointer text-xs"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#17140F]">{lead.name}</span>
                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                      NEW
                    </span>
                  </div>
                  <p className="text-[10px] text-[#B8924A] font-semibold mb-1 truncate">{lead.watchName}</p>
                  <p className="text-[10px] text-gray-500 italic line-clamp-1">"{lead.message}"</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                <p className="text-xs">Đã xử lý tất cả liên hệ mới!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top Performing watches table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-[#e5e0d8] pb-3">
          <h3 className="font-display text-sm font-bold">Mẫu đồng hồ thu hút nhất (3D/AR)</h3>
          <button onClick={onNavigateToProducts} className="text-[10px] text-[#B8924A] hover:underline font-bold">
            Xem sản phẩm
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px]">
                <th className="py-2.5">Tên sản phẩm</th>
                <th className="py-2.5">Phân khúc giá</th>
                <th className="py-2.5 text-center">Đánh giá</th>
                <th className="py-2.5 text-center">AR Model</th>
                <th className="py-2.5 text-right">Lượt thử AR (Ước tính)</th>
              </tr>
            </thead>
            <tbody>
              {topWatches.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3 font-semibold text-[#17140F] flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg overflow-hidden border border-[#e5e0d8] shadow-sm flex-shrink-0 bg-[#F6F4EF]">
                      <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                    </div>
                    <span>{w.name}</span>
                  </td>
                  <td className="py-3 font-medium text-gray-600">{formatVND(w.price)}</td>
                  <td className="py-3 text-center text-[#B8924A] font-bold">
                    <span className="inline-flex items-center gap-1 justify-center">{w.rating} <Star className="h-3.5 w-3.5 fill-current" /></span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                      Hoạt động
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-gray-700">+{Math.floor((w.reviewCount ?? 0) * 4.8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
