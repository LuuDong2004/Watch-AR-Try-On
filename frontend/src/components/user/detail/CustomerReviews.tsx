import React from 'react';
import { Star, Check } from 'lucide-react';

interface CustomerReviewsProps {
  watch: any;
}

// Plausible luxury rating distribution (weights sum to 1), scaled to reviewCount.
const DISTRIBUTION = [
  { stars: 5, weight: 0.78 },
  { stars: 4, weight: 0.16 },
  { stars: 3, weight: 0.04 },
  { stars: 2, weight: 0.015 },
  { stars: 1, weight: 0.005 },
];

const SAMPLE_REVIEWS = [
  {
    name: 'Hoàng Long',
    role: 'Doanh nhân',
    rate: 5,
    date: '25/05/2026',
    comment:
      'Đã ướm thử bằng AR trên web thấy vừa vặn, sau đó liên hệ shop nhận hàng liền. Đồng hồ đẹp hơn trên ảnh, hoàn thiện tinh xảo. Trải nghiệm mua sắm hiện đại nhất tôi từng có.',
  },
  {
    name: 'Quốc Bảo',
    role: 'Kiến trúc sư',
    rate: 5,
    date: '18/05/2026',
    comment:
      'Chức năng xoay 3D xem rõ từng góc cạnh niềng và cọc số sapphire. Tư vấn tận tình, đóng gói sang trọng. Rất đáng đồng tiền.',
  },
];

export default function CustomerReviews({ watch }: CustomerReviewsProps) {
  const total = watch.reviewCount || 0;

  return (
    <div className="grid gap-8 rounded-[24px] border border-[#e9e3d8] bg-white p-8 shadow-luxe-sm md:p-10 lg:grid-cols-[280px_1fr]">
      {/* Average + breakdown */}
      <div className="lg:border-r lg:border-[#e9e3d8] lg:pr-8">
        <div className="flex items-end gap-3">
          <span className="font-display text-6xl font-bold leading-none text-navy">{watch.rating}</span>
          <div className="pb-1">
            <div className="flex text-champagne">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-gray-500">{total} đánh giá đã xác minh</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {DISTRIBUTION.map((d) => {
            const count = Math.round(total * d.weight);
            const pct = total ? (count / total) * 100 : 0;
            return (
              <div key={d.stars} className="flex items-center gap-2 text-xs">
                <span className="flex w-6 items-center gap-0.5 text-gray-500">
                  {d.stars}
                  <Star className="h-3 w-3 fill-current" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0ece3]">
                  <div className="h-full rounded-full bg-champagne" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-7 text-right text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified reviews */}
      <div className="space-y-6">
        {SAMPLE_REVIEWS.map((r) => (
          <div key={r.name} className="border-b border-[#e9e3d8] pb-6 last:border-0 last:pb-0">
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne/40 bg-champagne/10 font-bold text-champagne">
                {r.name[0]}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-navy">{r.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    <Check className="h-3 w-3" /> Đã mua
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{r.role} · {r.date}</p>
              </div>
              <div className="flex text-champagne">
                {Array.from({ length: r.rate }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
