import React from 'react';

/**
 * Shared form primitives for a consistent, accessible look across the app.
 * Tokens: ink #16162A, cream #F6F4EF, gold #B8924A, border #e5e0d8.
 */

// Base styling for text inputs / selects / textareas.
export const inputBase =
  'w-full rounded-xl border border-[#e5e0d8] bg-white px-3.5 py-2.5 text-sm text-[#16162A] ' +
  'placeholder:text-gray-400 transition-shadow transition-colors ' +
  'focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20';

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, required, hint, htmlFor, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
      >
        {label}
        {required && <span className="text-[#B8924A]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => <input ref={ref} {...props} className={`${inputBase} ${className}`} />
);
TextInput.displayName = 'TextInput';

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} {...props} className={`${inputBase} resize-none leading-relaxed ${className}`} />
  )
);
TextArea.displayName = 'TextArea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select ref={ref} {...props} className={`${inputBase} pr-9 appearance-none bg-no-repeat cursor-pointer ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23B8924A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.85rem center',
        ...(props.style || {}),
      }}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

/** A grouped section with an optional title — for breaking long forms into steps. */
export function FormSection({ title, step, children }: { title?: string; step?: number; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      {title && (
        <legend className="flex items-center gap-2 text-xs font-bold text-[#16162A] mb-1">
          {step != null && (
            <span className="h-5 w-5 rounded-full bg-[#B8924A] text-white text-[10px] flex items-center justify-center font-bold">
              {step}
            </span>
          )}
          {title}
        </legend>
      )}
      {children}
    </fieldset>
  );
}

type SegOption = { value: string; label: string };

/** Pill segmented control (e.g. "Tư vấn" / "Đặt lịch"). */
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#e5e0d8] text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-center rounded-lg transition ${
            value === opt.value ? 'bg-[#16162A] text-white shadow-sm' : 'text-gray-500 hover:text-[#16162A]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
