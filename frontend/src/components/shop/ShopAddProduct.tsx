import React, { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Plus, FileText, Image as ImageIcon, Check, Box, Construction, Settings2, Eye, Lightbulb, SlidersHorizontal, Upload, X, Store, Star, ArrowRight } from 'lucide-react';
import { watchApi, shopApi, uploadApi, ApiError } from '../../api';
import type { Watch, Shop } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';
import { IMAGE_FILE_ACCEPT, MAX_IMAGE_BYTES, validateImageFile } from '../../utils/uploads';
import ImageAdjustModal from './ImageAdjustModal';

const WATCH_BRANDS = [
  'Rolex',
  'Cartier',
  'Omega',
  'Audemars Piguet',
  'Patek Philippe',
  'Richard Mille',
  'TAG Heuer',
  'Longines',
  'Tudor',
  'IWC',
];
const OTHER_BRAND_VALUE = '__other__';
const CUSTOM_BRANDS_STORAGE_KEY = 'tw_custom_watch_brands';
const MAX_PRODUCT_IMAGES = 10;

type ProductField = 'shopId' | 'name' | 'brand' | 'image' | 'price' | 'originalPrice' | 'model';
type ProductErrors = Partial<Record<ProductField, string>>;

interface ShopAddProductProps {
  editWatchId?: string | null;
  /** Target shop for a new product (defaults to the active shop). */
  shopId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ShopAddProduct({ editWatchId, shopId, onSuccess, onCancel }: ShopAddProductProps) {
  const user = useSession((s) => s.user);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageAdjustTarget, setImageAdjustTarget] = useState<{ file: File; replaceUrl?: string | null } | null>(null);
  const [myShops, setMyShops] = useState<Shop[]>([]);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [usesCustomBrand, setUsesCustomBrand] = useState(false);
  const [customBrandDraft, setCustomBrandDraft] = useState('');
  const [customBrands, setCustomBrands] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOM_BRANDS_STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((brand): brand is string => typeof brand === 'string') : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState({
    id: '',
    shopId: '',
    name: '',
    brand: '',
    price: '15000000',
    originalPrice: '18000000',
    description: '',
    model: '/models/chronograph_watch.glb',
    image: '',
    gallery: [] as string[],
    hasAR: false,
    accent: '#B8924A',
    specs: {
      'Đường kính mặt': '41 mm',
      'Độ dày vỏ': '12 mm',
      'Chất liệu vỏ': 'Thép không gỉ 316L',
      'Chất liệu dây': 'Dây da cao cấp',
      'Chất liệu kính': 'Sapphire chống xước',
      'Bộ máy': 'Automatic (Thụy Sĩ)',
      'Chống nước': '100 m',
      'Bảo hành': '2 năm chính hãng'
    },
    // AR Calibration values (live preview only — not persisted by backend)
    arScale: 1.0,
    arPositionY: 0,
    arPositionX: 0,
    arRotationOffset: 0
  });

