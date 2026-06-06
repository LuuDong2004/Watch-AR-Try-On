/**
 * ToastHost — renders the global toast queue. Mount once at the app root.
 *
 *  - success / error / info  → auto-dismissing stack, top-right.
 *  - confirm                 → a centred modal dialog (replaces window.confirm).
 */
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, Trash2, X } from 'lucide-react';
import { useToast, type ToastItem } from '../store/useToast';

const STYLES = {
  success: { Icon: CheckCircle2, accent: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { Icon: XCircle, accent: 'text-red-400', bar: 'bg-red-400' },
  info: { Icon: Info, accent: 'text-[#B8924A]', bar: 'bg-[#B8924A]' },
} as const;

/* --------------------------------------------------------- top-right toast */

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToast((s) => s.dismiss);
  const cfg = STYLES[(item.type as keyof typeof STYLES)] ?? STYLES.info;
  const { Icon } = cfg;

  useEffect(() => {
    if (item.duration > 0) {
      const t = setTimeout(() => dismiss(item.id), item.duration);
      return () => clearTimeout(t);
    }
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      role="alert"
      className="pointer-events-auto relative flex w-80 max-w-[calc(100vw-2rem)] gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#17140F]/95 p-4 pr-9 text-white shadow-luxe-lg backdrop-blur-md animate-slide-in-right"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`} />
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.accent}`} />
      <p className="min-w-0 flex-1 text-sm leading-snug text-white/90 break-words">{item.message}</p>
      <button
        onClick={() => dismiss(item.id)}
        aria-label="Đóng"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white/90 active:scale-95"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------- centred confirm */

function ConfirmDialog({ item }: { item: ToastItem }) {
  const dismiss = useToast((s) => s.dismiss);
  const danger = !!item.danger;

  const close = (result: boolean) => {
    item.resolve?.(result);
    dismiss(item.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const Icon = danger ? Trash2 : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-slide-up">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${danger ? 'bg-red-50' : 'bg-[#B8924A]/10'}`}>
          <Icon className={`h-7 w-7 ${danger ? 'text-red-500' : 'text-[#B8924A]'}`} />
        </div>

        <h3 className="font-display text-lg font-bold text-[#17140F]">{item.title ?? 'Xác nhận'}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.message}</p>

        <div className="mt-6 flex gap-3 text-sm font-bold">
          <button
            onClick={() => close(false)}
            className="flex-1 rounded-xl border border-[#e5e0d8] py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            {item.cancelText ?? 'Huỷ'}
          </button>
          <button
            onClick={() => close(true)}
            className={`flex-1 rounded-xl py-2.5 text-white transition active:scale-[0.98] ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#17140F] hover:bg-black'
            }`}
          >
            {item.confirmText ?? 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- host */

export default function ToastHost() {
  const items = useToast((s) => s.toasts);
  const confirm = items.find((t) => t.type === 'confirm');
  const toasts = items.filter((t) => t.type !== 'confirm');

  return (
    <>
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2 font-sans">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} />
          ))}
        </div>
      )}
      {confirm && <ConfirmDialog key={confirm.id} item={confirm} />}
    </>
  );
}
