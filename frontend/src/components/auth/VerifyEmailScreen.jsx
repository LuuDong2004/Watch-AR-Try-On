import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ApiError, authApi } from '../../api';
import { useSession } from '../../auth/session';

/**
 * Full-screen overlay reached from the email-verification link
 * (/verify-email?token=...). Verifies the token, signs the user in, and prompts
 * them to continue. Rendered by App.jsx when a verify token is present.
 */
export default function VerifyEmailScreen({ token, onClose, onLoginClick }) {
  const init = useSession((s) => s.init);
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authApi.verifyEmail(token); // stores the JWT
        await init(); // rehydrate the session as the newly-verified user
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err instanceof ApiError ? err.message : 'Liên kết xác minh không hợp lệ.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, init]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-[#14110c] border border-[#B8924A]/30 p-8 shadow-2xl text-[#F6F4EF]">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-wide bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] bg-clip-text text-transparent">
            TrueWrist
          </div>
          <p className="mt-1 text-xs text-white/50">Xác minh email</p>
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#E7CE8F]" />
            <p className="text-sm text-white/70">Đang xác minh email của bạn…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-2xl border border-green-400/20 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">Xác minh thành công!</p>
            <p className="mt-1.5 text-xs leading-5 text-white/60">
              Tài khoản của bạn đã được kích hoạt và đăng nhập. Chúc bạn trải nghiệm vui vẻ!
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105"
            >
              Vào trang chủ
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-400/20 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300">
              <XCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">Xác minh không thành công</p>
            <p className="mt-1.5 text-xs leading-5 text-white/60">{message}</p>
            <button
              onClick={onLoginClick}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#E7CE8F] to-[#B8924A] py-3 text-sm font-semibold text-black transition hover:brightness-105"
            >
              Về đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
