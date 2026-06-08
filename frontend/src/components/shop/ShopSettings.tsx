import React, { useState, useEffect } from 'react';
import {
  Store, Pencil, Upload, X, MapPin, Phone, Clock,
  ImageOff, Trash2, Map as MapIcon, Plus, MoreVertical, Star, Lock,
} from 'lucide-react';
import { shopApi, uploadApi, ApiError } from '../../api';
import type { Shop } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';
import { mapDirectionsUrl } from '../../utils/maps';
import { IMAGE_FILE_ACCEPT, validateImageFile } from '../../utils/uploads';
import MapPreview from '../MapPreview';
import ImageAdjustModal from './ImageAdjustModal';

/** Fallback cover shown when a shop has no image of its own. */
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200';

/** Blank shop used by the "create" flow (no id ⇒ POST instead of PUT). */
const emptyShop = (): Shop => ({
  id: '', name: '', phone: '', email: '', address: '', description: '',
  zalo: '', messenger: '', hours: '', manager: '', image: '', mapUrl: '',
  services: [], status: 'active',
});

type ShopErrors = Partial<Record<'name' | 'address' | 'phone' | 'zalo' | 'messenger' | 'mapUrl', string>>;

/** Client-side validation for the create/edit shop form. */
function validateShop(s: Shop): ShopErrors {
  const e: ShopErrors = {};
  const isUrl = (v?: string) => { const t = (v || '').trim(); return !t || /^https?:\/\/.+/i.test(t); };

  if (!s.name?.trim()) e.name = 'Vui lòng nhập tên cửa hàng';
  else if (s.name.trim().length < 2) e.name = 'Tên cửa hàng quá ngắn';

  if (!s.address?.trim()) e.address = 'Vui lòng nhập địa chỉ chi nhánh';

  const phone = (s.phone || '').trim();
  if (!phone) e.phone = 'Vui lòng nhập hotline';
  else if (!/^[0-9+\-\s().]{8,20}$/.test(phone) || phone.replace(/\D/g, '').length < 8) e.phone = 'Số điện thoại không hợp lệ';

  if (!isUrl(s.zalo)) e.zalo = 'Link phải bắt đầu bằng http:// hoặc https://';
  if (!isUrl(s.messenger)) e.messenger = 'Link phải bắt đầu bằng http:// hoặc https://';
  if (!isUrl(s.mapUrl)) e.mapUrl = 'Link bản đồ phải bắt đầu bằng http:// hoặc https://';
  return e;
}

