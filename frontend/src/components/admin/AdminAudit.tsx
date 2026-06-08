import React, { useEffect, useMemo, useState } from 'react';
import { Package, ShieldCheck, AlertTriangle, Check, X, RefreshCw, Box, Store } from 'lucide-react';
import { watchApi, ApiError } from '../../api';
import type { Watch, ArReviewStatus } from '../../api';
import { toast } from '../../store/useToast';
import Watch3DViewer from '../watch/Watch3DViewer';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + ' vnđ';

const STATUS_META: Record<ArReviewStatus, { label: string; chip: string }> = {
  pending: { label: 'Chờ duyệt', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Đã duyệt', chip: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Từ chối', chip: 'bg-red-50 text-red-600 border-red-200' },
};

const statusOf = (w: Watch): ArReviewStatus => w.arReviewStatus ?? 'pending';

const QUALITY_CHECKS = [
  'Vân bề mặt (Texture PBR) hiển thị sắc nét, không bị nhòe.',
  'Tỉ lệ mặt số, dây và núm đồng hồ đúng kích thước thật.',
  'Model 3D quay đủ các trục, không vỡ mesh hay lỗ hổng.',
  'Thông số kỹ thuật khớp đúng với catalog sản phẩm.',
];

export default function AdminAudit() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const load = async () => {
    setError(null);
    try {
      const list = await watchApi.arModeration();
      setWatches(list);
      setSelectedId((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        const firstPending = list.find((w) => statusOf(w) === 'pending');
        return firstPending?.id ?? list[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedWatch = useMemo(
    () => watches.find((w) => w.id === selectedId) ?? null,
    [watches, selectedId],
  );

  const pendingCount = useMemo(
    () => watches.filter((w) => statusOf(w) === 'pending').length,
    [watches],
  );

  const decide = async (status: 'approved' | 'rejected', note?: string) => {
    if (!selectedWatch) return;
    try {
      setBusy(true);
      await watchApi.reviewAr(selectedWatch.id, status, note);
      await load();
      toast.success(
        status === 'approved'
          ? `Đã PHÊ DUYỆT model 3D cho ${selectedWatch.name} — hiển thị AR trên toàn hệ thống.`
          : `Đã TỪ CHỐI model 3D của ${selectedWatch.name}. Phản hồi đã gửi tới shop.`,
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setBusy(false);
      setRejecting(false);
      setRejectNote('');
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-gray-500">Đang tải…</div>;

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Kiểm Duyệt Model 3D & AR</h1>
          <p className="text-xs text-gray-500 mt-1">
            Xem trực tiếp model 3D thật của từng sản phẩm và phê duyệt để bật tính năng thử AR trên storefront
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#e5e0d8] bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] shadow-sm transition hover:border-[#B8924A] hover:text-[#9A7434]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs font-semibold text-red-600">{error}</div>
      )}

      {watches.length === 0 && !error ? (
        <div className="rounded-3xl border border-[#e5e0d8] bg-white p-12 text-center text-xs text-gray-400 shadow-sm">
          Chưa có sản phẩm nào bật AR để kiểm duyệt.
        </div>
      ) : (
        <section className="grid lg:grid-cols-12 gap-8 items-start pb-16">
          {/* Left: moderation queue */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm text-xs">
            <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" /> Sản phẩm AR ({watches.length})
              {pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                  {pendingCount} chờ duyệt
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {watches.map((w) => {
                const meta = STATUS_META[statusOf(w)];
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={`p-3 bg-[#F6F4EF] rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      selectedId === w.id ? 'border-[#B8924A] bg-[#B8924A]/5' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#e5e0d8] bg-white flex-shrink-0">
                        <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#17140F] truncate">{w.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{w.brand}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border flex-shrink-0 ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: live 3D inspection */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm text-xs flex flex-col">
            {selectedWatch ? (
              <>
                <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Soi model 3D — {selectedWatch.name}
                </h3>

                {/* Real 3D preview */}
                <div className="mb-5">
                  {selectedWatch.model ? (
                    <Watch3DViewer modelUrl={selectedWatch.model} variant={selectedWatch.variant} height={300} />
                  ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-red-200 bg-red-50/40 text-red-500">
                      <AlertTriangle className="h-6 w-6" />
                      <p className="text-xs font-semibold">Sản phẩm bật AR nhưng chưa có file model 3D (.glb).</p>
                    </div>
                  )}
                </div>

                {/* Info card */}
                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-gray-100 mb-5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Thương hiệu:</span>
                    <span className="text-gray-700 font-semibold">{selectedWatch.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Giá niêm yết:</span>
                    <span className="text-gray-700 font-semibold">{formatVND(selectedWatch.price)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400 font-bold flex items-center gap-1"><Box className="h-3.5 w-3.5" /> File model 3D:</span>
                    <span className="font-mono text-gray-700 truncate">{selectedWatch.model || 'Chưa có'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400 font-bold flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Cửa hàng:</span>
                    <span className="font-mono text-gray-700 truncate">{selectedWatch.shopId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Trạng thái hiện tại:</span>
                    <span className={`px-2 py-0.5 rounded font-bold border ${STATUS_META[statusOf(selectedWatch)].chip}`}>
                      {STATUS_META[statusOf(selectedWatch)].label}
                    </span>
                  </div>
                  {statusOf(selectedWatch) === 'rejected' && selectedWatch.arReviewNote && (
                    <div className="pt-1 text-red-600">
                      <span className="font-bold">Lý do từ chối: </span>{selectedWatch.arReviewNote}
                    </div>
                  )}
                </div>

                {/* Quality checklist (guidance) */}
                <div className="space-y-2.5 mb-6">
                  <h4 className="font-bold text-[#17140F] border-b pb-1">Checklist chất lượng</h4>
                  {QUALITY_CHECKS.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2.5 cursor-pointer text-gray-600">
                      <input type="checkbox" defaultChecked className="accent-[#B8924A] rounded mt-0.5 h-3.5 w-3.5" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-3 font-bold border-t border-[#e5e0d8] pt-4">
                  <button
                    onClick={() => void decide('approved')}
                    disabled={busy || !selectedWatch.model || statusOf(selectedWatch) === 'approved'}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" /> {statusOf(selectedWatch) === 'approved' ? 'Đã phê duyệt' : 'Phê Duyệt & Xuất Bản'}
                  </button>
                  <button
                    onClick={() => { setRejectNote(''); setRejecting(true); }}
                    disabled={busy || statusOf(selectedWatch) === 'rejected'}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X className="h-4 w-4" /> Từ Chối
                  </button>
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-gray-400">Chọn một sản phẩm để kiểm duyệt.</p>
            )}
          </div>
        </section>
      )}

      {/* Reject reason modal */}
      {rejecting && selectedWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setRejecting(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#17140F]">Từ chối model 3D</h3>
            <p className="mt-1 text-xs text-gray-500">Phản hồi sẽ được gửi tới shop để chỉnh sửa lại model.</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              autoFocus
              placeholder="VD: Mặt số bị méo, tỉ lệ dây quá lớn so với thực tế…"
              className="mt-4 w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2 text-sm leading-6 focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejecting(false)} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => void decide('rejected', rejectNote.trim() || undefined)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
