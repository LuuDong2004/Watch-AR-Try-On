import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock, ShieldCheck, Store, Unlock, User as UserIcon, Eye, Search,
  X, Calendar, Building2, Globe, Check, Mail, Hash, MoreVertical,
} from 'lucide-react';
import { userApi, ApiError } from '../../api';
import type { User } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Khách hàng',
  shop: 'Showroom',
  admin: 'Quản trị viên',
};

const ROLE_ORDER: User['role'][] = ['customer', 'shop', 'admin'];

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Email & Mật khẩu',
  google: 'Google',
};

const roleBadgeClass = (role: User['role']) => {
  switch (role) {
    case 'admin': return 'bg-[#17140F] text-white';
    case 'shop': return 'bg-[#B8924A]/15 text-[#B8924A]';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const RoleIcon = ({ role, className }: { role: User['role']; className?: string }) => {
  if (role === 'admin') return <ShieldCheck className={className} />;
  if (role === 'shop') return <Store className={className} />;
  return <UserIcon className={className} />;
};

const initialsOf = (u: User) =>
  (u.name || u.email || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

type RoleFilter = 'all' | User['role'];
type StatusFilter = 'all' | User['status'];

export default function AdminUsers() {
  const currentUser = useSession((s) => s.user);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Search + filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Unified row actions menu (fixed-positioned to avoid table clipping):
  // view details + change role + lock/unlock, all under one "⋮" button.
  const [actionsMenu, setActionsMenu] = useState<{ user: User; x: number; y: number } | null>(null);
  // Detail modal
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const load = async () => {
    try {
      setError(null);
      const list = await userApi.list();
      setUsers(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: users.length,
    customer: users.filter((u) => u.role === 'customer').length,
    shop: users.filter((u) => u.role === 'shop').length,
    admin: users.filter((u) => u.role === 'admin').length,
    locked: users.filter((u) => u.status === 'locked').length,
  }), [users]);

  const handleSetRole = async (u: User, role: User['role']) => {
    setActionsMenu(null);
    if (u.role === role) return;
    if (u.id === currentUser?.id) {
      toast.info('Bạn không thể tự thay đổi vai trò của chính mình.');
      return;
    }

    const ok = await toast.confirm(
      `Đặt vai trò của ${u.name} thành ${ROLE_LABELS[role]}?`,
      { title: 'Xác nhận thay đổi vai trò', confirmText: 'Cập nhật' },
    );
    if (!ok) return;

    try {
      setSavingId(u.id);
      // Clear the shop assignment when the account is no longer a showroom.
      await userApi.update(u.id, { ...u, role, shopId: role === 'shop' ? u.shopId : '' });
      await load();
      setDetailUser((d) => (d && d.id === u.id ? { ...d, role, shopId: role === 'shop' ? d.shopId : null } : d));
      toast.success(`Đã cập nhật vai trò ${u.name} thành ${ROLE_LABELS[role]}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleBlock = async (u: User) => {
    if (u.id === currentUser?.id) {
      toast.info('Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }
    const nextStatus: User['status'] = u.status === 'locked' ? 'active' : 'locked';
    try {
      setSavingId(u.id);
      await userApi.update(u.id, { ...u, status: nextStatus });
      await load();
      setDetailUser((d) => (d && d.id === u.id ? { ...d, status: nextStatus } : d));
      toast.success(nextStatus === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingId(null);
    }
  };

  const openActionsMenu = (e: React.MouseEvent, u: User) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActionsMenu({ user: u, x: r.right, y: r.bottom + 6 });
  };

  const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString('vi-VN') : '—');
  const formatDateTime = (ts?: number) => (ts ? new Date(ts).toLocaleString('vi-VN') : '—');

  const filterPills: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.total },
    { key: 'customer', label: 'Khách hàng', count: counts.customer },
    { key: 'shop', label: 'Showroom', count: counts.shop },
    { key: 'admin', label: 'Quản trị', count: counts.admin },
  ];

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Quản Lý Tài Khoản</h1>
        <p className="text-xs text-gray-500 mt-1">Giám sát tài khoản khách hàng, đại lý và phân quyền hệ thống</p>
      </header>

      {/* Toolbar: search + filters */}
      <section className="bg-white rounded-3xl p-4 md:p-5 border border-[#e5e0d8] shadow-sm mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] text-xs focus:outline-none focus:border-[#B8924A] focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Role pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterPills.map((p) => (
              <button
                key={p.key}
                onClick={() => setRoleFilter(p.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition border ${
                  roleFilter === p.key
                    ? 'bg-[#17140F] text-white border-[#17140F]'
                    : 'bg-white text-gray-500 border-[#e5e0d8] hover:border-[#B8924A]/50'
                }`}
              >
                {p.label} <span className="opacity-60">{p.count}</span>
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="py-2.5 px-3 rounded-xl border border-[#e5e0d8] bg-white text-xs font-semibold text-gray-600 focus:outline-none focus:border-[#B8924A] cursor-pointer"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa ({counts.locked})</option>
          </select>
        </div>
      </section>

      {/* Users table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-gray-400 font-semibold">
            Hiển thị <span className="text-[#17140F] font-bold">{filtered.length}</span> / {users.length} tài khoản
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Tên người dùng</th>
                <th className="py-3 px-4">Địa chỉ Email</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Đăng nhập</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Đang tải…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="py-8 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">
                  {users.length === 0 ? 'Chưa có người dùng nào.' : 'Không tìm thấy tài khoản phù hợp.'}
                </td></tr>
              )}
              {!loading && !error && filtered.map((u) => {
                const isActive = u.status !== 'locked';
                const isSelf = u.id === currentUser?.id;
                return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#17140F]">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-[#17140F]/5 flex items-center justify-center text-[#17140F] flex-shrink-0 text-[10px] font-bold">
                        {initialsOf(u)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {u.name}
                        {isSelf && <span className="bg-[#B8924A]/15 text-[#B8924A] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">Bạn</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[9px] uppercase ${roleBadgeClass(u.role)}`}>
                      <RoleIcon role={u.role} className="h-3 w-3" />
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">{PROVIDER_LABELS[u.provider || ''] || u.provider || '—'}</td>
                  <td className="py-3.5 text-center">
                    {isActive ? (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => openActionsMenu(e, u)}
                      disabled={savingId === u.id}
                      title="Hành động"
                      aria-label="Hành động"
                      aria-haspopup="menu"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#17140F] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Unified row actions menu (fixed): view + role + lock/unlock */}
      {actionsMenu && (() => {
        const u = actionsMenu.user;
        const isSelf = u.id === currentUser?.id;
        const active = u.status !== 'locked';
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActionsMenu(null)} />
            <div
              className="fixed z-50 w-56 bg-white rounded-xl border border-[#e5e0d8] shadow-xl py-1.5 text-xs"
              style={{ top: actionsMenu.y, left: Math.max(8, actionsMenu.x - 224) }}
            >
              <button
                onClick={() => { setActionsMenu(null); setDetailUser(u); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[#17140F] hover:bg-[#F6F4EF] transition"
              >
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Xem chi tiết</span>
              </button>

              <div className="my-1 border-t border-gray-100" />
              <p className="px-3 py-1 text-[9px] uppercase tracking-wider text-gray-400 font-bold">Đặt vai trò</p>
              {ROLE_ORDER.map((role) => {
                const isCurrent = u.role === role;
                const disabled = isCurrent || isSelf;
                return (
                  <button
                    key={role}
                    onClick={() => handleSetRole(u, role)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                      disabled ? 'text-gray-300 cursor-not-allowed' : 'text-[#17140F] hover:bg-[#F6F4EF]'
                    }`}
                  >
                    <RoleIcon role={role} className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 font-semibold">{ROLE_LABELS[role]}</span>
                    {isCurrent && <Check className="h-3.5 w-3.5 text-[#B8924A]" />}
                  </button>
                );
              })}

              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setActionsMenu(null); handleToggleBlock(u); }}
                disabled={isSelf}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>

              {isSelf && (
                <p className="px-3 pt-1.5 text-[10px] italic text-gray-400">
                  Không thể đổi vai trò hoặc khóa tài khoản của chính bạn.
                </p>
              )}
            </div>
          </>
        );
      })()}

      {/* Detail modal */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          isSelf={detailUser.id === currentUser?.id}
          saving={savingId === detailUser.id}
          onClose={() => setDetailUser(null)}
          onSetRole={handleSetRole}
          onToggleBlock={handleToggleBlock}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
}

// --- Detail modal -----------------------------------------------------------

interface DetailProps {
  user: User;
  isSelf: boolean;
  saving: boolean;
  onClose: () => void;
  onSetRole: (u: User, role: User['role']) => void;
  onToggleBlock: (u: User) => void;
  formatDateTime: (ts?: number) => string;
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="h-8 w-8 rounded-lg bg-[#F6F4EF] flex items-center justify-center text-[#B8924A] flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">{label}</p>
        <div className="text-xs font-semibold text-[#17140F] break-words">{children}</div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, isSelf, saving, onClose, onSetRole, onToggleBlock, formatDateTime }: DetailProps) {
  const isActive = user.status !== 'locked';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl border border-[#e5e0d8] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-[#17140F] text-white p-6 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#F6F4EF] text-[#17140F] text-xl font-bold flex items-center justify-center border-2 border-[#B8924A] flex-shrink-0">
              {initialsOf(user)}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold truncate">{user.name}</h3>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded font-semibold text-[9px] uppercase ${roleBadgeClass(user.role)}`}>
                <RoleIcon role={user.role} className="h-3 w-3" />
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="divide-y divide-gray-50">
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Mã tài khoản">
              <span className="font-mono text-[11px]">{user.id}</span>
            </InfoRow>
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">{user.email}</InfoRow>
            <InfoRow icon={<Globe className="h-4 w-4" />} label="Phương thức đăng nhập">
              {PROVIDER_LABELS[user.provider || ''] || user.provider || '—'}
            </InfoRow>
            {user.role === 'shop' && (
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Showroom liên kết">
                {user.shopId || <span className="text-gray-400 font-normal">Chưa tạo showroom</span>}
              </InfoRow>
            )}
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Ngày tham gia">
              {formatDateTime(user.createdAt)}
            </InfoRow>
            <InfoRow icon={isActive ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />} label="Trạng thái">
              {isActive ? (
                <span className="text-green-600">Đang hoạt động</span>
              ) : (
                <span className="text-gray-500">Đã khóa</span>
              )}
            </InfoRow>
          </div>

          {/* Role management */}
          <div className="mt-5 pt-5 border-t border-[#e5e0d8]">
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-2.5">Phân quyền tài khoản</p>
            {isSelf ? (
              <p className="text-[11px] text-gray-400 italic">Bạn không thể tự thay đổi vai trò hoặc khóa tài khoản của chính mình.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {ROLE_ORDER.map((role) => {
                    const active = user.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => onSetRole(user, role)}
                        disabled={active || saving}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-bold transition ${
                          active
                            ? 'bg-[#17140F] text-white border-[#17140F] cursor-default'
                            : 'bg-white text-gray-600 border-[#e5e0d8] hover:border-[#B8924A] hover:text-[#B8924A] disabled:opacity-50'
                        }`}
                      >
                        <RoleIcon role={role} className="h-4 w-4" />
                        {ROLE_LABELS[role]}
                        {active && <span className="text-[8px] text-[#B8924A]">Hiện tại</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => onToggleBlock(user)}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition disabled:opacity-50 ${
                    isActive
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {isActive ? <><Lock className="h-4 w-4" /> Khóa tài khoản</> : <><Unlock className="h-4 w-4" /> Mở khóa tài khoản</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
