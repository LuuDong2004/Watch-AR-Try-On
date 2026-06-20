import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpCircle,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  ApiError,
  shopApi,
  subscriptionApi,
  watchApi,
} from '../../api';
import type {
  PlanUpgradeRequest,
  ShopSubscription,
  SubscriptionPlan,
  SubscriptionPlanCode,
} from '../../api';
import { toast } from '../../store/useToast';

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value) + ' vnđ';

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));

const formatCount = (value: number) => value.toLocaleString('vi-VN');

const formatPlanPrice = (value: number) => (value === 0 ? 'Miễn phí' : formatVND(value));

const formatLimit = (value: number) => (value < 0 ? 'Không giới hạn' : formatCount(value));

const getUsagePercent = (value: number, limit: number) => {
  if (limit < 0) return 100;
  return Math.min(100, Math.max(0, (value / Math.max(limit, 1)) * 100));
};

// Plans are a dynamic catalogue now, so derive presentation from rank/price
// rather than hard-coded codes. The top-ranked plan gets the premium look.
const planTone = (isTop: boolean, isTrial: boolean): string => {
  if (isTop) return 'bg-[#17140F] text-white';
  if (isTrial) return 'bg-[#B8924A]/10 text-[#B8924A]';
  return 'bg-[#B8924A]/15 text-[#9A7434]';
};

const planIcon = (plan: SubscriptionPlan, isTop: boolean): LucideIcon => {
  if (isTop) return Crown;
  if (plan.price > 0) return Zap;
  return Sparkles;
};

