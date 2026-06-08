import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { shopApi, watchApi } from '../../api';
import type { Watch } from '../../api';
import { publicWatches, canTryAr } from '../../utils/publicListings';

interface UserCatalogProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
}

export default function UserCatalog({ onSelectWatch, onOpenAR }: UserCatalogProps) {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(350000000); // max price filter
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('all');
  const [onlyAR, setOnlyAR] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const PAGE_SIZE = 6;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([watchApi.list(), shopApi.list()])
      .then(([list, shops]) => {
        if (cancelled) return;
        const visibleWatches = publicWatches(list, shops);
        setWatches(visibleWatches);
        // Extract unique brands
        const uniqueBrands = Array.from(new Set(visibleWatches.map((w) => w.brand)));
        setBrands(uniqueBrands);
      })
      .catch(() => { if (!cancelled) setWatches([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0
    }).format(n) + ' vnđ';
  };

  // Filter & Sort logic
  const filteredWatches = watches
    .filter((w) => {
      const q = searchQuery.trim().toLowerCase();
      if (q && !w.name.toLowerCase().includes(q) && !w.brand.toLowerCase().includes(q)) return false;
      if (selectedBrand !== 'all' && w.brand !== selectedBrand) return false;
      if (w.price > priceRange) return false;
      if (onlyAR && !canTryAr(w)) return false; // only models with a real 3D .glb support AR try-on
      
      const material = w.specs?.['Chất liệu vỏ'] || '';
      if (selectedMaterial !== 'all') {
        if (selectedMaterial === 'gold' && !material.toLowerCase().includes('vàng') && !material.toLowerCase().includes('gold')) return false;
        if (selectedMaterial === 'steel' && !material.toLowerCase().includes('thép') && !material.toLowerCase().includes('steel')) return false;
        if (selectedMaterial === 'ceramic' && !material.toLowerCase().includes('ceramic')) return false;
      }

      const diameter = w.specs?.['Đường kính mặt'] || '';
      if (selectedDiameter !== 'all') {
        const sizeVal = parseFloat(diameter);
        if (selectedDiameter === 'small' && sizeVal >= 41) return false;
        if (selectedDiameter === 'large' && sizeVal < 41) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      return 0; // default / featured
    });

  // Reset to first page whenever the result set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBrand, priceRange, selectedMaterial, selectedDiameter, onlyAR, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredWatches.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedWatches = filteredWatches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans pb-16">
      {/* Hero Banner */}
      <section className="relative bg-[#17140F] text-white py-16 px-6 md:px-12 text-center rounded-b-[40px] shadow-lg border-b border-[#B8924A]/20">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] text-[#B8924A] font-bold mb-3 block animate-fade-in">
            TrueWrist Haute Horlogerie & AR Studio
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-semibold leading-tight mb-4 animate-fade-in text-[#F6F4EF]">
            Đeo thử đồng hồ xa xỉ ngay trên cổ tay của bạn
          </h1>
          <p className="text-sm md:text-base text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Xem sản phẩm dưới định dạng 3D 360 độ và ướm thử tức thì bằng công nghệ AR Hand-Tracking chuẩn xác. Liên hệ shop để sở hữu trực tiếp.
          </p>
          <a
            href="#catalog-section"
            className="inline-block bg-[#B8924A] hover:bg-[#a6803f] text-white font-semibold px-8 py-3.5 rounded-full transition shadow-md hover:scale-105 active:scale-95"
          >
            Khám Phá Bộ Sưu Tập
          </a>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <main id="catalog-section" className="max-w-6xl mx-auto px-4 mt-12 grid md:grid-cols-4 gap-8">
        {/* Left Side: Filter Options */}
        <aside className="md:col-span-1 bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm h-fit">
          <div className="flex items-center justify-between mb-5 border-b border-[#e5e0d8] pb-3">
            <h2 className="font-serif text-lg font-bold">Bộ Lọc</h2>
            <button
              onClick={() => {
                setSelectedBrand('all');
                setPriceRange(350000000);
                setSelectedMaterial('all');
                setSelectedDiameter('all');
                setOnlyAR(false);
                setSortBy('featured');
                setSearchQuery('');
              }}
              className="text-xs text-[#B8924A] hover:underline"
            >
              Đặt lại
            </button>
          </div>

          <div className="space-y-6">
            {/* Brand Filter */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-2">Thương Hiệu</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8924A]"
              >
                <option value="all">Tất cả thương hiệu</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Giá Tối Đa</label>
                <span className="text-xs font-semibold text-[#B8924A]">{formatVND(priceRange)}</span>
              </div>
              <input
                type="range"
                min="5000000"
                max="350000000"
                step="5000000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#B8924A]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5 Trđ</span>
                <span>350 Trđ</span>
              </div>
            </div>

            {/* Material Filter */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-2">Chất Liệu Vỏ</label>
              <div className="flex flex-col gap-1.5 text-sm text-[#17140F]/90">
                {[
                  ['all', 'Tất cả'],
                  ['gold', 'Vàng nguyên khối / Gold'],
                  ['steel', 'Thép không gỉ'],
                  ['ceramic', 'Ceramic cao cấp']
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === val}
                      onChange={() => setSelectedMaterial(val)}
                      className="accent-[#B8924A]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-2">Kích Thước Mặt</label>
              <div className="flex flex-col gap-1.5 text-sm">
                {[
                  ['all', 'Tất cả kích thước'],
                  ['small', 'Mặt nhỏ (Dưới 41mm)'],
                  ['large', 'Mặt lớn (Từ 41mm trở lên)']
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="diameter"
                      checked={selectedDiameter === val}
                      onChange={() => setSelectedDiameter(val)}
                      className="accent-[#B8924A]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AR Try-On Toggle */}
            <div className="border-t border-[#e5e0d8] pt-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAR}
                  onChange={(e) => setOnlyAR(e.target.checked)}
                  className="rounded border-[#e5e0d8] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A] h-4 w-4"
                />
                <span className="text-sm font-semibold flex items-center gap-1.5 text-[#17140F]">
                  <Sparkles className="h-4 w-4" /> <span>Có Sẵn AR Try-On</span>
                </span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Side: Watches Grid */}
        <div className="md:col-span-3">
          {/* Grid Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-[#e5e0d8] shadow-sm text-sm">
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="h-4 w-4" /></span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc thương hiệu…"
                  className="w-full rounded-lg border border-[#e5e0d8] bg-[#F6F4EF] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8924A]"
                />
              </div>
              <div className="whitespace-nowrap">
                Có <span className="font-bold text-[#B8924A]">{filteredWatches.length}</span> sản phẩm phù hợp
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F6F4EF] rounded-lg border border-[#e5e0d8] p-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="featured">Nổi bật / Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#e5e0d8] p-12 text-center shadow-sm text-sm text-[#8A8170]">
              Đang tải…
            </div>
          ) : filteredWatches.length > 0 ? (
            <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedWatches.map((w) => (
                <div
                  key={w.id}
                  className="group bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => onSelectWatch(w.id)}
                >
                  {/* Product Photo */}
                  <div className="relative bg-gradient-to-br from-[#f3efe7] to-[#e9e3d8] h-56 overflow-hidden border-b border-[#e5e0d8]">
                    <img
                      src={w.image}
                      alt={w.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* gradient scrim for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                    {/* AR / 3D badge — only for models with a real 3D asset */}
                    {canTryAr(w) ? (
                      <span className="absolute top-3 right-3 bg-[#B8924A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-widest uppercase flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> AR Try-On
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-white/85 backdrop-blur text-[#17140F] text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-widest uppercase">
                        Ảnh 2D
                      </span>
                    )}

                    {/* Brand overlay */}
                    <span className="absolute bottom-2 left-3 text-[10px] uppercase tracking-[0.15em] text-white/90 font-bold drop-shadow">
                      {w.brand}
                    </span>
                  </div>

                  {/* Watch details */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-serif text-[#17140F] font-bold group-hover:text-[#B8924A] transition text-base mb-1 line-clamp-1">
                      {w.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-[#B8924A]"><Star className="h-3.5 w-3.5 fill-current" /></span>
                      <span className="text-xs font-bold">{w.rating}</span>
                      <span className="text-xs text-gray-400">({w.reviewCount} đánh giá)</span>
                    </div>

                    <div className="mt-auto mb-4 flex flex-col gap-0.5">
                      <span className="text-[#17140F] font-bold text-sm sm:text-base whitespace-nowrap">
                        {formatVND(w.price)}
                      </span>
                      {w.originalPrice && w.originalPrice > w.price && (
                        <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                          {formatVND(w.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Quick action — AR if available, otherwise view details */}
                    {canTryAr(w) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAR(w.id);
                        }}
                        className="w-full bg-[#17140F] text-white text-xs font-semibold py-2.5 rounded-full hover:bg-black transition flex items-center justify-center gap-1.5 shadow-sm border border-[#B8924A]/30"
                      >
                        <Sparkles className="h-4 w-4" /> <span>Thử Đeo AR Tức Thì</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWatch(w.id);
                        }}
                        className="w-full bg-white text-[#17140F] text-xs font-semibold py-2.5 rounded-full hover:bg-[#F6F4EF] transition flex items-center justify-center gap-1.5 shadow-sm border border-[#17140F]/20"
                      >
                        <span>Xem Chi Tiết</span> <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e0d8] bg-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#B8924A] transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                      p === safePage
                        ? 'bg-[#17140F] text-white border border-[#B8924A]/40'
                        : 'bg-white border border-[#e5e0d8] hover:border-[#B8924A]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e0d8] bg-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#B8924A] transition"
                >
                  Sau <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e0d8] p-12 text-center shadow-sm">
              <Search className="h-10 w-10 mx-auto text-gray-400" />
              <h3 className="font-serif text-lg font-bold mt-3 mb-1">Không tìm thấy sản phẩm</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                Vui lòng đổi bộ lọc hoặc đặt lại bộ lọc để xem đầy đủ các mẫu đồng hồ trong tủ đồ.
              </p>
              <button
                onClick={() => {
                  setSelectedBrand('all');
                  setPriceRange(350000000);
                  setSelectedMaterial('all');
                  setSelectedDiameter('all');
                  setOnlyAR(false);
                  setSearchQuery('');
                }}
                className="bg-[#B8924A] text-white px-5 py-2 rounded-full font-semibold text-xs"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
