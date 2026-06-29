import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export interface ChatBubbleAction {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
}

interface ChatBubbleProps {
  /** Unread message count shown as a red badge. */
  unread?: number;
  /** Title of the popover menu (when `actions` is provided). */
  title?: string;
  /** When set, clicking the bubble opens a small menu of these actions. */
  actions?: ChatBubbleAction[];
  /** When `actions` is absent, clicking the bubble fires this directly. */
  onOpen?: () => void;
}

/**
 * A floating chat launcher pinned to the bottom-right. Either jumps straight to an
 * inbox ({@link onOpen}) or pops up a small menu of {@link actions} (e.g. the
 * customer's "my inbox" / "contact support" shortcuts).
 */
export default function ChatBubble({ unread = 0, title = 'Tin nhắn', actions, onOpen }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleClick = () => {
    if (actions && actions.length) setOpen((v) => !v);
    else onOpen?.();
  };

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && actions && (
        <div className="w-64 overflow-hidden rounded-2xl border border-[#e5e0d8] bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#17140F] px-4 py-3 text-white">
            <p className="text-xs font-bold">{title}</p>
            <button onClick={() => setOpen(false)} aria-label="Đóng" className="text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2">
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={() => { setOpen(false); a.onClick(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F6F4EF]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8924A]/10 text-[#B8924A]">
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[#17140F]">{a.label}</span>
                  {a.sublabel && <span className="block truncate text-[11px] text-gray-400">{a.sublabel}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        aria-label={title}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#B8924A] text-white shadow-2xl transition hover:bg-[#a6803f] active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#F6F4EF]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
