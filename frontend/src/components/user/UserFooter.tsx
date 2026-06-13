import React from 'react';
import { MapPin, Phone, Mail, Clock, UserPlus, Sparkles, ArrowUpRight } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import { useLoginPrompt } from '../../auth/loginPrompt';
import { useSession } from '../../auth/session';

interface UserFooterProps {
  onChangePage: (page: string) => void;
}

const SOCIALS = ['Facebook', 'Instagram', 'YouTube', 'TikTok'];

export default function UserFooter({ onChangePage }: UserFooterProps) {
  const showLogin = useLoginPrompt((s) => s.show);
  const user = useSession((s) => s.user);

  return (
    <footer className="relative mt-auto bg-[#14110c] font-sans text-[#F6F4EF]">
      {/* gold hairline */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#B8924A]/70 to-transparent" />

      {/* Account CTA band */}
      {!user && (
        <div className="border-b border-white/[0.07]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B8924A]/30 bg-[#B8924A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7CE8F]">
                <Sparkles className="h-3 w-3" /> Tài khoản TrueWrist
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold leading-snug md:text-[1.7rem]">
                Đăng ký tài khoản để lưu yêu thích &amp; đặt lịch thử AR
              </h3>
              <p className="mt-1.5 max-w-xl text-sm text-gray-400">
                Tạo tài khoản miễn phí để lưu mẫu yêu thích, theo dõi lịch hẹn và trải nghiệm thử đeo AR độc quyền.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => showLogin('register')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105 active:scale-95"
              >
                <UserPlus className="h-4 w-4" /> Đăng ký tài khoản
              </button>
              <button
                onClick={() => showLogin('login')}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-[#B8924A] hover:text-white"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-4 py-14 md:grid-cols-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-5">
          <BrandLogo surface="dark" size="md" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
            Sàn trưng bày đồng hồ cao cấp kết hợp công nghệ thử đeo AR thời gian thực — đeo thử trước, liên hệ shop sau.
          </p>
          <div className="mt-5 flex gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s}
                href="#"
                title={s}
                aria-label={s}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-bold text-gray-300 transition hover:border-[#B8924A] hover:bg-[#B8924A] hover:text-black"
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Khám phá */}
        <div className="md:col-span-3">
          <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#B8924A]">Khám phá</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            {[
              { label: 'Trang chủ', page: 'home' },
              { label: 'Bộ sưu tập', page: 'catalog' },
              { label: 'Cửa hàng', page: 'stores' },
              { label: 'Trở thành đối tác', page: 'pricing' },
            ].map((it) => (
              <li key={it.page}>
                <button
                  onClick={() => onChangePage(it.page)}
                  className="group inline-flex items-center gap-1 transition hover:text-white"
                >
                  {it.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100 group-hover:text-[#B8924A]" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Liên hệ */}
        <div className="col-span-2 md:col-span-4">
          <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#B8924A]">Liên hệ</h4>
          <ul className="space-y-3.5 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8924A]" /> 15 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-[#B8924A]" /> 1900 6868
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-[#B8924A]" /> care@truewrist.vn
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-[#B8924A]" /> 09:00 – 21:30 · cả tuần
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-gray-500 sm:flex-row">
          <span>© 2026 TrueWrist · Sàn Trưng Bày &amp; Đeo Thử Đồng Hồ Cao Cấp</span>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-white">Điều khoản</a>
            <a href="#" className="transition hover:text-white">Bảo mật</a>
            <a href="#" className="transition hover:text-white">Đổi trả</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
