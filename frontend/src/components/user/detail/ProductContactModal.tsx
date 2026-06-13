import { useEffect, useState, type FormEvent } from 'react';
import { Check, Mail, Store, X } from 'lucide-react';
import { leadApi, ApiError } from '../../../api';
import type { Shop, Watch, LeadType } from '../../../api';
import { toast } from '../../../store/useToast';
import { useSession } from '../../../auth/session';
import { Field, Select, SegmentedControl, TextArea, TextInput } from '../../ui/Field';

interface ProductContactModalProps {
  open: boolean;
  watch: Watch;
  shop: Shop | null;
  onClose: () => void;
}

export default function ProductContactModal({ open, watch, shop, onClose }: ProductContactModalProps) {
  const user = useSession((s) => s.user);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'contact' as LeadType,
    date: '',
    time: '09:30',
    message: '',
  });

  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setForm({
      // Pre-fill from the signed-in user's profile so they don't retype it.
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      type: 'contact',
      date: '',
      time: '09:30',
      message: `Tôi đang quan tâm đến mẫu ${watch.name}. Nhờ ${shop?.name || 'shop'} tư vấn thêm.`,
    });
  }, [open, shop?.name, watch.name, user?.name, user?.phone, user?.email]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop) {
      toast.error('Chưa có thông tin shop để gửi yêu cầu.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (form.type === 'appointment' && !form.date) {
      toast.error('Vui lòng chọn ngày hẹn.');
      return;
    }

    setSubmitting(true);
    try {
      await leadApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        watchId: watch.id,
        watchName: watch.name,
        watchBrand: watch.brand,
        shopId: shop.id,
        shopName: shop.name,
        type: form.type,
        date: form.type === 'appointment' ? form.date : undefined,
        time: form.type === 'appointment' ? form.time : undefined,
        message: form.message.trim(),
        channel: 'form',
        hasTriedOn: false,
      });
      setSuccess(true);
      toast.success('Đã gửi yêu cầu tới shop.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gửi yêu cầu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-3xl border border-[#e5e0d8] bg-white shadow-2xl animate-slide-up">
        {success ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold text-[#17140F]">Đã gửi yêu cầu thành công</h3>
            <p className="mx-auto mb-6 max-w-xs text-xs leading-relaxed text-gray-500">
              {shop?.name || 'Shop'} sẽ phản hồi qua số điện thoại hoặc email bạn cung cấp.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#17140F] px-8 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-start justify-between gap-3 bg-[#17140F] px-6 py-5 text-white">
              <div>
                <h2 className="font-display text-lg font-bold">Liên hệ tư vấn</h2>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <Store className="h-3.5 w-3.5 text-[#B8924A]" /> {shop?.name || 'Shop đồng hồ'}
                </p>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 transition hover:text-white" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3 rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-2.5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e5e0d8] bg-white">
                  <img src={watch.image} alt={watch.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{watch.brand}</p>
                  <p className="truncate text-xs font-bold text-[#17140F]">{watch.name}</p>
                </div>
              </div>

              <SegmentedControl
                value={form.type}
                onChange={(value) => setForm((prev) => ({ ...prev, type: value as LeadType }))}
                options={[
                  { value: 'contact', label: 'Tư vấn sản phẩm' },
                  { value: 'appointment', label: 'Đặt lịch xem' },
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Họ và tên" required className="col-span-2 sm:col-span-1">
                  <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" />
                </Field>
                <Field label="Số điện thoại" required className="col-span-2 sm:col-span-1">
                  <TextInput type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx xxx xxx" />
                </Field>
              </div>

              <Field label="Email" hint="Không bắt buộc, dùng để nhận báo giá chi tiết.">
                <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your.email@gmail.com" />
              </Field>

              {form.type === 'appointment' && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <Field label="Ngày hẹn" required>
                    <TextInput type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </Field>
                  <Field label="Khung giờ">
                    <Select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
                      <option value="09:30">09:30 sáng</option>
                      <option value="11:00">11:00 trưa</option>
                      <option value="14:30">14:30 chiều</option>
                      <option value="16:00">16:00 chiều</option>
                      <option value="19:30">19:30 tối</option>
                    </Select>
                  </Field>
                </div>
              )}

              <Field label="Lời nhắn" required>
                <TextArea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Nhu cầu tư vấn cụ thể hoặc lịch ghé thăm..."
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17140F] py-3.5 font-bold text-white shadow-md transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" /> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
              <p className="text-center text-[10px] leading-snug text-gray-400">
                Thông tin của bạn chỉ được dùng để shop liên hệ tư vấn và xác nhận lịch hẹn.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
