import React from 'react';
import { Zap, Crown, Building2, Check, Star, Gift } from 'lucide-react';

interface UserPricingProps {
  onBackToCatalog: () => void;
}

interface Feature {
  text: string;
  on: boolean;
  strong?: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  Icon: typeof Zap;
  tag?: { label: string; Icon: typeof Star; cls: string };
  popular?: boolean;
  iconBox: string;
  accent: string;
  cta: string;
  ctaCls: string;
  ctaNote?: string;
  features: Feature[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Thoải mái khám phá, không cần trả phí',
    price: '0đ',
    period: '/ tháng',
    Icon: Zap,
    iconBox: 'bg-[#16162A]/5 text-[#16162A]',
    accent: 'text-[#16162A]',
    cta: 'Dùng ngay — Miễn phí',
    ctaCls: 'border border-[#e5e0d8] text-[#16162A] hover:bg-[#F6F4EF]',
    features: [
      { text: 'Duyệt toàn bộ bộ sưu tập + bộ lọc', on: true },
      { text: 'Xem mô hình 3D 360°', on: true },
      { text: 'Thử đeo AR — 5 lượt/ngày', on: true },
      { text: 'Lưu yêu thích — tối đa 10 mẫu', on: true },
      { text: 'Liên hệ shop — 3 yêu cầu/ngày', on: true },
      { text: 'Nhắc lịch hẹn xem đồng hồ', on: true },
      { text: 'Thiết kế đồng hồ 3D từ ảnh', on: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Cho tín đồ đồng hồ không bỏ lỡ mẫu nào',
    price: '49.000đ',
    period: '/ tháng',
    Icon: Crown,
    tag: { label: 'Phổ biến nhất', Icon: Star, cls: 'bg-[#1C9FD9] text-white' },
    popular: true,
    iconBox: 'bg-[#1C9FD9]/15 text-[#1C9FD9]',
    accent: 'text-[#1C9FD9]',
    cta: 'Bắt đầu dùng Pro',
    ctaCls: 'bg-[#1C9FD9] text-white hover:bg-[#1685B8] shadow',
    ctaNote: '7 ngày dùng thử miễn phí',
    features: [
      { text: 'Tất cả tính năng Free +', on: true, strong: true },
      { text: 'Thử đeo AR — không giới hạn', on: true },
      { text: 'Lưu yêu thích — không giới hạn', on: true },
      { text: 'Liên hệ shop — không giới hạn', on: true },
      { text: 'Cảnh báo giảm giá mẫu đã lưu', on: true },
      { text: 'Ưu tiên đặt lịch hẹn xem', on: true },
      { text: 'Badge "Pro" trên hồ sơ', on: true },
      { text: 'Sớm trải nghiệm Thiết kế đồng hồ 3D từ ảnh', on: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Cho chủ shop & đại lý đồng hồ',
    price: '199.000đ',
    period: '/ tháng',
    Icon: Building2,
    tag: { label: 'Doanh nghiệp', Icon: Building2, cls: 'bg-[#16162A] text-white' },
    iconBox: 'bg-[#16162A] text-white',
    accent: 'text-[#16162A]',
    cta: 'Liên hệ tư vấn',
    ctaCls: 'bg-[#16162A] text-white hover:bg-black shadow',
    features: [
      { text: 'Tất cả tính năng Pro +', on: true, strong: true },
      { text: 'Đăng bán sản phẩm không giới hạn', on: true },
      { text: 'Dashboard phân tích lượt thử AR & leads', on: true },
      { text: 'Quản lý nhiều cửa hàng', on: true },
      { text: 'Ghim sản phẩm lên đầu danh mục', on: true },
      { text: 'Logo + ảnh bìa thương hiệu trên trang shop', on: true },
      { text: 'Lên lịch đăng sản phẩm tự động', on: true },
      { text: 'Badge "Đã xác minh" trên cửa hàng', on: true },
      { text: 'Hỗ trợ ưu tiên 24/7', on: true },
    ],
  },
];

export default function UserPricing({ onBackToCatalog }: UserPricingProps) {
  const handleChoose = (plan: Plan) => {
    if (plan.id === 'free') {
      onBackToCatalog();
    } else if (plan.id === 'business') {
      alert('Cảm ơn bạn! Đội ngũ TrueWrist sẽ liên hệ tư vấn gói Business trong thời gian sớm nhất.');
    } else {
      alert('Cảm ơn bạn! Cổng thanh toán đang được hoàn thiện — bạn sẽ sớm có thể nâng cấp Pro.');
    }
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-[#1C9FD9] font-bold mb-2 block">Bảng giá & Nâng cấp</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Chọn gói phù hợp với bạn</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Mở khóa thử AR không giới hạn, lưu yêu thích thoải mái và công cụ kinh doanh cho cửa hàng. Hủy bất cứ lúc nào.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl bg-white p-7 flex flex-col h-full transition ${
                plan.popular
                  ? 'border-2 border-[#1C9FD9] shadow-2xl md:-translate-y-4'
                  : 'border border-[#e5e0d8] shadow-sm hover:shadow-md'
              }`}
            >
              {/* Top tag */}
              {plan.tag && (
                <span className={`inline-flex items-center gap-1.5 self-start text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${plan.tag.cls}`}>
                  <plan.tag.Icon className="h-3 w-3" /> {plan.tag.label}
                </span>
              )}

              {/* Header */}
              <div className="flex items-start gap-3 mb-5">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.iconBox}`}>
                  <plan.Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-bold leading-tight">{plan.name}</h3>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{plan.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-gray-400 font-medium"> {plan.period}</span>
              </div>

              {/* CTA */}
              <button
                onClick={() => handleChoose(plan)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-[0.99] ${plan.ctaCls}`}
              >
                {plan.cta}
              </button>
              {plan.ctaNote && (
                <p className="text-center text-[11px] text-[#1C9FD9] font-semibold mt-2.5 inline-flex items-center justify-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> {plan.ctaNote}
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <span className="h-px flex-1 bg-[#e5e0d8]" />
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Bao gồm</span>
                <span className="h-px flex-1 bg-[#e5e0d8]" />
              </div>

              {/* Features */}
              <ul className="space-y-3.5 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 ${f.on ? 'text-gray-600' : 'text-gray-300'}`}>
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${f.on ? plan.accent : 'text-gray-300'}`} />
                    <span className={f.strong ? 'font-bold text-[#16162A]' : ''}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-gray-400 mt-12 max-w-xl mx-auto leading-relaxed">
          Giá đã bao gồm VAT. Bạn có thể nâng cấp, hạ cấp hoặc hủy gói bất cứ lúc nào. Gói Business phù hợp với các shop muốn đăng bán và quản lý sản phẩm trên TrueWrist.
        </p>
      </div>
    </div>
  );
}
