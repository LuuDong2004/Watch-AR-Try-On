import React, { useRef, useState } from 'react';
import {
  X, Camera, Check, RefreshCw, Mail, Lock, Eye, EyeOff, Trash2, User as UserIcon, ShieldCheck, Phone,
} from 'lucide-react';
import type { User } from '../../api';
import { authApi, uploadApi, ApiError } from '../../api';
import { toast } from '../../store/useToast';
import ImageAdjustModal from '../shop/ImageAdjustModal';

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const initialsOf = (name: string, email: string) =>
  (name || email || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function ProfileEditModal({ user, onClose, onSaved }: ProfileEditModalProps) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);

  const [showPwdSection, setShowPwdSection] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [adjustFile, setAdjustFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isGoogle = user.provider === 'google';
  const initials = initialsOf(name, user.email);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setAdjustFile(f);
    e.target.value = '';
  };

  const handleCropped = async (blob: Blob) => {
    try {
      setUploading(true);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const url = await uploadApi.image(file, 'avatars');
      setAvatar(url);
      setAdjustFile(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được ảnh đại diện.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Vui lòng nhập họ tên.'); return; }

    const wantPassword = showPwdSection && !!newPassword;
    if (wantPassword) {
      if (newPassword.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
      if (newPassword !== confirmPassword) { toast.error('Xác nhận mật khẩu không khớp.'); return; }
      if (!isGoogle && !currentPassword) { toast.error('Vui lòng nhập mật khẩu hiện tại.'); return; }
    }

    const payload: Parameters<typeof authApi.updateProfile>[0] = {
      name: name.trim(),
      avatar: avatar ?? '',
      phone: phone.trim(),
    };
    if (wantPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      setSaving(true);
      const updated = await authApi.updateProfile(payload);
      toast.success('Đã cập nhật hồ sơ.');
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không cập nhật được hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-sm focus:border-[#B8924A] focus:bg-white focus:outline-none';

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
        <form
          onSubmit={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#e5e0d8] bg-white shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-[#e5e0d8] bg-white px-6 py-4">
            <h3 className="font-display text-lg font-bold text-[#17140F]">Chỉnh sửa hồ sơ</h3>
            <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#B8924A] bg-[#17140F] text-2xl font-bold text-[#F6F4EF]">
                  {avatar ? (
                    <img src={avatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Đổi ảnh đại diện"
                  aria-label="Đổi ảnh đại diện"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#B8924A] text-white shadow hover:bg-[#9A7434] disabled:opacity-60"
                >
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-bold text-[#9A7434] hover:underline">
                  Tải ảnh lên
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Xóa ảnh
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </div>

            {/* Name */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Họ và tên</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${field} pl-9`} placeholder="Tên của bạn" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Số điện thoại</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${field} pl-9`}
                  placeholder="09xx xxx xxx"
                  autoComplete="tel"
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Dùng để tự điền khi bạn liên hệ / đặt lịch với shop.</p>
            </div>

            {/* Email (read-only — login identity cannot change) */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={user.email} readOnly disabled className={`${field} cursor-not-allowed pl-9 opacity-70`} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Email đăng nhập không thể thay đổi.</p>
            </div>

            {/* Password section toggle */}
            <div className="rounded-2xl border border-[#e5e0d8] bg-[#FAF9F7] p-4">
              <button
                type="button"
                onClick={() => setShowPwdSection((s) => !s)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#17140F]">
                  <ShieldCheck className="h-4 w-4 text-[#B8924A]" />
                  {isGoogle ? 'Tạo mật khẩu đăng nhập' : 'Đổi mật khẩu'}
                </span>
                <span className="text-[11px] font-semibold text-[#9A7434]">{showPwdSection ? 'Ẩn' : 'Mở'}</span>
              </button>

              {showPwdSection && (
                <div className="mt-4 space-y-3">
                  {isGoogle && (
                    <p className="text-[11px] leading-4 text-gray-500">
                      Tài khoản đăng nhập bằng Google. Bạn có thể đặt thêm mật khẩu để đăng nhập bằng email.
                    </p>
                  )}
                  {!isGoogle && (
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`${field} pl-9`}
                        placeholder="Mật khẩu hiện tại"
                        autoComplete="current-password"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${field} pl-9 pr-10`}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${field} pl-9`}
                      placeholder="Xác nhận mật khẩu mới"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-3xl border-t border-[#e5e0d8] bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#17140F] px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {adjustFile && (
        <ImageAdjustModal
          file={adjustFile}
          aspect={1}
          outputWidth={400}
          title="Căn chỉnh ảnh đại diện"
          helpText="Kéo để di chuyển, dùng thanh trượt để phóng to khung vuông"
          confirmText="Dùng ảnh này"
          busy={uploading}
          onCancel={() => setAdjustFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </>
  );
}
