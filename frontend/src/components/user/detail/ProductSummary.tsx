import React from 'react';
import { ArrowRight, Check, Clock, MapPin, Phone, ShieldCheck, Store, Truck, Lock, Sparkles, Mail, Heart, type LucideIcon } from 'lucide-react';
import { formatVND, discountPct, referenceNo } from './format';
import { canTryAr } from '../../../utils/publicListings';

interface ProductSummaryProps {
  watch: any;
  shop: any;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onOpenAR: () => void;
  onOpenContact: () => void;
  onOpenShop?: (shopId: string) => void;
}

const TRUST_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: Check, label: 'Cam kết chính hãng' },
  { icon: ShieldCheck, label: 'Bảo hành chính hãng' },
  { icon: Truck, label: 'Miễn phí giao hàng' },
  { icon: Lock, label: 'Thanh toán an toàn' },
];

export default function ProductSummary({
  watch,
  shop,
  isFavorited,
  onToggleFavorite,
  onOpenAR,
  onOpenContact,
  onOpenShop,
}: ProductSummaryProps) {
  const off = discountPct(watch);
  const inStock = watch.status !== 'locked';
  const canAr = canTryAr(watch);
  const goToShop = () => shop && onOpenShop?.(shop.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Brand + name + reference */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">
          {watch.brand}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight text-navy md:text-[2.6rem] md:leading-[1.1]">
          {watch.name}
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          {referenceNo(watch)}
        </p>
      </div>

      {/* Price block */}
      <div className="border-y border-[#e9e3d8] py-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-display text-[2rem] font-bold leading-none text-navy">
            {formatVND(watch.price)}
          </span>
          {watch.originalPrice && off > 0 && (
            <>
              <span className="text-base text-gray-400 line-through">{formatVND(watch.originalPrice)}</span>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                −{off}%
              </span>
            </>
          )}
        </div>
        <p
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${
            inStock ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {inStock ? 'Còn hàng · Sẵn sàng giao' : 'Tạm hết hàng'}
        </p>
      </div>

      {/* Luxury trust badges */}
      <div className="grid grid-cols-2 gap-2.5">
        {TRUST_BADGES.map((b) => {
          const Ic = b.icon;
          return (
          <div
            key={b.label}
            className="flex items-center gap-2 rounded-xl border border-[#e9e3d8] bg-white px-3 py-2.5 text-xs font-semibold text-navy"
          >
            <Ic className="h-4 w-4 text-champagne" />
            {b.label}
          </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        {canAr && (
          <button
            onClick={onOpenAR}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-champagne py-4 text-sm font-bold uppercase tracking-wider text-white shadow-luxe transition hover:brightness-[1.05] active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4" /> Thử đeo AR trên cổ tay
          </button>
        )}

        {/* Contact + Save always share a single line */}
        <div className="flex gap-3">
          <button
            onClick={onOpenContact}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.99] ${
              canAr
                ? 'border border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white'
                : 'bg-champagne text-white shadow-luxe hover:brightness-[1.05]'
            }`}
          >
            <Mail className="h-4 w-4" /> Liên hệ người bán
          </button>
          <button
            onClick={onToggleFavorite}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-3.5 text-sm font-bold transition active:scale-[0.99] ${
              isFavorited
                ? 'border-champagne bg-champagne/5 text-champagne'
                : 'border-navy/20 text-navy hover:border-champagne hover:text-champagne'
            }`}
            title={isFavorited ? 'Đã lưu' : 'Lưu vào yêu thích'}
          >
            {isFavorited ? (
              <>
                <Heart className="h-4 w-4 fill-current" /> Đã lưu
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" /> Lưu
              </>
            )}
          </button>
        </div>
      </div>

      {shop && (
        <div className="overflow-hidden rounded-2xl border border-[#e9e3d8] bg-white shadow-luxe-sm">
          {/* Seller header */}
          <div className="flex items-center gap-3 border-b border-[#f1ece2] bg-gradient-to-r from-cream/60 via-white to-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-champagne shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Bán bởi</p>
              <button
                type="button"
                onClick={goToShop}
                className="line-clamp-1 text-left font-display text-base font-bold text-navy transition hover:text-champagne"
              >
                {shop.name}
              </button>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> Chính hãng
            </span>
          </div>

          {/* Seller details */}
          <div className="space-y-2.5 p-4 text-xs font-medium leading-5 text-gray-600">
            {shop.address && (
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
                <span>{shop.address}</span>
              </div>
            )}
            {shop.phone && (
              <div className="flex gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
                <span>{shop.phone}</span>
              </div>
            )}
            {shop.hours && (
              <div className="flex gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
                <span>{shop.hours}</span>
              </div>
            )}
            {onOpenShop && (
              <button
                type="button"
                onClick={goToShop}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-champagne/40 bg-champagne/5 py-2.5 text-xs font-bold text-champagne transition hover:bg-champagne hover:text-white"
              >
                Xem cửa hàng <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
