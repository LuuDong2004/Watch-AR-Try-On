import React, { useEffect, useState } from 'react';
import {
  LayoutGrid, Hexagon, Plus, Mail, BarChart3, Store, LogOut,
  Home, PanelLeftClose, PanelLeftOpen, type LucideIcon,
} from 'lucide-react';
import type { User } from '../../api';
import BrandLogo from '../ui/BrandLogo';

interface ShopSidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  newLeadsCount: number;
  user: User | null;
  onLogout: () => void;
  /** Switch to the customer storefront (view as a normal user). */
  onGoHome: () => void;
}

const MENU: { id: string; name: string; icon: LucideIcon; badge?: boolean }[] = [
  { id: 'dashboard', name: 'Tổng quan', icon: LayoutGrid },
  { id: 'products', name: 'Sản phẩm', icon: Hexagon },
  { id: 'add-product', name: 'Đăng mẫu mới', icon: Plus },
  { id: 'leads', name: 'Hộp liên hệ', icon: Mail, badge: true },
  { id: 'analytics', name: 'Thống kê', icon: BarChart3 },
  { id: 'settings', name: 'Quản lý cửa hàng', icon: Store },
];

const COLLAPSE_KEY = 'tw_shop_sidebar_collapsed';

export default function ShopSidebar({ currentPage, onChangePage, newLeadsCount, user, onLogout, onGoHome }: ShopSidebarProps) {
  const avatar = (user?.name || 'S').trim().charAt(0).toUpperCase();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  useEffect(() => { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); }, [collapsed]);

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-[#17140F] text-[#F6F4EF] flex flex-col h-screen sticky top-0 font-sans flex-shrink-0 transition-[width] duration-200`}>
      {/* Brand + collapse toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 pt-6 pb-4`}>
        {!collapsed && (
          <div className="pl-2">
            <BrandLogo surface="dark" size="sm" tagline="Seller · Kênh người bán" />
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Signed-in shop */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Đang quản lý</p>
            <p className="text-xs font-semibold truncate">{user?.name || 'Cửa hàng của tôi'}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {MENU.map((item) => {
          const isActive = currentPage === item.id;
          const Ic = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangePage(item.id)}
              title={collapsed ? item.name : undefined}
              className={`relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl transition text-[13px] ${
                isActive ? 'bg-[#B8924A] text-white font-semibold shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <Ic className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#B8924A]'}`} />
                {!collapsed && item.name}
              </span>
              {!collapsed && item.badge && newLeadsCount > 0 && (
                <span className={`px-1.5 min-w-[18px] text-center py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-[#B8924A]' : 'bg-[#B8924A] text-white'}`}>
                  {newLeadsCount}
                </span>
              )}
              {collapsed && item.badge && newLeadsCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#B8924A]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile + bottom icon actions (home + logout together) */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span className="h-9 w-9 rounded-full bg-white/10 border border-[#B8924A]/40 flex items-center justify-center text-xs font-bold text-[#B8924A]">
              {avatar}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Cửa hàng'}</p>
              <p className="text-[9px] text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        )}

        <div className={`flex gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <button
            onClick={onGoHome}
            aria-label="Về trang chủ"
            title="Về trang chủ"
            className="flex flex-1 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2.5 text-[#B8924A] transition"
          >
            <Home className="h-5 w-5" />
          </button>
          <button
            onClick={onLogout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="flex flex-1 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2.5 text-[#B8924A] transition"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
