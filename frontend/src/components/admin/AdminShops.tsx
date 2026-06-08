import React, { useState, useEffect } from 'react';
import { Lock, Store, Trash2, Unlock, X } from 'lucide-react';
import { shopApi, ApiError } from '../../api';
import type { Shop } from '../../api';
import { toast } from '../../store/useToast';

const QUICK_REASONS = [
  'Vi phạm chính sách bán hàng',
  'Thông tin cửa hàng không hợp lệ',
  'Sản phẩm không phù hợp',
  'Khóa theo yêu cầu / đang xác minh',
];

export default function AdminShops() {
  const [showrooms, setShowrooms] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Shop pending lock + the reason being composed in the modal.
  const [lockTarget, setLockTarget] = useState<Shop | null>(null);
  const [lockReason, setLockReason] = useState('');

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

  const applyStatus = async (shop: Shop, nextStatus: Shop['status'], reason?: string) => {
    try {
      setSavingId(shop.id);
      await shopApi.update(shop.id, {
        ...shop,
        status: nextStatus,
        lockReason: nextStatus === 'locked' ? (reason?.trim() || null) : null,
      });
      await load();
      toast.success(nextStatus === 'locked' ? 'Đã khóa cửa hàng.' : 'Đã mở khóa cửa hàng.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleStatus = (shop: Shop) => {
    if (shop.status === 'locked') {
      void applyStatus(shop, 'active');
    } else {
      // Locking: ask for a quick reason first.
      setLockReason('');
      setLockTarget(shop);
    }
  };

  const confirmLock = async () => {
    if (!lockTarget) return;
    const target = lockTarget;
    setLockTarget(null);
    await applyStatus(target, 'locked', lockReason);
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
                const isActive = room.status !== 'locked';
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
                    {!isActive && room.lockReason && (
                      <p className="mx-auto mt-1 max-w-[200px] truncate text-[10px] text-gray-400" title={room.lockReason}>
                        {room.lockReason}
                      </p>
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

      {/* Lock-with-reason modal */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setLockTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#17140F]">Khóa cửa hàng</h3>
              <button onClick={() => setLockTarget(null)} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Cửa hàng <span className="font-semibold text-[#17140F]">"{lockTarget.name}"</span> sẽ bị ẩn khỏi khách hàng. Lý do sẽ hiển thị cho chủ cửa hàng.
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLockReason(r)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    lockReason === r
                      ? 'border-[#B8924A] bg-[#B8924A]/10 text-[#9A7434]'
                      : 'border-[#e5e0d8] text-gray-500 hover:border-[#B8924A]/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Lý do khóa (tùy chọn)…"
              className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-sm leading-6 focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setLockTarget(null)} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => void confirmLock()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <Lock className="h-3.5 w-3.5" /> Khóa cửa hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
