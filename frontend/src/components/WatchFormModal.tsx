import { useState } from 'react';
import { Modal, Button, TextInput, TextArea, Select } from './ui';
import type { Shop, Watch } from '../data/types';
import { WATCHES as AR_CATALOGUE } from '../config/watches';

export type WatchFormValues = Omit<Watch, 'id' | 'createdAt'>;

const GLB_OPTIONS = [
  { value: '', label: '— Không có (dùng ảnh gradient) —' },
  { value: '/models/chronograph_watch.glb', label: 'chronograph_watch.glb' },
  { value: '/models/poly_wristwatch.glb', label: 'poly_wristwatch.glb' },
  { value: '/models/poly_watch.glb', label: 'poly_watch.glb' },
  { value: '/models/watch.glb', label: 'watch.glb' },
];

function specsToText(specs: Record<string, string>): string {
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

function textToSpecs(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  text.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k) out[k] = v;
    }
  });
  return out;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing watch to edit, or null to create. */
  watch: Watch | null;
  shops: Shop[];
  /** When set (shop role), the shop is fixed and not selectable. */
  lockedShopId?: string;
  onSave: (values: WatchFormValues) => void;
}

export function WatchFormModal({ open, onClose, watch, shops, lockedShopId, onSave }: Props) {
  const [name, setName] = useState(watch?.name ?? '');
  const [brand, setBrand] = useState(watch?.brand ?? '');
  const [price, setPrice] = useState(String(watch?.price ?? ''));
  const [originalPrice, setOriginalPrice] = useState(String(watch?.originalPrice ?? ''));
  const [description, setDescription] = useState(watch?.description ?? '');
  const [specsText, setSpecsText] = useState(watch ? specsToText(watch.specs) : '');
  const [modelUrl, setModelUrl] = useState(watch?.modelUrl ?? '');
  const [arWatchId, setArWatchId] = useState(watch?.arWatchId ?? AR_CATALOGUE[0].id);
  const [variant, setVariant] = useState(watch?.variant ?? '');
  const [metal, setMetal] = useState(watch?.metal ?? '#d2d6db');
  const [dial, setDial] = useState(watch?.dial ?? '#15171c');
  const [accent, setAccent] = useState(watch?.accent ?? '#c8a24a');
  const [shopId, setShopId] = useState(watch?.shopId ?? lockedShopId ?? shops[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setError('Vui lòng nhập tên và thương hiệu.');
      return;
    }
    const targetShop = lockedShopId ?? shopId;
    if (!targetShop) {
      setError('Vui lòng chọn cửa hàng.');
      return;
    }
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description.trim(),
      specs: textToSpecs(specsText),
      modelUrl,
      arWatchId,
      variant: variant.trim() || undefined,
      metal,
      dial,
      accent,
      shopId: targetShop,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={watch ? 'Sửa đồng hồ' : 'Thêm đồng hồ'} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Tên sản phẩm" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextInput label="Thương hiệu" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <TextInput
            label="Giá (VND)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextInput
            label="Giá gốc (VND)"
            hint="tuỳ chọn"
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
        </div>

        <TextArea
          label="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextArea
          label="Thông số kỹ thuật"
          value={specsText}
          onChange={(e) => setSpecsText(e.target.value)}
          placeholder={'Mỗi dòng một thông số dạng "Tên: Giá trị"\nVí dụ:\nĐường kính mặt: 42 mm\nChống nước: 200 m'}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Mô hình 3D (GLB)" value={modelUrl} onChange={(e) => setModelUrl(e.target.value)}>
            {GLB_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select label="Mô hình AR (Thử AR)" value={arWatchId} onChange={(e) => setArWatchId(e.target.value)}>
            {AR_CATALOGUE.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.id})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Variant (tuỳ chọn)" value={variant} onChange={(e) => setVariant(e.target.value)} />
          {!lockedShopId && (
            <Select label="Cửa hàng" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Palette */}
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Bảng màu (ảnh thumbnail)</span>
          <div className="flex gap-4">
            {[
              ['Kim loại', metal, setMetal],
              ['Mặt số', dial, setDial],
              ['Nhấn', accent, setAccent],
            ].map(([lbl, val, setter]) => (
              <label key={lbl as string} className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="color"
                  value={val as string}
                  onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-200"
                />
                {lbl as string}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary">
            {watch ? 'Lưu thay đổi' : 'Thêm đồng hồ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
