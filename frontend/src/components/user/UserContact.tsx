import React, { useState, useEffect } from 'react';
import { getDbWatches, addDbLead, getShopForWatch } from '../../utils/mockData';
import { Field, TextInput, TextArea, Select, SegmentedControl } from '../ui/Field';

interface UserContactProps {
  watchIdForQuery?: string | null;
  onBackToCatalog: () => void;
}

export default function UserContact({ watchIdForQuery, onBackToCatalog }: UserContactProps) {
  const [shop, setShop] = useState<any>(null); // the shop that sells the chosen product
  const [watches, setWatches] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'contact' as 'contact' | 'appointment',
    watchId: '',
    showroomId: '',
    date: '',
    time: '09:30',
    message: ''
  });
  const [success, setSuccess] = useState(false);

  // Load watches and derive the shop from the chosen product.
  useEffect(() => {
    const wList = getDbWatches();
    setWatches(wList);

    const initialWatchId = watchIdForQuery || wList[0]?.id || '';
    const initialShop = getShopForWatch(initialWatchId);
    setShop(initialShop);

    setForm((prev) => ({
      ...prev,
      watchId: initialWatchId,
      showroomId: initialShop?.id || '',
      message: watchIdForQuery
        ? `Tôi đang quan tâm đến mẫu ${wList.find((w) => w.id === watchIdForQuery)?.name}. Nhờ shop tư vấn thêm.`
        : 'Tôi muốn được tư vấn thêm về sản phẩm. Cảm ơn shop.'
    }));
  }, [watchIdForQuery]);

  // When the chosen product changes, switch to its shop.
  const handleWatchChange = (selectedId: string) => {
    const nextShop = getShopForWatch(selectedId);
    setShop(nextShop);
    setForm((prev) => ({
      ...prev,
      watchId: selectedId,
      showroomId: nextShop?.id || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Vui lòng điền các trường bắt buộc');
      return;
    }

    const selectedWatch = watches.find((w) => w.id === form.watchId) || watches[0];
    const selectedShop = getShopForWatch(form.watchId) || shop;

    addDbLead({
      name: form.name,
      phone: form.phone,
      email: form.email,
      watchId: selectedWatch.id,
      watchName: selectedWatch.name,
      watchBrand: selectedWatch.brand,
      shopId: selectedShop?.id,
      shopName: selectedShop?.name,
      type: form.type,
      date: form.type === 'appointment' ? form.date : undefined,
      time: form.type === 'appointment' ? form.time : undefined,
      message: form.message,
      channel: 'form',
      hasTriedOn: false
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      // Reset fields
      setForm({
        name: '',
        phone: '',
        email: '',
        type: 'contact',
        watchId: watches[0]?.id || '',
        showroomId: shop?.id || '',
        date: '',
        time: '09:30',
        message: 'Tư vấn thông tin sản phẩm đồng hồ cao cấp.'
      });
    }, 2500);
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2 block">
            Liên hệ trực tiếp shop đăng bán
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">
            Gửi yêu cầu tư vấn tới shop
          </h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Chọn sản phẩm bạn quan tâm — yêu cầu sẽ được gửi đến đúng shop đăng bán. Bạn cũng có thể gọi/nhắn tin trực tiếp cho shop bên dưới.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: the shop selling the chosen product (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display text-lg font-bold border-b border-[#e5e0d8] pb-2 text-[#16162A] flex items-center gap-2">
              <span className="text-[#B8924A]">🏬</span> Shop đăng bán sản phẩm này
            </h2>

            {shop && (
              <div className="bg-white rounded-3xl overflow-hidden border border-[#e5e0d8] shadow-sm">
                {/* Shop banner */}
                <div className="relative h-40">
                  <img src={shop.image} onError={(e)=>{const t=e.currentTarget; if(t.src.indexOf("1523275335684")===-1) t.src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200";}} alt={shop.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-5 text-white">
                    <span className="text-[10px] uppercase tracking-wider text-[#B8924A] font-bold">🏬 Cửa hàng chính hãng</span>
                    <h3 className="font-display text-lg font-bold">{shop.name}</h3>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="text-[#B8924A] font-bold">★ {shop.rating}</span>
                    <span>({shop.reviewCount} đánh giá)</span>
                    <span>·</span>
                    <span>📍 {shop.address}</span>
                  </div>
                  {shop.description && <p className="text-xs text-gray-600 leading-relaxed mb-4">{shop.description}</p>}

                  <div className="grid sm:grid-cols-2 gap-3 text-xs mb-5">
                    <div className="bg-[#F6F4EF] p-3 rounded-xl border border-gray-100">
                      <p className="text-gray-400 font-bold mb-0.5 uppercase tracking-wide text-[9px]">Chủ shop</p>
                      <p className="font-semibold text-gray-700">{shop.manager}</p>
                    </div>
                    <div className="bg-[#F6F4EF] p-3 rounded-xl border border-gray-100">
                      <p className="text-gray-400 font-bold mb-0.5 uppercase tracking-wide text-[9px]">Giờ làm việc</p>
                      <p className="font-semibold text-gray-700">{shop.hours}</p>
                    </div>
                  </div>

                  {/* Specialties */}
                  {shop.services?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {shop.services.map((s: string, i: number) => (
                        <span key={i} className="text-[10px] bg-[#F6F4EF] border border-[#e5e0d8] px-2.5 py-1 rounded-full text-gray-600">✓ {s}</span>
                      ))}
                    </div>
                  )}

                  {/* Self-serve contact actions */}
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="flex-1 min-w-[110px] bg-[#16162A] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-black transition text-center shadow">📞 Gọi shop</a>
                    <a href={shop.zalo} target="_blank" rel="noreferrer" className="flex-1 min-w-[110px] border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center">💬 Chat Zalo</a>
                    <a href={shop.messenger} target="_blank" rel="noreferrer" className="flex-1 min-w-[110px] border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center">🌐 Messenger</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Columns: Forms (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-[#e5e0d8] shadow-sm overflow-hidden">
              {success ? (
                <div className="text-center py-20 px-6">
                  <div className="h-16 w-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-3xl mb-4 animate-fade-in">✓</div>
                  <h3 className="font-display text-xl font-bold mb-2">Đã gửi yêu cầu thành công!</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Cảm ơn quý khách. Yêu cầu đã được chuyển tới shop. Chúng tôi sẽ phản hồi qua Zalo/SĐT đã cung cấp trong thời gian sớm nhất.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Card header */}
                  <div className="bg-[#16162A] text-white px-6 py-5">
                    <h2 className="font-display text-lg font-bold">Gửi yêu cầu tư vấn</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Phản hồi trong vòng 15 phút trong giờ làm việc</p>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Request type */}
                    <SegmentedControl
                      value={form.type}
                      onChange={(v) => setForm({ ...form, type: v as 'contact' | 'appointment' })}
                      options={[
                        { value: 'contact', label: 'Tư vấn sản phẩm' },
                        { value: 'appointment', label: 'Đặt lịch xem' },
                      ]}
                    />

                    {/* Personal details */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Họ và tên" required className="col-span-2 sm:col-span-1">
                        <TextInput
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Nguyễn Văn A"
                        />
                      </Field>
                      <Field label="Số điện thoại" required className="col-span-2 sm:col-span-1">
                        <TextInput
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="09xx xxx xxx"
                        />
                      </Field>
                    </div>

                    <Field label="Email" hint="Không bắt buộc — để nhận báo giá chi tiết qua email.">
                      <TextInput
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="your.email@gmail.com"
                      />
                    </Field>

                    {/* Selection */}
                    <Field label="Sản phẩm quan tâm">
                      <Select value={form.watchId} onChange={(e) => handleWatchChange(e.target.value)}>
                        {watches.map((w) => (
                          <option key={w.id} value={w.id}>[{w.brand}] {w.name}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Shop phản hồi" hint="Tự động theo sản phẩm bạn chọn.">
                      <div className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3.5 py-2.5 text-sm font-semibold text-[#16162A] flex items-center gap-2">
                        <span className="text-[#B8924A]">🏬</span> {shop?.name || '—'}
                      </div>
                    </Field>

                    {/* Appointment slot */}
                    {form.type === 'appointment' && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <Field label="Ngày hẹn" required>
                          <TextInput
                            type="date"
                            required
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                          />
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

                    {/* Message */}
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
                      className="w-full bg-[#16162A] text-white py-3.5 rounded-xl font-bold hover:bg-black transition shadow-md active:scale-[0.99]"
                    >
                      Gửi thông tin liên hệ
                    </button>
                    <p className="text-[10px] text-gray-400 text-center leading-snug">
                      Bằng việc gửi, bạn đồng ý để shop liên hệ tư vấn. Thông tin được bảo mật.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
