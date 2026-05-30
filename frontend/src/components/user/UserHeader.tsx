import React, { useState } from 'react';
import BrandLogo from '../ui/BrandLogo';

interface UserHeaderProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  favoritesCount: number;
}

const NAV_ITEMS: { key: string; label: string; match: string[] }[] = [
  { key: 'home', label: 'Trang chủ', match: ['home'] },
  { key: 'catalog', label: 'Sản phẩm', match: ['catalog', 'detail'] },
  { key: 'stores', label: 'Cửa hàng', match: ['stores'] },
  { key: 'closet', label: 'Tủ đồ ảo', match: ['closet'] },
  { key: 'contact', label: 'Liên hệ & Đặt lịch', match: ['contact'] },
];

export default function UserHeader({ currentPage, onChangePage, favoritesCount }: UserHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (p: string) => {
    setMobileOpen(false);
    onChangePage(p);
  };

  return (
    <header className="border-b border-[#e5e0d8] bg-[#F6F4EF]/95 backdrop-blur sticky top-0 z-30 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button onClick={() => go('home')} className="text-left group shrink-0">
          <BrandLogo surface="light" size="md" className="group-hover:scale-[1.03] transition" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#16162A]/80">
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(currentPage);
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`hover:text-[#B8924A] transition py-1 ${
                  active ? 'text-[#B8924A] border-b-2 border-[#B8924A]' : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => go('account')}
            className="relative p-2 rounded-full hover:bg-[#e5e0d8]/50 transition text-[#16162A]"
            title="Đồng hồ yêu thích"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#B8924A] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => go('closet')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16162A] text-white text-xs font-semibold hover:bg-black transition border border-[#B8924A]/30"
          >
            <span>⌚ Tủ đồ ảo</span>
          </button>

          <button
            onClick={() => go('account')}
            className="h-9 w-9 rounded-full bg-[#e5e0d8] border border-[#B8924A]/40 flex items-center justify-center font-bold text-sm text-[#16162A] hover:scale-105 transition"
            title="Tài khoản"
          >
            👤
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full hover:bg-[#e5e0d8]/50 transition text-[#16162A]"
            aria-label="Mở menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-[#e5e0d8] bg-[#F6F4EF] px-4 py-3 flex flex-col gap-1 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(currentPage);
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`text-left py-2.5 px-3 rounded-lg transition ${
                  active ? 'bg-[#B8924A]/10 text-[#B8924A]' : 'text-[#16162A]/80 hover:bg-[#e5e0d8]/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
