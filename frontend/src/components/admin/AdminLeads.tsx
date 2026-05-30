import React, { useState, useEffect } from 'react';
import { getDbLeads, Lead } from '../../utils/mockData';

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setLeads(getDbLeads());
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
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Báo Cáo Leads Toàn Hệ Thống</h1>
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
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#16162A]">
                    <p>{l.name}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">{l.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-700">{l.shopName}</td>
                  <td className="py-3.5 px-4 text-[#B8924A] font-bold">{l.watchName}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-[#16162A]/5 text-[#16162A] px-2.5 py-0.5 rounded font-semibold text-[9px] uppercase">
                      {l.type === 'appointment' ? '🗓️ HẸN TRỰC TIẾP' : '✉️ CHAT TƯ VẤN'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(l.status)}</td>
                  <td className="py-3.5 px-4 text-right text-gray-400">
                    {new Date(l.timestamp).toLocaleString('vi-VN')}
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
