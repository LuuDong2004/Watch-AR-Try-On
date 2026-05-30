import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../../auth/useAuth';
import { Button, TextInput } from '../../components/ui';

const DEMO = [
  { label: 'Admin', email: 'admin@watch.vn', password: 'admin123', tone: '#1A1A2E' },
  { label: 'Shop', email: 'aventus@watch.vn', password: 'shop123', tone: '#C9A84C' },
  { label: 'Khách', email: 'khach@watch.vn', password: 'khach123', tone: '#0b2a4a' },
];

export default function LoginPage() {
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = login(email, password);
    if (err) {
      setError(err);
      return;
    }
    const role = useAuth.getState().session!.role;
    navigate(homeForRole(role), { replace: true });
  }

  function quickFill(d: (typeof DEMO)[number]) {
    setEmail(d.email);
    setPassword(d.password);
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#10121a] via-[#161a26] to-[#0c0e15] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">🕐</span>
          <span className="font-display text-xl font-semibold">Watch AR Studio</span>
        </Link>
        <h1 className="text-center font-display text-2xl font-semibold">Đăng nhập</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Quản trị viên & chủ shop đăng nhập tại đây
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" variant="primary" block className="py-3">
            Đăng nhập
          </Button>
        </form>

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

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-gray-400 hover:text-gray-700"
        >
          ← Tiếp tục mua sắm không cần đăng nhập
        </Link>
      </div>
    </div>
  );
}
