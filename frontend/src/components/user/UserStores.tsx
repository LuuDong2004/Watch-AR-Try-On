import React, { useEffect, useState } from 'react';
import { getDbShops, getDbWatches } from '../../utils/mockData';

interface UserStoresProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
  onNavigate: (page: string) => void;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function UserStores({ onSelectWatch, onOpenAR, onNavigate }: UserStoresProps) {
  const [shops, setShops] = useState<any[]>([]);
  const [watches, setWatches] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setShops(getDbShops());
    setWatches(getDbWatches());
  }, []);

  const watchesAt = (shopId: string) => watches.filter((w) => w.shopId === shopId);
  const selected = shops.find((s) => s.id === selectedId) || null;

  // -------------------------------------------------- SHOP DETAIL VIEW
  if (selected) {
    const shopWatches = watchesAt(selected.id);
    return (
      <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#B8924A] transition mb-6"
          >
            ← Quay lại danh sách cửa hàng
          </button>

          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden border border-[#e5e0d8] shadow-sm mb-8 h-60">
            <img src={selected.image} onError={(e)=>{const t=e.currentTarget; if(t.src.indexOf("1523275335684")===-1) t.src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200";}} alt={selected.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8924A] font-bold">🏬 Cửa hàng chính hãng</span>
              <h1 className="font-display text-2xl md:text-4xl font-bold mt-1">{selected.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-200">
                <span className="text-[#B8924A] font-bold">★ {selected.rating}</span>
                <span>({selected.reviewCount} đánh giá)</span>
                <span>·</span>
                <span>📍 {selected.address}</span>
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
                  <li className="flex gap-2"><span className="text-[#B8924A]">👤</span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Chủ shop</p><p className="font-semibold text-gray-700">{selected.manager}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]">🕐</span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Giờ làm việc</p><p className="font-semibold text-gray-700">{selected.hours}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]">📞</span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Hotline</p><p className="font-semibold text-gray-700">{selected.phone}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]">✉️</span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Email</p><p className="font-semibold text-gray-700 break-all">{selected.email}</p></div></li>
                  <li className="flex gap-2"><span className="text-[#B8924A]">📍</span><div><p className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Khu vực</p><p className="font-semibold text-gray-700">{selected.address}</p></div></li>
                </ul>

                {/* Self-serve contact actions */}
                <div className="flex flex-col gap-2 mt-5">
                  <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="w-full bg-[#16162A] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-black transition text-center shadow">📞 Gọi shop</a>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={selected.zalo} target="_blank" rel="noreferrer" className="border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center">💬 Zalo</a>
                    <a href={selected.messenger} target="_blank" rel="noreferrer" className="border border-[#B8924A] text-[#B8924A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#B8924A]/5 transition text-center">🌐 Messenger</a>
                  </div>
                  <button onClick={() => onNavigate('contact')} className="w-full bg-[#B8924A] hover:bg-[#a6803f] text-white py-2.5 rounded-xl font-bold text-xs transition text-center shadow">✉️ Gửi yêu cầu tư vấn</button>
                </div>
              </div>

              {/* Specialties */}
              {selected.services?.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
                  <h3 className="font-display font-bold text-sm mb-3 border-b border-[#e5e0d8] pb-2">Cam kết & dịch vụ</h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {selected.services.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-[#B8924A] font-bold mt-0.5">✓</span><span className="leading-relaxed">{s}</span></li>
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
                <div className="grid sm:grid-cols-2 gap-5">
                  {shopWatches.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => onSelectWatch(w.id)}
                      className="group bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img src={w.image} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        {w.hasAR && <span className="absolute top-2 right-2 bg-[#B8924A] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">✨ AR</span>}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{w.brand}</p>
                        <h3 className="text-sm font-bold mt-0.5 mb-1 line-clamp-1 group-hover:text-[#B8924A] transition">{w.name}</h3>
                        <span className="text-sm font-bold mb-3">{formatVND(w.price)}</span>
                        {w.hasAR ? (
                          <button onClick={(e) => { e.stopPropagation(); onOpenAR(w.id); }} className="mt-auto w-full bg-[#16162A] text-white text-xs font-semibold py-2 rounded-full hover:bg-black transition border border-[#B8924A]/30">✨ Thử Đeo AR</button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); onSelectWatch(w.id); }} className="mt-auto w-full bg-white text-[#16162A] text-xs font-semibold py-2 rounded-full hover:bg-[#F6F4EF] transition border border-[#16162A]/20">Xem chi tiết →</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-10 text-center text-sm text-gray-500">Shop chưa đăng sản phẩm nào.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------- SHOP DIRECTORY VIEW
  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2 block">Marketplace đồng hồ chính hãng</span>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">Cửa hàng trên TrueWrist</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Chọn một shop để xem toàn bộ sản phẩm đang đăng bán, thử AR và chủ động liên hệ trực tiếp với shop.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {shops.map((shop) => {
            const count = watchesAt(shop.id).length;
            return (
              <button
                key={shop.id}
                onClick={() => setSelectedId(shop.id)}
                className="group text-left rounded-3xl overflow-hidden border border-[#e5e0d8] bg-white shadow-sm hover:shadow-xl transition"
              >
                <div className="h-44 overflow-hidden relative">
                  <img src={shop.image} onError={(e)=>{const t=e.currentTarget; if(t.src.indexOf("1523275335684")===-1) t.src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200";}} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute top-3 right-3 bg-[#B8924A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{count} sản phẩm</span>
                  <div className="absolute bottom-3 left-4 text-white">
                    <span className="text-[10px] uppercase tracking-wider text-[#B8924A] font-bold">🏬 Cửa hàng</span>
                    <h3 className="font-display text-lg font-bold">{shop.name}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{shop.description || shop.address}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B8924A] font-bold">★ {shop.rating} <span className="text-gray-400 font-normal">· 📍 {shop.address}</span></span>
                    <span className="font-semibold text-[#B8924A] group-hover:underline">Xem shop →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
