import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../../auth/useAuth';

/** Public storefront shell: top nav + footer. */
export function CustomerLayout({ children }: { children: ReactNode }) {
  const session = useAuth((s) => s.session);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0D0D0D]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🕐</span>
            <span className="font-display text-xl font-semibold">Watch AR Studio</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            <Link to="/" className="hover:text-black">Sản phẩm</Link>
            <a className="cursor-pointer hover:text-black">Thương hiệu</a>
            <a className="cursor-pointer hover:text-black">AR Try-On</a>
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                {session.role !== 'customer' && (
                  <Link
                    to={homeForRole(session.role)}
                    className="hidden rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:inline-block"
                  >
                    {session.role === 'admin' ? 'Trang quản trị' : 'Quản lý shop'}
                  </Link>
                )}
                <span className="hidden text-sm text-gray-500 sm:inline">{session.name}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © 2026 Watch AR Studio · Demo MVP · Thử đồng hồ bằng AR ngay trên trình duyệt
      </footer>
    </div>
  );
}
