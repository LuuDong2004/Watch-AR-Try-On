import { useState } from 'react';
import { X, ArrowLeft, MailCheck } from 'lucide-react';
import { useSession } from '../../auth/session';
import { ApiError, authApi } from '../../api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const DEMO = [
  { label: 'Admin', email: 'admin@watch.vn', password: 'admin123' },
  { label: 'Shop', email: 'aventus@watch.vn', password: 'shop123' },
  { label: 'Khách', email: 'khach@watch.vn', password: 'khach123' },
];

/**
 * Full-screen sign-in / sign-up overlay. On success it just closes — App.jsx
 * reacts to the session change and swaps to the right shell (shop/admin) or
 * unlocks customer features.
 */
export default function LoginScreen({ onClose }) {
  const login = useSession((s) => s.login);
  const register = useSession((s) => s.register);

  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const switchTab = (t) => { setTab(t); setError(null); setSent(false); };

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === 'login') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      onClose?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  async function submitForgot(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  function quickFill(d) {
    switchTab('login');
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-[#14110c] border border-[#B8924A]/30 p-8 shadow-2xl text-[#F6F4EF]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-white"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-wide bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] bg-clip-text text-transparent">
            TrueWrist
          </div>
          <p className="mt-1 text-xs text-white/50">Đồng hồ chính hãng · Thử AR trực tuyến</p>
        </div>

        {tab === 'forgot' ? (
          /* ---- Forgot password ---- */
          <div>
            <button
              type="button"
              onClick={() => switchTab('login')}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
            </button>

            {sent ? (
              <div className="rounded-2xl border border-[#B8924A]/30 bg-white/5 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#B8924A]/15 text-[#E7CE8F]">
                  <MailCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">Kiểm tra hộp thư của bạn</p>
                <p className="mt-1.5 text-xs leading-5 text-white/60">
                  Nếu <span className="text-white/80">{email}</span> đã đăng ký, chúng tôi vừa gửi một
                  liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 60 phút.
                </p>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-3">
                <p className="text-xs leading-5 text-white/55">
                  Nhập email tài khoản, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.
                </p>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email đăng ký"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#B8924A]"
                />
                {error && (
                  <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
                >
                  {busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1 text-sm">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`rounded-full py-2 font-medium transition ${
                    tab === t ? 'bg-[#B8924A] text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {tab === 'register' && (
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#B8924A]"
                />
              )}
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#B8924A]"
              />
              <input
                type="password"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#B8924A]"
              />

              {tab === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-xs font-medium text-[#E7CE8F]/80 hover:text-[#E7CE8F]"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
              >
                {busy ? 'Đang xử lý…' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>

            {/* Google OAuth */}
            <a
              href={`${API_BASE}/oauth2/authorization/google`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.2 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.2 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C39.9 36.6 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
              </svg>
              Đăng nhập với Google
            </a>

            {/* Demo accounts */}
            <div className="mt-6">
              <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-white/30">
                Tài khoản demo (bấm để điền)
              </p>
              <div className="flex justify-center gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => quickFill(d)}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 hover:border-[#B8924A] hover:text-white"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
