import React from 'react';
import { LogOut } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import { ADMIN_NAV } from './adminNav';
import type { User } from '../../api';

interface AdminSidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  pendingAuditsCount: number;
  user: User | null;
  onLogout: () => void;
}

export default function AdminSidebar({ currentPage, onChangePage, pendingAuditsCount, user, onLogout }: AdminSidebarProps) {
  const initials = (user?.name || 'SA')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();
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
                isActive ? 'bg-[#B8924A] text-white font-semibold shadow-sm' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Ic className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#B8924A]'}`} />
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
          <span className="h-9 w-9 rounded-full bg-white/10 border border-[#B8924A]/40 flex items-center justify-center text-xs font-bold text-[#B8924A]">{initials || 'SA'}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name || 'System Admin'}</p>
            <p className="text-[9px] text-gray-500 truncate">{user?.email || 'admin@aventus.luxury'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-2 w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut className="h-5 w-5 text-[#B8924A]" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
