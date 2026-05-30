import { Link } from 'react-router-dom';
import { useData } from '../../data/store';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge, WatchDisc } from '../../components/ui';
import { formatVND, formatDate } from '../../lib/format';
import { ADMIN_NAV } from './adminNav';

function StatCard({ icon, label, value, to }: { icon: string; label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const watches = useData((s) => s.watches);
  const shops = useData((s) => s.shops);
  const users = useData((s) => s.users);

  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? '—';
  const recent = [...watches].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <DashboardLayout title="Tổng quan" nav={ADMIN_NAV}>
      <h2 className="mb-5 font-display text-xl font-semibold">Bảng điều khiển</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="⌚" label="Đồng hồ" value={watches.length} to="/admin/watches" />
        <StatCard icon="🏬" label="Cửa hàng" value={shops.length} to="/admin/shops" />
        <StatCard icon="👤" label="Tài khoản" value={users.length} to="/admin/users" />
        <StatCard
          icon="🔒"
          label="Tài khoản bị khoá"
          value={users.filter((u) => u.status === 'locked').length}
          to="/admin/users"
        />
      </div>

      <div className="mt-7 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold">Đồng hồ mới nhất</h3>
          <Link to="/admin/watches" className="text-sm font-medium text-gold hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-5 py-2.5">Sản phẩm</th>
              <th className="px-5 py-2.5">Cửa hàng</th>
              <th className="px-5 py-2.5">Giá</th>
              <th className="px-5 py-2.5">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recent.map((w) => (
              <tr key={w.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <WatchDisc metal={w.metal} dial={w.dial} accent={w.accent} size={36} />
                    <span className="font-medium">{w.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge tone="blue">{shopName(w.shopId)}</Badge>
                </td>
                <td className="px-5 py-3 font-medium">{formatVND(w.price)}</td>
                <td className="px-5 py-3 text-gray-500">{formatDate(w.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
