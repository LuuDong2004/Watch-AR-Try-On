import { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { ApiError, authApi } from '../../api';

/**
 * Full-screen overlay reached from the password-reset email link
 * (/reset-password?token=...). Lets the user set a new password, then prompts
 * them to sign in. Rendered by App.jsx when a reset token is present.
 */
export default function ResetPasswordScreen({ token, onClose, onLoginClick }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (password !== confirm) { setError('Xác nhận mật khẩu không khớp.'); return; }
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pl-10 text-sm outline-none focus:border-[#B8924A]';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-[#14110c] border border-[#B8924A]/30 p-8 shadow-2xl text-[#F6F4EF]">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/50 hover:text-white" aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-wide bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] bg-clip-text text-transparent">
            TrueWrist
          </div>
          <p className="mt-1 text-xs text-white/50">Đặt lại mật khẩu</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-green-400/20 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">Đổi mật khẩu thành công</p>
            <p className="mt-1.5 text-xs leading-5 text-white/60">
              Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
            </p>
            <button
              onClick={onLoginClick}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105"
            >
              Đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs leading-5 text-white/55">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className={inputCls}
              />
            </div>

            {error && <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
