import React from 'react';
import BrandLogo from '../ui/BrandLogo';

interface UserFooterProps {
  onChangePage: (page: string) => void;
}

export default function UserFooter({ onChangePage }: UserFooterProps) {
  return (
    <footer className="bg-[#16162A] text-[#F6F4EF] font-sans mt-auto">
      {/* Newsletter / CTA strip */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="font-display text-xl md:text-2xl font-bold mb-1.5">
              Đăng ký nhận bộ sưu tập giới hạn
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Nhận thông tin ra mắt sản phẩm mới, ưu đãi riêng và lời mời sự kiện trải nghiệm AR độc quyền.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2"
          >
            <input
              type="email"
              required
              placeholder="Nhập email của bạn"
              className="flex-1 rounded-full bg-white/10 border border-white/15 px-5 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#B8924A]"
            />
            <button className="bg-[#B8924A] hover:bg-[#a6803f] text-white font-semibold px-6 py-3 rounded-full text-sm transition shadow-md active:scale-95 whitespace-nowrap">
              Đăng ký
            </button>
          </form>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4">
            <BrandLogo surface="dark" size="md" />
          </div>
          <p className="text-gray-400 leading-relaxed mb-4">
            Sàn trưng bày đồng hồ cao cấp kết hợp công nghệ thử đeo AR thời gian thực — đeo thử trước, liên hệ shop sau.
          </p>
          <div className="flex gap-3">
            {['Facebook', 'Instagram', 'YouTube', 'TikTok'].map((s) => (
              <a
                key={s}
                href="#"
                title={s}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-[#B8924A] flex items-center justify-center text-xs font-bold transition"
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Khám phá */}
        <div>
          <h4 className="font-display font-bold mb-4 text-[#B8924A] uppercase text-xs tracking-wider">Khám phá</h4>
          <ul className="space-y-2.5 text-gray-400">
            <li><button onClick={() => onChangePage('home')} className="hover:text-white transition">Trang chủ</button></li>
            <li><button onClick={() => onChangePage('catalog')} className="hover:text-white transition">Bộ sưu tập</button></li>
            <li><button onClick={() => onChangePage('stores')} className="hover:text-white transition">Cửa hàng</button></li>
            <li><button onClick={() => onChangePage('closet')} className="hover:text-white transition">Tủ đồ ảo</button></li>
            <li><button onClick={() => onChangePage('contact')} className="hover:text-white transition">Liên hệ shop</button></li>
          </ul>
        </div>

        {/* Dịch vụ */}
        <div>
          <h4 className="font-display font-bold mb-4 text-[#B8924A] uppercase text-xs tracking-wider">Dịch vụ</h4>
          <ul className="space-y-2.5 text-gray-400">
            <li>Thử đeo AR thời gian thực</li>
            <li>Xem mô hình 3D 360°</li>
            <li>Tư vấn VIP 1-1</li>
            <li>Bảo hành chính hãng</li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <h4 className="font-display font-bold mb-4 text-[#B8924A] uppercase text-xs tracking-wider">Liên hệ</h4>
          <ul className="space-y-2.5 text-gray-400">
            <li>📍 15 Lý Tự Trọng, Q1, TP.HCM</li>
            <li>📞 1900 6868</li>
            <li>✉️ care@aventus.luxury</li>
            <li>🕐 09:00 – 21:30 hằng ngày</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© 2026 TrueWrist AR Watch Studio · Sàn Trưng Bày & Đeo Thử Đồng Hồ Cao Cấp</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition">Điều khoản</a>
            <a href="#" className="hover:text-white transition">Bảo mật</a>
            <a href="#" className="hover:text-white transition">Chính sách đổi trả</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