  const clearError = (field: ProductField) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const fieldClass = (field: ProductField, extra = '') =>
    `w-full rounded-xl border px-3.5 py-2.5 outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-[#e5e0d8] focus:border-[#B8924A] focus:ring-[#B8924A]/20'
    } ${extra}`;
  const FieldError = ({ field }: { field: ProductField }) =>
    errors[field] ? <p className="mt-1 text-[10px] font-semibold text-red-500">{errors[field]}</p> : null;
  const normalizePriceInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^0+(?=\d)/, '');
  };

  const saveCustomBrands = (brands: string[]) => {
    setCustomBrands(brands);
    localStorage.setItem(CUSTOM_BRANDS_STORAGE_KEY, JSON.stringify(brands));
  };

  const addCustomBrand = (rawBrand: string) => {
    const brand = rawBrand.trim().replace(/\s+/g, ' ');
    if (!brand) {
      setErrors((current) => ({ ...current, brand: 'Vui lòng nhập tên thương hiệu.' }));
      return;
    }
    if (brand.length > 60) {
      setErrors((current) => ({ ...current, brand: 'Tên thương hiệu không được vượt quá 60 ký tự.' }));
      return;
    }

    const existingBrand = [...WATCH_BRANDS, ...customBrands].find(
      (item) => item.toLocaleLowerCase('vi') === brand.toLocaleLowerCase('vi'),
    );
    const selectedBrand = existingBrand || brand;

    if (!existingBrand) {
      saveCustomBrands([...customBrands, selectedBrand]);
    }
    setForm((prev) => ({ ...prev, brand: selectedBrand }));
    clearError('brand');
    setCustomBrandDraft('');
    setUsesCustomBrand(false);
  };

  // Load the seller's shops for the "đăng bán tại" selector.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    shopApi.mine().then((shops) => { if (!cancelled) setMyShops(shops); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (editWatchId) {
      setIsEditMode(true);
      setErrors({});
      let cancelled = false;
      setLoading(true);
      watchApi.get(editWatchId)
        .then((found) => {
          if (cancelled || !found) return;
          setForm((prev) => ({
            ...prev,
            id: found.id,
            shopId: found.shopId || prev.shopId,
            name: found.name,
            brand: found.brand,
            price: String(found.price || ''),
            originalPrice: found.originalPrice == null ? '' : String(found.originalPrice),
            description: found.description || '',
            model: found.model || '',
            image: found.image || '',
            gallery: Array.from(new Set([found.image, ...(found.gallery || [])].filter(Boolean))).slice(
              0,
              MAX_PRODUCT_IMAGES,
            ),
            hasAR: found.hasAR ?? !!found.model,
            accent: found.accent || '#B8924A',
            specs: {
              'Đường kính mặt': found.specs?.['Đường kính mặt'] || '41 mm',
              'Độ dày vỏ': found.specs?.['Độ dày vỏ'] || '12 mm',
              'Chất liệu vỏ': found.specs?.['Chất liệu vỏ'] || 'Thép không gỉ 316L',
              'Chất liệu dây': found.specs?.['Chất liệu dây'] || 'Dây da cao cấp',
              'Chất liệu kính': found.specs?.['Chất liệu kính'] || 'Sapphire chống xước',
              'Bộ máy': found.specs?.['Bộ máy'] || 'Automatic (Thụy Sĩ)',
              'Chống nước': found.specs?.['Chống nước'] || '100 m',
              'Bảo hành': found.specs?.['Bảo hành'] || '2 năm chính hãng'
            }
          }));
          if (!WATCH_BRANDS.includes(found.brand) && !customBrands.includes(found.brand)) {
            saveCustomBrands([...customBrands, found.brand]);
          }
          setCustomBrandDraft('');
          setUsesCustomBrand(false);
        })
        .catch(() => { /* ignore — keep defaults */ })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    } else {
      setIsEditMode(false);
      setUsesCustomBrand(false);
      setCustomBrandDraft('');
      setErrors({});
      setForm((prev) => ({ ...prev, id: '', shopId: shopId || user?.shopId || '' }));
    }
  }, [editWatchId, shopId, user?.shopId]);

  const handleSpecChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value
      }
    }));
  };

  const handleUploadImages = async (files: File[]) => {
    const currentImages = Array.from(new Set([form.image, ...form.gallery].filter(Boolean)));
    const availableSlots = MAX_PRODUCT_IMAGES - currentImages.length;
    if (availableSlots <= 0) {
      toast.error(`Mỗi sản phẩm chỉ được tải tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }

    const validFiles = files.filter((file) => !validateImageFile(file, MAX_IMAGE_BYTES));
    if (validFiles.length !== files.length) {
      toast.error('Chỉ nhận file ảnh có dung lượng tối đa 10 MB.');
    }
    if (validFiles.length === 0) return;

    const filesToUpload = validFiles.slice(0, availableSlots);
    if (filesToUpload.length === 1 && !form.image) {
      setImageAdjustTarget({ file: filesToUpload[0] });
      return;
    }
    if (validFiles.length > availableSlots) {
      toast.error(`Chỉ có thể thêm ${availableSlots} ảnh để không vượt quá ${MAX_PRODUCT_IMAGES} ảnh.`);
    }

    setUploadingImage(true);
    try {
      const results = await Promise.allSettled(
        filesToUpload.map((file) => uploadApi.image(file, 'watches')),
      );
      const uploadedUrls = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedCount = results.length - uploadedUrls.length;

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          image: prev.image || uploadedUrls[0],
          gallery: Array.from(
            new Set([prev.image || uploadedUrls[0], ...prev.gallery, ...uploadedUrls]),
          ).slice(0, MAX_PRODUCT_IMAGES),
        }));
        clearError('image');
      }

      if (failedCount > 0) {
        const firstFailure = results.find(
          (result): result is PromiseRejectedResult => result.status === 'rejected',
        );
        const message =
          failedCount === filesToUpload.length && firstFailure?.reason instanceof ApiError
            ? firstFailure.reason.message
            : `Không thể tải lên ${failedCount}/${filesToUpload.length} ảnh.`;
        toast.error(message);
      } else {
        toast.success(`Đã tải lên ${uploadedUrls.length} ảnh.`);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const applyUploadedProductImage = (uploadedUrl: string, replaceUrl?: string | null) => {
    setForm((prev) => {
      const currentImages = Array.from(new Set([prev.image, ...prev.gallery].filter(Boolean)));
      const nextImages = replaceUrl
        ? currentImages.map((url) => (url === replaceUrl ? uploadedUrl : url))
        : [uploadedUrl, ...currentImages];
      const dedupedImages = Array.from(new Set(nextImages)).slice(0, MAX_PRODUCT_IMAGES);
      const nextMainImage = replaceUrl
        ? (prev.image === replaceUrl ? uploadedUrl : prev.image || uploadedUrl)
        : uploadedUrl;

      return {
        ...prev,
        image: nextMainImage,
        gallery: [nextMainImage, ...dedupedImages.filter((url) => url !== nextMainImage)].slice(0, MAX_PRODUCT_IMAGES),
      };
    });
    clearError('image');
  };

  const handleCroppedProductImageUpload = async (blob: Blob) => {
    if (!imageAdjustTarget) return;
    const replaceUrl = imageAdjustTarget.replaceUrl;
    setUploadingImage(true);
    try {
      const file = new File([blob], 'watch-product-image.jpg', { type: 'image/jpeg' });
      const url = await uploadApi.image(file, 'watches');
      applyUploadedProductImage(url, replaceUrl);
      setImageAdjustTarget(null);
      toast.success(replaceUrl ? 'Đã cập nhật ảnh sản phẩm.' : 'Đã tải ảnh đại diện lên.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Tải ảnh thất bại');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdjustUploadedImage = async (url: string) => {
    setUploadingImage(true);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('download-failed');
      }
      const blob = await response.blob();
      const type = blob.type || 'image/jpeg';
      const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
      const file = new File([blob], `watch-product-image.${ext}`, { type });
      const error = validateImageFile(file, MAX_IMAGE_BYTES);
      if (error) {
        toast.error(error);
        return;
      }
      setImageAdjustTarget({ file, replaceUrl: url });
    } catch {
      toast.error('Không thể mở ảnh này để căn chỉnh. Hãy tải lại ảnh từ máy của bạn.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetMainImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      image: url,
      gallery: [url, ...prev.gallery.filter((item) => item !== url)].slice(0, MAX_PRODUCT_IMAGES),
    }));
    clearError('image');
  };

  const handleRemoveImage = (url: string) => {
    setForm((prev) => {
      const remainingImages = Array.from(
        new Set([prev.image, ...prev.gallery].filter((item) => item && item !== url)),
      );
      const nextMainImage = prev.image === url ? remainingImages[0] || '' : prev.image;
      return {
        ...prev,
        image: nextMainImage,
        gallery: nextMainImage
          ? [nextMainImage, ...remainingImages.filter((item) => item !== nextMainImage)]
          : [],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: ProductErrors = {};
    const name = form.name.trim().replace(/\s+/g, ' ');
    const brand = form.brand.trim();
    const price = Number(form.price);
    const originalPrice = Number(form.originalPrice);
    const productImages = Array.from(new Set([form.image, ...form.gallery].filter(Boolean)));

    if (!form.shopId) nextErrors.shopId = 'Vui lòng chọn cửa hàng đăng bán.';
    if (!name) nextErrors.name = 'Vui lòng nhập tên sản phẩm.';
    else if (name.length < 3) nextErrors.name = 'Tên sản phẩm phải có ít nhất 3 ký tự.';
    else if (name.length > 120) nextErrors.name = 'Tên sản phẩm không được vượt quá 120 ký tự.';
    if (!brand) nextErrors.brand = 'Vui lòng chọn hoặc thêm thương hiệu.';
    else if (brand.length > 60) nextErrors.brand = 'Tên thương hiệu không được vượt quá 60 ký tự.';
    if (!form.image.trim()) nextErrors.image = 'Vui lòng tải ít nhất một ảnh sản phẩm.';
    else if (productImages.length > MAX_PRODUCT_IMAGES) {
      nextErrors.image = `Mỗi sản phẩm chỉ được có tối đa ${MAX_PRODUCT_IMAGES} ảnh.`;
    }
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = 'Giá bán phải lớn hơn 0.';
    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
      nextErrors.originalPrice = 'Giá niêm yết không được là số âm.';
    } else if (originalPrice > 0 && originalPrice < price) {
      nextErrors.originalPrice = 'Giá niêm yết phải lớn hơn hoặc bằng giá bán.';
    }
    if (form.hasAR && !form.model.trim()) nextErrors.model = 'Vui lòng nhập đường dẫn model 3D.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0] || 'Vui lòng kiểm tra lại thông tin sản phẩm.');
      return;
    }

    const payload: Partial<Watch> = {
      name,
      brand,
      price,
      originalPrice,
      description: form.description.trim(),
      shopId: form.shopId,
      model: form.hasAR ? form.model : '',
      image: form.image,
      gallery: [form.image, ...productImages.filter((url) => url !== form.image)],
      hasAR: form.hasAR,
      accent: form.accent,
      specs: form.specs,
      rating: 4.8,
      reviewCount: 1,
      status: 'active'
    };

    setSaving(true);
    try {
      if (form.id) {
        await watchApi.update(form.id, payload);
      } else {
        await watchApi.create(payload);
      }
      toast.success(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Đăng bán sản phẩm mới thành công!');
      onSuccess();
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

  const productImages = Array.from(new Set([form.image, ...form.gallery].filter(Boolean)));

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      {/* Page Header */}
      <header className="mb-8 border-b border-[#e5e0d8] pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F] flex items-center gap-2">
            {isEditMode ? (
              <><Pencil className="h-6 w-6 text-[#B8924A]" /> Cập Nhật Sản Phẩm</>
            ) : (
              <><Plus className="h-6 w-6 text-[#B8924A]" /> Đăng Mẫu Đồng Hồ Mới</>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Chọn loại sản phẩm (Thường / AR), nhập thông số và đăng bán
          </p>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black font-semibold border border-[#e5e0d8] bg-white px-4 py-2 rounded-xl transition"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại sản phẩm
        </button>
      </header>

      {/* Main Form container split into: Left inputs, Right AR Calibrator */}
      <form noValidate onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start pb-16">
        {/* Left Column: Inputs details (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm space-y-6">
          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#17140F] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#B8924A]" /> Thông tin sản phẩm cơ bản
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {/* Target shop */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Cửa hàng đăng bán *</label>
              <div
                className={`flex w-full items-center gap-1.5 rounded-xl border bg-[#F6F4EF] px-3.5 py-2.5 font-semibold text-[#17140F] ${
                  errors.shopId ? 'border-red-400' : 'border-[#e5e0d8]'
                }`}
                aria-readonly="true"
              >
                <Store className="h-4 w-4 shrink-0 text-[#B8924A]" />
                <span className="truncate">
                  {myShops.find((s) => s.id === form.shopId)?.name || 'Cửa hàng đã chọn'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Cửa hàng được chọn từ màn quản lý sản phẩm.
              </p>
              <FieldError field="shopId" />
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Tên đồng hồ *</label>
              <input
                type="text"
                maxLength={120}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  clearError('name');
                }}
                placeholder="Ví dụ: Rolex Submariner Gold 41mm"
                className={fieldClass('name')}
              />
              <FieldError field="name" />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Hãng sản xuất / Thương hiệu *</label>
              <select
                value={usesCustomBrand ? OTHER_BRAND_VALUE : form.brand}
                onChange={(e) => {
                  if (e.target.value === OTHER_BRAND_VALUE) {
                    setUsesCustomBrand(true);
                    setCustomBrandDraft('');
                    setForm({ ...form, brand: '' });
                    return;
                  }
                  setUsesCustomBrand(false);
                  setCustomBrandDraft('');
                  setForm({ ...form, brand: e.target.value });
                  clearError('brand');
                }}
                className={fieldClass('brand', 'bg-white')}
              >
                <option value="" disabled>Chọn hãng / thương hiệu</option>
                <optgroup label="Thương hiệu phổ biến">
                  {WATCH_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </optgroup>
                {customBrands.length > 0 && (
                  <optgroup label="Thương hiệu đã thêm">
                    {customBrands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </optgroup>
                )}
                <option value={OTHER_BRAND_VALUE}>+ Thêm thương hiệu khác</option>
              </select>
              {usesCustomBrand && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={customBrandDraft}
                    onChange={(e) => setCustomBrandDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomBrand(customBrandDraft);
                      }
                      if (e.key === 'Escape') {
                        setUsesCustomBrand(false);
                        setCustomBrandDraft('');
                      }
                    }}
                    placeholder="Nhập tên thương hiệu khác"
                    className="min-w-0 flex-1 rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomBrand(customBrandDraft)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#17140F] px-4 py-2.5 font-bold text-white transition hover:bg-black"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsesCustomBrand(false);
                      setCustomBrandDraft('');
                    }}
                    aria-label="Hủy thêm thương hiệu"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e0d8] text-gray-400 transition hover:bg-gray-50 hover:text-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <FieldError field="brand" />
            </div>

            {/* Unified product image upload and cover selection */}
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block font-bold text-gray-500">Ảnh sản phẩm *</label>
                <span className="text-[10px] font-semibold text-gray-400">
                  {productImages.length}/{MAX_PRODUCT_IMAGES} ảnh
                </span>
              </div>
              <div
                className={`rounded-2xl border p-3 ${
                  errors.image ? 'border-red-400 bg-red-50/30' : 'border-[#e5e0d8] bg-[#FAF9F7]'
                }`}
              >
                <div className="flex flex-wrap gap-3">
                  {productImages.map((url, index) => {
                    const isMainImage = url === form.image;
                    return (
                      <div
                        key={url}
                        className={`group relative w-28 overflow-hidden rounded-xl border-2 bg-white transition ${
                          isMainImage
                            ? 'border-[#B8924A] ring-2 ring-[#B8924A]/15'
                            : 'border-transparent hover:border-[#d8d1c5]'
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[#F6F4EF]">
                          <img
                            src={url}
                            alt={`Ảnh sản phẩm ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            aria-label={`Xóa ảnh ${index + 1}`}
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAdjustUploadedImage(url)}
                            aria-label={`Căn chỉnh ảnh ${index + 1}`}
                            disabled={uploadingImage}
                            className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#17140F] shadow transition hover:bg-white disabled:opacity-50"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(url)}
                          disabled={isMainImage}
                          className={`flex min-h-8 w-full items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-bold transition ${
                            isMainImage
                              ? 'cursor-default bg-[#B8924A] text-white'
                              : 'bg-white text-gray-500 hover:bg-[#F6F4EF] hover:text-[#17140F]'
                          }`}
                        >
                          {isMainImage && <Check className="h-3 w-3" />}
                          {isMainImage ? 'Ảnh đại diện' : 'Chọn đại diện'}
                        </button>
                      </div>
                    );
                  })}

                  {productImages.length < MAX_PRODUCT_IMAGES && (
                    <label
                      className={`flex min-h-36 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfc7ba] bg-white px-3 text-center font-semibold text-gray-500 transition hover:border-[#B8924A] hover:bg-[#B8924A]/5 ${
                        uploadingImage ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <Upload className="h-5 w-5 text-[#B8924A]" />
                      <span className="text-[10px]">
                        {uploadingImage ? 'Đang tải ảnh…' : 'Thêm ảnh'}
                      </span>
                      <input
                        type="file"
                        accept={IMAGE_FILE_ACCEPT}
                        multiple
                        disabled={uploadingImage}
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) void handleUploadImages(files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-3 text-[10px] leading-4 text-gray-400">
                  Tải tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh không quá 10 MB. Chọn một ảnh làm ảnh đại diện sản phẩm.
                </p>
              </div>
              <FieldError field="image" />
            </div>

            {/* Product type: Thường (2D) vs AR (under development) */}
            <div className="sm:col-span-2">
              <label className="block text-gray-500 font-bold mb-2">Loại sản phẩm *</label>
              <div className="grid max-w-xl grid-cols-2 gap-3">
                {/* Normal */}
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, hasAR: false });
                    clearError('model');
                  }}
                  className={`text-left rounded-xl border-2 p-3.5 transition ${
                    !form.hasAR ? 'border-[#B8924A] bg-[#B8924A]/5 ring-2 ring-[#B8924A]/20' : 'border-[#e5e0d8] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ImageIcon className="h-5 w-5 text-gray-500" />
                    {!form.hasAR && <Check className="h-4 w-4 text-[#B8924A]" />}
                  </div>
                  <p className="font-bold text-[#17140F]">Đồng hồ thường</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Hiển thị bằng ảnh 2D. Đăng bán ngay lập tức.</p>
                </button>

                {/* AR (under development) */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hasAR: true })}
                  className={`relative text-left rounded-xl border-2 p-3.5 transition ${
                    form.hasAR ? 'border-[#B8924A] bg-[#B8924A]/5 ring-2 ring-[#B8924A]/20' : 'border-[#e5e0d8] hover:border-gray-300'
                  }`}
                >
                  <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                    Đang phát triển
                  </span>
                  <div className="flex items-center mb-1">
                    <Box className="h-5 w-5 text-[#B8924A]" />
                  </div>
                  <p className="font-bold text-[#17140F]">Đồng hồ AR 3D</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Cho phép khách thử đeo AR trên cổ tay.</p>
                </button>
              </div>
            </div>

            {/* AR development notice + model field */}
            {form.hasAR && (
              <div className="space-y-3 animate-fade-in sm:col-span-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 text-amber-800">
                  <Construction className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold">Tính năng AR đang trong giai đoạn phát triển.</p>
                    <p className="text-amber-700 mt-0.5">
                      Hiện chỉ hỗ trợ một số mẫu 3D do hệ thống cung cấp. Bạn vẫn có thể đính kèm file model để sẵn sàng khi AR mở rộng cho cửa hàng.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Đường dẫn file 3D (.glb)</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => {
                      setForm({ ...form, model: e.target.value });
                      clearError('model');
                    }}
                    placeholder="/models/chronograph_watch.glb"
                    className={fieldClass('model', 'bg-gray-50 font-mono text-gray-600')}
                  />
                  <FieldError field="model" />
                </div>
              </div>
            )}

            {/* Price */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Giá trưng bày (VND) *</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: normalizePriceInput(e.target.value) });
                  clearError('price');
                  clearError('originalPrice');
                }}
                placeholder="Ví dụ: 48900000"
                className={fieldClass('price')}
              />
              <FieldError field="price" />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Giá niêm yết cũ (Nếu có)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form.originalPrice}
                onChange={(e) => {
                  setForm({ ...form, originalPrice: normalizePriceInput(e.target.value) });
                  clearError('originalPrice');
                }}
                placeholder="Ví dụ: 56000000"
                className={fieldClass('originalPrice')}
              />
              <FieldError field="originalPrice" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-gray-500 font-bold mb-1">Mô tả sản phẩm</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
                rows={3}
                placeholder="Mô tả chất liệu máy Thụy Sĩ, đá đính kèm..."
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition resize-none"
              />
            </div>
          </div>

          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#17140F] pt-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#B8924A]" /> Thông số kỹ thuật (Specs)
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(form.specs).map(([key, val]) => (
              <div key={key}>
                <label className="block text-gray-500 font-bold mb-1">{key}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleSpecChange(key, e.target.value)}
                  className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-2 justify-end border-t border-[#e5e0d8]">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="bg-[#17140F] text-white py-3 px-8 rounded-full font-bold text-xs hover:bg-black transition shadow border border-[#B8924A]/30 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : (isEditMode ? 'Lưu Thay Đổi & Xuất Bản' : 'Đăng Bán & Duyệt Sản Phẩm')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-[#e5e0d8] text-gray-500 py-3 px-8 rounded-full text-xs font-semibold hover:bg-gray-50 transition"
            >
              Huỷ
            </button>
          </div>
        </div>

        {/* Right Column: preview (normal) or AR calibration simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between h-fit sticky top-28">
          {!form.hasAR ? (
            /* NORMAL PRODUCT — live card preview + tips */
            <div>
              <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#17140F] mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#B8924A]" /> Xem trước thẻ sản phẩm
              </h3>
              <div className="mx-auto mb-5 flex w-full max-w-[320px] cursor-default flex-col overflow-hidden rounded-2xl border border-[#e5e0d8] bg-white shadow-sm">
                <div className="relative h-44 overflow-hidden border-b border-[#e5e0d8] bg-gradient-to-br from-[#f3efe7] to-[#e9e3d8]">
                  {form.image && <img src={form.image} alt="" className="h-full w-full object-cover" />}
                  {!form.image && (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#17140F] shadow-md backdrop-blur">
                    Anh 2D
                  </span>
                  <span className="absolute bottom-2 left-3 max-w-[85%] truncate text-[10px] font-bold uppercase tracking-[0.15em] text-white/90 drop-shadow">
                    {form.brand || 'Thuong hieu'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="mb-1 line-clamp-1 font-serif text-base font-bold text-[#17140F]">{form.name || 'Tên sản phẩm'}</h4>
                  <div className="mb-3 flex items-center gap-1">
                    <span className="text-[#B8924A]"><Star className="h-3.5 w-3.5 fill-current" /></span>
                    <span className="text-xs font-bold">4.8</span>
                    <span className="text-xs text-gray-400">(1 đánh giá)</span>
                  </div>
                  <div className="mb-4 mt-auto flex items-baseline gap-2">
                    <span className="text-sm font-bold text-[#17140F] sm:text-base">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(form.price) || 0)}
                    </span>
                    {Number(form.originalPrice) > Number(form.price) && (
                      <span className="text-xs text-gray-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(form.originalPrice))}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#17140F]/20 bg-white py-2.5 text-xs font-semibold text-[#17140F] shadow-sm"
                  >
                    <span>Xem Chi Tiết</span> <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-[#F6F4EF] p-3.5 rounded-xl border border-[#e5e0d8] text-[10px] text-gray-500 leading-relaxed flex gap-2">
                <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#B8924A]" />
                <span>Mẹo: dùng ảnh nền sáng, chụp chính diện mặt số để thẻ sản phẩm nổi bật. Có thể nâng cấp lên loại AR khi tính năng mở rộng cho cửa hàng.</span>
              </div>
            </div>
          ) : (
          <>
          <div>
            <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#17140F] mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#B8924A]" /> Bộ căn chỉnh AR trên cổ tay (Live Preview)
            </h3>
            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
              Kéo các thanh trượt bên dưới để cân chỉnh kích thước và hướng đeo đồng hồ 3D khớp khít nhất với khung cổ tay.
            </p>

            {/* VISUAL WRIST CALIBRATION DISPLAY */}
            <div className="relative bg-[#F6F4EF] rounded-2xl h-56 border border-[#e5e0d8] overflow-hidden flex items-center justify-center mb-6">
              {/* Simulated arm / wrist path background */}
              <div className="absolute inset-0 bg-[#e5e0d8]/30 flex items-center justify-center">
                {/* Arm representation */}
                <div className="w-24 h-full bg-[#ecdac7] border-x border-[#dfc8b3] rotate-[30deg] shadow-inner relative flex items-center justify-center">
                  <div className="w-full h-10 border-y border-[#dfc8b3]/45 absolute top-1/2 -translate-y-5" />
                </div>
              </div>

              {/* Dynamic watch preview superimposed (real product photo) */}
              <div
                className="h-16 w-16 rounded-full border-2 shadow-2xl relative transition-all duration-100 ease-out overflow-hidden bg-[#17140F]"
                style={{
                  borderColor: '#d2d6db',
                  transform: `scale(${form.arScale}) translate(${form.arPositionX * 40}px, ${-form.arPositionY * 40}px) rotate(${form.arRotationOffset}deg)`,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                }}
              >
                {form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,#d2d6db,#15171c_80%)]" />
                )}
              </div>

              {/* Overlay guidelines grid */}
              <div className="absolute inset-0 border border-dashed border-gray-200/50 pointer-events-none flex items-center justify-center">
                <div className="w-[1px] h-full border-l border-dashed border-[#B8924A]/20" />
                <div className="h-[1px] w-full border-t border-dashed border-[#B8924A]/20" />
              </div>

              <span className="absolute bottom-2 left-3 text-[9px] uppercase tracking-wider text-[#B8924A] font-bold">
                Mô phỏng 3D Calibration
              </span>
            </div>

            {/* Sliders workspace */}
            <div className="space-y-4 text-xs">
              {/* Scale */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Tỉ lệ kích thước (Scale)</label>
                  <span className="font-mono text-[#B8924A] font-bold">×{Number(form.arScale).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={form.arScale}
                  onChange={(e) => setForm({ ...form, arScale: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Position Y */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Dịch dọc trục cổ tay (Y Position)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{Number(form.arPositionY).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={form.arPositionY}
                  onChange={(e) => setForm({ ...form, arPositionY: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Position X */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Dịch ngang cổ tay (X Position)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{Number(form.arPositionX).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={form.arPositionX}
                  onChange={(e) => setForm({ ...form, arPositionX: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Bù góc xoay (Rotation Offset)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{form.arRotationOffset}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={form.arRotationOffset}
                  onChange={(e) => setForm({ ...form, arRotationOffset: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#F6F4EF] p-3.5 rounded-xl border border-[#e5e0d8] text-[10px] text-gray-500 leading-normal flex gap-2">
            <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#B8924A]" />
            <span><span className="font-bold text-gray-700">Mẹo:</span> Đặt tỉ lệ chuẩn để mặt kính đồng hồ phủ rộng khoảng 75%-80% độ rộng của cổ tay, tạo hiệu ứng đeo thử tự nhiên nhất khi khách hàng bật camera.</span>
          </div>
          </>
          )}
        </div>
      </form>
      {imageAdjustTarget && (
        <ImageAdjustModal
          file={imageAdjustTarget.file}
          aspect={1}
          outputWidth={1200}
          title="Căn chỉnh ảnh đại diện sản phẩm"
          busy={uploadingImage}
          onCancel={() => setImageAdjustTarget(null)}
          onConfirm={handleCroppedProductImageUpload}
        />
      )}
    </div>
  );
}
