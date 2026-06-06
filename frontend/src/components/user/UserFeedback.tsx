import React, { useEffect, useState } from 'react';
import { MessageSquare, Store, Globe, Star, Check, Send } from 'lucide-react';
import { shopApi, feedbackApi, ApiError } from '../../api';
import type { Shop } from '../../api';
import { Field, TextInput, TextArea, Select, SegmentedControl } from '../ui/Field';
import { toast } from '../../store/useToast';

interface UserFeedbackProps {
  onBackToCatalog: () => void;
}

const SHOP_TOPICS = ['Thái độ phục vụ', 'Chất lượng sản phẩm', 'Giá & khuyến mãi', 'Quy trình đặt lịch', 'Khác'];
const WEB_TOPICS = ['Trải nghiệm thử AR', 'Mô hình 3D', 'Tốc độ & hiệu năng', 'Giao diện & dễ dùng', 'Đề xuất tính năng', 'Khác'];

export default function UserFeedback({ onBackToCatalog }: UserFeedbackProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [target, setTarget] = useState<'shop' | 'website'>('shop');
  const [hoverRating, setHoverRating] = useState(0);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shopId: '',
    rating: 5,
    topic: '',
    message: '',
    name: '',
    contact: '',
  });

  useEffect(() => {
    let cancelled = false;
    shopApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setShops(list);
        setForm((prev) => ({ ...prev, shopId: list[0]?.id || '' }));
      })
      .catch(() => { if (!cancelled) setShops([]); });
    return () => { cancelled = true; };
  }, []);

  const switchTarget = (t: 'shop' | 'website') => {
    setTarget(t);
    setForm((prev) => ({ ...prev, topic: '' }));
  };

  const topics = target === 'shop' ? SHOP_TOPICS : WEB_TOPICS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) {
      toast.error('Vui lòng nhập họ tên và nội dung góp ý');
      return;
    }
    if (target === 'shop' && !form.shopId) {
      toast.error('Vui lòng chọn cửa hàng bạn muốn góp ý');
      return;
    }
    const shop = target === 'shop' ? shops.find((s) => s.id === form.shopId) : null;
    setSubmitting(true);
    try {
      await feedbackApi.create({
        target,
        shopId: shop?.id,
        shopName: shop?.name,
        rating: form.rating,
        topic: form.topic,
        message: form.message,
        name: form.name,
        contact: form.contact,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ shopId: shops[0]?.id || '', rating: 5, topic: '', message: '', name: '', contact: '' });
    setTarget('shop');
    setSuccess(false);
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2">
            <MessageSquare className="h-4 w-4" /> Góp ý & Phản hồi
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">Ý kiến của bạn giúp chúng tôi tốt hơn</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Gửi góp ý về một cửa hàng cụ thể hoặc về trải nghiệm website TrueWrist. Chúng tôi đọc mọi phản hồi.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#e5e0d8] shadow-sm overflow-hidden">
          {success ? (
            <div className="text-center py-16 px-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mb-4 animate-fade-in">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Cảm ơn góp ý của bạn!</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
                Phản hồi đã được ghi nhận{target === 'shop' ? ' và chuyển tới cửa hàng' : ''}. Chúng tôi rất trân trọng ý kiến của bạn.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={resetForm} className="border border-[#e5e0d8] text-[#17140F] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#F6F4EF] transition">
                  Gửi góp ý khác
                </button>
                <button onClick={onBackToCatalog} className="bg-[#17140F] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-black transition">
                  Về trang sản phẩm
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Card header */}
              <div className="bg-[#17140F] text-white px-6 py-5">
                <h2 className="font-display text-lg font-bold">Gửi góp ý</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Chọn đối tượng bạn muốn góp ý bên dưới</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Target: shop vs website */}
                <SegmentedControl
                  value={target}
                  onChange={(v) => switchTarget(v as 'shop' | 'website')}
                  options={[
                    { value: 'shop', label: 'Góp ý cửa hàng' },
                    { value: 'website', label: 'Góp ý website' },
                  ]}
                />

                {/* Visual context badge */}
                <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F4EF] border border-[#e5e0d8] px-3.5 py-2.5 text-xs text-gray-600">
                  <span className="text-[#B8924A]">
                    {target === 'shop' ? <Store className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  </span>
                  {target === 'shop'
                    ? 'Góp ý về dịch vụ, sản phẩm của một cửa hàng cụ thể.'
                    : 'Góp ý về trải nghiệm chung của website TrueWrist.'}
                </div>

                {/* Shop selector (only for shop feedback) */}
                {target === 'shop' && (
                  <Field label="Cửa hàng" required>
                    <Select value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })}>
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} · {s.address}</option>
                      ))}
                    </Select>
                  </Field>
                )}

                {/* Star rating */}
                <Field label={target === 'shop' ? 'Đánh giá cửa hàng' : 'Đánh giá website'} required>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, rating: n })}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition active:scale-90"
                        aria-label={`${n} sao`}
                      >
                        <Star className={`h-7 w-7 ${n <= (hoverRating || form.rating) ? 'text-[#B8924A] fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-gray-500">{form.rating}/5</span>
                  </div>
                </Field>

                {/* Topic */}
                <Field label="Chủ đề" hint="Giúp chúng tôi phân loại góp ý của bạn.">
                  <Select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                    <option value="">— Chọn chủ đề —</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>

                {/* Message */}
                <Field label="Nội dung góp ý" required>
                  <TextArea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={target === 'shop'
                      ? 'Chia sẻ trải nghiệm của bạn với cửa hàng này...'
                      : 'Điều gì khiến bạn thích/chưa hài lòng với website? Đề xuất tính năng?...'}
                  />
                </Field>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Họ và tên" required className="col-span-2 sm:col-span-1">
                    <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" />
                  </Field>
                  <Field label="Email / SĐT" hint="Không bắt buộc — để chúng tôi phản hồi lại." className="col-span-2 sm:col-span-1">
                    <TextInput value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="email hoặc 09xx xxx xxx" />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#17140F] text-white py-3.5 rounded-xl font-bold hover:bg-black transition shadow-md active:scale-[0.99] inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" /> {submitting ? 'Đang gửi…' : 'Gửi góp ý'}
                </button>
                <p className="text-[10px] text-gray-400 text-center leading-snug">
                  Góp ý của bạn được bảo mật và chỉ dùng để cải thiện chất lượng dịch vụ.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
