import React from 'react';
import { buildSpecList } from './format';

interface SpecGridProps {
  specs: Record<string, string>;
}

/** Elegant card grid of the key technical specifications. */
export default function SpecGrid({ specs }: SpecGridProps) {
  const items = buildSpecList(specs);
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((it) => {
        const Ic = it.icon;
        return (
        <div
          key={it.label}
          className="group rounded-2xl border border-[#e9e3d8] bg-white p-5 shadow-luxe-sm transition hover:-translate-y-0.5 hover:shadow-luxe"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-lg text-champagne">
            <Ic className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{it.label}</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-navy">{it.value}</p>
        </div>
        );
      })}
    </div>
  );
}
