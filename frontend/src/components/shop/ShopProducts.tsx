import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Lock,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { ApiError, shopApi, watchApi } from '../../api';
import type { Shop, Watch } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';
import ShopAddProduct from './ShopAddProduct';
import ShopProductDetail from './ShopProductDetail';

type ProductView =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'detail'; watchId: string }
  | { kind: 'edit'; watchId: string };

type StatusFilter = 'all' | 'active' | 'locked';

const SHOP_STORAGE_KEY = 'tw_product_shop';
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value) + ' vnđ';

export default function ShopProducts() {
  const user = useSession((state) => state.user);
  const [view, setView] = useState<ProductView>({ kind: 'list' });
  const [myShops, setMyShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState(
    () => sessionStorage.getItem(SHOP_STORAGE_KEY) || '',
  );
  const [watches, setWatches] = useState<Watch[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const shopNames = useMemo(
    () => Object.fromEntries(myShops.map((shop) => [shop.id, shop.name])),
    [myShops],
  );

  const selectedShop = useMemo(
    () => myShops.find((shop) => shop.id === selectedShopId) ?? null,
    [myShops, selectedShopId],
  );
  // A locked shop is frozen: the seller cannot add/edit/remove its products.
  const shopLocked = selectedShop?.status === 'locked';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    shopApi.mine()
      .then((shops) => {
        if (cancelled) return;
        setMyShops(shops);
        setSelectedShopId((current) => {
          if (current && shops.some((shop) => shop.id === current)) return current;
          return user.shopId || shops[0]?.id || '';
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError('Không thể tải danh sách cửa hàng.');
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (selectedShopId) sessionStorage.setItem(SHOP_STORAGE_KEY, selectedShopId);
  }, [selectedShopId]);

  const loadWatches = useCallback(async () => {
    if (!selectedShopId) {
      setWatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      setWatches(await watchApi.list(selectedShopId));
    } catch {
      setWatches([]);
      setLoadError('Không thể tải sản phẩm của cửa hàng này.');
    } finally {
      setLoading(false);
    }
  }, [selectedShopId]);

  useEffect(() => {
    void loadWatches();
  }, [loadWatches]);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, selectedShopId, pageSize]);

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    setView({ kind: 'list' });
    setSearch('');
    setFilterStatus('all');
  };

  const handleDelete = async (watch: Watch) => {
    const confirmed = await toast.confirm(
      `Sản phẩm "${watch.name}" sẽ bị gỡ khỏi hệ thống và không thể khôi phục.`,
      {
        title: 'Xóa sản phẩm này?',
        confirmText: 'Xóa',
        danger: true,
      },
    );
    if (!confirmed) return;

    try {
      await watchApi.remove(watch.id);
      setView({ kind: 'list' });
      await loadWatches();
      toast.success('Đã xóa sản phẩm.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Có lỗi xảy ra khi xóa sản phẩm.');
    }
  };

  const activeWatch =
    view.kind === 'detail' || view.kind === 'edit'
      ? watches.find((watch) => watch.id === view.watchId)
      : undefined;

  if (view.kind === 'create') {
    return (
      <ShopAddProduct
        shopId={selectedShopId}
        onSuccess={async () => {
          await loadWatches();
          setView({ kind: 'list' });
        }}
        onCancel={() => setView({ kind: 'list' })}
      />
    );
  }

  if (view.kind === 'edit') {
    return (
      <ShopAddProduct
        editWatchId={view.watchId}
        onSuccess={async () => {
          await loadWatches();
          setView({ kind: 'list' });
        }}
        onCancel={() => setView({ kind: 'detail', watchId: view.watchId })}
      />
    );
  }

  if (view.kind === 'detail' && activeWatch) {
    return (
      <ShopProductDetail
        watch={activeWatch}
        shopName={shopNames[activeWatch.shopId]}
        locked={shopLocked}
        onBack={() => setView({ kind: 'list' })}
        onEdit={() => setView({ kind: 'edit', watchId: activeWatch.id })}
        onDelete={() => void handleDelete(activeWatch)}
      />
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredWatches = watches.filter((watch) => {
    const matchesSearch =
      !normalizedSearch ||
      watch.name.toLowerCase().includes(normalizedSearch) ||
      watch.brand.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      filterStatus === 'all' || (watch.status || 'active') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWatches.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedWatches = filteredWatches.slice(pageStart, pageStart + pageSize);
  const rangeStart = filteredWatches.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredWatches.length);
  const hasFilters = Boolean(search) || filterStatus !== 'all';

  const visiblePages = Array.from(
    new Set(
      [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
        (value) => value >= 1 && value <= totalPages,
      ),
    ),
  );

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#F6F4EF] p-5 font-sans text-[#17140F] md:p-7">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Sản phẩm</h1>
          <p className="mt-1 text-xs text-gray-500">
            Quản lý toàn bộ sản phẩm theo từng cửa hàng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView({ kind: 'create' })}
          disabled={!selectedShopId || shopLocked}
          title={shopLocked ? 'Cửa hàng đang bị khóa' : undefined}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17140F] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </button>
      </header>

      {shopLocked && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-xs leading-5 text-red-700">
            <span className="font-bold">Cửa hàng "{selectedShop?.name}" đang bị khóa.</span>{' '}
            {selectedShop?.lockReason && (
              <span>Lý do: <span className="font-semibold">{selectedShop.lockReason}</span>. </span>
            )}
            Bạn không thể thêm, chỉnh sửa hoặc xóa sản phẩm cho đến khi được quản trị viên mở khóa.
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#ddd7ce] bg-white shadow-sm">
        <div className="border-b border-[#e9e4dc] px-4 py-3.5 md:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8924A]" />
                <select
                  value={selectedShopId}
                  onChange={(event) => handleShopChange(event.target.value)}
                  aria-label="Chọn cửa hàng"
                  className="w-full appearance-none rounded-lg border border-[#ddd7ce] bg-white py-2.5 pl-9 pr-9 text-xs font-bold outline-none transition focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/15"
                >
                  {myShops.length === 0 && <option value="">Chưa có cửa hàng</option>}
                  {myShops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}{shop.id === user?.shopId ? ' (chính)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <span className="whitespace-nowrap text-[11px] text-gray-400">
                <strong className="text-gray-700">{watches.length}</strong> sản phẩm
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên hoặc thương hiệu"
                  className="w-full rounded-lg border border-[#ddd7ce] bg-[#FAF9F7] py-2.5 pl-8 pr-8 text-xs outline-none transition focus:border-[#B8924A] focus:bg-white focus:ring-2 focus:ring-[#B8924A]/15"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as StatusFilter)}
                aria-label="Lọc trạng thái"
                className="rounded-lg border border-[#ddd7ce] bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 outline-none transition focus:border-[#B8924A]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bán</option>
                <option value="locked">Ngừng bán</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center text-sm text-[#8A8170]">
            Đang tải sản phẩm...
          </div>
        ) : loadError ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
            <Package className="h-10 w-10 text-red-200" />
            <p className="mt-3 text-sm font-bold text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadWatches()}
              className="mt-4 rounded-lg border border-[#ddd7ce] px-4 py-2 text-xs font-bold hover:bg-[#F6F4EF]"
            >
              Thử lại
            </button>
          </div>
        ) : paginatedWatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e9e4dc] bg-[#FAF9F7] text-[9px] uppercase tracking-[0.08em] text-gray-400">
                  <th className="w-16 py-3 pl-5 pr-2 text-center font-bold">STT</th>
                  <th className="px-3 py-3 font-bold">Sản phẩm</th>
                  <th className="w-36 px-3 py-3 font-bold">Thương hiệu</th>
                  <th className="w-40 px-3 py-3 font-bold">Giá bán</th>
                  <th className="w-24 px-3 py-3 text-center font-bold">Hiển thị</th>
                  <th className="w-28 px-3 py-3 text-center font-bold">Trạng thái</th>
                  <th className="w-24 px-3 py-3 text-center font-bold">Đánh giá</th>
                  <th className="w-32 py-3 pl-3 pr-5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae3]">
                {paginatedWatches.map((watch, index) => {
                  const isActive = (watch.status || 'active') === 'active';
                  return (
                    <tr
                      key={watch.id}
                      onClick={() => setView({ kind: 'detail', watchId: watch.id })}
                      className="group cursor-pointer transition hover:bg-[#FBFAF8]"
                    >
                      <td className="py-3 pl-5 pr-2 text-center text-[11px] text-gray-400">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e5e0d8] bg-[#F6F4EF]">
                            <img
                              src={watch.image}
                              alt={watch.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-72 truncate font-display text-[13px] font-bold transition group-hover:text-[#9A7434]">
                              {watch.name}
                            </p>
                            <p className="mt-0.5 max-w-64 truncate text-[10px] text-gray-400">
                              {watch.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-600">{watch.brand}</td>
                      <td className="px-3 py-3 font-bold">{formatVND(watch.price)}</td>
                      <td className="px-3 py-3 text-center">
                        {watch.hasAR ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#B8924A]/10 px-2 py-1 text-[9px] font-bold text-[#8C682C]">
                            <Box className="h-3 w-3" />
                            AR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[9px] font-bold text-gray-500">
                            <ImageIcon className="h-3 w-3" />
                            2D
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold ${
                            isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[#9A7434]">
                          <Star className="h-3 w-3 fill-current" />
                          {watch.rating ?? 0}
                        </span>
                      </td>
                      <td
                        className="py-3 pl-3 pr-5 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setView({ kind: 'detail', watchId: watch.id })}
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-[#F1ECE4] hover:text-[#9A7434]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setView({ kind: 'edit', watchId: watch.id })}
                            disabled={shopLocked}
                            title={shopLocked ? 'Cửa hàng đang bị khóa' : 'Chỉnh sửa'}
                            aria-label="Chỉnh sửa"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(watch)}
                            disabled={shopLocked}
                            title={shopLocked ? 'Cửa hàng đang bị khóa' : 'Xóa sản phẩm'}
                            aria-label="Xóa sản phẩm"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
            <Package className="h-10 w-10 text-gray-300" />
            <h3 className="mt-3 font-display text-sm font-bold">Không tìm thấy sản phẩm</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
              {watches.length === 0
                ? 'Cửa hàng này chưa có sản phẩm.'
                : 'Không có sản phẩm phù hợp với điều kiện tìm kiếm.'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                }}
                className="mt-4 rounded-lg border border-[#ddd7ce] px-4 py-2 text-xs font-bold hover:bg-[#F6F4EF]"
              >
                Xóa bộ lọc
              </button>
            ) : selectedShopId && !shopLocked ? (
              <button
                type="button"
                onClick={() => setView({ kind: 'create' })}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#17140F] px-5 py-2.5 text-xs font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Thêm sản phẩm
              </button>
            ) : null}
          </div>
        )}

        {!loading && !loadError && filteredWatches.length > 0 && (
          <footer className="flex flex-col gap-3 border-t border-[#e9e4dc] bg-[#FAF9F7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>
                Hiển thị <strong className="text-gray-700">{rangeStart}-{rangeEnd}</strong> trong{' '}
                <strong className="text-gray-700">{filteredWatches.length}</strong> sản phẩm
              </span>
              <label className="flex items-center gap-1.5">
                Số dòng
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-md border border-[#ddd7ce] bg-white px-2 py-1 text-[11px] font-semibold outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                aria-label="Trang trước"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#ddd7ce] bg-white text-gray-500 transition hover:border-[#B8924A] hover:text-[#9A7434] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {visiblePages.map((pageNumber, index) => {
                const previous = visiblePages[index - 1];
                return (
                  <React.Fragment key={pageNumber}>
                    {previous && pageNumber - previous > 1 && (
                      <span className="px-1 text-xs text-gray-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-8 min-w-8 rounded-md px-2 text-xs font-bold transition ${
                        currentPage === pageNumber
                          ? 'bg-[#17140F] text-white'
                          : 'border border-[#ddd7ce] bg-white text-gray-500 hover:border-[#B8924A] hover:text-[#9A7434]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </React.Fragment>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#ddd7ce] bg-white text-gray-500 transition hover:border-[#B8924A] hover:text-[#9A7434] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
