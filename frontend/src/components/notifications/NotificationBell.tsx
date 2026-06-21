import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, CreditCard, Loader2, MessageSquare } from 'lucide-react';
import { notificationApi } from '../../api';
import type { AppNotification } from '../../api';

interface NotificationBellProps {
  /** Navigate to the customer inbox, optionally selecting a conversation. */
  onOpenInbox?: (conversationId?: string | null) => void;
}

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
};

export default function NotificationBell({ onOpenInbox }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll the unread count (and once on mount).
  useEffect(() => {
    let active = true;
    const tick = () => notificationApi.unreadCount().then((c) => { if (active) setCount(c); }).catch(() => {});
    tick();
    const id = setInterval(tick, 20000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Load the list whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationApi.list()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const handleOpenItem = async (n: AppNotification) => {
    if (!n.read) {
      try { await notificationApi.markRead(n.id); } catch { /* ignore */ }
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.type === 'MESSAGE') onOpenInbox?.(n.refId ?? null);
    else if (n.type === 'PAYMENT') onOpenInbox?.(null); // surface inbox/account; payment has no thread
  };

  const markAll = async () => {
    try { await notificationApi.markAllRead(); } catch { /* ignore */ }
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    setCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-full transition ${open ? 'text-[#B8924A] bg-[#B8924A]/10' : 'text-[#17140F] hover:bg-[#e5e0d8]/50'}`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B8924A] px-1 text-[9px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e5e0d8] bg-white shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#e5e0d8] px-4 py-3">
            <p className="text-sm font-bold text-[#17140F]">Thông báo</p>
            {items.some((n) => !n.read) && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B8924A] hover:underline">
                <Check className="h-3 w-3" /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#B8924A]" /></div>}
            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-xs text-gray-400">
                <Bell className="h-7 w-7 text-gray-200" /> Chưa có thông báo nào.
              </div>
            )}
            {!loading && items.map((n) => (
              <button
                key={n.id}
                onClick={() => void handleOpenItem(n)}
                className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${n.read ? '' : 'bg-[#B8924A]/5'}`}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  n.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#B8924A]/15 text-[#B8924A]'
                }`}>
                  {n.type === 'PAYMENT' ? <CreditCard className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#17140F]">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#B8924A]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
