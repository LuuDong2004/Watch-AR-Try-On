import React, { useState, useEffect } from 'react';
import { Circle, Store, Users, Package, Sparkles, Send, ClipboardList, ShieldCheck, type LucideIcon } from 'lucide-react';
import { getDbLeads, getDbWatches } from '../../utils/mockData';

interface AdminDashboardProps {
  onNavigateToShops: () => void;
  onNavigateToAudit: () => void;
}

export default function AdminDashboard({ onNavigateToShops, onNavigateToAudit }: AdminDashboardProps) {
  const [watches, setWatches] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    setWatches(getDbWatches());
    setLeads(getDbLeads());
  }, []);

  const totalShops = 3;
  const totalUsers = 120;
  const totalWatches = watches.length;
  const totalTryons = leads.filter((l) => l.hasTriedOn).length + 342; // global simulated tryons
  const totalLeads = leads.length;

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      {/* Welcome admin banner */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Hệ Thống Admin Center</h1>
          <p className="text-xs text-gray-500 mt-1">Giám sát hoạt động của các cửa hàng đối tác, chất lượng file 3D và leads phát sinh</p>
        </div>
        <span className="bg-red-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider animate-pulse inline-flex items-center gap-1.5">
          <Circle className="h-4 w-4 fill-current" /> Live Monitoring Active
        </span>
      </header>

      {/* Grid: 5 Metrics Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 text-xs">
        {[
          { label: 'Tổng số Showrooms', val: totalShops, change: 'Rolex, Omega, Aventus', icon: Store },
          { label: 'Tổng số Người dùng', val: totalUsers, change: '10+ thành viên mới hôm nay', icon: Users },
          { label: 'Số mẫu đồng hồ', val: totalWatches, change: 'Tăng 2 mẫu tuần này', icon: Package },
          { label: 'Số lượt thử AR', val: totalTryons, change: '+18.5% so với tuần trước', icon: Sparkles },
          { label: 'Tổng số Leads/Lịch hẹn', val: totalLeads, change: 'Không có GMV giao dịch', icon: Send }
        ].map((card: { label: string; val: number; change: string; icon: LucideIcon }, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-[#e5e0d8] shadow-sm flex flex-col justify-between hover:shadow transition"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">{card.label}</span>
              {(() => {
                const Ic = card.icon;
                return <Ic className="h-5 w-5 text-[#1C9FD9]" />;
              })()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#16162A] mb-1">{card.val}</h3>
              <p className="text-[9px] text-gray-500 font-semibold leading-relaxed">{card.change}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Grid: Pending actions list & growth chart */}
      <section className="grid lg:grid-cols-12 gap-8 mb-8 text-xs">
        {/* Growth Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display text-sm font-bold">Thống kê tăng trưởng toàn sàn</h3>
              <p className="text-[10px] text-gray-400">Độ phủ người dùng mới và lượt thử đeo AR hàng tháng</p>
            </div>
          </div>

          <div className="h-60 w-full relative">
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#f3f4f6" strokeWidth="1" />

              <polyline
                fill="none"
                stroke="#1C9FD9"
                strokeWidth="3.5"
                points="40,160 120,130 200,140 280,90 360,70 460,30"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="40" cy="160" r="4" fill="#1C9FD9" />
              <circle cx="120" cy="130" r="4" fill="#1C9FD9" />
              <circle cx="200" cy="140" r="4" fill="#1C9FD9" />
              <circle cx="280" cy="90" r="4" fill="#1C9FD9" />
              <circle cx="360" cy="70" r="4" fill="#1C9FD9" />
              <circle cx="460" cy="30" r="4" fill="#1C9FD9" />

              <text x="40" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 1</text>
              <text x="120" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 2</text>
              <text x="200" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 3</text>
              <text x="280" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 4</text>
              <text x="360" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 5</text>
              <text x="460" y="190" fill="#9ca3af" fontSize="8" textAnchor="middle">Tháng 6 (Dự kiến)</text>
            </svg>
          </div>
        </div>

        {/* Pending approvals checklist (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Hàng chờ phê duyệt
            </h3>

            <div className="space-y-4">
              {/* Check 1 */}
              <div
                onClick={onNavigateToAudit}
                className="p-3 bg-[#F6F4EF] rounded-xl border border-gray-100 hover:border-[#1C9FD9] transition cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">Model 3D Aventus White</span>
                  <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                    ĐỢI KIỂM DUYỆT
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Cần xác minh tỉ lệ scale trên cổ tay.</p>
              </div>

              {/* Check 2 */}
              <div
                onClick={onNavigateToShops}
                className="p-3 bg-[#F6F4EF] rounded-xl border border-gray-100 hover:border-[#1C9FD9] transition cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">Showroom Rolex Hoàn Kiếm</span>
                  <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                    ĐỢI DUYỆT SHOP
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Đối tác Rolex Tràng Tiền đăng ký showroom mới.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50/50 text-blue-700 border border-blue-100 p-3 rounded-xl leading-normal text-[10px] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <p>Tất cả model 3D trước khi hiển thị cho khách thử AR đều phải được admin rà soát chất lượng vân (textures).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