export default function ShopPlanManagement() {
  const [subscription, setSubscription] = useState<ShopSubscription | null>(null);
  const [usage, setUsage] = useState({ shops: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<SubscriptionPlanCode | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PlanUpgradeRequest | null>(null);
  const [loadError, setLoadError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [subscriptionData, shops, myRequests] = await Promise.all([
        subscriptionApi.get(),
        shopApi.mine(),
        subscriptionApi.myRequests().catch(() => [] as PlanUpgradeRequest[]),
      ]);
      const productLists = await Promise.all(shops.map((shop) => watchApi.list(shop.id)));
      setSubscription(subscriptionData);
      setPendingRequest(myRequests.find((r) => r.status === 'pending') ?? null);
      setUsage({
        shops: shops.length,
        products: productLists.reduce((total, products) => total + products.length, 0),
      });
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Không thể tải thông tin gói sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const periodProgress = useMemo(() => {
    if (!subscription) return 0;
    const total = subscription.expiresAt - subscription.registeredAt;
    if (total <= 0) return 100;
    const elapsed = Date.now() - subscription.registeredAt;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [subscription]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!subscription) return;
    const isRenewal = plan.code === subscription.plan;
    const confirmed = await toast.confirm(
      isRenewal
        ? `Gửi yêu cầu gia hạn gói ${plan.name} (${plan.durationDays} ngày · ${formatPlanPrice(plan.price)}) đến quản trị viên?`
        : `Gửi yêu cầu nâng cấp lên gói ${plan.name} (${formatPlanPrice(plan.price)}) đến quản trị viên?`,
      {
        title: isRenewal ? 'Xác nhận gửi yêu cầu gia hạn' : 'Xác nhận gửi yêu cầu nâng cấp',
        confirmText: 'Gửi yêu cầu',
      },
    );
    if (!confirmed) return;

    setUpgradingPlan(plan.code);
    try {
      const request = await subscriptionApi.requestUpgrade(plan.code);
      setPendingRequest(request);
      toast.success('Đã gửi yêu cầu. Quản trị viên sẽ duyệt và kích hoạt gói cho bạn.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không thể gửi yêu cầu nâng cấp.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F4EF] text-sm text-[#8A8170]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[#e5e0d8] bg-white px-5 py-4 shadow-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-[#B8924A]" />
          Đang tải thông tin gói…
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen w-full bg-[#F6F4EF] p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-6 text-sm shadow-sm">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-[#17140F]">Không thể tải gói sử dụng</p>
              <p className="mt-1 text-xs leading-5 text-red-600">
                {loadError || 'Không thể tải thông tin gói sử dụng.'}
              </p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#17140F] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription.currentPlan;
  const isExpired = subscription.status === 'EXPIRED';
  const daysRemaining = Math.max(0, subscription.daysRemaining);

  // Highest rank in the upgrade catalogue → used to pick the "premium" styling.
  const maxSort = subscription.plans.reduce((m, p) => Math.max(m, p.sortOrder), currentPlan.sortOrder);
  const currentRank = currentPlan.sortOrder;
  const CurrentIcon = planIcon(currentPlan, currentRank >= maxSort);

  const usageCards = [
    {
      label: 'Cửa hàng',
      caption: 'Chi nhánh đang quản lý',
      value: usage.shops,
      limit: currentPlan.maxShops,
      Icon: Building2,
    },
    {
      label: 'Sản phẩm',
      caption: 'Đồng hồ đã đăng bán',
      value: usage.products,
      limit: currentPlan.maxProducts,
      Icon: Package,
    },
  ];

  const headlineStats = [
    {
      label: 'Gói hiện tại',
      value: currentPlan.name,
      detail: isExpired ? 'Cần gia hạn để tiếp tục dùng' : 'Đang hoạt động',
      Icon: CurrentIcon,
    },
    {
      label: 'Thời hạn',
      value: isExpired ? 'Hết hạn' : `${daysRemaining} ngày`,
      detail: `Đến ${formatDate(subscription.expiresAt)}`,
      Icon: Clock3,
    },
    {
      label: 'Mức sử dụng',
      value: `${usage.products}/${formatLimit(currentPlan.maxProducts)}`,
      detail: `${usage.shops}/${formatLimit(currentPlan.maxShops)} cửa hàng`,
      Icon: Package,
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#F6F4EF] font-sans text-[#17140F]">
      <div className="mx-auto max-w-7xl p-5 md:p-8">
        <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7434]">
              Tài khoản đối tác
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
              Quản lý gói dịch vụ
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">
              Theo dõi thời hạn, quota cửa hàng/sản phẩm và nâng cấp gói bán hàng trên TrueWrist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#ded7ca] bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] shadow-sm transition hover:border-[#B8924A] hover:text-[#9A7434] lg:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới dữ liệu
          </button>
        </header>

        {isExpired && currentPlan.price > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-xs leading-5 text-red-700">
              <span className="font-bold">Gói trả phí của bạn đã hết hạn.</span>{' '}
              Vui lòng gửi yêu cầu gia hạn. Sau <span className="font-bold">3 ngày</span> cửa hàng sẽ tạm bị khóa,
              và sau <span className="font-bold">7 ngày</span> tài khoản sẽ được chuyển về người dùng thường.
            </p>
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {headlineStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-[#e5e0d8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
                  <p className="mt-2 font-display text-xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{stat.detail}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B8924A]/10 text-[#B8924A]">
                  <stat.Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_430px]">
          <article className="relative overflow-hidden rounded-3xl bg-[#17140F] p-6 text-white shadow-luxe md:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B8924A]/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#B8924A] text-white shadow-lg shadow-[#B8924A]/20">
                  <CurrentIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-3xl font-bold">{currentPlan.name}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${
                        isExpired
                          ? 'bg-red-500/20 text-red-200 ring-1 ring-red-400/30'
                          : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/20'
                      }`}
                    >
                      {isExpired ? 'Đã hết hạn' : 'Đang hoạt động'}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    {currentPlan.description}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left backdrop-blur sm:min-w-48 lg:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Chi phí gói</p>
                <p className="mt-1 font-display text-2xl font-bold text-[#D5B46B]">
                  {formatPlanPrice(currentPlan.price)}
                </p>
                <p className="text-[10px] text-white/40">{currentPlan.durationDays} ngày / chu kỳ</p>
              </div>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <CalendarDays className="mb-3 h-4 w-4 text-[#D5B46B]" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Ngày đăng ký</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(subscription.registeredAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <Clock3 className="mb-3 h-4 w-4 text-[#D5B46B]" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Ngày hết hạn</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(subscription.expiresAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <ShieldCheck className="mb-3 h-4 w-4 text-[#D5B46B]" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Trạng thái gia hạn</p>
                <p className="mt-1 text-sm font-semibold">
                  {subscription.autoRenew ? 'Tự động gia hạn' : 'Gia hạn thủ công'}
                </p>
              </div>
            </div>

            <div className="relative mt-7 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Chu kỳ sử dụng</p>
                  <p className="mt-1 text-sm text-white/70">
                    {isExpired ? 'Gói đã hết hạn, hãy gia hạn để tiếp tục bán hàng.' : `Còn ${daysRemaining} ngày trong chu kỳ hiện tại.`}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#D5B46B]">
                  {Math.round(periodProgress)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${isExpired ? 'bg-red-400' : 'bg-[#B8924A]'}`}
                  style={{ width: `${periodProgress}%` }}
                />
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-[#ded7ca] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A7434]">Quota sử dụng</p>
                <h3 className="mt-1 font-display text-xl font-bold">Năng lực hiện tại</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Theo dõi số cửa hàng và sản phẩm đã dùng trong gói hiện tại.
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#17140F] text-white">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {usageCards.map((item) => {
                const unlimited = item.limit < 0;
                const percent = getUsagePercent(item.value, item.limit);
                const remaining = unlimited
                  ? 'Không giới hạn'
                  : `${formatCount(Math.max(0, item.limit - item.value))} còn lại`;
                const isHighUsage = !unlimited && percent >= 90;

                return (
                  <div key={item.label} className="rounded-3xl border border-[#e8e2d9] bg-[#FAF9F7] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#B8924A] shadow-sm">
                          <item.Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-sm font-bold">
                            {formatCount(item.value)} / {formatLimit(item.limit)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{item.caption}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isHighUsage
                            ? 'bg-red-50 text-red-600'
                            : 'bg-[#B8924A]/10 text-[#9A7434]'
                        }`}
                      >
                        {unlimited ? '∞' : `${Math.round(percent)}%`}
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${isHighUsage ? 'bg-red-500' : 'bg-[#B8924A]'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{remaining}</span>
                      <span>{unlimited ? 'Không giới hạn quota' : 'Giới hạn gói'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-[#eadfca] bg-[#B8924A]/5 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8924A]" />
                <p className="text-[11px] leading-5 text-gray-600">
                  Gói không tự động gia hạn. Bạn có thể gia hạn gói hiện tại hoặc nâng cấp lên gói cao hơn bất cứ lúc nào.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A7434]">Nâng cấp</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Chọn gói phù hợp với quy mô shop</h2>
              <p className="mt-1 text-xs text-gray-500">
                So sánh quyền lợi, giới hạn vận hành và chi phí trước khi nâng cấp.
              </p>
            </div>
            <div className="rounded-full border border-[#e5e0d8] bg-white px-4 py-2 text-[11px] font-semibold text-gray-500 shadow-sm">
              Giá đã bao gồm cấu hình bán hàng và AR Try-On
            </div>
          </div>

          {pendingRequest && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#B8924A]/40 bg-[#B8924A]/5 p-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#B8924A]" />
              <p className="text-xs leading-5 text-[#7a5e28]">
                <span className="font-bold">Yêu cầu gói “{pendingRequest.planName}” đang chờ quản trị viên duyệt.</span>{' '}
                Chưa có cổng thanh toán nên gói sẽ được kích hoạt sau khi admin xác nhận. Bạn không thể gửi yêu cầu mới khi yêu cầu này còn chờ xử lý.
              </p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            {subscription.plans.map((plan) => {
              const isTop = plan.sortOrder >= maxSort;
              const Icon = planIcon(plan, isTop);
              const isCurrent = plan.code === subscription.plan;
              // While the plan is still active, the current plan and any lower plan
              // are locked — only higher tiers can be requested (until expiry).
              const blockedWhileActive = !isExpired && plan.sortOrder <= currentRank;
              const isPendingPlan = pendingRequest?.planCode === plan.code;
              const actionLabel = isPendingPlan
                ? 'Đang chờ duyệt'
                : isCurrent
                  ? (isExpired ? 'Gia hạn gói' : 'Đang sử dụng')
                  : plan.sortOrder > currentRank || isExpired
                    ? 'Nâng cấp ngay'
                    : 'Gói thấp hơn';
              const isPremium = isTop;
              const isBusy = upgradingPlan === plan.code;

              return (
                <article
                  key={plan.code}
                  className={`relative flex min-h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-luxe ${
                    isCurrent
                      ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/15'
                      : plan.recommended
                        ? 'border-2 border-[#B8924A]'
                        : 'border border-[#ded7ca]'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Check className="h-3 w-3" /> Gói đang sử dụng
                    </span>
                  )}
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 ${
                      isCurrent ? 'bg-emerald-500' : isPremium ? 'bg-[#17140F]' : 'bg-[#B8924A]'
                    }`}
                  />

                  <div className="mb-5 flex min-h-7 flex-wrap items-center gap-2">
                    {plan.recommended && (
                      <span className="rounded-full bg-[#B8924A] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                        Đề xuất
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${planTone(isTop, plan.price === 0)}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      <p className="mt-1 text-[11px] leading-5 text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <span className="font-display text-3xl font-bold">{formatPlanPrice(plan.price)}</span>
                      <span className="pb-1 text-xs text-gray-400">/ {plan.durationDays} ngày</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[#FAF9F7] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Cửa hàng</p>
                      <p className="mt-1 text-sm font-bold">{formatLimit(plan.maxShops)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#FAF9F7] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Sản phẩm</p>
                      <p className="mt-1 text-sm font-bold">{formatLimit(plan.maxProducts)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#FAF9F7] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Chu kỳ</p>
                      <p className="mt-1 text-sm font-bold">{plan.durationDays} ngày</p>
                    </div>
                  </div>

                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[#e5e0d8]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quyền lợi</span>
                    <span className="h-px flex-1 bg-[#e5e0d8]" />
                  </div>

                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B8924A]" />
                        <span className="leading-5">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => void handleUpgrade(plan)}
                    disabled={blockedWhileActive || upgradingPlan !== null || pendingRequest !== null}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isPremium
                        ? 'bg-[#17140F] text-white hover:bg-black'
                        : isCurrent
                          ? 'bg-[#B8924A]/10 text-[#9A7434] hover:bg-[#B8924A]/15'
                          : 'border border-[#B8924A] text-[#9A7434] hover:bg-[#B8924A]/5'
                    }`}
                  >
                    {isBusy ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      <Clock3 className="h-4 w-4" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4" />
                    )}
                    {isBusy ? 'Đang cập nhật…' : actionLabel}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
