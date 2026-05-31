import React, { useState } from 'react';
import { Zap, Crown, Building2, Users, CircleDollarSign, TrendingUp, Pencil, X, Check, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number; // VND / month, 0 = free
  subscribers: number;
  active: boolean;
  popular: boolean;
  Icon: typeof Zap;
  box: string;
  features: string[];
}

const INITIAL_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Thoải mái khám phá, không cần trả phí',
    price: 0,
    subscribers: 1280,
    active: true,
    popular: false,
    Icon: Zap,
    box: 'bg-[#16162A]/5 text-[#16162A]',
    features: ['Duyệt bộ sưu tập + bộ lọc', 'Xem 3D 360°', 'Thử AR 5 lượt/ngày', 'Lưu yêu thích ≤ 10 mẫu'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Cho tín đồ đồng hồ không bỏ lỡ mẫu nào',
    price: 49000,
    subscribers: 342,
    active: true,
    popular: true,
    Icon: Crown,
    box: 'bg-[#1C9FD9]/15 text-[#1C9FD9]',
    features: ['Tất cả tính năng Free +', 'Thử AR không giới hạn', 'Lưu yêu thích không giới hạn', 'Cảnh báo giảm giá', 'Badge "Pro"'],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Cho chủ shop & đại lý đồng hồ',
    price: 199000,
    subscribers: 28,
    active: true,
    popular: false,
    Icon: Building2,
    box: 'bg-[#16162A] text-white',
    features: ['Tất cả tính năng Pro +', 'Đăng bán không giới hạn', 'Dashboard phân tích', 'Quản lý nhiều cửa hàng', 'Badge "Đã xác minh"'],
  },
];

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Plan | null>(null);

  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);
  const mrr = plans.reduce((s, p) => s + p.price * p.subscribers, 0);
  const paidSubs = plans.filter((p) => p.price > 0).reduce((s, p) => s + p.subscribers, 0);
  const paidRate = totalSubs ? Math.round((paidSubs / totalSubs) * 100) : 0;

  const openEdit = (plan: Plan) => {
    setDraft({ ...plan });
    setEditingId(plan.id);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setPlans((prev) => prev.map((p) => (p.id === draft.id ? { ...draft, price: Number(draft.price) || 0 } : p)));
    setEditingId(null);
    setDraft(null);
  };

  const toggleActive = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const metrics = [
    { label: 'Tổng người đăng ký', val: totalSubs.toLocaleString('vi-VN'), sub: `${plans.length} gói đang vận hành`, Icon: Users, color: 'text-blue-600' },
    { label: 'Doanh thu định kỳ (MRR)', val: formatVND(mrr), sub: 'Ước tính theo số đăng ký', Icon: CircleDollarSign, color: 'text-[#1C9FD9]' },
    { label: 'Tỷ lệ trả phí', val: `${paidRate}%`, sub: `${paidSubs.toLocaleString('vi-VN')} người dùng trả phí`, Icon: TrendingUp, color: 'text-green-600' },
  ];

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Quản Lý Gói Dịch Vụ</h1>
        <p className="text-xs text-gray-500 mt-1">Cấu hình giá, tính năng và trạng thái mở bán của các gói Free / Pro / Business</p>
      </header>

      {/* Metric cards */}
      <section className="grid sm:grid-cols-3 gap-6 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#e5e0d8] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{m.label}</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#16162A] mb-1">{m.val}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">{m.sub}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-[#F6F4EF] flex items-center justify-center border border-gray-100 ${m.color}`}>
              <m.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Plans table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
        <h3 className="font-display text-sm font-bold mb-4 border-b border-[#e5e0d8] pb-3">Danh sách gói</h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Gói</th>
                <th className="py-3 px-4">Giá / tháng</th>
                <th className="py-3 px-4 text-center">Người đăng ký</th>
                <th className="py-3 px-4 text-center">Tỷ trọng</th>
                <th className="py-3 px-4 text-right">Doanh thu/tháng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const share = totalSubs ? Math.round((p.subscribers / totalSubs) * 100) : 0;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.box}`}>
                          <p.Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-display font-bold text-sm text-[#16162A] flex items-center gap-1.5">
                            {p.name}
                            {p.popular && (
                              <span className="inline-flex items-center gap-1 bg-[#1C9FD9] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"><Star className="h-2.5 w-2.5 fill-current" /> Phổ biến</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 max-w-[220px] truncate">{p.tagline}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#16162A]">{p.price === 0 ? 'Miễn phí' : formatVND(p.price)}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-700">{p.subscribers.toLocaleString('vi-VN')}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
                          <div className="h-full bg-[#1C9FD9]" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 w-8 text-right">{share}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#1C9FD9]">{p.price === 0 ? '—' : formatVND(p.price * p.subscribers)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleActive(p.id)}
                        className={`inline-flex items-center h-5 w-9 rounded-full transition relative ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={p.active ? 'Đang mở bán' : 'Đã tạm ẩn'}
                      >
                        <span className={`h-4 w-4 bg-white rounded-full shadow absolute top-0.5 transition ${p.active ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      <p className={`text-[9px] font-bold mt-1 ${p.active ? 'text-green-600' : 'text-gray-400'}`}>{p.active ? 'Mở bán' : 'Tạm ẩn'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1.5 bg-[#16162A] text-white hover:bg-black py-1.5 px-3 rounded-lg font-bold"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit modal */}
      {editingId && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e5e0d8] overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
            <form onSubmit={saveEdit}>
              <div className="bg-[#16162A] text-white px-6 py-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${draft.box}`}><draft.Icon className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-display text-lg font-bold">Chỉnh sửa gói {draft.name}</h2>
                    <p className="text-[11px] text-gray-400">Thay đổi sẽ áp dụng cho gói hiển thị ngoài trang giá</p>
                  </div>
                </div>
                <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white transition" aria-label="Đóng"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Tên gói</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#1C9FD9] focus:ring-2 focus:ring-[#1C9FD9]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={draft.tagline}
                    onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#1C9FD9] focus:ring-2 focus:ring-[#1C9FD9]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Giá / tháng (VND)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#1C9FD9] focus:ring-2 focus:ring-[#1C9FD9]/20 transition"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Đặt 0 để gói miễn phí.</p>
                </div>

                {/* Feature list (read-only preview) */}
                <div>
                  <label className="block text-gray-500 font-bold mb-1.5">Tính năng nổi bật</label>
                  <ul className="space-y-1.5 bg-[#F6F4EF] rounded-xl border border-gray-100 p-3">
                    {draft.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600"><Check className="h-3.5 w-3.5 text-[#1C9FD9] flex-shrink-0" /> {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between rounded-xl border border-[#e5e0d8] px-3.5 py-2.5">
                  <span className="font-bold text-gray-600">Đang mở bán</span>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, active: !draft.active })}
                    className={`inline-flex items-center h-5 w-9 rounded-full transition relative ${draft.active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`h-4 w-4 bg-white rounded-full shadow absolute top-0.5 transition ${draft.active ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#e5e0d8] px-3.5 py-2.5">
                  <span className="font-bold text-gray-600">Đánh dấu "Phổ biến nhất"</span>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, popular: !draft.popular })}
                    className={`inline-flex items-center h-5 w-9 rounded-full transition relative ${draft.popular ? 'bg-[#1C9FD9]' : 'bg-gray-300'}`}
                  >
                    <span className={`h-4 w-4 bg-white rounded-full shadow absolute top-0.5 transition ${draft.popular ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-[#16162A] text-white py-3 rounded-xl font-bold hover:bg-black transition shadow active:scale-[0.99]">
                    Lưu thay đổi
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-[#e5e0d8] text-gray-500 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                    Huỷ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
