import { useState } from 'react';
import { useData } from '../../data/store';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, EmptyState, Modal, TextArea, TextInput } from '../../components/ui';
import type { Shop } from '../../data/types';
import { ADMIN_NAV } from './adminNav';

function ShopForm({
  open,
  onClose,
  shop,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  shop: Shop | null;
  onSave: (v: Omit<Shop, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState(shop?.name ?? '');
  const [phone, setPhone] = useState(shop?.phone ?? '');
  const [email, setEmail] = useState(shop?.email ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [color, setColor] = useState(shop?.color ?? '#C9A84C');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), phone, email, address, description, color });
  }

  return (
    <Modal open={open} onClose={onClose} title={shop ? 'Sửa cửa hàng' : 'Thêm cửa hàng'}>
      <form onSubmit={submit} className="space-y-4">
        <TextInput label="Tên cửa hàng" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <TextInput label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} />
        <TextArea label="Giới thiệu" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Màu thương hiệu
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-gray-200"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary">
            {shop ? 'Lưu' : 'Thêm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminShopsPage() {
  const shops = useData((s) => s.shops);
  const watches = useData((s) => s.watches);
  const addShop = useData((s) => s.addShop);
  const updateShop = useData((s) => s.updateShop);
  const deleteShop = useData((s) => s.deleteShop);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);

  const productCount = (id: string) => watches.filter((w) => w.shopId === id).length;

  function save(v: Omit<Shop, 'id' | 'createdAt'>) {
    if (editing) updateShop(editing.id, v);
    else addShop(v);
    setOpen(false);
  }
  function remove(s: Shop) {
    if (window.confirm(`Xoá cửa hàng "${s.name}"? Mọi sản phẩm của shop cũng sẽ bị xoá.`)) deleteShop(s.id);
  }

  return (
    <DashboardLayout title="Cửa hàng" nav={ADMIN_NAV}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Cửa hàng</h2>
          <p className="text-sm text-gray-500">{shops.length} cửa hàng</p>
        </div>
        <Button
          variant="gold"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Thêm cửa hàng
        </Button>
      </div>

      {shops.length === 0 ? (
        <EmptyState icon="🏬" title="Chưa có cửa hàng" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: s.color }}
                >
                  {s.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-gray-400">{productCount(s.id)} sản phẩm</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>📞 {s.phone || '—'}</p>
                <p className="truncate">✉️ {s.email || '—'}</p>
                <p className="truncate">📍 {s.address || '—'}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sửa
                </button>
                <button
                  onClick={() => remove(s)}
                  className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShopForm open={open} onClose={() => setOpen(false)} shop={editing} onSave={save} />
    </DashboardLayout>
  );
}
