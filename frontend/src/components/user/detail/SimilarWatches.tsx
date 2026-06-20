import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { formatVND } from './format';
import { canTryAr } from '../../../utils/publicListings';

interface SimilarWatchesProps {
  watches: any[];
  onSelect: (id: string) => void;
}

/** Luxury horizontal product carousel with scroll-snap + arrow controls. */
export default function SimilarWatches({ watches, onSelect }: SimilarWatchesProps) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!watches.length) return null;

  const nudge = (dir: number) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">Khám phá thêm</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy md:text-3xl">Những mẫu tương tự</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => nudge(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9e3d8] bg-white text-navy transition hover:border-champagne hover:text-champagne"
            aria-label="Trước"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => nudge(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9e3d8] bg-white text-navy transition hover:border-champagne hover:text-champagne"
            aria-label="Sau"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {watches.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#e9e3d8] bg-white text-left shadow-luxe-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-luxe-lg"
          >
            <div className="relative h-52 overflow-hidden">
              <img
                src={w.image}
                alt={w.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              {canTryAr(w) && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-champagne px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                  <Sparkles className="h-3 w-3" /> AR
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{w.brand}</p>
              <h3 className="mt-1 line-clamp-1 font-display text-sm font-bold text-navy transition group-hover:text-champagne">
                {w.name}
              </h3>
              <div className="mt-auto flex flex-col gap-0.5 pt-3">
                <span className="font-display text-lg font-bold text-navy whitespace-nowrap">{formatVND(w.price)}</span>
                {w.originalPrice && w.originalPrice > w.price && (
                  <span className="text-xs text-gray-400 line-through whitespace-nowrap">{formatVND(w.originalPrice)}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
