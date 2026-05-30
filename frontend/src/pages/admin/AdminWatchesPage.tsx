import { useState } from 'react';
import { useData } from '../../data/store';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge, Button, EmptyState, WatchDisc } from '../../components/ui';
import { WatchFormModal, WatchFormValues } from '../../components/WatchFormModal';
import { formatVND } from '../../lib/format';
import type { Watch } from '../../data/types';
import { ADMIN_NAV } from './adminNav';

export default function AdminWatchesPage() {
  const watches = useData((s) => s.watches);
  const shops = useData((s) => s.shops);
  const addWatch = useData((s) => s.addWatch);
  const updateWatch = useData((s) => s.updateWatch);
  const deleteWatch = useData((s) => s.deleteWatch);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Watch | null>(null);
  const [query, setQuery] = useState('');

  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? '—';
  const filtered = watches.filter(
    (w) =>
      !query.trim() ||
      w.name.toLowerCase().includes(query.toLowerCase()) ||
      w.brand.toLowerCase().includes(query.toLowerCase()),
  );

  function save(values: WatchFormValues) {
    if (editing) updateWatch(editing.id, values);
    else addWatch(values);
    setModalOpen(false);
  }
  function remove(w: Watch) {
    if (window.confirm(`Xoá "${w.name}"?`)) deleteWatch(w.id);
  }

  return (
    <DashboardLayout title="Đồng hồ" nav={ADMIN_NAV}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Tất cả đồng hồ</h2>
          <p className="text-sm text-gray-500">{watches.length} sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm…"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
          <Button
            variant="gold"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Thêm
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="⌚" title="Không có đồng hồ" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Cửa hàng</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <WatchDisc metal={w.metal} dial={w.dial} accent={w.accent} />
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-gray-400">{w.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{shopName(w.shopId)}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatVND(w.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(w);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => remove(w)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WatchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        watch={editing}
        shops={shops}
        onSave={save}
      />
    </DashboardLayout>
  );
}
