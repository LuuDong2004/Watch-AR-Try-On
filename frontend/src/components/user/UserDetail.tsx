import React, { useState, useEffect } from 'react';
import Watch3DViewer from '../watch/Watch3DViewer';
import { Field, TextInput, TextArea, Select } from '../ui/Field';
import { getDbWatches, addDbLead, getDbFavorites, toggleFavorite, getShowroomsForWatch } from '../../utils/mockData';

interface UserDetailProps {
  watchId: string;
  onOpenAR: (watchId: string) => void;
  onBack: () => void;
  onSelectWatch: (id: string) => void;
}

export default function UserDetail({ watchId, onOpenAR, onBack, onSelectWatch }: UserDetailProps) {
  const [watch, setWatch] = useState<any>(null);
  const [allWatches, setAllWatches] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isFavorited, setIsFavorited] = useState(false);
  // Media viewer: '3d' shows the 360° GLB viewer, a number shows that gallery photo.
  const [activeMedia, setActiveMedia] = useState<'3d' | number>(0);
  
  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    showroomId: '',
    date: '',
    time: '10:00',
    message: 'Tôi muốn đặt lịch xem trực tiếp mẫu đồng hồ này.'
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const list = getDbWatches();
    setAllWatches(list);
    const found = list.find((w) => w.id === watchId);
    if (found) {
      setWatch(found);
      // Default to the 3D viewer when a model exists, otherwise the first photo.
      setActiveMedia(found.hasAR && found.model ? '3d' : 0);
      const rooms = getShowroomsForWatch(watchId);
      setShowrooms(rooms);
      setBookingForm((prev) => ({
        ...prev,
        showroomId: rooms[0]?.id || ''
      }));
    }

    const favs = getDbFavorites();
    setIsFavorited(favs.includes(watchId));
  }, [watchId]);

  if (!watch) return <div className="text-center py-20 font-serif text-lg">Đang tải chi tiết đồng hồ...</div>;

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(n);
  };

  const handleFavoriteToggle = () => {
    const isNowFav = toggleFavorite(watch.id);
    setIsFavorited(isNowFav);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone) {
      alert('Vui lòng nhập Tên và Số điện thoại');
      return;
    }

    const selectedShowroom = showrooms.find((s) => s.id === bookingForm.showroomId) || showrooms[0];

    addDbLead({
      name: bookingForm.name,
      phone: bookingForm.phone,
      email: bookingForm.email,
      watchId: watch.id,
      watchName: watch.name,
      watchBrand: watch.brand,
      shopId: selectedShowroom.id,
      shopName: selectedShowroom.name,
      type: 'appointment',
      date: bookingForm.date,
      time: bookingForm.time,
      message: bookingForm.message,
      channel: 'form',
      hasTriedOn: false
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingOpen(false);
      setBookingSuccess(false);
      // Reset form
      setBookingForm({
        name: '',
        phone: '',
        email: '',
        showroomId: showrooms[0]?.id || '',
        date: '',
        time: '10:00',
        message: 'Tôi muốn đặt lịch xem trực tiếp mẫu đồng hồ này.'
      });
    }, 2500);
  };

  // Recommendations
  const recommendations = allWatches.filter((w) => w.id !== watch.id).slice(0, 3);

  // Mock community try-on gallery images
  const communityPhotos = [
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=300',
  ];

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#B8924A] transition mb-6"
        >
          <span>← Quay lại Catalog</span>
        </button>

        {/* Product Details Section */}
        <section className="grid md:grid-cols-2 gap-8 items-start bg-white rounded-3xl p-6 md:p-8 border border-[#e5e0d8] shadow-sm">
          {/* Left Column: Media (3D viewer + photo gallery) */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#F6F4EF] rounded-2xl p-4 relative overflow-hidden border border-[#e5e0d8] h-[380px] flex items-center justify-center">
              {activeMedia === '3d' && watch.model ? (
                <>
                  <Watch3DViewer modelUrl={watch.model} variant={watch.variant} height={350} />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-[#F6F4EF] text-[10px] px-3 py-1 rounded-full font-medium pointer-events-none">
                    🖱️ Nhấn và kéo chuột để xoay 360°
                  </div>
                </>
              ) : (
                <img
                  src={(watch.gallery && watch.gallery[activeMedia as number]) || watch.image}
                  alt={watch.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              )}
            </div>

            {/* Thumbnail strip: optional 3D tile + gallery photos */}
            <div className="flex gap-3 justify-center flex-wrap">
              {watch.hasAR && watch.model && (
                <button
                  onClick={() => setActiveMedia('3d')}
                  className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 transition flex items-center justify-center bg-[#16162A] text-white ${
                    activeMedia === '3d' ? 'border-[#B8924A] ring-2 ring-[#B8924A]/30' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title="Xem mô hình 3D"
                >
                  <span className="text-[9px] font-bold tracking-wider text-center leading-tight">360°<br/>3D</span>
                </button>
              )}
              {(watch.gallery || [watch.image]).map((src: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveMedia(idx)}
                  className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition ${
                    activeMedia === idx ? 'border-[#B8924A] ring-2 ring-[#B8924A]/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Specifications & Checkout Alternatives */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-1">
              {watch.brand}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-2">
              {watch.name}
            </h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 bg-[#B8924A]/10 px-2 py-0.5 rounded-full">
                <span className="text-[#B8924A] text-xs">★</span>
                <span className="text-xs font-bold text-[#B8924A]">{watch.rating}</span>
              </div>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500">{watch.reviewCount} lượt đánh giá thực tế</span>
            </div>

            {/* Price Tags */}
            <div className="flex items-baseline gap-3 mb-6 border-b border-[#e5e0d8] pb-4">
              <span className="text-2xl font-bold text-[#16162A]">{formatVND(watch.price)}</span>
              {watch.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatVND(watch.originalPrice)}
                </span>
              )}
              <span className="ml-2 bg-[#B8924A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {watch.hasAR ? 'Đeo thử AR' : 'Ảnh thật 2D'}
              </span>
            </div>

            {/* Call To Actions */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Thử AR Button — only when a real 3D model is available */}
              {watch.hasAR ? (
                <button
                  onClick={() => onOpenAR(watch.id)}
                  className="w-full bg-[#16162A] hover:bg-black text-white py-4 rounded-full font-semibold transition flex items-center justify-center gap-2 shadow-md border border-[#B8924A]/30 active:scale-[0.99]"
                >
                  <span className="text-lg">✨</span> Thử Đeo AR Trên Cổ Tay Ngay
                </button>
              ) : (
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full bg-[#16162A] hover:bg-black text-white py-4 rounded-full font-semibold transition flex items-center justify-center gap-2 shadow-md border border-[#B8924A]/30 active:scale-[0.99]"
                >
                  <span className="text-lg">✉️</span> Liên Hệ Shop Để Mua
                </button>
              )}

              {/* Save Favorites */}
              <button
                onClick={handleFavoriteToggle}
                className={`w-full py-3 rounded-full font-semibold transition flex items-center justify-center gap-2 border ${
                  isFavorited
                    ? 'border-[#B8924A] bg-[#B8924A]/5 text-[#B8924A]'
                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                }`}
              >
                <span>{isFavorited ? '♥ Đã Lưu Vào Bộ Yêu Thích' : '♡ Lưu Vào Yêu Thích'}</span>
              </button>
            </div>

            {/* SHOP ĐĂNG BÁN Block */}
            <div className="bg-[#F6F4EF] p-6 rounded-3xl border border-[#e5e0d8] shadow-sm">
              <h3 className="font-display text-sm font-bold text-[#16162A] mb-3 flex items-center gap-1.5 border-b border-[#e5e0d8] pb-2">
                <span>🏬 SHOP ĐĂNG BÁN SẢN PHẨM NÀY</span>
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Liên hệ trực tiếp shop bên dưới để được tư vấn, báo giá và chốt đơn. Bạn có thể gọi điện, nhắn Zalo/Messenger hoặc gửi yêu cầu tư vấn.
              </p>

              {/* Shop card */}
              <div className="space-y-4 mb-5">
                {showrooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow transition duration-300">
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-500"
                      />
                      <span className="absolute bottom-2 left-2 bg-[#16162A]/85 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                        🏬 Shop chính hãng
                      </span>
                    </div>

                    <div className="p-4 text-xs">
                      <h4 className="font-display text-sm font-bold text-[#16162A] mb-1">{room.name}</h4>
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        {room.rating && <span className="text-[#B8924A] font-bold">★ {room.rating}</span>}
                        <span>· 📍 {room.address}</span>
                      </div>

                      {/* Owner info */}
                      <div className="border-t border-gray-100 pt-2.5 mb-3 space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chủ shop</p>
                        <p className="font-semibold text-gray-700">{room.manager}</p>
                        <p className="text-gray-500 font-mono text-[10px]">{room.email}</p>
                      </div>

                      {/* Commitments */}
                      <div className="border-t border-gray-100 pt-2.5 mb-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Cam kết của shop</p>
                        <ul className="space-y-1 text-gray-600">
                          {room.services.map((service: string, sIdx: number) => (
                            <li key={sIdx} className="flex items-start gap-1">
                              <span className="text-[#B8924A] font-bold mt-0.5">✓</span>
                              <span className="leading-relaxed">{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex gap-2">
                        <a
                          href={`tel:${room.phone.replace(/\s/g, '')}`}
                          className="flex-1 bg-[#16162A] text-white py-2.5 rounded-xl text-center font-bold text-[10px] hover:bg-black transition shadow-sm active:scale-95"
                        >
                          📞 Gọi shop
                        </a>
                        <a
                          href={room.zalo}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl text-center font-bold text-[10px] hover:bg-[#B8924A]/5 transition active:scale-95"
                        >
                          💬 Nhắn Zalo
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Send inquiry button */}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-[#B8924A] hover:bg-[#a6803f] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>✉️ Gửi Yêu Cầu Tư Vấn Tới Shop</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab info (Mô tả, Thông số, Đánh giá) */}
        <section className="mt-8 bg-white rounded-3xl p-6 md:p-8 border border-[#e5e0d8] shadow-sm">
          {/* Tab buttons */}
          <div className="flex border-b border-[#e5e0d8] mb-6 text-sm">
            {[
              ['desc', 'Mô tả chi tiết'],
              ['specs', 'Thông số kỹ thuật'],
              ['reviews', 'Ý kiến khách hàng']
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-6 font-semibold transition border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-[#B8924A] text-[#B8924A]'
                    : 'border-transparent text-gray-500 hover:text-[#16162A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {activeTab === 'desc' && (
            <div className="text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p className="mb-4">{watch.description}</p>
              <p>Mỗi tác phẩm từ thương hiệu đều được lắp ráp tỉ mỉ bởi các nghệ nhân chế tác đồng hồ Thụy Sĩ dày dặn kinh nghiệm. Thừa hưởng tinh hoa cơ khí hàng trăm năm kết hợp với phong cách đương đại lịch lãm, đây không đơn thuần là cỗ máy đo thời gian mà là tuyên ngôn sống cho chủ nhân sở hữu.</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl">
              <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm border-t border-gray-100 pt-3">
                {Object.entries(watch.specs || {}).map(([key, val]: any) => (
                  <div key={key} className="contents border-b border-gray-50">
                    <dt className="text-gray-400 py-1.5 border-b border-gray-100">{key}</dt>
                    <dd className="text-gray-900 font-medium py-1.5 border-b border-gray-100">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-[#F6F4EF] p-4 rounded-2xl border border-[#e5e0d8] flex items-center justify-between text-sm">
                <div>
                  <span className="text-xl font-bold text-[#16162A]">{watch.rating}</span>
                  <span className="text-gray-400 text-xs ml-1">trên 5.0</span>
                </div>
                <div className="text-[#B8924A] text-xs">★★★★★</div>
              </div>

              {[
                { name: 'Hoàng Long', rate: 5, date: '25/05/2026', comment: 'Đã ướm thử bằng AR trên web thấy vừa vặn, sau đó liên hệ shop nhận hàng liền. Dịch vụ tuyệt vời, đồng hồ đẹp hơn trên ảnh nhiều!' },
                { name: 'Quốc Bảo', rate: 5, date: '18/05/2026', comment: 'Chức năng xoay 3D xem rõ từng góc cạnh niềng và cọc số sapphire. Model cao cấp rất đáng tiền.' }
              ].map((rev, idx) => (
                <div key={idx} className="border-b border-[#e5e0d8] pb-4">
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-[#16162A]">{rev.name}</span>
                    <span className="text-gray-400">{rev.date}</span>
                  </div>
                  <div className="text-[#B8924A] text-[10px] mb-1.5">{'★'.repeat(rev.rate)}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Khách hàng đã đeo thử AR Gallery */}
        <section className="mt-8 bg-white rounded-3xl p-6 md:p-8 border border-[#e5e0d8] shadow-sm">
          <h2 className="font-display text-xl font-bold mb-1.5">Khách đã thử AR</h2>
          <p className="text-xs text-gray-500 mb-5">Hình ảnh thực tế chụp từ tính năng chụp ảnh đeo thử AR của khách hàng trên toàn quốc.</p>
          
          <div className="grid grid-cols-3 gap-4">
            {communityPhotos.map((url, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden aspect-square border border-[#e5e0d8] group">
                <img src={url} alt="Khách đã đeo thử AR" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[9px] px-2 py-0.5 rounded font-medium">
                  Verified Try-on
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="mt-12 mb-16">
          <h2 className="font-display text-xl font-bold mb-6 text-center">Có thể bạn quan tâm</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {recommendations.map((w) => (
              <div
                key={w.id}
                onClick={() => onSelectWatch(w.id)}
                className="bg-white rounded-2xl border border-[#e5e0d8] p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
              >
                <div className="h-28 w-full rounded-xl overflow-hidden mb-3 border border-[#e5e0d8]">
                  <img src={w.image} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">{w.brand}</p>
                <h3 className="font-serif text-[#16162A] font-bold group-hover:text-[#B8924A] text-sm mb-1.5 transition line-clamp-1">
                  {w.name}
                </h3>
                <span className="text-[#16162A] text-xs font-bold">{formatVND(w.price)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Booking Scheduler Modal Popup */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBookingOpen(false)}>
          <div className="bg-white rounded-3xl border border-[#e5e0d8] w-full max-w-md shadow-2xl relative animate-slide-up text-[#16162A] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {bookingSuccess ? (
              <div className="text-center py-14 px-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-3xl mb-4">✓</div>
                <h3 className="font-display text-xl font-bold mb-2">Đặt lịch thành công!</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Shop đã nhận thông tin của bạn và sẽ gọi tư vấn trong 15 phút tới. Cảm ơn bạn!
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                {/* Modal header */}
                <div className="bg-[#16162A] text-white px-6 py-5 relative">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                  <h3 className="font-display text-lg font-bold">Liên hệ shop</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Đeo thử trực tiếp: <span className="font-semibold text-[#B8924A]">{watch.name}</span>
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Họ và tên" required className="col-span-2 sm:col-span-1">
                      <TextInput required value={bookingForm.name} onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })} placeholder="Nguyễn Văn A" />
                    </Field>
                    <Field label="Số điện thoại" required className="col-span-2 sm:col-span-1">
                      <TextInput type="tel" required value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} placeholder="09xx xxx xxx" />
                    </Field>
                  </div>

                  <Field label="Shop">
                    <Select value={bookingForm.showroomId} onChange={(e) => setBookingForm({ ...bookingForm, showroomId: e.target.value })}>
                      {showrooms.map((room) => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </Select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Chọn ngày" required>
                      <TextInput type="date" required value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} />
                    </Field>
                    <Field label="Khung giờ">
                      <Select value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}>
                        <option value="09:30">09:30 sáng</option>
                        <option value="10:30">10:30 sáng</option>
                        <option value="14:00">14:00 chiều</option>
                        <option value="16:30">16:30 chiều</option>
                        <option value="19:00">19:00 tối</option>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Yêu cầu đặc biệt" hint="Ví dụ: chuẩn bị hộp quà, khắc tên...">
                    <TextArea value={bookingForm.message} onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })} rows={2} />
                  </Field>
                </div>

                <div className="px-6 pb-6 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#16162A] text-white py-3 rounded-xl font-bold text-xs hover:bg-black transition shadow-md active:scale-[0.99]"
                  >
                    Gửi đăng ký
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="px-5 border border-[#e5e0d8] text-gray-500 py-3 rounded-xl text-xs font-semibold hover:bg-[#F6F4EF] transition"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
