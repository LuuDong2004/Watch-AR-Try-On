import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}

/** Reusable centered popup for long secondary content (specs, story). */
export default function DetailModal({ open, onClose, title, eyebrow, children }: DetailModalProps) {
  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#e9e3d8] bg-cream shadow-luxe-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e9e3d8] bg-white px-6 py-5 md:px-8">
          <div>
            {eyebrow && (
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">{eyebrow}</span>
            )}
            <h2 className="mt-1 font-display text-xl font-bold text-navy md:text-2xl">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-[#e9e3d8]"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
