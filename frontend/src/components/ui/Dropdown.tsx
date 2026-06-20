import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Custom, fully-styled dropdown that replaces the native <select>.
 *
 * The browser renders the native <select> option list itself, so its corners
 * can't be rounded with CSS. This component renders the popup as real DOM, so
 * the whole control — trigger AND list — follows the app's rounded, modern look.
 *
 * Drop-in for a controlled <select>: pass `value`, `onChange(value)` and
 * `options`. `className` styles the trigger so each call site keeps its own
 * sizing/colours; the popup panel is consistent everywhere.
 */
export type DropdownOption = {
  value: string;
  label: React.ReactNode;
  /** Optional plain-text label used for the collapsed trigger when `label` is a node. */
  text?: string;
  disabled?: boolean;
};

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  align?: 'left' | 'right';
  /** Optional icon shown at the left of the trigger. */
  leadingIcon?: React.ReactNode;
  ariaLabel?: string;
  /** Extra classes for the popup panel (e.g. a wider min-width). */
  panelClassName?: string;
  /** Extra classes for the relative wrapper (e.g. `flex-1` inside a flex row). */
  wrapperClassName?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Chọn…',
  disabled = false,
  fullWidth = true,
  align = 'left',
  leadingIcon,
  ariaLabel,
  panelClassName = '',
  wrapperClassName = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected ? selected.text ?? selected.label : placeholder;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // When opening, point the keyboard cursor at the current selection.
  useEffect(() => {
    if (open) setActiveIndex(options.findIndex((o) => o.value === value));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (opt: DropdownOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    setActiveIndex((prev) => {
      const n = options.length;
      let i = prev;
      for (let step = 0; step < n; step++) {
        i = (i + delta + n) % n;
        if (!options[i]?.disabled) return i;
      }
      return prev;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${wrapperClassName}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leadingIcon}
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#B8924A] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          id={listId}
          tabIndex={-1}
          className={`absolute z-50 mt-2 max-h-72 min-w-full overflow-auto rounded-2xl border border-[#e5e0d8] bg-white p-1.5 shadow-luxe animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => commit(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'bg-[#B8924A]/12 font-semibold text-[#17140F]'
                      : isActive
                      ? 'bg-[#F6F4EF] text-[#17140F]'
                      : 'text-gray-600 hover:bg-[#F6F4EF]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#B8924A]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
