import React from 'react';
import BrandLogo from '../ui/BrandLogo';
import { ADMIN_NAV } from './adminNav';

interface AdminSidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  pendingAuditsCount: number;
}

export default function AdminSidebar({ currentPage, onChangePage, pendingAuditsCount }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-[#0a0a14] text-[#F6F4EF] flex flex-col h-screen sticky top-0 font-sans flex-shrink-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <BrandLogo surface="dark" size="sm" tagline="Admin · Quản trị toàn sàn" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const isActive = currentPage === item.id;
          const Ic = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-[13px] ${
                isActive ? 'bg-[#1C9FD9] text-white font-semibold shadow-sm' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Ic className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#1C9FD9]'}`} />
                {item.name}
              </span>
              {item.badge && pendingAuditsCount > 0 && (
                <span className={`px-1.5 min-w-[18px] text-center py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-[#1C9FD9]' : 'bg-[#1C9FD9] text-white'}`}>
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
          <span className="h-9 w-9 rounded-full bg-white/10 border border-[#1C9FD9]/40 flex items-center justify-center text-xs font-bold text-[#1C9FD9]">SA</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">System Admin</p>
            <p className="text-[9px] text-gray-500 truncate">admin@aventus.luxury</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
