import { useState } from 'react';
import { useData } from '../../data/store';
import { useAuth } from '../../auth/useAuth';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, EmptyState, WatchDisc } from '../../components/ui';
import { WatchFormModal, WatchFormValues } from '../../components/WatchFormModal';
import { formatVND } from '../../lib/format';
import type { Watch } from '../../data/types';
import { SHOP_NAV } from './shopNav';

export default function ShopProductsPage() {
  const shopId = useAuth((s) => s.session?.shopId);
  const watches = useData((s) => s.watches.filter((w) => w.shopId === shopId));
  const shops = useData((s) => s.shops);
  const addWatch = useData((s) => s.addWatch);
  const updateWatch = useData((s) => s.updateWatch);
  const deleteWatch = useData((s) => s.deleteWatch);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Watch | null>(null);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(w: Watch) {
    setEditing(w);
    setModalOpen(true);
  }
  function save(values: WatchFormValues) {
    if (editing) updateWatch(editing.id, values);
    else addWatch(values);
    setModalOpen(false);
  }
  function remove(w: Watch) {
    if (window.confirm(`Xoá "${w.name}"?`)) deleteWatch(w.id);
  }

  return (
    <DashboardLayout title="Quản lý shop" nav={SHOP_NAV}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Sản phẩm của shop</h2>
          <p className="text-sm text-gray-500">{watches.length} đồng hồ</p>
        </div>
        <Button variant="gold" onClick={openAdd}>
          + Thêm đồng hồ
        </Button>
      </div>

      {watches.length === 0 ? (
        <EmptyState icon="⌚" title="Chưa có sản phẩm" hint="Bấm “Thêm đồng hồ” để đăng sản phẩm đầu tiên." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Thương hiệu</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {watches.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <WatchDisc metal={w.metal} dial={w.dial} accent={w.accent} />
                      <span className="font-medium">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{w.brand}</td>
                  <td className="px-4 py-3 font-medium">{formatVND(w.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(w)}
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
        lockedShopId={shopId}
        onSave={save}
      />
    </DashboardLayout>
  );
}
