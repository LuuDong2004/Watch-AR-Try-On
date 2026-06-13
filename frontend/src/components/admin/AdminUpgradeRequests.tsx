import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, Check, Clock3, CreditCard, Loader2, Mail, User as UserIcon, X } from 'lucide-react';
import { subscriptionApi, ApiError } from '../../api';
import type { PlanUpgradeRequest } from '../../api';
import { toast } from '../../store/useToast';

const formatVND = (value: number) =>
  value === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(value) + ' vnđ';

const formatDateTime = (ts?: number | null) => (ts ? new Date(ts).toLocaleString('vi-VN') : '—');

const initialsOf = (name?: string | null, email?: string | null) =>
  (name || email || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Admin queue of seller plan-upgrade requests. Approving grants the SHOP role
 *  and activates the requested plan ("lên quyền"). */
export default function AdminUpgradeRequests() {
  const [requests, setRequests] = useState<PlanUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PlanUpgradeRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = async () => {
    try {
      setError(null);
      setRequests(await subscriptionApi.adminRequests());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = useMemo(() => requests.length, [requests]);

  const handleApprove = async (req: PlanUpgradeRequest) => {
    const ok = await toast.confirm(
      `Duyệt yêu cầu của ${req.userName || req.userEmail} cho gói ${req.planName}? Tài khoản sẽ được cấp quyền bán hàng (SHOP) và kích hoạt gói.`,
      { title: 'Duyệt & cấp quyền', confirmText: 'Duyệt' },
    );
    if (!ok) return;
    try {
      setBusyId(req.id);
      await subscriptionApi.approveRequest(req.id);
      toast.success(`Đã duyệt và cấp quyền bán hàng cho ${req.userName || req.userEmail}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể duyệt yêu cầu.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    try {
      setBusyId(rejecting.id);
      await subscriptionApi.rejectRequest(rejecting.id, rejectNote.trim() || undefined);
      toast.success('Đã từ chối yêu cầu.');
      setRejecting(null);
      setRejectNote('');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể từ chối yêu cầu.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Yêu Cầu Nâng Cấp Gói</h1>
        <p className="text-xs text-gray-500 mt-1">
          Duyệt yêu cầu đăng ký/nâng cấp gói bán hàng. Duyệt sẽ cấp quyền SHOP và kích hoạt gói cho tài khoản.
        </p>
      </header>

      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-gray-400 font-semibold">
            <span className="text-[#17140F] font-bold">{pendingCount}</span> yêu cầu đang chờ duyệt
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Người yêu cầu</th>
                <th className="py-3 px-4">Gói đăng ký</th>
                <th className="py-3 px-4 text-right">Chi phí</th>
                <th className="py-3 px-4 text-right">Ngày gửi</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Đang tải…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={5} className="py-8 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && requests.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">
                  <Clock3 className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                  Không có yêu cầu nào đang chờ duyệt.
                </td></tr>
              )}
              {!loading && !error && requests.map((req) => (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-full bg-[#17140F]/5 flex items-center justify-center text-[#17140F] flex-shrink-0 text-[10px] font-bold">
                        {initialsOf(req.userName, req.userEmail)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#17140F] flex items-center gap-1.5"><UserIcon className="h-3 w-3 text-gray-400" />{req.userName || '—'}</p>
                        <p className="text-gray-500 flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-400" />{req.userEmail || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B8924A]/15 px-2.5 py-1 font-bold text-[#9A7434]">
                      <CreditCard className="h-3 w-3" /> {req.planName}
                    </span>
                    <p className="mt-1 text-[10px] text-gray-400">{req.planDurationDays} ngày / chu kỳ</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">{formatVND(req.planPrice)}</td>
                  <td className="py-3.5 px-4 text-right text-gray-400">{formatDateTime(req.createdAt)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={busyId === req.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                        Duyệt
                      </button>
                      <button
                        onClick={() => { setRejecting(req); setRejectNote(''); }}
                        disabled={busyId === req.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-3xl border border-[#e5e0d8] shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-[#17140F]">Từ chối yêu cầu</h3>
            <p className="mt-1 text-xs text-gray-500">
              Từ chối yêu cầu gói <span className="font-semibold">{rejecting.planName}</span> của {rejecting.userName || rejecting.userEmail}.
            </p>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Lý do (tuỳ chọn)</label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Cần bổ sung thông tin cửa hàng…"
              className="mt-1.5 w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-3 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={submitReject}
                disabled={busyId === rejecting.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === rejecting.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
