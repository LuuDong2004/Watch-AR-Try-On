import React, { useEffect, useState } from 'react';
import { Zap, Crown, Check, Gift, Sparkles, Building2, Boxes, Clock3, Loader2, UserPlus, ClipboardCheck, BadgeCheck, Store } from 'lucide-react';
import { subscriptionApi, ApiError } from '../../api';
import type { PlanUpgradeRequest, SubscriptionPlan } from '../../api';
import { useSession } from '../../auth/session';
import { useLoginPrompt } from '../../auth/loginPrompt';
import { toast } from '../../store/useToast';

interface UserPricingProps {
  onBackToCatalog: () => void;
}

const formatVND = (value: number) =>
  value === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(value) + ' vnđ';

const formatLimit = (value: number) => (value < 0 ? 'không giới hạn' : value.toLocaleString('vi-VN'));

/** Customer-facing "become a partner" pricing. Picking a plan submits an upgrade
 *  request to the admin (no payment gateway yet); admin approval grants the SHOP
 *  role and activates the plan. */
export default function UserPricing({ onBackToCatalog }: UserPricingProps) {
  const user = useSession((s) => s.user);
  const showLogin = useLoginPrompt((s) => s.show);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pending, setPending] = useState<PlanUpgradeRequest | null>(null);

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

  // Resolve the signed-in user's pending request (if any) to lock the CTAs.
  useEffect(() => {
    let cancelled = false;
    if (!user) { setPending(null); return; }
    subscriptionApi
      .myRequests()
      .then((reqs) => { if (!cancelled) setPending(reqs.find((r) => r.status === 'pending') ?? null); })
      .catch(() => { if (!cancelled) setPending(null); });
    return () => { cancelled = true; };
  }, [user]);

  const handleChoose = async (plan: SubscriptionPlan) => {
    if (!user) { showLogin('login'); return; }
    if (pending) return;
    const ok = await toast.confirm(
      `Gửi yêu cầu đăng ký gói ${plan.name} (${formatVND(plan.price)}) đến quản trị viên?`,
      { title: 'Trở thành đối tác bán hàng', confirmText: 'Gửi yêu cầu' },
    );
    if (!ok) return;
    setSubmitting(plan.code);
    try {
      const request = await subscriptionApi.requestUpgrade(plan.code);
      setPending(request);
      toast.success('Đã gửi yêu cầu! Quản trị viên sẽ duyệt và cấp quyền bán hàng cho bạn.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(null);
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
              { icon: ClipboardCheck, title: 'Chọn gói & gửi yêu cầu', desc: 'Chọn gói đối tác phù hợp rồi gửi đăng ký.' },
              { icon: BadgeCheck, title: 'Chờ admin duyệt', desc: 'Quản trị viên xác nhận và cấp quyền bán hàng.' },
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

        {/* Pending request banner */}
        {pending && (
          <div className="mx-auto mb-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-[#B8924A]/40 bg-white p-4 shadow-sm">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#B8924A]" />
            <p className="text-xs leading-5 text-[#7a5e28]">
              <span className="font-bold">Yêu cầu gói “{pending.planName}” của bạn đang chờ duyệt.</span>{' '}
              Quản trị viên sẽ xác nhận và cấp quyền bán hàng. Bạn sẽ nhận được quyền truy cập trang quản lý cửa hàng sau khi được duyệt.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#B8924A]" /> Đang tải bảng giá…
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
            {plans.map((plan) => {
              const isTop = plan.sortOrder >= maxSort && plans.length > 1;
              const Icon = isTop ? Crown : Zap;
              const isBusy = submitting === plan.code;
              const isPendingPlan = pending?.planCode === plan.code;
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
                  <button
                    onClick={() => void handleChoose(plan)}
                    disabled={isBusy || pending !== null}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center justify-center gap-2 ${
                      isTop
                        ? 'bg-[#B8924A] text-white hover:bg-[#a6803f] shadow'
                        : 'border border-[#B8924A] text-[#B8924A] hover:bg-[#B8924A]/10'
                    }`}
                  >
                    {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPendingPlan ? 'Đang chờ duyệt' : `Đăng ký gói ${plan.name}`}
                  </button>
                  {!user && (
                    <p className="text-center text-[11px] text-gray-400 mt-2">Đăng nhập để gửi yêu cầu đăng ký</p>
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
          <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Chưa có cổng thanh toán — yêu cầu đăng ký sẽ được quản trị viên duyệt thủ công để kích hoạt quyền bán hàng.</span>
        </p>
        <div className="text-center mt-4">
          <button onClick={onBackToCatalog} className="text-xs font-semibold text-[#B8924A] hover:underline">
            ← Quay lại bộ sưu tập
          </button>
        </div>
      </div>
    </div>
  );
}
