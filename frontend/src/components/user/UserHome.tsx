import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Star, Wand2, UploadCloud, Lock, Check, Bell } from 'lucide-react';
import Watch3DViewer from '../watch/Watch3DViewer';
import { shopApi, watchApi } from '../../api';
import type { Watch } from '../../api';
import { publicWatches } from '../../utils/publicListings';

interface UserHomeProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
  onNavigate: (page: string) => void;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function UserHome({ onSelectWatch, onOpenAR, onNavigate }: UserHomeProps) {
  const [watches, setWatches] = useState<Watch[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([watchApi.list(), shopApi.list()])
      .then(([list, shops]) => { if (!cancelled) setWatches(publicWatches(list, shops)); })
      .catch(() => { if (!cancelled) setWatches([]); });
    return () => { cancelled = true; };
  }, []);

  const featured = watches.find((w) => w.hasAR) || watches[0];
  const popular = watches.slice(0, 4);

  return (
    <div className="bg-[#F6F4EF] text-[#17140F] font-sans">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-[#17140F] text-white">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_30%_20%,#B8924A,transparent_55%)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#B8924A] font-bold mb-5">
              <span className="h-px w-8 bg-[#B8924A]" /> Haute Horlogerie × AR
            </span>
            <h1 className="heading-crisp font-display text-4xl md:text-6xl font-bold leading-[1.12] pb-1 mb-6">
              Đeo thử đồng hồ ảo <span className="text-[#B8924A]">ngay trên tay</span> của bạn
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
                  <Sparkles className="h-4 w-4" /> Thử AR ngay
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
            <span key={b} className="font-display text-lg md:text-xl font-bold text-[#17140F]/30 tracking-widest">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ============== DESIGN STUDIO — UPLOAD YOUR OWN (COMING SOON) ============== */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#17140F] text-white shadow-2xl">
          {/* ambient glow */}
          <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(circle_at_78%_25%,#B8924A,transparent_55%)]" />
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B8924A]/60 to-transparent" />

          <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-14 p-8 md:p-12 lg:p-16 items-center">
            {/* ---- Copy column ---- */}
            <div>
              <span className="inline-flex items-center gap-2 bg-[#B8924A]/15 border border-[#B8924A]/30 text-[#B8924A] text-[11px] font-bold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full mb-6">
                <Wand2 className="h-3.5 w-3.5" /> Sắp ra mắt
              </span>
              <h2 className="heading-crisp font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-snug pb-1 mb-5">
                Thiết kế trải nghiệm <span className="text-[#B8924A]">đồng hồ 3D</span> của riêng bạn
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 max-w-md">
                Tải lên hình ảnh chiếc đồng hồ bạn mơ ước hoặc phong cách yêu thích — hệ thống sẽ
                dựng nên mô hình 3D tương ứng để bạn xoay ngắm và đeo thử AR ngay tại nhà.
              </p>

              <ul className="space-y-3 mb-9">
                {[
                  'Tải ảnh tham chiếu của riêng bạn',
                  'Dựng mô hình 3D tự động theo ý tưởng',
                  'Đeo thử AR & chia sẻ với bạn bè',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-200">
                    <span className="h-5 w-5 rounded-full bg-[#B8924A]/20 border border-[#B8924A]/40 flex items-center justify-center text-[#B8924A] flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="inline-flex items-center gap-2 bg-white/10 text-gray-300 font-semibold px-7 py-3.5 rounded-full border border-white/15 cursor-not-allowed"
              >
                <Bell className="h-4 w-4" /> Nhận thông báo khi ra mắt
              </button>
            </div>

            {/* ---- Upload dropzone mockup (visual only) ---- */}
            <div className="relative">
              <div className="absolute -inset-3 bg-[#B8924A]/10 blur-3xl rounded-full" />
              <div className="relative rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] backdrop-blur p-8 md:p-10 text-center">
                {/* coming-soon ribbon */}
                <span className="absolute top-4 right-4 bg-[#B8924A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow">
                  Beta
                </span>

                <div className="h-20 w-20 mx-auto rounded-2xl bg-[#B8924A]/15 border border-[#B8924A]/30 flex items-center justify-center text-[#B8924A] mb-6">
                  <UploadCloud className="h-9 w-9" />
                </div>
                <p className="font-display font-bold text-lg md:text-xl mb-1.5">Kéo thả ảnh vào đây</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-7">
                  hoặc bấm để chọn ảnh từ thiết bị<br />PNG, JPG · tối đa 10MB
                </p>

                <div className="inline-flex items-center gap-2 bg-white/10 text-gray-300 text-sm font-semibold px-6 py-3 rounded-full border border-white/10 select-none">
                  <Lock className="h-4 w-4" /> Tạo trải nghiệm 3D
                </div>

                <p className="mt-6 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#B8924A]" /> Tính năng đang được hoàn thiện
                </p>
              </div>
            </div>
          </div>
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
              <button onClick={() => onNavigate('catalog')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B8924A] hover:underline whitespace-nowrap">
                Toàn bộ sản phẩm <ArrowRight className="h-4 w-4" />
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
      <section className="bg-[#17140F] text-white">
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
                <div className="flex text-[#B8924A] mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
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
    </div>
  );
}
