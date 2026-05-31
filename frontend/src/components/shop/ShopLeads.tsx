import React, { useState, useEffect } from 'react';
import { Calendar, Mail, X, Phone, Watch, MessageCircle, Trash2 } from 'lucide-react';
import { getLeadsForShopIds, resolveScopeShopIds, updateLeadStatus, deleteDbLead, Lead } from '../../utils/mockData';

interface ShopLeadsProps {
  onStatusUpdated: () => void;
  shopScope: string;
}

export default function ShopLeads({ onStatusUpdated, shopScope }: ShopLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'responded' | 'booked' | 'closed'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const loadLeads = () => getLeadsForShopIds(resolveScopeShopIds(shopScope));

  useEffect(() => {
    setLeads(loadLeads());
  }, [shopScope]);

  const handleUpdateStatus = (id: string, newStatus: Lead['status']) => {
    updateLeadStatus(id, newStatus);
    const updated = loadLeads();
    setLeads(updated);
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(updated.find((l) => l.id === id) || null);
    }
    onStatusUpdated();
  };

  const handleDeleteLead = (id: string) => {
    if (confirm('Xóa thông tin liên hệ này ra khỏi lịch sử của shop?')) {
      deleteDbLead(id);
      setSelectedLead(null);
      setLeads(loadLeads());
      onStatusUpdated();
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (activeTab === 'all') return true;
    return l.status === activeTab;
  });

  const getStatusBadge = (status: Lead['status']) => {
    const map = {
      new: { text: 'Yêu cầu mới', bg: 'bg-red-50 text-red-600 border-red-200' },
      responded: { text: 'Đã phản hồi', bg: 'bg-[#B8924A]/10 text-[#B8924A] border-[#B8924A]/20' },
      booked: { text: 'Đã xếp lịch hẹn', bg: 'bg-green-50 text-green-600 border-green-200' },
      closed: { text: 'Đóng / Hoàn tất', bg: 'bg-gray-100 text-gray-500 border-gray-200' }
    };
    const info = map[status] || { text: 'Chờ duyệt', bg: 'bg-gray-50 text-gray-400' };

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bg}`}>
        {info.text}
      </span>
    );
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto relative flex">
      {/* Main Leads List Panel */}
      <div className="flex-1 mr-0 transition-all duration-300">
        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Hộp Thư Liên Hệ (Leads)</h1>
          <p className="text-xs text-gray-500 mt-1">
            Tin nhắn, hồ sơ thử AR và yêu cầu tư vấn của khách gửi tới cửa hàng bạn quản lý
          </p>
        </header>

        {/* Toolbar tabs */}
        <section className="bg-white p-2.5 rounded-2xl border border-[#e5e0d8] shadow-sm mb-6 flex flex-wrap gap-2 text-xs font-semibold">
          {[
            ['all', 'Tất cả liên hệ'],
            ['new', 'Yêu cầu mới'],
            ['responded', 'Đã phản hồi'],
            ['booked', 'Đã xếp lịch hẹn'],
            ['closed', 'Đã đóng']
          ].map(([val, label]) => {
            const count = val === 'all' ? leads.length : leads.filter((l) => l.status === val).length;
            const isActive = activeTab === val;
            return (
              <button
                key={val}
                onClick={() => {
                  setActiveTab(val as any);
                  setSelectedLead(null);
                }}
                className={`py-2 px-4 rounded-xl transition flex items-center gap-1.5 ${
                  isActive ? 'bg-[#17140F] text-white shadow' : 'text-gray-500 hover:text-black'
                }`}
              >
                <span>{label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                  isActive ? 'bg-white text-[#17140F]' : 'bg-[#F6F4EF] text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </section>

        {/* Leads Table */}
        <section className="bg-white rounded-3xl border border-[#e5e0d8] shadow-sm overflow-hidden">
          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                    <th className="py-3 px-4">Tên khách hàng</th>
                    <th className="py-3 px-4">Kênh liên hệ</th>
                    <th className="py-3 px-4">Sản phẩm quan tâm</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Ngày gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      className={`border-b border-gray-50 hover:bg-gray-50/80 transition cursor-pointer ${
                        selectedLead?.id === l.id ? 'bg-[#F6F4EF]/75 font-semibold border-l-4 border-l-[#B8924A]' : ''
                      }`}
                    >
                      {/* Customer Name */}
                      <td className="py-4 px-4 font-bold text-[#17140F]">{l.name}</td>

                      {/* Channel */}
                      <td className="py-4 px-4">
                        <span className="bg-[#17140F]/5 text-[#17140F] px-2 py-0.5 rounded font-semibold text-[9px] uppercase">
                          {l.channel === 'form' ? 'Form Web' : l.channel}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-4 text-[#B8924A] font-semibold truncate max-w-[150px]">{l.watchName}</td>

                      {/* Type */}
                      <td className="py-4 px-4 font-medium text-gray-600">
                        {l.type === 'appointment' ? (
                          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Đặt Lịch Hẹn</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> Tư vấn</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{getStatusBadge(l.status)}</td>

                      {/* Date */}
                      <td className="py-4 px-4 text-right text-gray-400">
                        {new Date(l.timestamp).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Mail className="h-10 w-10 mx-auto text-gray-300" />
              <h4 className="font-display font-bold text-sm mt-3 mb-1">Hộp liên hệ đang trống</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Không có cuộc trò chuyện hay lịch hẹn nào phù hợp với bộ lọc đã chọn.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Leads Drawer Slide panel (Right side) */}
      {selectedLead && (
        <div className="w-96 ml-6 bg-white border border-[#e5e0d8] rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-fit animate-slide-up sticky top-6 text-[#17140F] text-xs">
          <div>
            <div className="flex justify-between items-start border-b border-[#e5e0d8] pb-3 mb-4">
              <div>
                <h3 className="font-display text-sm font-bold">Chi Tiết Khách Hàng</h3>
                <p className="text-[10px] text-gray-400">ID: {selectedLead.id}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Detail */}
            <div className="space-y-4">
              <div className="bg-[#F6F4EF] p-4 rounded-xl border border-gray-100">
                <p className="text-[11px] font-bold text-[#17140F] mb-0.5">{selectedLead.name}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1.5"><Phone className="h-3 w-3" /> SĐT: {selectedLead.phone}</p>
                {selectedLead.email && <p className="text-[10px] text-gray-500 flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email: {selectedLead.email}</p>}
              </div>

              {/* Watch query details */}
              <div>
                <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider mb-1">Đồng hồ quan tâm</span>
                <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#17140F] text-white flex items-center justify-center">
                    <Watch className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#17140F]">{selectedLead.watchName}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{selectedLead.watchBrand}</p>
                  </div>
                </div>
              </div>

              {/* Appointment details if applicable */}
              {selectedLead.type === 'appointment' && (
                <div>
                  <span className="text-gray-400 font-bold flex items-center gap-1 text-[8px] uppercase tracking-wider mb-1">
                    <Calendar className="h-3 w-3" /> Lịch hẹn showroom
                  </span>
                  <div className="grid grid-cols-2 gap-3 bg-[#F6F4EF] p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">Ngày hẹn</span>
                      <span className="font-semibold text-gray-700">{selectedLead.date}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">Giờ hẹn</span>
                      <span className="font-semibold text-gray-700">{selectedLead.time}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider mb-1">Lời nhắn của khách</span>
                <div className="bg-[#F6F4EF] p-3 rounded-xl border border-gray-100 italic text-gray-600 leading-relaxed">
                  "{selectedLead.message}"
                </div>
              </div>

              {/* Action: Call / Zalo */}
              <div className="flex gap-2 pt-2">
                <a
                  href={`tel:${selectedLead.phone.replace(/\s/g, '')}`}
                  className="flex-1 bg-[#17140F] text-white py-2 rounded-lg font-bold hover:bg-black transition text-[10px] flex items-center justify-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" /> Gọi Hotline Khách
                </a>
                <a
                  href={`https://zalo.me/${selectedLead.phone.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 border border-[#B8924A] text-[#B8924A] py-2 rounded-lg font-bold hover:bg-[#B8924A]/5 transition text-[10px] flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat Zalo Với Khách
                </a>
              </div>
            </div>
          </div>

          {/* Status actions */}
          <div className="mt-8 border-t border-[#e5e0d8] pt-4 space-y-2">
            <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider mb-2">
              Cập nhật tiến trình phản hồi
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-bold text-[9px] text-center">
              <button
                onClick={() => handleUpdateStatus(selectedLead.id, 'responded')}
                className={`py-2 rounded-lg transition border ${
                  selectedLead.status === 'responded'
                    ? 'bg-[#B8924A] text-white border-[#B8924A]'
                    : 'border-[#e5e0d8] hover:bg-gray-50'
                }`}
              >
                Đã Phản Hồi
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedLead.id, 'booked')}
                className={`py-2 rounded-lg transition border ${
                  selectedLead.status === 'booked'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-[#e5e0d8] hover:bg-gray-50'
                }`}
              >
                Đã Lên Hẹn
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedLead.id, 'closed')}
                className={`py-2 rounded-lg transition border ${
                  selectedLead.status === 'closed'
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-[#e5e0d8] hover:bg-gray-50'
                }`}
              >
                Hoàn Tất / Đóng
              </button>
            </div>

            <button
              onClick={() => handleDeleteLead(selectedLead.id)}
              className="w-full text-red-600 hover:text-red-800 font-bold flex items-center justify-center gap-1.5 pt-2 text-[10px]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa Liên Hệ Này
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
