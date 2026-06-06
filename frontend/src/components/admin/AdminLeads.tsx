import React, { useState, useEffect } from 'react';
import { CalendarClock, Mail } from 'lucide-react';
import { leadApi } from '../../api';
import type { Lead } from '../../api';

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await leadApi.list();
        if (!cancelled) setLeads(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getStatusBadge = (status: Lead['status']) => {
    const map = {
      new: { text: 'Yêu cầu mới', bg: 'bg-red-50 text-red-600 border-red-200' },
      responded: { text: 'Shop đã phản hồi', bg: 'bg-[#B8924A]/10 text-[#B8924A] border-[#B8924A]/20' },
      booked: { text: 'Đã hẹn showroom', bg: 'bg-green-50 text-green-600 border-green-200' },
      closed: { text: 'Đã hoàn tất', bg: 'bg-gray-100 text-gray-500 border-gray-200' }
    };
    const info = map[status] || { text: 'Chờ duyệt', bg: 'bg-gray-50 text-gray-400' };

    return (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${info.bg}`}>
        {info.text}
      </span>
    );
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Báo Cáo Leads Toàn Hệ Thống</h1>
        <p className="text-xs text-gray-500 mt-1">Giám sát lượng khách hàng đăng ký mua sắm tại các đại lý liên kết</p>
      </header>

      {/* Leads Table system wide */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Showroom tiếp nhận</th>
                <th className="py-3 px-4">Sản phẩm quan tâm</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Trạng thái xử lý</th>
                <th className="py-3 px-4 text-right">Thời gian gửi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Đang tải…</td></tr>
              )}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chưa có lead nào.</td></tr>
              )}
              {!loading && leads.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#17140F]">
                    <p>{l.name}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">{l.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-700">{l.shopName}</td>
                  <td className="py-3.5 px-4 text-[#B8924A] font-bold">{l.watchName}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-[#17140F]/5 text-[#17140F] px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase inline-flex items-center gap-1">
                      {l.type === 'appointment' ? (
                        <><CalendarClock className="h-3 w-3" /> HẸN TRỰC TIẾP</>
                      ) : (
                        <><Mail className="h-3 w-3" /> CHAT TƯ VẤN</>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(l.status)}</td>
                  <td className="py-3.5 px-4 text-right text-gray-400">
                    {l.timestamp ? new Date(l.timestamp).toLocaleString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
