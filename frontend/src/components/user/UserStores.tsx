import React, { useEffect, useState } from 'react';
import { Store, Star, MapPin, User, Clock, Phone, Mail, MessageCircle, Globe, Check, Sparkles, ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { shopApi, watchApi, leadApi, ApiError } from '../../api';
import type { Shop, Watch } from '../../api';
import { Field, TextInput, TextArea, Select, SegmentedControl } from '../ui/Field';
import { toast } from '../../store/useToast';
import { mapDirectionsUrl } from '../../utils/maps';
import { isPublicShop, publicWatches, canTryAr } from '../../utils/publicListings';
import { detectRegion } from '../../utils/region';
import MapPreview from '../MapPreview';

interface UserStoresProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
  onNavigate: (page: string) => void;
  initialShopId?: string | null;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + ' vnđ';

const STORES_PER_PAGE = 6;
const SHOP_PRODUCTS_PER_PAGE = 6;

export default function UserStores({ onSelectWatch, onOpenAR, onNavigate, initialShopId }: UserStoresProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(initialShopId ?? null);

  // Directory filters & pagination
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [page, setPage] = useState(1);
  const [shopProductPage, setShopProductPage] = useState(1);

  // In-store consultation popup
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'contact' as 'contact' | 'appointment',
    watchId: '',
    date: '',
    time: '09:30',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([shopApi.list(), watchApi.list()])
      .then(([s, w]) => {
        if (cancelled) return;
        const activeShops = s.filter(isPublicShop);
        setShops(activeShops);
        setWatches(publicWatches(w, activeShops));
      })
      .catch(() => {
        if (cancelled) return;
        setShops([]);
        setWatches([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Open straight into a shop when linked from elsewhere (e.g. product detail).
  useEffect(() => {
    if (initialShopId) setSelectedId(initialShopId);
  }, [initialShopId]);

  // Reset to first page whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, region]);

  useEffect(() => {
    setShopProductPage(1);
  }, [selectedId]);

  const watchesAt = (shopId: string) => watches.filter((w) => w.shopId === shopId);
  const selected = shops.find((s) => s.id === selectedId) || null;

  // Open the consultation popup. The product is chosen from outside the form
  // (a specific watch card, or the shop's general "tư vấn" button => no product).
  const openContact = (watchId = '') => {
    if (!selected) return;
    const chosen = watchesAt(selected.id).find((w) => w.id === watchId);
    setContactForm({
      name: '',
      phone: '',
      email: '',
      type: 'contact',
      watchId: chosen?.id || '',
      date: '',
      time: '09:30',
      message: chosen
        ? `Tôi đang quan tâm đến mẫu ${chosen.name}. Nhờ ${selected.name} tư vấn thêm.`
        : `Tôi muốn được ${selected.name} tư vấn thêm về sản phẩm. Cảm ơn shop.`,
    });
    setContactSuccess(false);
    setContactOpen(true);
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!contactForm.name || !contactForm.phone) {
      toast.error('Vui lòng điền họ tên và số điện thoại');
      return;
    }
    const chosen = watchesAt(selected.id).find((w) => w.id === contactForm.watchId);
    setSubmitting(true);
    try {
      await leadApi.create({
        name: contactForm.name,
        phone: contactForm.phone,
        email: contactForm.email,
        watchId: chosen?.id || '',
        watchName: chosen?.name || 'Tư vấn chung',
        watchBrand: chosen?.brand || selected.name,
        shopId: selected.id,
        shopName: selected.name,
        type: contactForm.type,
        date: contactForm.type === 'appointment' ? contactForm.date : undefined,
        time: contactForm.type === 'appointment' ? contactForm.time : undefined,
        message: contactForm.message,
        channel: 'form',
        hasTriedOn: false,
      });
      setContactSuccess(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Canonical city/province for grouping (diacritic-insensitive, district-aware).
  const regions = Array.from(new Set(shops.map((s) => detectRegion(s.address)))).sort((a, b) => a.localeCompare(b, 'vi'));

  const filteredShops = shops.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || [s.name, s.address, s.description].filter(Boolean).join(' ').toLowerCase().includes(q);
    const matchesRegion = region === 'all' || detectRegion(s.address) === region;
    return matchesSearch && matchesRegion;
  });

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / STORES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedShops = filteredShops.slice((safePage - 1) * STORES_PER_PAGE, safePage * STORES_PER_PAGE);

  // -------------------------------------------------- SHOP DETAIL VIEW
  if (selected) {
    const shopWatches = watchesAt(selected.id);
    const shopProductTotalPages = Math.max(1, Math.ceil(shopWatches.length / SHOP_PRODUCTS_PER_PAGE));
    const safeShopProductPage = Math.min(shopProductPage, shopProductTotalPages);
    const pagedShopWatches = shopWatches.slice(
      (safeShopProductPage - 1) * SHOP_PRODUCTS_PER_PAGE,
      safeShopProductPage * SHOP_PRODUCTS_PER_PAGE,
    );
    return (
      <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#B8924A] transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách cửa hàng
          </button>

          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden border border-[#e5e0d8] shadow-sm mb-8 h-60">
            <img src={selected.image} onError={(e)=>{const t=e.currentTarget; if(t.src.indexOf("1523275335684")===-1) t.src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200";}} alt={selected.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#B8924A] font-bold"><Store className="h-4 w-4" /> Cửa hàng chính hãng</span>
              <h1 className="font-display text-2xl md:text-4xl font-bold mt-1">{selected.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-200">
                <span className="inline-flex items-center gap-1 text-[#B8924A] font-bold"><Star className="h-3.5 w-3.5 fill-current" /> {selected.rating}</span>
                <span>({selected.reviewCount} đánh giá)</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {selected.address}</span>
                {selected.since && <><span>·</span><span>Hoạt động từ {selected.since}</span></>}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left: shop info + contact (self-serve) */}
            <aside className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
                {selected.description && <p className="text-xs text-gray-500 leading-relaxed mb-4">{selected.description}</p>}
                <h3 className="font-display font-bold text-sm mb-3 border-b border-[#e5e0d8] pb-2">Thông tin liên hệ</h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex gap-2"><span className="text-[#B8924A]"><User className="h-4 w-4" /></span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Chủ shop</p><p className="font-semibold text-gray-700">{selected.manager}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]"><Clock className="h-4 w-4" /></span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Giờ làm việc</p><p className="font-semibold text-gray-700">{selected.hours}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]"><Phone className="h-4 w-4" /></span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Hotline</p><p className="font-semibold text-gray-700">{selected.phone}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]"><Mail className="h-4 w-4" /></span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Email</p><p className="font-semibold text-gray-700 break-all">{selected.email}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]"><MapPin className="h-4 w-4" /></span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Khu vực</p><p className="font-semibold text-gray-700">{selected.address}</p></div></li>
                </ul>

                {/* Self-serve contact actions */}
                <div className="flex flex-col gap-2 mt-5">
                  <a href={`tel:${(selected.phone || '').replace(/\s/g, '')}`} className="w-full bg-[#17140F] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-black transition text-center shadow inline-flex items-center justify-center gap-1.5"><Phone className="h-4 w-4" /> Gọi shop</a>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={selected.zalo} target="_blank" rel="noreferrer" className="border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center inline-flex items-center justify-center gap-1.5"><MessageCircle className="h-4 w-4" /> Zalo</a>
                    <a href={selected.messenger} target="_blank" rel="noreferrer" className="border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center inline-flex items-center justify-center gap-1.5"><Globe className="h-4 w-4" /> Messenger</a>
                  </div>
                  <button onClick={() => openContact()} className="w-full bg-[#B8924A] hover:bg-[#a6803f] text-white py-2.5 rounded-xl font-bold text-xs transition text-center shadow inline-flex items-center justify-center gap-1.5"><Mail className="h-4 w-4" /> Gửi yêu cầu tư vấn</button>
                  {mapDirectionsUrl(selected.mapUrl) && (
                    <a
                      href={mapDirectionsUrl(selected.mapUrl)!}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full border border-[#17140F] text-[#17140F] py-2.5 rounded-xl font-bold text-xs hover:bg-[#17140F] hover:text-white transition text-center inline-flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="h-4 w-4" /> Chỉ đường tới cửa hàng
                    </a>
                  )}
                </div>

                {/* Map preview — only when the shop provided a map link */}
                {selected.mapUrl && (
                  <MapPreview mapUrl={selected.mapUrl} className="mt-4 rounded-2xl" />
                )}
              </div>

              {/* Specialties */}
              {(selected.services?.length ?? 0) > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
                  <h3 className="font-display font-bold text-sm mb-3 border-b border-[#e5e0d8] pb-2">Cam kết & dịch vụ</h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {(selected.services ?? []).map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-[#B8924A] font-bold mt-0.5"><Check className="h-4 w-4" /></span><span className="leading-relaxed">{s}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            {/* Right: watches this shop posted */}
            <div className="lg:col-span-2">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold">Sản phẩm của shop</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{shopWatches.length} mẫu đồng hồ đang đăng bán</p>
                </div>
              </div>

              {shopWatches.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {pagedShopWatches.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => onSelectWatch(w.id)}
                        className="group bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                      >
                        <div className="relative bg-gradient-to-br from-[#f3efe7] to-[#e9e3d8] h-56 overflow-hidden border-b border-[#e5e0d8]">
                          <img
                            src={w.image}
                            alt={w.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                        {canTryAr(w) ? (
                          <span className="absolute top-3 right-3 bg-[#B8924A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-widest uppercase flex items-center gap-1">
                            <Sparkles className="h-4 w-4" /> AR Try-On
                          </span>
                        ) : (
                          <span className="absolute top-3 right-3 bg-white/85 backdrop-blur text-[#17140F] text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-widest uppercase">
                            Ảnh 2D
                          </span>
                        )}

                        <span className="absolute bottom-2 left-3 text-[10px] uppercase tracking-[0.15em] text-white/90 font-bold drop-shadow">
                          {w.brand}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-serif text-[#17140F] font-bold group-hover:text-[#B8924A] transition text-base mb-1 line-clamp-1">
                          {w.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-[#B8924A]"><Star className="h-3.5 w-3.5 fill-current" /></span>
                          <span className="text-xs font-bold">{w.rating}</span>
                          <span className="text-xs text-gray-400">({w.reviewCount} đánh giá)</span>
                        </div>

                        <div className="mt-auto mb-4 flex flex-col gap-0.5">
                          <span className="text-[#17140F] font-bold text-sm sm:text-base whitespace-nowrap">
                            {formatVND(w.price)}
                          </span>
                          {w.originalPrice && w.originalPrice > w.price && (
                            <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                              {formatVND(w.originalPrice)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {canTryAr(w) ? (
                            <button onClick={(e) => { e.stopPropagation(); onOpenAR(w.id); }} className="w-full bg-[#17140F] text-white text-xs font-semibold py-2.5 rounded-full hover:bg-black transition flex items-center justify-center gap-1.5 shadow-sm border border-[#B8924A]/30"><Sparkles className="h-4 w-4" /> Thử Đeo AR</button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); onSelectWatch(w.id); }} className="w-full bg-white text-[#17140F] text-xs font-semibold py-2.5 rounded-full hover:bg-[#F6F4EF] transition flex items-center justify-center gap-1.5 shadow-sm border border-[#17140F]/20">Xem chi tiết <ArrowRight className="h-4 w-4" /></button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openContact(w.id); }} className="w-full border border-[#B8924A] text-[#B8924A] text-xs font-semibold py-2 rounded-full hover:bg-[#B8924A]/5 transition inline-flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Yêu cầu tư vấn</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {shopProductTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShopProductPage((p) => Math.max(1, p - 1))}
                      disabled={safeShopProductPage === 1}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-[#e5e0d8] bg-white text-[#17140F] hover:border-[#B8924A] hover:text-[#B8924A] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#e5e0d8] disabled:hover:text-[#17140F]"
                      aria-label="Trang sản phẩm trước"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: shopProductTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setShopProductPage(i + 1)}
                        className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-full text-sm font-semibold transition border ${
                          safeShopProductPage === i + 1
                            ? 'bg-[#17140F] text-white border-[#17140F]'
                            : 'bg-white text-gray-600 border-[#e5e0d8] hover:border-[#B8924A] hover:text-[#B8924A]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setShopProductPage((p) => Math.min(shopProductTotalPages, p + 1))}
                      disabled={safeShopProductPage === shopProductTotalPages}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-[#e5e0d8] bg-white text-[#17140F] hover:border-[#B8924A] hover:text-[#B8924A] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#e5e0d8] disabled:hover:text-[#17140F]"
                      aria-label="Trang sản phẩm sau"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-10 text-center text-sm text-gray-500">Shop chưa đăng sản phẩm nào.</div>
              )}
            </div>
          </div>
        </div>

        {/* ===== In-store consultation popup ===== */}
        {contactOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContactOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e5e0d8] overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
              {contactSuccess ? (
                <div className="text-center py-16 px-6">
                  <div className="h-16 w-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mb-4 animate-fade-in"><Check className="h-6 w-6" /></div>
                  <h3 className="font-display text-xl font-bold mb-2">Đã gửi yêu cầu thành công!</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
                    Yêu cầu đã được chuyển tới {selected.name}. Shop sẽ phản hồi qua SĐT/Zalo trong thời gian sớm nhất.
                  </p>
                  <button onClick={() => setContactOpen(false)} className="bg-[#17140F] text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-black transition">Đóng</button>
                </div>
              ) : (
                <form onSubmit={submitContact}>
                  {/* header */}
                  <div className="bg-[#17140F] text-white px-6 py-5 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold">Gửi yêu cầu tư vấn</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1"><Store className="h-3.5 w-3.5 text-[#B8924A]" /> {selected.name}</p>
                    </div>
                    <button type="button" onClick={() => setContactOpen(false)} className="text-gray-400 hover:text-white transition" aria-label="Đóng"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-6 space-y-5">
                    <SegmentedControl
                      value={contactForm.type}
                      onChange={(v) => setContactForm({ ...contactForm, type: v as 'contact' | 'appointment' })}
                      options={[
                        { value: 'contact', label: 'Tư vấn sản phẩm' },
                        { value: 'appointment', label: 'Đặt lịch xem' },
                      ]}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Họ và tên" required className="col-span-2 sm:col-span-1">
                        <TextInput required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Nguyễn Văn A" />
                      </Field>
                      <Field label="Số điện thoại" required className="col-span-2 sm:col-span-1">
                        <TextInput type="tel" required value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="09xx xxx xxx" />
                      </Field>
                    </div>

                    <Field label="Email" hint="Không bắt buộc — để nhận báo giá chi tiết qua email.">
                      <TextInput type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="your.email@gmail.com" />
                    </Field>

                    <Field label="Sản phẩm quan tâm">
                      {(() => {
                        const chosen = watchesAt(selected.id).find((w) => w.id === contactForm.watchId);
                        return chosen ? (
                          <div className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-2.5 flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg overflow-hidden border border-[#e5e0d8] bg-white flex-shrink-0">
                              <img src={chosen.image} alt={chosen.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{chosen.brand}</p>
                              <p className="text-xs font-bold text-[#17140F] truncate">{chosen.name}</p>
                            </div>
                            <button type="button" onClick={() => setContactForm({ ...contactForm, watchId: '' })} className="text-[10px] font-semibold text-gray-400 hover:text-[#B8924A] transition flex-shrink-0 px-1">Bỏ chọn</button>
                          </div>
                        ) : (
                          <div className="w-full rounded-xl border border-dashed border-[#e5e0d8] bg-[#F6F4EF] px-3.5 py-2.5 text-xs text-gray-500 flex items-center gap-2">
                            <Store className="h-4 w-4 text-[#B8924A] flex-shrink-0" /> Tư vấn chung — chọn "Yêu cầu tư vấn" trên một sản phẩm để gắn vào yêu cầu.
                          </div>
                        );
                      })()}
                    </Field>

                    {contactForm.type === 'appointment' && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <Field label="Ngày hẹn" required>
                          <TextInput type="date" required value={contactForm.date} onChange={(e) => setContactForm({ ...contactForm, date: e.target.value })} />
                        </Field>
                        <Field label="Khung giờ">
                          <Select value={contactForm.time} onChange={(e) => setContactForm({ ...contactForm, time: e.target.value })}>
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
                      <TextArea required rows={3} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Nhu cầu tư vấn cụ thể hoặc lịch ghé thăm..." />
                    </Field>

                    <button type="submit" disabled={submitting} className="w-full bg-[#17140F] text-white py-3.5 rounded-xl font-bold hover:bg-black transition shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed">
                      {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center leading-snug">
                      Bằng việc gửi, bạn đồng ý để shop liên hệ tư vấn. Thông tin được bảo mật.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------- SHOP DIRECTORY VIEW
  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2 block">Marketplace đồng hồ chính hãng</span>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">Cửa hàng trên TrueWrist</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Chọn một shop để xem toàn bộ sản phẩm đang đăng bán, thử AR và chủ động liên hệ trực tiếp với shop.
          </p>
        </div>

        {/* Toolbar: search + region filter */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cửa hàng theo tên hoặc địa chỉ..."
              className="w-full bg-white rounded-full border border-[#e5e0d8] shadow-sm pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['all', ...regions].map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition border ${
                  region === r
                    ? 'bg-[#17140F] text-white border-[#17140F] shadow'
                    : 'bg-white text-gray-600 border-[#e5e0d8] hover:border-[#B8924A] hover:text-[#B8924A]'
                }`}
              >
                {r !== 'all' && <MapPin className="h-3.5 w-3.5" />}
                {r === 'all' ? 'Tất cả khu vực' : r}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-gray-400">
            {filteredShops.length} cửa hàng{region !== 'all' ? ` tại ${region}` : ''}
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 text-center shadow-sm text-sm text-[#8A8170]">
            Đang tải…
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 text-center shadow-sm">
            <Store className="h-10 w-10 mx-auto text-gray-300" />
            <h3 className="font-display font-bold text-base mt-3 mb-1">Không tìm thấy cửa hàng phù hợp</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Thử đổi từ khóa tìm kiếm hoặc chọn khu vực khác.
            </p>
          </div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {pagedShops.map((shop) => {
            const count = watchesAt(shop.id).length;
            const region = detectRegion(shop.address);
            return (
              <button
                key={shop.id}
                onClick={() => setSelectedId(shop.id)}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[#e5e0d8] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Cover */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={shop.image}
                    onError={(e) => { const t = e.currentTarget; if (t.src.indexOf('1523275335684') === -1) t.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200'; }}
                    alt={shop.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Top chips */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#17140F] shadow-sm">
                      <Star className="h-3 w-3 fill-[#B8924A] text-[#B8924A]" /> {shop.rating ?? '—'}
                    </span>
                    <span className="rounded-full bg-[#B8924A] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">{count} sản phẩm</span>
                  </div>
                  {/* Name */}
                  <h3 className="absolute inset-x-4 bottom-3 font-display text-lg font-bold text-white drop-shadow">{shop.name}</h3>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-[#F6F4EF] px-2.5 py-1 text-[10px] font-semibold text-[#8A7A55]">
                    <MapPin className="h-3 w-3 text-[#B8924A]" /> {region}
                  </span>
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">{shop.description || shop.address}</p>

                  {(shop.services?.length ?? 0) > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {(shop.services ?? []).slice(0, 2).map((s, i) => (
                        <span key={i} className="rounded-md bg-[#B8924A]/10 px-2 py-0.5 text-[9px] font-semibold text-[#8A7A55]">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-[#f0ebe2] pt-3 text-xs">
                    <span className="truncate text-gray-400">{shop.address}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 font-bold text-[#B8924A] group-hover:gap-2 transition-all">Xem cửa hàng <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-[#e5e0d8] bg-white text-[#17140F] hover:border-[#B8924A] hover:text-[#B8924A] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#e5e0d8] disabled:hover:text-[#17140F]"
              aria-label="Trang trước"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-full text-sm font-semibold transition border ${
                  safePage === i + 1
                    ? 'bg-[#17140F] text-white border-[#17140F]'
                    : 'bg-white text-gray-600 border-[#e5e0d8] hover:border-[#B8924A] hover:text-[#B8924A]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-[#e5e0d8] bg-white text-[#17140F] hover:border-[#B8924A] hover:text-[#B8924A] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#e5e0d8] disabled:hover:text-[#17140F]"
              aria-label="Trang sau"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
