// Shared formatting + presentation helpers for the luxury product detail module.

import {
  Cog,
  Circle,
  Gem,
  Droplets,
  Ruler,
  Link2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(n) + ' vnđ';

/** Discount percentage (rounded) when an original price exists, else 0. */
export const discountPct = (watch: any): number => {
  if (!watch?.originalPrice || watch.originalPrice <= watch.price) return 0;
  return Math.round((1 - watch.price / watch.originalPrice) * 100);
};

/** A stable, elegant pseudo reference number derived from brand + id. */
export const referenceNo = (watch: any): string => {
  const code = (watch?.brand || 'TW').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'TW';
  const tail = String(watch?.id || '').toUpperCase();
  const size = (watch?.specs?.['Đường kính mặt'] || '').replace(/[^0-9]/g, '');
  return `Ref. ${code}-${tail}${size ? `.${size}` : ''}`;
};

// Known spec keys mapped to an icon + short luxury label, in display priority.
// The grid renders whichever of these exist on the watch (then any extras).
export const SPEC_META: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'Chất liệu vỏ', label: 'Chất liệu vỏ', icon: ShieldCheck },
  { key: 'Bộ máy', label: 'Bộ máy', icon: Cog },
  { key: 'Đường kính mặt', label: 'Đường kính', icon: Circle },
  { key: 'Chất liệu kính', label: 'Mặt kính', icon: Gem },
  { key: 'Chống nước', label: 'Chống nước', icon: Droplets },
  { key: 'Độ dày vỏ', label: 'Độ dày vỏ', icon: Ruler },
  { key: 'Chất liệu dây', label: 'Dây đeo', icon: Link2 },
  { key: 'Bảo hành', label: 'Bảo hành', icon: ShieldCheck },
];

/** Build an ordered list of { icon, label, value } from a watch's specs. */
export function buildSpecList(specs: Record<string, string> = {}) {
  const known = SPEC_META.filter((m) => specs[m.key]).map((m) => ({
    icon: m.icon,
    label: m.label,
    value: specs[m.key],
  }));
  const knownKeys = new Set(SPEC_META.map((m) => m.key));
  const extras = Object.entries(specs)
    .filter(([k]) => !knownKeys.has(k))
    .map(([label, value]) => ({ icon: Circle, label, value: String(value) }));
  return [...known, ...extras];
}
