import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Image as ImageIcon,
  Pencil,
  Star,
  Store,
  Trash2,
} from 'lucide-react';
import type { Watch } from '../../api';

interface ShopProductDetailProps {
  watch: Watch;
  shopName?: string;
  /** When the shop is locked, edit/delete are hidden (admin froze the shop). */
  locked?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value) + ' vnđ';

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'Chưa có dữ liệu';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
};

export default function ShopProductDetail({
  watch,
  shopName,
  locked = false,
  onBack,
  onEdit,
  onDelete,
}: ShopProductDetailProps) {
  const gallery = useMemo(
    () => Array.from(new Set([watch.image, ...(watch.gallery || [])].filter(Boolean))),
    [watch.gallery, watch.image],
  );
  const [selectedImage, setSelectedImage] = useState(watch.image);

  useEffect(() => {
    setSelectedImage(watch.image);
  }, [watch.id, watch.image]);

  const specs = Object.entries(watch.specs || {});
  const isActive = (watch.status || 'active') === 'active';

  return (
    <div className="min-h-screen w-full bg-[#F6F4EF] p-5 font-sans text-[#17140F] md:p-7">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại danh sách sản phẩm"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ddd7ce] bg-white text-gray-500 transition hover:border-[#B8924A] hover:text-[#9A7434]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A7434]">
              Chi tiết sản phẩm
            </p>
            <h1 className="truncate font-display text-xl font-bold md:text-2xl">{watch.name}</h1>
          </div>
        </div>

        {!locked && (
          <div className="flex items-center gap-2 pl-12 sm:pl-0">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#17140F] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-black"
            >
              <Pencil className="h-3.5 w-3.5" />
              Chỉnh sửa
            </button>
          </div>
        )}
      </header>

      <main className="overflow-hidden rounded-2xl border border-[#ddd7ce] bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(360px,44%)_1fr]">
          <section className="border-b border-[#e9e4dc] bg-[#FAF9F7] p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-3">
              <div className="aspect-square overflow-hidden rounded-xl border border-[#e5e0d8] bg-white">
                <img src={selectedImage} alt={watch.name} className="h-full w-full object-contain" />
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((image, index) => (
                    <button
                      type="button"
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      aria-label={`Xem ảnh ${index + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                        selectedImage === image
                          ? 'border-[#B8924A]'
                          : 'border-transparent hover:border-[#d9c8a8]'
                      }`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${
                  isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isActive ? 'Đang bán' : 'Ngừng bán'}
              </span>
              {watch.hasAR ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#B8924A]/10 px-2.5 py-1 text-[10px] font-bold text-[#8C682C]">
                  <Box className="h-3.5 w-3.5" />
                  Hỗ trợ AR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Ảnh 2D
                </span>
              )}
              {watch.hasAR && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${
                    watch.arReviewStatus === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : watch.arReviewStatus === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {watch.arReviewStatus === 'approved'
                    ? 'AR đã duyệt'
                    : watch.arReviewStatus === 'rejected'
                      ? 'AR bị từ chối'
                      : 'AR chờ duyệt'}
                </span>
              )}
            </div>
            {watch.hasAR && watch.arReviewStatus === 'rejected' && watch.arReviewNote && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                <span className="font-bold">Lý do từ chối AR: </span>{watch.arReviewNote}
              </p>
            )}

            <div className="mt-5 border-b border-[#eeeae3] pb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                {watch.brand}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{watch.name}</h2>
              <p className="mt-3 text-3xl font-bold">{formatVND(watch.price)}</p>
              {watch.originalPrice && watch.originalPrice > watch.price ? (
                <p className="mt-1 text-sm text-gray-400 line-through">{formatVND(watch.originalPrice)}</p>
              ) : null}
            </div>

            <dl className="divide-y divide-[#eeeae3] text-xs">
              <div className="grid grid-cols-[130px_1fr] gap-4 py-3.5">
                <dt className="text-gray-400">Cửa hàng</dt>
                <dd className="inline-flex items-center justify-end gap-1.5 text-right font-semibold text-gray-700">
                  <Store className="h-3.5 w-3.5 text-[#B8924A]" />
                  {shopName || 'Cửa hàng'}
                </dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-4 py-3.5">
                <dt className="text-gray-400">Đánh giá</dt>
                <dd className="inline-flex items-center justify-end gap-1 text-right font-bold text-[#9A7434]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {watch.rating ?? 0}
                  <span className="font-normal text-gray-400">({watch.reviewCount ?? 0} lượt)</span>
                </dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-4 py-3.5">
                <dt className="text-gray-400">Ngày tạo</dt>
                <dd className="inline-flex items-center justify-end gap-1.5 text-right font-semibold text-gray-700">
                  <CalendarDays className="h-3.5 w-3.5 text-[#B8924A]" />
                  {formatDate(watch.createdAt)}
                </dd>
              </div>
              {watch.model && (
                <div className="grid grid-cols-[130px_1fr] gap-4 py-3.5">
                  <dt className="text-gray-400">Model 3D</dt>
                  <dd className="truncate text-right font-mono text-[10px] text-gray-600" title={watch.model}>
                    {watch.model}
                  </dd>
                </div>
              )}
            </dl>

            {watch.description && (
              <div className="mt-5">
                <h3 className="text-xs font-bold">Mô tả sản phẩm</h3>
                <p className="mt-2 whitespace-pre-line text-xs leading-6 text-gray-500">
                  {watch.description}
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="border-t border-[#e9e4dc] px-5 py-4 md:px-7">
          <div className="max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold">Thông số kỹ thuật</h2>
                <p className="mt-0.5 text-[9px] text-gray-400">{specs.length} thông số sản phẩm</p>
              </div>
            </div>

            {specs.length > 0 ? (
              <div className="grid overflow-hidden rounded-lg border border-[#e5e0d8] sm:grid-cols-2">
                {specs.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid min-h-10 grid-cols-[minmax(95px,40%)_1fr] items-center gap-3 border-b border-r border-[#e9e4dc] px-3.5 py-2 text-[11px]"
                  >
                    <span className="text-gray-400">{key}</span>
                    <span className="text-right font-semibold leading-4 text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-[#ddd7ce] py-6 text-center text-[11px] text-gray-400">
                Sản phẩm chưa có thông số kỹ thuật.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