export default function ShopSettings() {
  const user = useSession((s) => s.user);
  const refreshSession = useSession((s) => s.init);
  const [shops, setShops] = useState<Shop[]>([]);
  const [editingRoom, setEditingRoom] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Which card's action menu is open (compact "⋮" → edit/map/delete).
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  // File picked for the cover, pending crop/confirm in the adjust modal.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Close any open card menu on an outside click.
  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  const reloadShops = async () => {
    try { setShops(await shopApi.mine()); } catch { setShops([]); }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    shopApi.mine()
      .then((list) => { if (!cancelled) setShops(list); })
      .catch(() => { if (!cancelled) setShops([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const openEditor = (room: Shop) => setEditingRoom({ ...room });
  const openCreate = () => setEditingRoom(emptyShop());
  const closeEditor = () => { setEditingRoom(null); setPendingFile(null); };
  const handlePickCoverFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setPendingFile(file);
  };

  // Crop confirmed → upload the framed JPEG to MinIO and store its URL.
  const handleCroppedUpload = async (blob: Blob) => {
    setUploading(true);
    try {
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      const url = await uploadApi.image(file, 'shops');
      setEditingRoom((prev) => (prev ? { ...prev, image: url } : prev));
      setPendingFile(null);
      toast.success('Đã tải ảnh bìa lên');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => setEditingRoom((prev) => (prev ? { ...prev, image: '' } : prev));

  const handleSetPrimary = async (shopId: string) => {
    setMenuOpenId(null);
    try {
      await shopApi.activate(shopId);
      await refreshSession();
      await reloadShops();
      toast.success('Đã đặt làm cửa hàng chính');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không đặt được cửa hàng chính');
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!shopId || deleting) return;
    const ok = await toast.confirm(
      'Toàn bộ sản phẩm đang bán của cửa hàng cũng sẽ bị xóa và không thể khôi phục.',
      { title: 'Xóa cửa hàng này?', confirmText: 'Xóa cửa hàng', danger: true },
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await shopApi.remove(shopId);
      // Products are removed and the owner unlinked on the server; refresh the
      // session (user.shopId may clear) and reload the owned-shop list.
      await refreshSession();
      await reloadShops();
      closeEditor();
      toast.success('Đã xóa cửa hàng cùng toàn bộ sản phẩm của cửa hàng.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Xóa cửa hàng thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const isCreate = !editingRoom.id;
    setSaving(true);
    try {
      if (isCreate) {
        await shopApi.create(editingRoom);
        // Backend links the new shop to the current user; refresh so user.shopId
        // updates, then reload the owned-shop list.
        await refreshSession();
        await reloadShops();
        closeEditor();
        toast.success('Đã tạo cửa hàng mới thành công!');
      } else {
        await shopApi.update(editingRoom.id, editingRoom);
        await reloadShops();
        closeEditor();
        toast.success('Đã cập nhật thông tin cửa hàng thành công!');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F6F4EF] min-h-screen w-full flex items-center justify-center text-sm text-[#8A8170]">
        Đang tải…
      </div>
    );
  }

  const showrooms = shops;

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Cài Đặt Cửa Hàng</h1>
        <p className="text-xs text-gray-500 mt-1">Quản lý thông tin, ảnh bìa, bản đồ chỉ đường và kênh liên hệ của cửa hàng bạn quản lý</p>
      </header>

      <div className="mb-4 flex items-center justify-between border-b border-[#e5e0d8] pb-2">
        <h3 className="font-display text-sm font-bold flex items-center gap-2">
          <Store className="h-4 w-4 text-[#B8924A]" /> Cửa hàng của tôi ({showrooms.length})
        </h3>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#17140F] px-3 py-2 text-xs font-bold text-white transition hover:bg-black active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Tạo cửa hàng mới
        </button>
      </div>

      {showrooms.length === 0 && (
        <button
          onClick={openCreate}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-[#cdbf9f] bg-white p-10 text-center text-gray-400 transition hover:border-[#B8924A] hover:text-[#B8924A]"
        >
          <Plus className="h-7 w-7" />
          <span className="text-xs font-semibold">Chưa có cửa hàng — bấm để tạo cửa hàng đầu tiên của bạn</span>
        </button>
      )}

      {/* Shop cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {showrooms.map((room) => {
          const directions = mapDirectionsUrl(room.mapUrl);
          const locked = room.status === 'locked';
          return (
            <div key={room.id} className="group bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden flex flex-col">
              {/* Cover */}
              <div className="relative h-32 bg-[#F6F4EF]">
                <img
                  src={room.image || DEFAULT_COVER}
                  alt={room.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.src = DEFAULT_COVER; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                {room.id === user?.shopId && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#B8924A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">Cửa hàng chính</span>
                )}
                {locked && (
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                    <Lock className="h-2.5 w-2.5" /> Đã khóa
                  </span>
                )}
                <h4 className="absolute bottom-2 left-3 right-3 font-display text-sm font-bold text-white truncate">{room.name}</h4>
                {/* Compact action menu: one "⋮" reveals edit / map / delete */}
                <div className="absolute right-2 top-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {menuOpenId === room.id && (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      {room.id !== user?.shopId && !locked && (
                        <button
                          onClick={() => handleSetPrimary(room.id)}
                          title="Đặt làm cửa hàng chính"
                          aria-label="Đặt làm cửa hàng chính"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#B8924A] shadow hover:bg-white active:scale-95 transition"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      {!locked && (
                        <button
                          onClick={() => { setMenuOpenId(null); openEditor(room); }}
                          title="Sửa thông tin"
                          aria-label="Sửa thông tin"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#17140F] shadow hover:bg-white active:scale-95 transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {directions && (
                        <a
                          href={directions}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setMenuOpenId(null)}
                          title="Mở chỉ đường"
                          aria-label="Mở chỉ đường"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#B8924A] shadow hover:bg-white active:scale-95 transition"
                        >
                          <MapIcon className="h-4 w-4" />
                        </a>
                      )}
                      {!locked && (
                        <button
                          onClick={() => { setMenuOpenId(null); handleDelete(room.id); }}
                          disabled={deleting}
                          title="Xóa cửa hàng"
                          aria-label="Xóa cửa hàng"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white active:scale-95 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setMenuOpenId((id) => (id === room.id ? null : room.id))}
                    title="Tùy chọn"
                    aria-label="Tùy chọn"
                    aria-expanded={menuOpenId === room.id}
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow active:scale-95 transition ${
                      menuOpenId === room.id ? 'bg-[#17140F] text-white' : 'bg-white/90 text-[#17140F] hover:bg-white'
                    }`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick facts */}
              <div className="p-4 text-xs space-y-2 flex-1">
                <p className="flex items-start gap-1.5 text-gray-600"><MapPin className="h-3.5 w-3.5 text-[#B8924A] mt-0.5 shrink-0" /> <span className="line-clamp-2">{room.address || '—'}</span></p>
                <p className="flex items-center gap-1.5 text-gray-600"><Phone className="h-3.5 w-3.5 text-[#B8924A] shrink-0" /> {room.phone || '—'}</p>
                <p className="flex items-center gap-1.5 text-gray-600"><Clock className="h-3.5 w-3.5 text-[#B8924A] shrink-0" /> {room.hours || '—'}</p>
              </div>

              {locked ? (
                <div className="m-3 mt-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600">
                  <Lock className="h-3.5 w-3.5" /> Đã bị khóa
                </div>
              ) : (
                <button
                  onClick={() => openEditor(room)}
                  className="m-3 mt-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#17140F] py-2.5 text-xs font-bold text-white hover:bg-black active:scale-[0.98] transition"
                >
                  <Pencil className="h-3.5 w-3.5" /> Sửa thông tin
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal (popup) */}
      {editingRoom && (
        <EditShopModal
          room={editingRoom}
          setRoom={setEditingRoom}
          saving={saving}
          uploading={uploading}
          deleting={deleting}
          onPickFile={handlePickCoverFile}
          onClearImage={clearImage}
          onSave={handleSave}
          onDelete={() => handleDelete(editingRoom.id)}
          onClose={closeEditor}
        />
      )}

      {/* Cover crop/adjust modal (sits above the edit modal) */}
      {pendingFile && (
        <ImageAdjustModal
          file={pendingFile}
          aspect={16 / 9}
          title="Căn chỉnh ảnh bìa"
          busy={uploading}
          onCancel={() => setPendingFile(null)}
          onConfirm={handleCroppedUpload}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Edit modal */

interface EditShopModalProps {
  room: Shop;
  setRoom: React.Dispatch<React.SetStateAction<Shop | null>>;
  saving: boolean;
  uploading: boolean;
  deleting: boolean;
  onPickFile: (file: File) => void;
  onClearImage: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onClose: () => void;
}

function EditShopModal({ room, setRoom, saving, uploading, deleting, onPickFile, onClearImage, onSave, onDelete, onClose }: EditShopModalProps) {
  const [errors, setErrors] = useState<ShopErrors>({});

  // Update a field and clear any error attached to the keys being changed.
  const set = (patch: Partial<Shop>) => {
    setRoom((prev) => (prev ? { ...prev, ...patch } : prev));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(patch) as (keyof ShopErrors)[]).forEach((k) => delete next[k]);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateShop(room);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Vui lòng kiểm tra lại các trường được tô đỏ');
      return;
    }
    onSave(e);
  };

  const field = 'w-full rounded-lg border border-[#e5e0d8] px-3 py-2 text-[11px] focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition';
  const labelCls = 'mb-1 block text-[11px] font-bold text-gray-500';
  const errFor = (k: keyof ShopErrors) => (errors[k] ? ' border-red-400 focus:border-red-400 focus:ring-red-200' : '');
  const ErrMsg = ({ k }: { k: keyof ShopErrors }) => (errors[k] ? <p className="mt-1 text-[10px] font-semibold text-red-500">{errors[k]}</p> : null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[#e5e0d8] bg-white/95 px-5 py-3 backdrop-blur">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#17140F]">
            {room.id ? <Pencil className="h-4 w-4 text-[#B8924A]" /> : <Plus className="h-4 w-4 text-[#B8924A]" />}
            {room.id ? 'Hiệu chỉnh thông tin showroom' : 'Tạo cửa hàng mới'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 px-5 py-4 lg:grid-cols-2 lg:items-start">
          {/* Left column: visual */}
          <div className="space-y-3">
            {/* Cover image */}
            <div>
              <label className={labelCls}>Ảnh bìa cửa hàng</label>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#e5e0d8] bg-[#F6F4EF]">
                {room.image ? (
                  <img src={room.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-[11px]">Chưa có ảnh — đang dùng ảnh mặc định</span>
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#17140F] shadow hover:bg-white ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    <Upload className="h-3.5 w-3.5 text-[#B8924A]" />
                    {uploading ? 'Đang tải…' : 'Tải ảnh lên'}
                    <input
                      type="file"
                      accept={IMAGE_FILE_ACCEPT}
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ''; }}
                    />
                  </label>
                  {room.image && (
                    <button
                      type="button"
                      onClick={onClearImage}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-bold text-red-500 shadow hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">Tải ảnh lên để căn chỉnh tỉ lệ trước khi lưu. Xóa ảnh sẽ quay về ảnh mặc định.</p>
            </div>

          </div>

          {/* Right column: text fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Tên showroom</label>
              <input type="text" value={room.name} onChange={(e) => set({ name: e.target.value })} className={`${field}${errFor('name')}`} />
              <ErrMsg k="name" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Địa chỉ chi nhánh</label>
              <textarea value={room.address || ''} onChange={(e) => set({ address: e.target.value })} rows={2} className={`${field} resize-none${errFor('address')}`} />
              <ErrMsg k="address" />
            </div>

            <div>
              <label className={labelCls}>Hotline điện thoại</label>
              <input type="text" value={room.phone || ''} onChange={(e) => set({ phone: e.target.value })} className={`${field}${errFor('phone')}`} />
              <ErrMsg k="phone" />
            </div>

            <div>
              <label className={labelCls}>Giờ mở cửa</label>
              <input type="text" value={room.hours || ''} onChange={(e) => set({ hours: e.target.value })} className={field} placeholder="09:00 - 21:30" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Link Zalo Chat</label>
              <input type="text" value={room.zalo || ''} onChange={(e) => set({ zalo: e.target.value })} className={`${field} font-mono${errFor('zalo')}`} />
              <ErrMsg k="zalo" />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-3 lg:col-span-2 lg:grid-cols-2">
            <div>
              <label className={labelCls}>Link Google Maps (chỉ đường)</label>
              <input
                type="text"
                value={room.mapUrl || ''}
                onChange={(e) => set({ mapUrl: e.target.value })}
                placeholder="https://maps.app.goo.gl/..."
                className={`${field} font-mono${errFor('mapUrl')}`}
              />
              <ErrMsg k="mapUrl" />
              {room.mapUrl?.trim() ? (
                <MapPreview mapUrl={room.mapUrl} className="mt-2" />
              ) : (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-gray-400">
                  <MapIcon className="h-3.5 w-3.5" /> Dán link Google Maps để hiển thị bản đồ.
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Link Messenger Chat</label>
              <input
                type="text"
                value={room.messenger || ''}
                onChange={(e) => set({ messenger: e.target.value })}
                className={`${field} font-mono${errFor('messenger')}`}
              />
              <ErrMsg k="messenger" />
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-b-2xl border-t border-[#e5e0d8] bg-white/95 px-5 py-2.5 font-bold backdrop-blur">
          <div>
            {room.id && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? 'Đang xóa…' : 'Xóa cửa hàng'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e0d8] px-4 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-[#17140F] px-4 py-2 text-xs text-white transition hover:bg-black disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : room.id ? 'Lưu thay đổi' : 'Tạo cửa hàng'}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
