/**
 * Tiny global toast store — replaces the browser's native alert()/confirm()
 * dialogs (the "localhost says…" popups) with in-app toasts rendered top-right
 * by <ToastHost />.
 *
 * Usage from anywhere (no hooks needed):
 *   import { toast } from '../store/useToast';
 *   toast.success('Đã lưu!');
 *   toast.error('Có lỗi xảy ra');
 *   if (await toast.confirm('Xóa mục này?')) { ... }
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'confirm';

export interface ConfirmOptions {
  /** Heading shown above the message. */
  title?: string;
  confirmText?: string;
  cancelText?: string;
  /** Style the confirm action as destructive (red). */
  danger?: boolean;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  /** Auto-dismiss after this many ms. 0 = sticky (used for confirm). */
  duration: number;
  /** Resolver for confirm toasts — true on confirm, false on cancel/dismiss. */
  resolve?: (ok: boolean) => void;
  /** Confirm-dialog extras. */
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

function notify(type: ToastType, message: string, duration = 3600) {
  return useToast.getState().push({ type, message, duration });
}

export const toast = {
  success: (message: string) => notify('success', message),
  error: (message: string) => notify('error', message),
  info: (message: string) => notify('info', message),
  /** In-app replacement for window.confirm — resolves to a boolean. Rendered as
   *  a centred dialog by <ToastHost />. */
  confirm: (message: string, opts: ConfirmOptions = {}) =>
    new Promise<boolean>((resolve) => {
      useToast.getState().push({ type: 'confirm', message, duration: 0, resolve, ...opts });
    }),
};
