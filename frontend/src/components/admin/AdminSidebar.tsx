import React from 'react';

interface AdminSidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  pendingAuditsCount: number;
}

const MENU = [
  { id: 'dashboard', name: 'Tổng quan hệ thống', icon: '◈' },
  { id: 'shops', name: 'Quản lý cửa hàng', icon: '🏬' },
  { id: 'audit', name: 'Kiểm duyệt 3D', icon: '★', badge: true },
  { id: 'users', name: 'Người dùng', icon: '⌗' },
  { id: 'leads', name: 'Leads toàn sàn', icon: '✉' },
  { id: 'settings', name: 'Cấu hình hệ thống', icon: '⚙' },
];

export default function AdminSidebar({ currentPage, onChangePage, pendingAuditsCount }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-[#0a0a14] text-[#F6F4EF] flex flex-col h-screen sticky top-0 font-sans flex-shrink-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[#B8924A] text-[#0a0a14] flex items-center justify-center font-display text-lg font-bold">A</span>
          <div className="leading-none">
            <p className="font-display font-bold text-sm">Aventus Admin</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#B8924A] font-bold mt-0.5">Quản trị toàn sàn</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {MENU.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-[13px] ${
                isActive ? 'bg-[#B8924A] text-white font-semibold shadow-sm' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`text-base ${isActive ? 'text-white' : 'text-[#B8924A]'}`}>{item.icon}</span>
                {item.name}
              </span>
              {item.badge && pendingAuditsCount > 0 && (
                <span className={`px-1.5 min-w-[18px] text-center py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-[#B8924A]' : 'bg-[#B8924A] text-white'}`}>
                  {pendingAuditsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="h-9 w-9 rounded-full bg-white/10 border border-[#B8924A]/40 flex items-center justify-center text-xs font-bold text-[#B8924A]">SA</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">System Admin</p>
            <p className="text-[9px] text-gray-500 truncate">admin@aventus.luxury</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
