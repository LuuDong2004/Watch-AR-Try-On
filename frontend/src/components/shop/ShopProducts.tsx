import React, { useState, useEffect } from 'react';
import { Plus, Search, Store, Box, Check, Star, Package } from 'lucide-react';
import { getWatchesForShopIds, resolveScopeShopIds, getDbShops, deleteDbWatch } from '../../utils/mockData';

interface ShopProductsProps {
  onEditProduct: (id: string) => void;
  onNavigateToAddProduct: () => void;
  shopScope: string;
}

export default function ShopProducts({ onEditProduct, onNavigateToAddProduct, shopScope }: ShopProductsProps) {
  const [watches, setWatches] = useState<any[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'pending'>('all');

  useEffect(() => {
    // Only the owner's stores within the active scope.
    setWatches(getWatchesForShopIds(resolveScopeShopIds(shopScope)));
    const map: Record<string, string> = {};
    getDbShops().forEach((s) => { map[s.id] = s.name; });
    setShopNames(map);
  }, [shopScope]);

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(n);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) {
      deleteDbWatch(id);
      setWatches(getWatchesForShopIds(resolveScopeShopIds(shopScope)));
    }
  };

  const filteredWatches = watches.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.brand.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (w.status || 'active') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-8 w-full overflow-y-auto">
      {/* Products Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#17140F]">Danh Sách Sản Phẩm</h1>
          <p className="text-xs text-gray-500 mt-1">Đăng bán và hiệu chỉnh model 3D/AR cho từng mẫu đồng hồ</p>
        </div>
        <button
          onClick={onNavigateToAddProduct}
          className="bg-[#17140F] text-white hover:bg-black font-semibold text-xs py-3 px-6 rounded-full transition shadow border border-[#B8924A]/30 active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> <span>Đăng Đồng Hồ Mới</span>
        </button>
      </header>

      {/* Toolbar Filters */}
      <section className="bg-white p-4 rounded-2xl border border-[#e5e0d8] shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mẫu, hãng..."
            className="w-full bg-[#F6F4EF] rounded-xl border border-[#e5e0d8] py-2 px-3 pl-8 focus:outline-none focus:ring-1 focus:ring-[#B8924A]"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        {/* Tab Status filters */}
        <div className="flex bg-[#F6F4EF] p-1 rounded-xl font-semibold">
          {[
            ['all', 'Tất cả'],
            ['active', 'Đang bán'],
            ['pending', 'Chờ duyệt'],
            ['draft', 'Nháp']
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val as any)}
              className={`py-1.5 px-4 text-center rounded-lg transition ${
                filterStatus === val ? 'bg-[#17140F] text-white shadow' : 'text-gray-500 hover:text-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Products Table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
        {filteredWatches.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px]">
                  <th className="py-2.5">Tên sản phẩm / Hãng</th>
                  <th className="py-2.5">Giá bán</th>
                  <th className="py-2.5 text-center">Trạng thái AR</th>
                  <th className="py-2.5 text-center">Duyệt hệ thống</th>
                  <th className="py-2.5 text-center">Đánh giá</th>
                  <th className="py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatches.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    {/* Name */}
                    <td className="py-3.5 font-semibold text-[#17140F] flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#e5e0d8] shadow-sm flex-shrink-0 bg-[#F6F4EF]">
                        <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm text-[#17140F]">{w.name}</p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{w.brand}</p>
                        <p className="text-[9px] text-[#B8924A] font-semibold mt-0.5 flex items-center gap-1"><Store className="h-3 w-3" /> {shopNames[w.shopId] || '—'}</p>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 font-medium text-gray-700">{formatVND(w.price)}</td>

                    {/* AR availability */}
                    <td className="py-3.5 text-center">
                      {w.hasAR ? (
                        <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full font-bold text-[9px] border border-green-200 inline-flex items-center gap-1">
                          <Box className="h-3 w-3" /> AR Try-On
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-bold text-[9px] border border-gray-200">
                          Chỉ ảnh 2D
                        </span>
                      )}
                    </td>

                    {/* System audit status */}
                    <td className="py-3.5 text-center">
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold text-[9px] inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Đã Duyệt
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 text-center font-bold text-[#B8924A]">
                      <span className="inline-flex items-center gap-1 justify-center">{w.rating} <Star className="h-3 w-3 fill-current" /> <span className="text-gray-400 font-normal text-[10px]">({w.reviewCount})</span></span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => onEditProduct(w.id)}
                        className="bg-[#17140F] text-white hover:bg-black py-1 px-3 rounded-lg font-bold"
                      >
                        Sửa / Cân AR
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="border border-red-200 hover:bg-red-50 text-red-600 py-1 px-2.5 rounded-lg font-bold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-10 w-10 mx-auto text-gray-300" />
            <h4 className="font-display font-bold text-sm mt-3 mb-1">Không tìm thấy sản phẩm nào</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
              Không tìm thấy đồng hồ nào phù hợp với từ khóa tìm kiếm hoặc trạng thái của bạn.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
