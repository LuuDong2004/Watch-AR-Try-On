import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../data/store';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Badge } from '../../components/ui';
import { formatVND, watchGradient } from '../../lib/format';

export default function HomePage() {
  const watches = useData((s) => s.watches);
  const shops = useData((s) => s.shops);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<string>('all');

  const brands = useMemo(
    () => ['all', ...Array.from(new Set(watches.map((w) => w.brand)))],
    [watches],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return watches.filter((w) => {
      const matchBrand = brand === 'all' || w.brand === brand;
      const matchQuery =
        !q || w.name.toLowerCase().includes(q) || w.brand.toLowerCase().includes(q);
      return matchBrand && matchQuery;
    });
  }, [watches, query, brand]);

  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? '—';

  return (
    <CustomerLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#10121a] via-[#161a26] to-[#0c0e15] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-gold">
            Virtual Boutique
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight md:text-5xl">
            Thử đồng hồ cao cấp ngay trên cổ tay bạn — bằng AR thời gian thực
          </h1>
          <p className="mt-5 max-w-xl text-white/60">
            Duyệt bộ sưu tập, xem mô hình 3D và bấm “Thử AR” để đeo thử qua camera.
            Theo dõi cổ tay bằng MediaPipe, đồng hồ ôm khít và xoay theo tay.
          </p>
          <a
            href="#catalog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Khám phá bộ sưu tập ↓
          </a>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Bộ sưu tập</h2>
            <p className="text-sm text-gray-500">{filtered.length} sản phẩm</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc thương hiệu…"
            className="w-full rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 md:w-72"
          />
        </div>

        {/* Brand filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                brand === b
                  ? 'bg-ink text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {b === 'all' ? 'Tất cả' : b}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <Link
              key={w.id}
              to={`/watch/${w.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="flex h-52 items-center justify-center"
                style={{ background: watchGradient(w.metal, w.dial) }}
              >
                <span
                  className="h-28 w-28 rounded-full border-4 shadow-2xl transition group-hover:scale-105"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${w.metal}, ${w.dial} 80%)`,
                    borderColor: w.accent,
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-gray-400">{w.brand}</p>
                  <Badge tone="gold">AR</Badge>
                </div>
                <h3 className="line-clamp-2 font-semibold leading-snug">{w.name}</h3>
                <p className="mt-1 text-xs text-gray-400">{shopName(w.shopId)}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold">{formatVND(w.price)}</span>
                  {w.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatVND(w.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            Không tìm thấy đồng hồ phù hợp.
          </div>
        )}
      </section>
    </CustomerLayout>
  );
}
