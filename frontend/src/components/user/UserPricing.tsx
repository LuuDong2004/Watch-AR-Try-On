import React from 'react';
import { Zap, Crown, Check, Gift, Star, Building2, Boxes, Sparkles, MapPin, Headset } from 'lucide-react';

interface UserPricingProps {
  onBackToCatalog: () => void;
}

interface Feature {
  text: string;
  strong?: string;
  Icon: typeof Zap;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  oldPrice: string;
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
    id: 'essential',
    name: 'Essential',
    tagline: 'Gói Tháng — cơ bản cho cửa hàng mới bắt đầu',
    oldPrice: '700.000đ',
    price: '499.000đ',
    period: '/ tháng',
    Icon: Zap,
    iconBox: 'bg-[#B8924A]/15 text-[#B8924A]',
    accent: 'text-[#B8924A]',
    cta: 'Đăng ký gói Tháng',
    ctaCls: 'border border-[#B8924A] text-[#B8924A] hover:bg-[#B8924A]/10',
    features: [
      { Icon: Building2, text: 'Tối đa ', strong: '3 chi nhánh' },
      { Icon: Boxes, text: 'Tối đa ', strong: '50 sản phẩm' },
      { Icon: Sparkles, text: 'Trải nghiệm AR Try-on ', strong: 'mượt mà, chuẩn kích thước 1:1' },
      { Icon: MapPin, text: 'Cửa hàng được đề xuất trong thông tin sản phẩm' },
      { Icon: Headset, text: 'Hỗ trợ kỹ thuật tức thì' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Gói Năm — cao cấp cho chuỗi cửa hàng & đại lý',
    oldPrice: '8.400.000đ',
    price: '4.199.000đ',
    period: '/ 12 tháng',
    Icon: Crown,
    tag: { label: 'Tiết kiệm 50%', Icon: Star, cls: 'bg-[#B8924A] text-white' },
    popular: true,
    iconBox: 'bg-[#17140F] text-white',
    accent: 'text-[#B8924A]',
    cta: 'Đăng ký gói Năm',
    ctaCls: 'bg-[#B8924A] text-white hover:bg-[#a6803f] shadow',
    ctaNote: 'Tiết kiệm hơn 4.2 triệu so với gói tháng',
    features: [
      { Icon: Building2, text: 'Tối đa ', strong: '50 chi nhánh' },
      { Icon: Boxes, text: 'Sản phẩm ', strong: 'không giới hạn' },
      { Icon: Sparkles, text: 'Trải nghiệm AR Try-on ', strong: 'mượt mà, chuẩn kích thước 1:1' },
      { Icon: MapPin, text: 'Cửa hàng được đề xuất trong thông tin sản phẩm' },
      { Icon: Headset, text: 'Hỗ trợ kỹ thuật tức thì' },
    ],
  },
];

export default function UserPricing({ onBackToCatalog }: UserPricingProps) {
  const handleChoose = (plan: Plan) => {
    alert(`Cảm ơn bạn! Cổng thanh toán đang được hoàn thiện — bạn sẽ sớm có thể đăng ký gói ${plan.name} dành cho đối tác.`);
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2 block">Gói dành cho Đối tác</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Trở thành đối tác TrueWrist</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Đưa cửa hàng của bạn lên TrueWrist với trải nghiệm thử đồng hồ AR chuẩn kích thước 1:1, được đề xuất trực tiếp trong thông tin sản phẩm. Hủy bất cứ lúc nào.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl bg-white p-7 flex flex-col h-full transition ${
                plan.popular
                  ? 'border-2 border-[#B8924A] shadow-2xl md:-translate-y-4'
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
                <span className="text-sm text-gray-400 line-through font-medium mr-2">{plan.oldPrice}</span>
                <span className="text-[10px] uppercase tracking-wide text-[#B8924A] font-bold">Chỉ còn</span>
                <div className="mt-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-400 font-medium"> {plan.period}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => handleChoose(plan)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-[0.99] ${plan.ctaCls}`}
              >
                {plan.cta}
              </button>
              {plan.ctaNote && (
                <p className="text-center text-[11px] text-[#B8924A] font-semibold mt-2.5 inline-flex items-center justify-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> {plan.ctaNote}
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <span className="h-px flex-1 bg-[#e5e0d8]" />
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Thông tin gói</span>
                <span className="h-px flex-1 bg-[#e5e0d8]" />
              </div>

              {/* Features */}
              <ul className="space-y-3.5 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-gray-600">
                    <f.Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.accent}`} />
                    <span>
                      {f.text}
                      {f.strong && <span className="font-bold text-[#17140F]">{f.strong}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-gray-400 mt-12 max-w-xl mx-auto leading-relaxed">
          Giá đã bao gồm VAT. Đăng ký gói đối tác để đăng bán sản phẩm, quản lý chi nhánh và hiển thị cửa hàng của bạn trên TrueWrist. Bạn có thể nâng cấp hoặc gia hạn bất cứ lúc nào.
        </p>
      </div>
    </div>
  );
}
