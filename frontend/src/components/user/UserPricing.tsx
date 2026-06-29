import React, { useEffect, useState } from 'react';
import { Zap, Crown, Check, ShieldCheck, Sparkles, Building2, Boxes, Loader2, UserPlus, QrCode, BadgeCheck, Store } from 'lucide-react';
import { authApi, subscriptionApi } from '../../api';
import type { ShopSubscription, SubscriptionPlan } from '../../api';
import { useSession } from '../../auth/session';
import { useLoginPrompt } from '../../auth/loginPrompt';
import { toast } from '../../store/useToast';
import PaymentQRModal from '../payment/PaymentQRModal';

interface UserPricingProps {
  onBackToCatalog: () => void;
}

const formatVND = (value: number) =>
  value === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(value) + ' vnđ';

const formatLimit = (value: number) => (value < 0 ? 'không giới hạn' : value.toLocaleString('vi-VN'));

/** Customer-facing "become a partner" pricing. Picking a plan opens a QR payment
 *  (SePay); a confirmed payment activates the plan and grants the SHOP role
 *  automatically. */
export default function UserPricing({ onBackToCatalog }: UserPricingProps) {
  const user = useSession((s) => s.user);
  const setUser = useSession((s) => s.setUser);
  const showLogin = useLoginPrompt((s) => s.show);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [sub, setSub] = useState<ShopSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await subscriptionApi.plans();
        if (!cancelled) setPlans(list);
      } catch {
        /* ignore — page still renders with an empty catalogue */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load the caller's current subscription so we can disable buying the same or a
  // lower-tier plan while it's still active (matches the backend's purchase rule).
  useEffect(() => {
    if (!user) { setSub(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const s = await subscriptionApi.get();
        if (!cancelled) setSub(s);
      } catch {
        if (!cancelled) setSub(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // The active plan blocks same/lower tiers until it expires. A paid plan only;
  // an expired (or trial-only) subscription leaves everything purchasable.
  const now = Date.now();
  const activeSub = sub && sub.expiresAt > now && (sub.currentPlan?.price ?? 0) > 0 ? sub : null;
  const currentSort = activeSub?.currentPlan?.sortOrder ?? -Infinity;

  /** Is this plan blocked because the caller already holds it or a higher tier? */
  const isLockedPlan = (plan: SubscriptionPlan) => !!activeSub && plan.sortOrder <= currentSort;

  const handleChoose = (plan: SubscriptionPlan) => {
    if (!user) { showLogin('login'); return; }
    if (isLockedPlan(plan)) return; // guarded by the disabled button; defensive
    setPayingPlan(plan);
  };

  const handlePaid = async () => {
    setPayingPlan(null);
    toast.success('Thanh toán thành công! Quyền bán hàng đã được kích hoạt.');
    // Refresh the session so the new SHOP role takes effect immediately.
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      /* the app shell will pick up the new role on next load */
    }
  };

  const maxSort = plans.reduce((m, p) => Math.max(m, p.sortOrder), 0);

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2 block">Gói dành cho Đối tác</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Trở thành đối tác TrueWrist</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Đưa cửa hàng của bạn lên TrueWrist với trải nghiệm thử đồng hồ AR chuẩn kích thước 1:1, được đề xuất trực tiếp trong thông tin sản phẩm.
          </p>
        </div>

        {/* How to become a partner — quick steps */}
        <div className="mx-auto mb-10 max-w-4xl">
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8924A]">
            Các bước trở thành đối tác
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: UserPlus, title: 'Đăng ký tài khoản', desc: 'Tạo và đăng nhập tài khoản TrueWrist.' },
              { icon: QrCode, title: 'Chọn gói & quét QR', desc: 'Chọn gói đối tác rồi quét mã QR thanh toán.' },
              { icon: BadgeCheck, title: 'Kích hoạt tự động', desc: 'Thanh toán xong, quyền bán hàng được cấp ngay.' },
              { icon: Store, title: 'Mở cửa hàng', desc: 'Tạo cửa hàng, đăng đồng hồ với thử AR 1:1.' },
            ].map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-[#e5e0d8] bg-white p-4 shadow-sm">
                <span className="absolute right-3 top-2 font-display text-2xl font-bold text-[#efe7d8]">{i + 1}</span>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#B8924A]/15 text-[#B8924A]">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold leading-tight">{step.title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#B8924A]" /> Đang tải bảng giá…
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
            {plans.map((plan) => {
              const isTop = plan.sortOrder >= maxSort && plans.length > 1;
              const Icon = isTop ? Crown : Zap;
              return (
                <div
                  key={plan.code}
                  className={`relative rounded-3xl bg-white p-7 flex flex-col h-full transition ${
                    plan.recommended
                      ? 'border-2 border-[#B8924A] shadow-2xl md:-translate-y-2'
                      : 'border border-[#e5e0d8] shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.recommended && (
                    <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 bg-[#B8924A] text-white">
                      <Sparkles className="h-3 w-3" /> Đề xuất
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isTop ? 'bg-[#17140F] text-white' : 'bg-[#B8924A]/15 text-[#B8924A]'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold leading-tight">{plan.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="font-display text-4xl font-bold">{formatVND(plan.price)}</span>
                    <span className="text-sm text-gray-400 font-medium"> / {plan.durationDays} ngày</span>
                  </div>

                  {/* CTA */}
                  {(() => {
                    const locked = isLockedPlan(plan);
                    const isCurrent = !!activeSub && plan.sortOrder === currentSort;
                    return (
                      <button
                        onClick={() => handleChoose(plan)}
                        disabled={locked}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition inline-flex items-center justify-center gap-2 ${
                          locked
                            ? 'cursor-not-allowed border border-[#e5e0d8] bg-gray-50 text-gray-400'
                            : isTop
                              ? 'bg-[#B8924A] text-white hover:bg-[#a6803f] shadow active:scale-[0.99]'
                              : 'border border-[#B8924A] text-[#B8924A] hover:bg-[#B8924A]/10 active:scale-[0.99]'
                        }`}
                      >
                        {locked ? (
                          <>
                            <Check className="h-4 w-4" />
                            {isCurrent ? 'Gói hiện tại của bạn' : 'Đã có gói cao hơn'}
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4" />
                            {`Thanh toán gói ${plan.name}`}
                          </>
                        )}
                      </button>
                    );
                  })()}
                  {!user && (
                    <p className="text-center text-[11px] text-gray-400 mt-2">Đăng nhập để thanh toán & đăng ký</p>
                  )}
                  {isLockedPlan(plan) && (
                    <p className="text-center text-[11px] text-gray-400 mt-2">
                      {activeSub && plan.sortOrder === currentSort
                        ? `Còn ${activeSub.daysRemaining} ngày — có thể gia hạn khi hết hạn.`
                        : 'Bạn đang dùng gói cao hơn. Chỉ có thể nâng cấp, không thể mua gói thấp hơn.'}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-6">
                    <span className="h-px flex-1 bg-[#e5e0d8]" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Quyền lợi</span>
                    <span className="h-px flex-1 bg-[#e5e0d8]" />
                  </div>

                  {/* Quotas */}
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-start gap-2.5 text-gray-600">
                      <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#B8924A]" />
                      <span>Tối đa <span className="font-bold text-[#17140F]">{formatLimit(plan.maxShops)} chi nhánh</span></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-gray-600">
                      <Boxes className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#B8924A]" />
                      <span>Sản phẩm <span className="font-bold text-[#17140F]">{formatLimit(plan.maxProducts)}</span></span>
                    </li>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-gray-600">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#B8924A]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Footnote */}
        <p className="mx-auto mt-12 flex max-w-xl items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-gray-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Thanh toán an toàn qua mã QR (SePay / VietQR). Quyền bán hàng được kích hoạt tự động ngay khi nhận được thanh toán.</span>
        </p>
        <div className="text-center mt-4">
          <button onClick={onBackToCatalog} className="text-xs font-semibold text-[#B8924A] hover:underline">
            ← Quay lại bộ sưu tập
          </button>
        </div>
      </div>

      {payingPlan && (
        <PaymentQRModal
          plan={payingPlan}
          onClose={() => setPayingPlan(null)}
          onSuccess={handlePaid}
        />
      )}
    </div>
  );
}
