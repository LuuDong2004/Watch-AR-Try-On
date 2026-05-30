import { useState } from 'react';
import { useData } from '../../data/store';
import { useAuth } from '../../auth/useAuth';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, EmptyState, TextInput, TextArea } from '../../components/ui';
import { SHOP_NAV } from './shopNav';

export default function ShopInfoPage() {
  const shopId = useAuth((s) => s.session?.shopId);
  const shop = useData((s) => s.shops.find((sh) => sh.id === shopId));
  const updateShop = useData((s) => s.updateShop);

  const [name, setName] = useState(shop?.name ?? '');
  const [phone, setPhone] = useState(shop?.phone ?? '');
  const [email, setEmail] = useState(shop?.email ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [color, setColor] = useState(shop?.color ?? '#C9A84C');
  const [saved, setSaved] = useState(false);

  if (!shop) {
    return (
      <DashboardLayout title="Quản lý shop" nav={SHOP_NAV}>
        <EmptyState icon="🏬" title="Chưa gắn cửa hàng" hint="Liên hệ quản trị viên để gán shop cho tài khoản này." />
      </DashboardLayout>
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    updateShop(shop!.id, { name, phone, email, address, description, color });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <DashboardLayout title="Quản lý shop" nav={SHOP_NAV}>
      <h2 className="mb-5 font-display text-xl font-semibold">Thông tin liên hệ cửa hàng</h2>

      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: color }}
          >
            {name.charAt(0) || '?'}
          </span>
          <label className="text-sm text-gray-600">
            Màu thương hiệu
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="ml-2 h-8 w-12 cursor-pointer rounded border border-gray-200 align-middle"
            />
          </label>
        </div>

        <TextInput label="Tên cửa hàng" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <TextInput label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} />
        <TextArea label="Giới thiệu" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary">
            Lưu thông tin
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600">✓ Đã lưu</span>}
        </div>
      </form>
    </DashboardLayout>
  );
}
