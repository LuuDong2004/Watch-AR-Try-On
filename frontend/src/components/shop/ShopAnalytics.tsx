import React, { useState, useEffect } from 'react';
import { getWatchesForShopIds, getLeadsForShopIds, resolveScopeShopIds } from '../../utils/mockData';

export default function ShopAnalytics({ shopScope }: { shopScope: string }) {
  const [watches, setWatches] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const ids = resolveScopeShopIds(shopScope);
    setWatches(getWatchesForShopIds(ids));
    setLeads(getLeadsForShopIds(ids));
  }, [shopScope]);

  const totalTryons = leads.filter((l) => l.hasTriedOn).length + 86;
  const totalLeads = leads.length;

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Thống Kê Tương Tác AR</h1>
        <p className="text-xs text-gray-500 mt-1">Đo lường mức độ quan tâm của khách hàng qua trải nghiệm thử đồ ảo</p>
      </header>

      {/* Analytics Summary */}
      <section className="grid sm:grid-cols-3 gap-6 mb-8 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-[#e5e0d8] shadow-sm">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Tỉ lệ Thử AR → Đặt Lịch</p>
          <h3 className="text-xl md:text-2xl font-bold text-[#B8924A] mb-1">
            {((leads.filter(l => l.type === 'appointment').length / totalTryons) * 100).toFixed(1)}%
          </h3>
          <p className="text-gray-500">Mức chuyển đổi cao hơn 15% so với ảnh 2D tĩnh</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e5e0d8] shadow-sm">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Thời Gian Trải Nghiệm 3D TB</p>
          <h3 className="text-xl md:text-2xl font-bold text-[#17140F] mb-1">42 giây / khách</h3>
          <p className="text-gray-500">Khách hàng xoay và ngắm nghía chi tiết vỏ đáy</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e5e0d8] shadow-sm">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Kênh liên hệ phổ biến nhất</p>
          <h3 className="text-xl md:text-2xl font-bold text-green-600 mb-1">Form Đăng Ký (65%)</h3>
          <p className="text-gray-500">Tiếp theo là kênh Zalo Chat (20%)</p>
        </div>
      </section>

      {/* Comparison section */}
      <section className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
          <h3 className="font-display text-sm font-bold mb-3">Hiệu quả Thử AR vs Sản phẩm thường</h3>
          <p className="text-gray-400 mb-6">Mức độ tương tác (Số lượt xem/yêu cầu) của sản phẩm hỗ trợ AR so với đồng hồ thường.</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Đồng hồ hỗ trợ AR (Lượt thử)</span>
                <span>86% tương tác</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#B8924A] h-full rounded-full" style={{ width: '86%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Đồng hồ không hỗ trợ AR</span>
                <span>14% tương tác</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gray-400 h-full rounded-full" style={{ width: '14%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
          <h3 className="font-display text-sm font-bold mb-4">Danh sách đồng hồ có tương tác cao</h3>
          <div className="space-y-3">
            {watches.slice(0, 3).map((w, idx) => (
              <div key={w.id} className="flex justify-between items-center bg-[#F6F4EF] p-3 rounded-xl border border-gray-100">
                <span className="font-bold">{w.name}</span>
                <span className="bg-[#B8924A] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  {w.reviewCount * 3 + 12} Lượt Thử AR
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
