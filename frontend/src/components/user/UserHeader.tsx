import React, { useEffect, useRef, useState } from 'react';
import {
  User, Heart, LogIn, LogOut, ChevronDown, Home, Hexagon, Store,
  LayoutDashboard, ShieldCheck,
} from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import type { User as SessionUser } from '../../api';

interface UserHeaderProps {
  currentPage: string;
  onChangePage: (page: string) => void;
  favoritesCount: number;
  user?: SessionUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
  /** Enter the shop/admin management panel (shown only for staff accounts). */
  onGoDashboard?: () => void;
}

const NAV_ITEMS: { key: string; label: string; match: string[] }[] = [
  { key: 'home', label: 'Trang chủ', match: ['home'] },
  { key: 'catalog', label: 'Sản phẩm', match: ['catalog', 'detail'] },
  { key: 'stores', label: 'Cửa hàng', match: ['stores'] },
  { key: 'pricing', label: 'Đối tác', match: ['pricing'] },
  { key: 'feedback', label: 'Góp ý', match: ['feedback'] },
];

export default function UserHeader({ currentPage, onChangePage, favoritesCount, user, onLogin, onLogout, onGoDashboard }: UserHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const go = (p: string) => {
    setMobileOpen(false);
    setMenuOpen(false);
    onChangePage(p);
  };

  // Close the account dropdown on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const firstName = (user?.name || '').trim().split(/\s+/).slice(-1)[0] || user?.name || '';
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const isStaff = user?.role === 'shop' || user?.role === 'admin';
  const adminLabel = user?.role === 'admin' ? 'Trang quản trị' : 'Quản lý cửa hàng';

  const itemCls = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#17140F]/80 hover:bg-[#F6F4EF] transition text-left';

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

          {user ? (
            <div className="relative" ref={menuRef}>
              {/* Account trigger */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 h-9 pl-1 pr-2 sm:pr-3 rounded-full bg-[#e5e0d8] border border-[#B8924A]/40 text-sm font-semibold text-[#17140F] hover:bg-[#ded8cc] transition"
                title="Tài khoản"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="h-7 w-7 rounded-full bg-[#17140F] text-[#F6F4EF] flex items-center justify-center text-xs font-bold">
                  {initial}
                </span>
                <span className="hidden sm:block max-w-[8rem] truncate">{firstName}</span>
                <ChevronDown className={`h-4 w-4 text-[#17140F]/60 transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 z-50 rounded-2xl border border-[#e5e0d8] bg-white shadow-2xl overflow-hidden animate-fade-in">
                  {/* Identity */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-[#e5e0d8]">
                    <span className="h-11 w-11 rounded-full bg-[#17140F] text-[#F6F4EF] flex items-center justify-center text-base font-bold">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-[#17140F] truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Staff: enter management panel */}
                  {isStaff && (
                    <div className="p-2 border-b border-[#e5e0d8] bg-[#B8924A]/5">
                      <button
                        onClick={() => { setMenuOpen(false); onGoDashboard?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#17140F] hover:bg-[#B8924A]/10 transition text-left"
                      >
                        {user?.role === 'admin'
                          ? <ShieldCheck className="h-5 w-5 text-[#B8924A]" />
                          : <LayoutDashboard className="h-5 w-5 text-[#B8924A]" />}
                        {adminLabel}
                      </button>
                    </div>
                  )}

                  {/* Tiện ích */}
                  <div className="p-2">
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tiện ích</p>
                    <button onClick={() => go('home')} className={itemCls}><Home className="h-5 w-5 text-[#B8924A]" /> Trang chủ</button>
                    <button onClick={() => go('catalog')} className={itemCls}><Hexagon className="h-5 w-5 text-[#B8924A]" /> Sản phẩm</button>
                    <button onClick={() => go('stores')} className={itemCls}><Store className="h-5 w-5 text-[#B8924A]" /> Cửa hàng</button>
                  </div>

                  {/* Tài khoản */}
                  <div className="p-2 border-t border-[#e5e0d8]">
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tài khoản</p>
                    <button onClick={() => go('account')} className={itemCls}><User className="h-5 w-5 text-[#B8924A]" /> Hồ sơ của tôi</button>
                    <button onClick={() => go('favorites')} className={itemCls}>
                      <Heart className="h-5 w-5 text-[#B8924A]" /> Sản phẩm yêu thích
                      {favoritesCount > 0 && <span className="ml-auto bg-[#B8924A] text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">{favoritesCount}</span>}
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-[#e5e0d8]">
                    <button
                      onClick={() => { setMenuOpen(false); onLogout?.(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="h-5 w-5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onLogin?.()}
              className="inline-flex items-center gap-1.5 bg-[#17140F] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-black transition"
              title="Đăng nhập"
            >
              <LogIn className="h-4 w-4" /> Đăng nhập
            </button>
          )}

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
          <div className="border-t border-[#e5e0d8] my-1" />
          {isStaff && (
            <button
              onClick={() => { setMobileOpen(false); onGoDashboard?.(); }}
              className="text-left py-2.5 px-3 rounded-lg transition font-bold text-[#17140F] bg-[#B8924A]/10 inline-flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4 text-[#B8924A]" /> {adminLabel}
            </button>
          )}
          <button
            onClick={() => go('account')}
            className="text-left py-2.5 px-3 rounded-lg transition text-[#17140F]/80 hover:bg-[#e5e0d8]/40 inline-flex items-center gap-2"
          >
            <User className="h-4 w-4" /> Hồ sơ của tôi
          </button>
          {user ? (
            <button
              onClick={() => { setMobileOpen(false); onLogout?.(); }}
              className="text-left py-2.5 px-3 rounded-lg transition text-red-500 hover:bg-red-50 inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); onLogin?.(); }}
              className="text-left py-2.5 px-3 rounded-lg transition text-[#B8924A] hover:bg-[#B8924A]/10 inline-flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" /> Đăng nhập
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
