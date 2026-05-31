import React, { useEffect, useState } from 'react';
import { LayoutGrid, Hexagon, Plus, Mail, BarChart3, Settings, ChevronDown, Check, type LucideIcon } from 'lucide-react';
import { getMyShops, OWNERS, CURRENT_OWNER_ID } from '../../utils/mockData';
import BrandLogo from '../ui/BrandLogo';

interface ShopSidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  newLeadsCount: number;
  shopScope: string;
  onChangeScope: (scope: string) => void;
}

const MENU: { id: string; name: string; icon: LucideIcon; badge?: boolean }[] = [
  { id: 'dashboard', name: 'Tổng quan', icon: LayoutGrid },
  { id: 'products', name: 'Sản phẩm', icon: Hexagon },
  { id: 'add-product', name: 'Đăng mẫu mới', icon: Plus },
  { id: 'leads', name: 'Hộp liên hệ', icon: Mail, badge: true },
  { id: 'analytics', name: 'Thống kê', icon: BarChart3 },
  { id: 'settings', name: 'Cài đặt shop', icon: Settings },
];

export default function ShopSidebar({ currentPage, onChangePage, newLeadsCount, shopScope, onChangeScope }: ShopSidebarProps) {
  const [myShops, setMyShops] = useState<any[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const owner = OWNERS[CURRENT_OWNER_ID];

  useEffect(() => {
    setMyShops(getMyShops());
  }, []);

  const scopeLabel =
    shopScope === 'all' ? 'Tất cả cửa hàng' : myShops.find((s) => s.id === shopScope)?.name || 'Tất cả cửa hàng';

  return (
    <aside className="w-64 bg-[#16162A] text-[#F6F4EF] flex flex-col h-screen sticky top-0 font-sans flex-shrink-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <BrandLogo surface="dark" size="sm" tagline="Seller · Kênh người bán" />
      </div>

      {/* Store switcher */}
      <div className="px-4 pb-4 relative">
        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between transition"
        >
          <div className="text-left min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Đang quản lý</p>
            <p className="text-xs font-semibold truncate">{scopeLabel}</p>
          </div>
          <ChevronDown className={`text-[#1C9FD9] h-4 w-4 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
        </button>

        {switcherOpen && (
          <div className="absolute left-4 right-4 mt-1.5 bg-[#1f1f38] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { onChangeScope('all'); setSwitcherOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition flex items-center justify-between ${shopScope === 'all' ? 'text-[#1C9FD9] font-bold' : 'text-gray-300'}`}
            >
              <span>Tất cả cửa hàng</span>
              {shopScope === 'all' && <Check className="h-4 w-4" />}
            </button>
            <div className="h-px bg-white/10" />
            {myShops.map((s) => (
              <button
                key={s.id}
                onClick={() => { onChangeScope(s.id); setSwitcherOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition flex items-center justify-between ${shopScope === s.id ? 'text-[#1C9FD9] font-bold' : 'text-gray-300'}`}
              >
                <span className="truncate">{s.name}</span>
                {shopScope === s.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        )}
        <p className="text-[9px] text-gray-500 mt-1.5 px-1">Bạn chỉ quản lý {myShops.length} cửa hàng của mình.</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {MENU.map((item) => {
          const isActive = currentPage === item.id;
          const Ic = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-[13px] ${
                isActive ? 'bg-[#1C9FD9] text-white font-semibold shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Ic className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#1C9FD9]'}`} />
                {item.name}
              </span>
              {item.badge && newLeadsCount > 0 && (
                <span className={`px-1.5 min-w-[18px] text-center py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-[#1C9FD9]' : 'bg-[#1C9FD9] text-white'}`}>
                  {newLeadsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Owner profile */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="h-9 w-9 rounded-full bg-white/10 border border-[#1C9FD9]/40 flex items-center justify-center text-xs font-bold text-[#1C9FD9]">
            {owner.avatar}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{owner.name}</p>
            <p className="text-[9px] text-gray-500 truncate">{owner.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
