import React, { useState, useEffect } from 'react';
import { Lock, Store, Trash2, Unlock } from 'lucide-react';
import { shopApi, ApiError } from '../../api';
import type { Shop } from '../../api';
import { toast } from '../../store/useToast';

export default function AdminShops() {
  const [showrooms, setShowrooms] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const list = await shopApi.list();
      setShowrooms(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleStatus = async (shop: Shop) => {
    const nextStatus: Shop['status'] = shop.status === 'active' ? 'archived' : 'active';
    try {
      setSavingId(shop.id);
      await shopApi.update(shop.id, { ...shop, status: nextStatus });
      await load();
      toast.success(nextStatus === 'archived' ? 'Đã khóa cửa hàng.' : 'Đã mở khóa cửa hàng.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (shop: Shop) => {
    const ok = await toast.confirm(
      `Cửa hàng "${shop.name}" và toàn bộ sản phẩm thuộc cửa hàng này sẽ bị xóa.`,
      { title: 'Xóa cửa hàng?', confirmText: 'Xóa', danger: true },
    );
    if (!ok) return;
    try {
      setSavingId(shop.id);
      await shopApi.remove(shop.id);
      await load();
      toast.success('Đã xóa cửa hàng.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Quản Lý Cửa Hàng</h1>
        <p className="text-xs text-gray-500 mt-1">Toàn quyền duyệt cấp phép kinh doanh hoặc khoá tài khoản các cửa hàng trên sàn</p>
      </header>

      {/* Showrooms list */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Tên showroom</th>
                <th className="py-3 px-4">Hotline liên hệ</th>
                <th className="py-3 px-4">Đại chỉ chi nhánh</th>
                <th className="py-3 px-4 text-center">Trạng thái duyệt</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Đang tải…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={5} className="py-8 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && showrooms.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Chưa có showroom nào.</td></tr>
              )}
              {!loading && !error && showrooms.map((room) => {
                const isActive = room.status !== 'archived';
                return (
                <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#17140F] flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#17140F]/5 flex items-center justify-center text-[#17140F] flex-shrink-0">
                      <Store className="h-4 w-4" />
                    </span>
                    <span>{room.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">{room.phone}</td>
                  <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">{room.address}</td>
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
                  <td className="py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(room)}
                        disabled={savingId === room.id}
                        title={isActive ? 'Khóa cửa hàng' : 'Mở khóa cửa hàng'}
                        aria-label={isActive ? 'Khóa cửa hàng' : 'Mở khóa cửa hàng'}
                        className={isActive
                          ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                          : 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50'}
                      >
                        {isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        disabled={savingId === room.id}
                        title="Xóa cửa hàng"
                        aria-label="Xóa cửa hàng"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
