/** Shared, modern UI primitives for the storefront + dashboards (Tailwind). */
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
} from 'react';

/* --------------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'outline';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-black',
  gold: 'bg-gold text-white hover:brightness-95',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  outline: 'border border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
}

export function Button({ variant = 'primary', block, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        buttonStyles[variant]
      } ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}

/* ---------------------------------------------------------------------- Fields */

function Label({ label, hint }: { label?: string; hint?: string }) {
  if (!label) return null;
  return (
    <span className="mb-1 flex items-baseline justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </span>
  );
}

const fieldBase =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/30';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}
export function TextInput({ label, hint, className = '', ...rest }: TextInputProps) {
  return (
    <label className="block">
      <Label label={label} hint={hint} />
      <input className={`${fieldBase} ${className}`} {...rest} />
    </label>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export function TextArea({ label, className = '', ...rest }: TextAreaProps) {
  return (
    <label className="block">
      <Label label={label} />
      <textarea className={`${fieldBase} min-h-[90px] resize-y ${className}`} {...rest} />
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export function Select({ label, className = '', children, ...rest }: SelectProps) {
  return (
    <label className="block">
      <Label label={label} />
      <select className={`${fieldBase} ${className}`} {...rest}>
        {children}
      </select>
    </label>
  );
}

/* ----------------------------------------------------------------------- Badge */

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: 'gray' | 'green' | 'red' | 'gold' | 'blue';
}) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-600',
    gold: 'bg-gold/15 text-[#0E6E99]',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- EmptyState */

export function EmptyState({ icon = '📭', title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <p className="mb-2 text-4xl">{icon}</p>
      <p className="font-semibold text-gray-700">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-gray-500">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------- WatchDisc */

/** Round watch-face thumbnail rendered from the model palette (no photos). */
export function WatchDisc({
  metal,
  dial,
  accent,
  size = 44,
}: {
  metal: string;
  dial: string;
  accent: string;
  size?: number;
}) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border-2"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${metal}, ${dial} 75%)`,
        borderColor: accent,
      }}
    />
  );
}
