import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { paymentApi, ApiError } from '../../api';
import type { PaymentCheckout, PaymentStatus, SubscriptionPlan } from '../../api';
import { toast } from '../../store/useToast';

interface PaymentQRModalProps {
  plan: SubscriptionPlan;
  /** Renewing the current plan vs. upgrading — only changes the wording. */
  isRenewal?: boolean;
  onClose: () => void;
  /** Called once the payment is confirmed PAID (plan activated server-side). */
  onSuccess: () => void;
}

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ';

/** Format a millisecond duration as m:ss. */
const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Render a scannable QR image from either a raw EMV string or a ready image URL. */
const qrImageFor = (checkout: PaymentCheckout): string | null => {
  if (checkout.qrImageUrl) return checkout.qrImageUrl;
  if (checkout.qrCode) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
      checkout.qrCode,
    )}`;
  }
  return null;
};

export default function PaymentQRModal({ plan, isRenewal, onClose, onSuccess }: PaymentQRModalProps) {
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown is derived from the server's expiresAt (absolute time), so a page
  // reload continues the same clock instead of restarting from 30:00.
  const remainingMs =
    checkout?.expiresAt != null ? Math.max(0, checkout.expiresAt - now) : null;

  // Create the payment when the modal opens. The checkout request is cached in a
  // ref so React 18 StrictMode's double-invoked effect (and any re-render) reuses
  // the SAME in-flight POST instead of creating a second transaction in the BE.
  const checkoutRef = useRef<{ code: string; promise: Promise<PaymentCheckout> } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (checkoutRef.current?.code !== plan.code) {
      checkoutRef.current = { code: plan.code, promise: paymentApi.checkout(plan.code) };
    }
    checkoutRef.current.promise
      .then((data) => {
        if (!cancelled) {
          setCheckout(data);
          setStatus(data.status);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không thể tạo giao dịch thanh toán.');
        }
      });
    return () => { cancelled = true; };
  }, [plan.code]);

  // Poll for payment confirmation while pending.
  useEffect(() => {
    if (!checkout || status !== 'PENDING') return;
    pollRef.current = setInterval(async () => {
      try {
        const next = await paymentApi.status(checkout.orderCode);
        setStatus(next);
      } catch {
        /* transient — keep polling */
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [checkout, status]);

  // Tick the countdown once a second while pending.
  useEffect(() => {
    if (checkout?.expiresAt == null || status !== 'PENDING') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [checkout?.expiresAt, status]);

  // Flip to EXPIRED locally the moment the window lapses (the server agrees on
  // the next poll); stops the QR from lingering past its deadline.
  useEffect(() => {
    if (status === 'PENDING' && remainingMs === 0 && checkout?.expiresAt != null) {
      setStatus('EXPIRED');
    }
  }, [remainingMs, status, checkout?.expiresAt]);

  // On success, stop polling and notify the parent after a short beat.
  useEffect(() => {
    if (status !== 'PAID') return;
    if (pollRef.current) clearInterval(pollRef.current);
    const t = setTimeout(onSuccess, 1800);
    return () => clearTimeout(t);
  }, [status, onSuccess]);

  // Close on Escape (except mid-success).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && status !== 'PAID') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, status]);

  const handleDevConfirm = async () => {
    if (!checkout) return;
    setConfirming(true);
    try {
      const next = await paymentApi.devConfirm(checkout.orderCode);
      setStatus(next);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xác nhận thanh toán.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!checkout) return;
    setCancelling(true);
    try {
      const next = await paymentApi.cancel(checkout.orderCode);
      setStatus(next);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể hủy giao dịch.');
    } finally {
      setCancelling(false);
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const failed = status === 'CANCELLED' || status === 'EXPIRED' || status === 'FAILED';
  const qrSrc = checkout ? qrImageFor(checkout) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => status !== 'PAID' && onClose()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between bg-[#17140F] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B8924A] text-white">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                {isRenewal ? 'Gia hạn gói' : 'Thanh toán gói'}
              </p>
              <p className="font-display text-base font-bold leading-tight">{plan.name}</p>
            </div>
          </div>
          {status !== 'PAID' && (
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Error creating the payment */}
          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl border border-[#e5e0d8] px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Loading the checkout */}
          {!error && !checkout && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#B8924A]" />
              <p className="text-sm">Đang tạo mã thanh toán…</p>
            </div>
          )}

          {/* Success */}
          {checkout && status === 'PAID' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <p className="font-display text-xl font-bold text-[#17140F]">Thanh toán thành công!</p>
              <p className="text-sm text-gray-500">
                Gói <span className="font-bold text-[#17140F]">{plan.name}</span> đã được kích hoạt và
                quyền bán hàng đã được cấp cho tài khoản của bạn.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Đang chuyển hướng…
              </div>
            </div>
          )}

          {/* Failed / cancelled / expired */}
          {checkout && failed && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="font-display text-lg font-bold text-[#17140F]">
                {status === 'EXPIRED' ? 'Giao dịch đã hết hạn' : status === 'CANCELLED' ? 'Đã hủy giao dịch' : 'Thanh toán thất bại'}
              </p>
              <p className="text-sm text-gray-500">Vui lòng đóng và thử lại.</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl bg-[#17140F] px-5 py-2.5 text-xs font-bold text-white hover:bg-black"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Pending — the QR + details */}
          {checkout && status === 'PENDING' && (
            <>
              <div className="flex flex-col items-center">
                {qrSrc ? (
                  <div className="rounded-2xl border border-[#e5e0d8] bg-white p-3 shadow-sm">
                    <img src={qrSrc} alt="Mã QR thanh toán" className="h-56 w-56" />
                  </div>
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-[#e5e0d8] text-xs text-gray-400">
                    Không có mã QR
                  </div>
                )}
                <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                  Mở <span className="font-semibold text-[#17140F]">App ngân hàng / Ví điện tử</span> và quét mã QR
                  để chuyển khoản. Gói sẽ tự kích hoạt ngay khi nhận được tiền.
                </p>
              </div>

              {/* Amount + transfer content */}
              <div className="mt-4 space-y-2 rounded-2xl bg-[#FAF9F7] p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Số tiền</span>
                  <span className="flex items-center gap-2 font-display text-base font-bold text-[#B8924A]">
                    {formatVND(checkout.amount)}
                    <button onClick={() => copy(String(checkout.amount), 'số tiền')} className="text-gray-400 hover:text-[#B8924A]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Nội dung CK</span>
                  <span className="flex items-center gap-2 font-bold text-[#17140F]">
                    {checkout.description}
                    <button onClick={() => copy(checkout.description, 'nội dung')} className="text-gray-400 hover:text-[#B8924A]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                {checkout.accountNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Số tài khoản</span>
                    <span className="flex items-center gap-2 font-bold text-[#17140F]">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      {checkout.accountNumber}
                      <button onClick={() => copy(checkout.accountNumber!, 'số tài khoản')} className="text-gray-400 hover:text-[#B8924A]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                )}
                {checkout.accountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Chủ tài khoản</span>
                    <span className="font-bold text-[#17140F]">{checkout.accountName}</span>
                  </div>
                )}
              </div>

              {/* Countdown — QR expires after the server-set window (30 phút). */}
              {remainingMs != null && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tabular-nums ${
                      remainingMs <= 60_000
                        ? 'bg-red-50 text-red-600'
                        : 'bg-[#FAF3E4] text-[#9A7434]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Mã QR hết hạn sau {formatCountdown(remainingMs)}
                  </span>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#9A7434]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chờ thanh toán…
              </div>

              {/* Dev/manual confirm (fallback mode) */}
              {checkout.devMode && (
                <button
                  onClick={handleDevConfirm}
                  disabled={confirming}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17140F] px-4 py-3 text-xs font-bold text-white transition hover:bg-black disabled:opacity-50"
                >
                  {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Tôi đã thanh toán (xác nhận thủ công)
                </button>
              )}

              {/* Cancel the pending payment */}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Hủy thanh toán
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-gray-400">
                <ShieldCheck className="h-3 w-3" /> Giao dịch được bảo mật. Không đóng cửa sổ cho đến khi hoàn tất.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
