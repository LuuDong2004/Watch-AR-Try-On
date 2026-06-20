import React from 'react';
import { Dropdown, type DropdownOption } from './Dropdown';

/**
 * Shared form primitives for a consistent, accessible look across the app.
 * Tokens: ink #17140F, cream #F6F4EF, gold #B8924A, border #e5e0d8.
 */

// Base styling for text inputs / selects / textareas.
export const inputBase =
  'w-full rounded-xl border border-[#e5e0d8] bg-white px-3.5 py-2.5 text-sm text-[#17140F] ' +
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

/** Flatten <option> children (incl. fragments / arrays / conditionals) to options. */
function optionsFromChildren(children: React.ReactNode): DropdownOption[] {
  const out: DropdownOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      out.push(...optionsFromChildren(child.props.children));
      return;
    }
    if (child.type === 'option') {
      const label = child.props.children;
      out.push({
        value: String(child.props.value ?? ''),
        label,
        text: typeof label === 'string' ? label : undefined,
        disabled: child.props.disabled,
      });
    }
  });
  return out;
}

type FieldSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  onChange?: (e: { target: { value: string } }) => void;
};

/**
 * Drop-in for a native <select> that renders the custom rounded {@link Dropdown}.
 * Keeps the event-style `onChange(e => e.target.value)` API so existing call
 * sites need no changes, while the popup list follows the app's rounded look.
 */
export function Select({ className = '', children, value, onChange, disabled }: FieldSelectProps) {
  const options = optionsFromChildren(children);
  return (
    <Dropdown
      value={value == null ? '' : String(value)}
      onChange={(v) => onChange?.({ target: { value: v } })}
      options={options}
      disabled={disabled}
      className={`${inputBase} cursor-pointer ${className}`}
    />
  );
}
Select.displayName = 'Select';

/** A grouped section with an optional title — for breaking long forms into steps. */
export function FormSection({ title, step, children }: { title?: string; step?: number; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      {title && (
        <legend className="flex items-center gap-2 text-xs font-bold text-[#17140F] mb-1">
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
            value === opt.value ? 'bg-[#17140F] text-white shadow-sm' : 'text-gray-500 hover:text-[#17140F]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
