import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

/** Shared sidebar shell for the admin + shop dashboards. */
export function DashboardLayout({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const session = useAuth((s) => s.session);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] text-[#0D0D0D]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-[#0F1117] text-white md:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <span className="text-2xl">🕐</span>
          <span className="font-display text-lg font-semibold">Watch AR</span>
        </Link>
        <p className="px-6 pb-2 text-[11px] uppercase tracking-widest text-white/40">{title}</p>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-gold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            <span>🏬</span> Xem cửa hàng
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3.5">
          {/* Mobile nav (horizontal scroll) */}
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-ink text-white' : 'text-gray-500'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block">
            <h1 className="font-display text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-7">{children}</main>
      </div>
    </div>
  );
}
