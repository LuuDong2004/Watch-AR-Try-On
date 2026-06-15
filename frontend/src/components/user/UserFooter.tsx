import React from 'react';
import { MapPin, Phone, Mail, Clock, UserPlus, Sparkles, ArrowUpRight } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import { useLoginPrompt } from '../../auth/loginPrompt';
import { useSession } from '../../auth/session';

interface UserFooterProps {
  onChangePage: (page: string) => void;
}

type IconProps = { className?: string };

const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
  </svg>
);

const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.44c-3.14 0-3.51.01-4.75.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.39-.32-1.71-.17-.43-.37-.74-.69-1.06-.32-.32-.63-.52-1.06-.69-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.75-.07Zm0 2.45a5.95 5.95 0 1 1 0 11.9 5.95 5.95 0 0 1 0-11.9Zm0 9.81a3.86 3.86 0 1 0 0-7.72 3.86 3.86 0 0 0 0 7.72Zm7.58-10.05a1.39 1.39 0 1 1-2.78 0 1.39 1.39 0 0 1 2.78 0Z" />
  </svg>
);

const YoutubeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.6 24 12 24 12s0-3.6-.5-5.5ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
  </svg>
);

const SOCIALS: { name: string; href: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61589994946734', Icon: FacebookIcon },
  { name: 'Instagram', href: '#', Icon: InstagramIcon },
  { name: 'YouTube', href: '#', Icon: YoutubeIcon },
];

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
                key={s.name}
                href={s.href}
                target={s.href === '#' ? undefined : '_blank'}
                rel={s.href === '#' ? undefined : 'noopener noreferrer'}
                title={s.name}
                aria-label={s.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-gray-300 transition hover:border-[#B8924A] hover:bg-[#B8924A] hover:text-black"
              >
                <s.Icon className="h-4 w-4" />
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
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8924A]" /> Hòa Lạc, Thạch Thất, Hà Nội
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
