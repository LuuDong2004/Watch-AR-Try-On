import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Clock, MapPin, Phone, Store } from 'lucide-react';
import type { Shop } from '../../../api';

export interface BranchShopEntry {
  shop: Shop;
  /** How many watches in this branch share the current watch's brand. */
  matchCount: number;
  /** A representative product image for the card header. */
  thumb?: string;
}

interface BranchShopsProps {
  brand: string;
  branches: BranchShopEntry[];
  onSelect: (shopId: string) => void;
}

/**
 * Other branches owned by the same seller account that also stock products of
 * the current watch's brand. Horizontal scroll-snap carousel (≈3 cards visible),
 * arrow controls reveal the rest when there are more than 3.
 */
export default function BranchShops({ brand, branches, onSelect }: BranchShopsProps) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!branches.length) return null;

  const nudge = (dir: number) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  const showArrows = branches.length > 3;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">
            Cùng nhà bán
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy md:text-3xl">
            Chi nhánh khác cũng bán {brand}
          </h2>
        </div>
        {showArrows && (
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
        )}
      </div>

      <div
        ref={scroller}
        className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {branches.map(({ shop, matchCount, thumb }) => (
          <button
            key={shop.id}
            onClick={() => onSelect(shop.id)}
            className="group flex w-[300px] max-w-[85vw] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[#e9e3d8] bg-white text-left shadow-luxe-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-luxe-lg sm:w-[calc((100%-2.5rem)/3)]"
          >
            <div className="relative h-36 overflow-hidden bg-cream">
              {thumb ? (
                <img
                  src={thumb}
                  alt={shop.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-champagne/40">
                  <Store className="h-10 w-10" />
                </div>
              )}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-champagne px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                {matchCount} mẫu {brand}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Chi nhánh</p>
              <h3 className="mt-1 line-clamp-1 font-display text-base font-bold text-navy transition group-hover:text-champagne">
                {shop.name}
              </h3>

              <div className="mt-2 space-y-1.5 text-[11px] font-medium leading-4 text-gray-500">
                {shop.address && (
                  <p className="flex gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
                    <span className="line-clamp-2">{shop.address}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {shop.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-champagne" /> {shop.phone}
                    </span>
                  )}
                  {shop.hours && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-champagne" /> {shop.hours}
                    </span>
                  )}
                </div>
              </div>

              <span className="mt-3 inline-flex items-center gap-1 pt-1 text-xs font-bold text-champagne transition group-hover:gap-1.5">
                Xem shop <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
