import { useState } from 'react';
import { useData } from '../../data/store';
import { useAuth } from '../../auth/useAuth';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge, Button, EmptyState, Modal, Select, TextInput } from '../../components/ui';
import type { Role, Shop, User } from '../../data/types';
import { ADMIN_NAV } from './adminNav';

const ROLE_LABEL: Record<Role, string> = { admin: 'Quản trị', shop: 'Chủ shop', customer: 'Khách hàng' };
const ROLE_TONE: Record<Role, 'red' | 'gold' | 'gray'> = { admin: 'red', shop: 'gold', customer: 'gray' };

function UserForm({
  open,
  onClose,
  user,
  shops,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  shops: Shop[];
  onSave: (v: Omit<User, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState(user?.password ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'customer');
  const [shopId, setShopId] = useState(user?.shopId ?? shops[0]?.id ?? '');
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập tên, email và mật khẩu.');
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      shopId: role === 'shop' ? shopId : undefined,
      status,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Sửa tài khoản' : 'Thêm tài khoản'}>
      <form onSubmit={submit} className="space-y-4">
        <TextInput label="Họ tên" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextInput label="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Vai trò" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="customer">Khách hàng</option>
            <option value="shop">Chủ shop</option>
            <option value="admin">Quản trị</option>
          </Select>
          {role === 'shop' && (
            <Select label="Cửa hàng" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <Select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as User['status'])}>
            <option value="active">Hoạt động</option>
            <option value="locked">Khoá</option>
          </Select>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary">
            {user ? 'Lưu' : 'Thêm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const users = useData((s) => s.users);
  const shops = useData((s) => s.shops);
  const addUser = useData((s) => s.addUser);
  const updateUser = useData((s) => s.updateUser);
  const deleteUser = useData((s) => s.deleteUser);
  const myId = useAuth((s) => s.session?.userId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const shopName = (id?: string) => (id ? shops.find((s) => s.id === id)?.name ?? '—' : '—');

  function save(v: Omit<User, 'id' | 'createdAt'>) {
    if (editing) updateUser(editing.id, v);
    else addUser(v);
    setOpen(false);
  }
  function remove(u: User) {
    if (u.id === myId) {
      window.alert('Không thể xoá tài khoản đang đăng nhập.');
      return;
    }
    if (window.confirm(`Xoá tài khoản "${u.name}"?`)) deleteUser(u.id);
  }
  function toggleLock(u: User) {
    updateUser(u.id, { status: u.status === 'active' ? 'locked' : 'active' });
  }

  return (
    <DashboardLayout title="Tài khoản" nav={ADMIN_NAV}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Tài khoản</h2>
          <p className="text-sm text-gray-500">{users.length} người dùng</p>
        </div>
        <Button
          variant="gold"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Thêm tài khoản
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState icon="👤" title="Chưa có tài khoản" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Cửa hàng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.role === 'shop' ? shopName(u.shopId) : '—'}</td>
                  <td className="px-4 py-3">
                    {u.status === 'active' ? (
                      <Badge tone="green">Hoạt động</Badge>
                    ) : (
                      <Badge tone="red">Đã khoá</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleLock(u)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(u);
                          setOpen(true);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => remove(u)}
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

      <UserForm open={open} onClose={() => setOpen(false)} user={editing} shops={shops} onSave={save} />
    </DashboardLayout>
  );
}
