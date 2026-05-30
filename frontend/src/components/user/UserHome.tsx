import React, { useEffect, useState } from 'react';
import Watch3DViewer from '../watch/Watch3DViewer';
import { getDbWatches } from '../../utils/mockData';

interface UserHomeProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
  onNavigate: (page: string) => void;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function UserHome({ onSelectWatch, onOpenAR, onNavigate }: UserHomeProps) {
  const [watches, setWatches] = useState<any[]>([]);

  useEffect(() => {
    setWatches(getDbWatches());
  }, []);

  const featured = watches.find((w) => w.hasAR) || watches[0];
  const arWatches = watches.filter((w) => w.hasAR).slice(0, 3);
  const popular = watches.slice(0, 4);

  return (
    <div className="bg-[#F6F4EF] text-[#16162A] font-sans">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-[#16162A] text-white">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_30%_20%,#B8924A,transparent_55%)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#B8924A] font-bold mb-5">
              <span className="h-px w-8 bg-[#B8924A]" /> Haute Horlogerie × AR
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              Đeo thử đồng hồ xa xỉ <span className="text-[#B8924A]">ngay trên cổ tay</span> bạn
            </h1>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Trải nghiệm công nghệ thử đeo AR thời gian thực và xem mô hình 3D 360° sắc nét.
              Chọn mẫu ưng ý, đeo thử tại nhà, rồi liên hệ shop để sở hữu.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-[#B8924A] hover:bg-[#a6803f] text-white font-semibold px-8 py-3.5 rounded-full transition shadow-lg hover:scale-105 active:scale-95"
              >
                Khám phá bộ sưu tập
              </button>
              {featured && (
                <button
                  onClick={() => onOpenAR(featured.id)}
                  className="border border-white/30 hover:border-[#B8924A] hover:text-[#B8924A] text-white font-semibold px-8 py-3.5 rounded-full transition flex items-center gap-2"
                >
                  ✨ Thử AR ngay
                </button>
              )}
            </div>

            {/* trust stats */}
            <div className="flex gap-8 mt-12">
              {[
                ['12K+', 'Lượt thử AR'],
                ['50+', 'Mẫu cao cấp'],
                ['2', 'Shop uy tín'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl md:text-3xl font-bold text-[#B8924A]">{n}</div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured 3D viewer */}
          <div className="relative">
            <div className="absolute -inset-4 bg-[#B8924A]/10 blur-3xl rounded-full" />
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur shadow-2xl">
              {featured?.model ? (
                <Watch3DViewer modelUrl={featured.model} variant={featured.variant} height={360} />
              ) : (
                <img src={featured?.image} alt={featured?.name} className="rounded-2xl w-full h-[360px] object-cover" />
              )}
              <div className="flex items-center justify-between mt-4 px-2 pb-1">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#B8924A] font-bold">{featured?.brand}</p>
                  <p className="font-display font-bold text-white">{featured?.name}</p>
                </div>
                <span className="bg-[#B8924A] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  3D · 360°
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== BRAND STRIP ===================== */}
      <section className="bg-white border-y border-[#e5e0d8]">
        <div className="max-w-6xl mx-auto px-4 py-7 flex flex-wrap items-center justify-center md:justify-between gap-x-10 gap-y-3">
          {['ROLEX', 'OMEGA', 'AVENTUS', 'G-SHOCK', 'SUBMARINER', 'HERITAGE'].map((b) => (
            <span key={b} className="font-display text-lg md:text-xl font-bold text-[#16162A]/30 tracking-widest">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ===================== VALUE PROPS ===================== */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold">Vì sao chọn TrueWrist</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Mua đồng hồ cao cấp, tự tin hơn bao giờ hết</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '✨', title: 'Thử đeo AR thời gian thực', desc: 'Công nghệ hand-tracking ướm đồng hồ lên cổ tay bạn qua webcam, chính xác từng chuyển động.' },
            { icon: '🔄', title: 'Mô hình 3D 360°', desc: 'Xoay, phóng to và quan sát từng chi tiết niềng, cọc số, dây đeo trước khi quyết định.' },
            { icon: '🏪', title: 'Liên hệ shop trực tiếp', desc: 'Mỗi sản phẩm gắn với một shop. Liên hệ ngay qua điện thoại, Zalo, Messenger để chốt đơn.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-3xl p-8 border border-[#e5e0d8] shadow-sm hover:shadow-md transition">
              <div className="h-14 w-14 rounded-2xl bg-[#B8924A]/10 flex items-center justify-center text-2xl mb-5">{f.icon}</div>
              <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== AR TRY-ON SHOWCASE ===================== */}
      {arWatches.length > 0 && (
        <section className="bg-white border-y border-[#e5e0d8]">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold">Có sẵn AR Try-On</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Đeo thử ngay hôm nay</h2>
              </div>
              <button onClick={() => onNavigate('catalog')} className="text-sm font-semibold text-[#B8924A] hover:underline whitespace-nowrap">
                Xem tất cả →
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {arWatches.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWatch(w.id)}
                  className="group rounded-3xl overflow-hidden border border-[#e5e0d8] bg-[#F6F4EF] shadow-sm hover:shadow-xl transition cursor-pointer flex flex-col"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img src={w.image} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-3 right-3 bg-[#B8924A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">✨ AR</span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{w.brand}</p>
                    <h3 className="font-display font-bold mt-0.5 mb-2 group-hover:text-[#B8924A] transition">{w.name}</h3>
                    <span className="font-bold mb-4">{formatVND(w.price)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenAR(w.id); }}
                      className="mt-auto w-full bg-[#16162A] text-white text-xs font-semibold py-2.5 rounded-full hover:bg-black transition border border-[#B8924A]/30"
                    >
                      ✨ Thử Đeo AR Tức Thì
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold">Quy trình</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Chỉ 3 bước để sở hữu</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Chọn mẫu đồng hồ', desc: 'Duyệt bộ sưu tập và lọc theo thương hiệu, chất liệu, kích thước mặt.' },
            { n: '02', title: 'Thử đeo bằng AR', desc: 'Bật webcam, đưa cổ tay vào khung hình và xem đồng hồ hiện lên thực tế.' },
            { n: '03', title: 'Liên hệ shop & sở hữu', desc: 'Ưng ý thì liên hệ trực tiếp shop đăng bán qua điện thoại/Zalo để chốt và nhận hàng.' },
          ].map((s, i) => (
            <div key={s.n} className="relative bg-white rounded-3xl p-8 border border-[#e5e0d8] shadow-sm">
              <span className="font-display text-5xl font-bold text-[#B8924A]/20">{s.n}</span>
              <h3 className="font-display text-lg font-bold mt-2 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              {i < 2 && <span className="hidden md:block absolute top-1/2 -right-3 text-[#B8924A] text-xl">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ===================== POPULAR GRID ===================== */}
      {popular.length > 0 && (
        <section className="bg-white border-y border-[#e5e0d8]">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold">Được yêu thích</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Bộ sưu tập nổi bật</h2>
              </div>
              <button onClick={() => onNavigate('catalog')} className="text-sm font-semibold text-[#B8924A] hover:underline whitespace-nowrap">
                Toàn bộ sản phẩm →
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {popular.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWatch(w.id)}
                  className="group rounded-2xl overflow-hidden border border-[#e5e0d8] bg-[#F6F4EF] shadow-sm hover:shadow-lg transition cursor-pointer"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={w.image} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    {w.hasAR && (
                      <span className="absolute top-2 right-2 bg-[#B8924A] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">AR</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{w.brand}</p>
                    <h3 className="text-sm font-bold mt-0.5 mb-1 line-clamp-1 group-hover:text-[#B8924A] transition">{w.name}</h3>
                    <span className="text-sm font-bold">{formatVND(w.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="bg-[#16162A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold">Khách hàng nói gì</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Tin tưởng bởi hàng nghìn người</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Hoàng Long', role: 'Doanh nhân', text: 'Thử AR trên web thấy vừa vặn, liên hệ shop nhận liền. Trải nghiệm mua sắm hiện đại nhất tôi từng có.' },
              { name: 'Quốc Bảo', role: 'Kiến trúc sư', text: 'Xoay 3D xem rõ từng cọc số sapphire. Quá tiện để quyết định trước khi xuống tiền.' },
              { name: 'Minh Anh', role: 'Nhà sáng tạo nội dung', text: 'Đặt lịch nhanh gọn, shop tư vấn rất tận tình. Sẽ quay lại!' },
            ].map((t) => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-3xl p-7">
                <div className="text-[#B8924A] mb-3">★★★★★</div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">“{t.text}”</p>
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-[#B8924A]/20 border border-[#B8924A]/40 flex items-center justify-center font-bold text-[#B8924A]">
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#B8924A] to-[#8c6e38] text-white px-6 py-14 md:py-20 text-center shadow-xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,#fff,transparent_50%)]" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Sẵn sàng đeo thử chiếc đồng hồ mơ ước?</h2>
            <p className="text-white/85 mb-8 text-base md:text-lg">
              Bắt đầu trải nghiệm AR ngay trên trình duyệt — miễn phí, không cần cài đặt.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => onNavigate('catalog')} className="bg-white text-[#16162A] font-semibold px-8 py-3.5 rounded-full hover:scale-105 active:scale-95 transition shadow-lg">
                Bắt đầu khám phá
              </button>
              <button onClick={() => onNavigate('contact')} className="border border-white/60 hover:bg-white/10 font-semibold px-8 py-3.5 rounded-full transition">
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
