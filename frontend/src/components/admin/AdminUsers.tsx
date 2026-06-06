import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { userApi, ApiError } from '../../api';
import type { User } from '../../api';
import { toast } from '../../store/useToast';

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Khách hàng',
  shop: 'Showroom',
  admin: 'Quản trị viên',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await userApi.list();
      setUsers(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleBlock = async (u: User) => {
    const nextStatus: User['status'] = u.status === 'locked' ? 'active' : 'locked';
    try {
      await userApi.update(u.id, { ...u, status: nextStatus });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    }
  };

  const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString('vi-VN') : '—');

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Quản Lý Tài Khoản</h1>
        <p className="text-xs text-gray-500 mt-1">Giám sát tài khoản khách hàng, đại lý và phân quyền hệ thống</p>
      </header>

      {/* Users table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Tên người dùng</th>
                <th className="py-3 px-4">Địa chỉ Email</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4 text-center">Lượt thử AR</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Đang tải…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="py-8 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && users.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Chưa có người dùng nào.</td></tr>
              )}
              {!loading && !error && users.map((u) => {
                const isActive = u.status !== 'locked';
                return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#17140F] flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-[#17140F]/5 flex items-center justify-center text-[#17140F] flex-shrink-0">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-[#17140F]/5 text-[#17140F] px-2 py-0.5 rounded font-semibold text-[9px] uppercase">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-bold text-gray-700">—</td>
                  <td className="py-3.5 text-center">
                    {isActive ? (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleToggleBlock(u)}
                      className={isActive
                        ? 'border border-red-200 text-red-600 hover:bg-red-50 py-1 px-3 rounded-lg font-bold'
                        : 'border border-green-200 text-green-600 hover:bg-green-50 py-1 px-3 rounded-lg font-bold'}
                    >
                      {isActive ? 'Khóa nick' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
