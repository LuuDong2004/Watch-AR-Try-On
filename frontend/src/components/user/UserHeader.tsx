import React, { useState } from 'react';
import { User, Heart } from 'lucide-react';
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
  { key: 'pricing', label: 'Nâng cấp', match: ['pricing'] },
  { key: 'feedback', label: 'Góp ý', match: ['feedback'] },
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
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#17140F]/80">
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
            onClick={() => go('favorites')}
            className={`relative p-2 rounded-full transition ${
              currentPage === 'favorites' ? 'text-[#B8924A] bg-[#B8924A]/10' : 'text-[#17140F] hover:bg-[#e5e0d8]/50'
            }`}
            title="Sản phẩm yêu thích"
            aria-label="Sản phẩm yêu thích"
          >
            <Heart className={`h-5 w-5 ${currentPage === 'favorites' ? 'fill-current' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#B8924A] text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => go('account')}
            className="h-9 w-9 rounded-full bg-[#e5e0d8] border border-[#B8924A]/40 flex items-center justify-center font-bold text-sm text-[#17140F] hover:scale-105 transition"
            title="Tài khoản"
          >
            <User className="h-5 w-5" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full hover:bg-[#e5e0d8]/50 transition text-[#17140F]"
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
                  active ? 'bg-[#B8924A]/10 text-[#B8924A]' : 'text-[#17140F]/80 hover:bg-[#e5e0d8]/40'
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
