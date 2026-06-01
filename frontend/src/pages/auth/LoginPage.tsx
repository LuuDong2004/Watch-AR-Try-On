import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../../auth/useAuth';
import { googleLoginUrl } from '../../api/auth';
import { Button, TextInput } from '../../components/ui';

const DEMO = [
  { label: 'Admin', email: 'admin@watch.vn', password: 'admin123', tone: '#1A1A2E' },
  { label: 'Shop', email: 'aventus@watch.vn', password: 'shop123', tone: '#C9A84C' },
  { label: 'Khách', email: 'khach@watch.vn', password: 'khach123', tone: '#0b2a4a' },
];

type Mode = 'login' | 'register';

export default function LoginPage() {
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    const role = useAuth.getState().session!.role;
    navigate(homeForRole(role), { replace: true });
  }

  function quickFill(d: (typeof DEMO)[number]) {
    setMode('login');
    setEmail(d.email);
    setPassword(d.password);
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#10121a] via-[#161a26] to-[#0c0e15] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">🕐</span>
          <span className="font-display text-xl font-semibold">TrueWrist</span>
        </Link>

        <h1 className="text-center font-display text-2xl font-semibold">
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          {mode === 'login'
            ? 'Đăng nhập để lưu yêu thích, đặt lịch và quản lý cửa hàng'
            : 'Đăng ký tài khoản khách để lưu yêu thích & lịch sử thử AR'}
        </p>

        {/* Google */}
        <a
          href={googleLoginUrl()}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <GoogleIcon /> Tiếp tục với Google
        </a>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-widest text-gray-400">hoặc</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <TextInput
              label="Họ tên"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          )}
          <TextInput
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@watch.vn"
            required
          />
          <TextInput
            label="Mật khẩu"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={mode === 'register' ? 6 : undefined}
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" variant="primary" block className="py-3" disabled={busy}>
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-[#B8924A] hover:underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-[#B8924A] hover:underline"
              >
                Đăng nhập
              </button>
            </>
          )}
        </p>

        <div className="mt-6">
          <p className="mb-2 text-center text-xs uppercase tracking-widest text-gray-400">
            Tài khoản demo (bấm để điền)
          </p>
          <div className="flex justify-center gap-2">
            {DEMO.map((d) => (
              <button
                key={d.label}
                onClick={() => quickFill(d)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                style={{ background: d.tone }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Link to="/" className="mt-6 block text-center text-sm text-gray-400 hover:text-gray-700">
          ← Tiếp tục mua sắm không cần đăng nhập
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
