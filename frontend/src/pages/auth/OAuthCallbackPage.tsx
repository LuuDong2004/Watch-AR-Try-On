import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, homeForRole } from '../../auth/useAuth';

/**
 * Landing page for the Google OAuth redirect. The backend appends ?token=<jwt>;
 * we adopt it, fetch the user, and route to their home.
 */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const adoptToken = useAuth((s) => s.adoptToken);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      setError('Đăng nhập Google thất bại: thiếu token.');
      return;
    }
    adoptToken(token).then((err) => {
      if (err) {
        setError(err);
        return;
      }
      const role = useAuth.getState().session?.role ?? 'customer';
      navigate(homeForRole(role), { replace: true });
    });
  }, [params, adoptToken, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF] px-4 text-center">
      {error ? (
        <div className="max-w-sm">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="rounded-xl bg-[#B8924A] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Về trang đăng nhập
          </button>
        </div>
      ) : (
        <p className="animate-pulse text-sm font-medium text-[#B8924A]">Đang hoàn tất đăng nhập Google…</p>
      )}
    </div>
  );
}
