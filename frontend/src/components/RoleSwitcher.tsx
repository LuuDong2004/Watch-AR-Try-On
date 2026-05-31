import React, { useState } from 'react';
import { User, Store, Key, Wrench, RefreshCw } from 'lucide-react';
import { resetDatabase } from '../utils/mockData';

interface RoleSwitcherProps {
  currentRole: 'user' | 'shop' | 'admin';
  onChangeRole: (role: 'user' | 'shop' | 'admin') => void;
}

export default function RoleSwitcher({ currentRole, onChangeRole }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { id: 'user', name: 'Khách hàng', icon: User, desc: 'Xem đồng hồ, thử AR, đặt lịch' },
    { id: 'shop', name: 'Cửa hàng', icon: Store, desc: 'Đăng sản phẩm, quản lý Leads, thống kê' },
    { id: 'admin', name: 'Quản trị viên', icon: Key, desc: 'Duyệt model 3D, quản lý shop, user' },
  ] as const;

  const handleRoleSelect = (roleId: 'user' | 'shop' | 'admin') => {
    onChangeRole(roleId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#17140F] text-white shadow-xl hover:bg-black hover:scale-105 active:scale-95 transition-all duration-300 border border-[#B8924A]/30"
        title="Chuyển đổi vai trò demo"
      >
        <Wrench className="h-6 w-6 animate-pulse" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 rounded-2xl border border-[#e5e0d8] bg-[#F6F4EF]/95 p-4 shadow-2xl backdrop-blur-md animate-slide-up text-[#17140F]">
          <div className="mb-3 border-b border-[#e5e0d8] pb-2">
            <h3 className="font-serif text-lg font-bold text-[#17140F] flex items-center gap-1.5">
              <span>Demo Role Switcher</span>
            </h3>
            <p className="text-[11px] text-gray-500">Chuyển đổi nhanh giữa các phân hệ của MVP</p>
          </div>

          <div className="flex flex-col gap-2">
            {roles.map((r) => {
              const isActive = r.id === currentRole;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`flex items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-[#17140F] text-[#F6F4EF] shadow-md scale-[1.02]'
                      : 'hover:bg-[#e5e0d8]/55'
                  }`}
                >
                  <span className="mt-0.5"><r.icon className="h-6 w-6" /></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{r.name}</span>
                      {isActive && (
                        <span className="bg-[#B8924A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Đang xem
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                      {r.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reset DB Button */}
          <div className="mt-3 border-t border-[#e5e0d8] pt-3 flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Dữ liệu lưu tại localStorage</span>
            <button
              onClick={() => {
                if (confirm('Khôi phục toàn bộ dữ liệu mock về ban đầu?')) {
                  resetDatabase();
                }
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:text-red-800 transition py-1 px-2 rounded-lg hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Dữ Liệu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
