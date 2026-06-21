import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Search, Star, Store, Globe, X, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { feedbackApi, ApiError } from '../../api';
import type { Feedback } from '../../api';

const PAGE_SIZE = 12;

/** Build a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 10]. */
const pageItems = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('…');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('…');
  items.push(total);
  return items;
};

const TARGET_LABELS: Record<Feedback['target'], string> = {
  shop: 'Góp ý cửa hàng',
  website: 'Trải nghiệm nền tảng',
};

type TargetFilter = 'all' | Feedback['target'];

const initialsOf = (name: string) =>
  (name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const Stars = ({ rating, className = 'h-3.5 w-3.5' }: { rating: number; className?: string }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`${className} ${n <= rating ? 'fill-[#B8924A] text-[#B8924A]' : 'fill-gray-200 text-gray-200'}`}
      />
    ))}
  </span>
);

export default function AdminFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await feedbackApi.list();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((f) => {
      if (targetFilter !== 'all' && f.target !== targetFilter) return false;
      if (q && !`${f.name} ${f.message} ${f.topic || ''} ${f.shopName || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, targetFilter]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => { setPage(1); }, [search, targetFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const stats = useMemo(() => {
    const total = items.length;
    const shop = items.filter((f) => f.target === 'shop').length;
    const website = items.filter((f) => f.target === 'website').length;
    const avg = total ? items.reduce((s, f) => s + (f.rating || 0), 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: items.filter((f) => Math.round(f.rating) === star).length,
    }));
    return { total, shop, website, avg, dist };
  }, [items]);

  const filterPills: { key: TargetFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: stats.total },
    { key: 'shop', label: 'Cửa hàng', count: stats.shop },
    { key: 'website', label: 'Nền tảng', count: stats.website },
  ];

  const formatDateTime = (ts?: string) => (ts ? new Date(ts).toLocaleString('vi-VN') : '—');

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans p-6 md:p-10 w-full overflow-y-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2">Trải nghiệm khách hàng</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#17140F]">Góp Ý Từ Người Dùng</h1>
        <p className="text-xs text-gray-500 mt-2 max-w-xl">
          Lắng nghe phản hồi của khách hàng về cửa hàng đối tác và trải nghiệm trên nền tảng TrueWrist.
        </p>
      </header>

      {/* Summary: satisfaction score + rating distribution */}
      <section className="bg-white rounded-3xl border border-[#e5e0d8] shadow-sm p-7 md:p-9 mb-6">
        <div className="grid md:grid-cols-[minmax(0,260px)_1fr] gap-8 md:gap-12 items-center">
          {/* Hero score */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left md:border-r border-[#e5e0d8] md:pr-12">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-3">Điểm hài lòng</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-display text-6xl font-bold leading-none text-[#17140F]">{stats.avg.toFixed(1)}</span>
              <span className="text-gray-300 text-base font-semibold mb-1.5">/ 5.0</span>
            </div>
            <Stars rating={Math.round(stats.avg)} className="h-4 w-4" />
            <p className="text-[11px] text-gray-400 mt-3">
              Dựa trên <span className="text-[#17140F] font-bold">{stats.total}</span> góp ý
            </p>
          </div>

          {/* Distribution */}
          <div className="space-y-2.5">
            {stats.dist.map((d) => {
              const pct = stats.total ? (d.count / stats.total) * 100 : 0;
              return (
                <div key={d.star} className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 w-8 text-[11px] font-bold text-gray-500">
                    {d.star}<Star className="h-3 w-3 fill-[#B8924A] text-[#B8924A]" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#F6F4EF] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#B8924A] to-[#cda863] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] text-gray-400 font-semibold tabular-nums">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segmented totals */}
        <div className="grid grid-cols-3 gap-px mt-7 pt-6 border-t border-[#e5e0d8] text-center">
          <div>
            <p className="font-display text-xl font-bold text-[#17140F]">{stats.total}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">Tổng góp ý</p>
          </div>
          <div className="border-x border-[#e5e0d8]">
            <p className="font-display text-xl font-bold text-[#B8924A]">{stats.shop}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">Về cửa hàng</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-[#B8924A]">{stats.website}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">Về nền tảng</p>
          </div>
        </div>
      </section>

      {/* List card with embedded toolbar */}
      <section className="bg-white rounded-3xl border border-[#e5e0d8] shadow-sm">
        {/* Toolbar header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-5 md:p-6 border-b border-[#e5e0d8]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, nội dung, chủ đề hoặc cửa hàng…"
              className="w-full pl-10 pr-9 py-2.5 rounded-full border border-[#e5e0d8] bg-[#F6F4EF] text-xs focus:outline-none focus:border-[#B8924A] focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterPills.map((p) => (
              <button
                key={p.key}
                onClick={() => setTargetFilter(p.key)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-bold transition border ${
                  targetFilter === p.key
                    ? 'bg-[#17140F] text-white border-[#17140F] shadow-sm'
                    : 'bg-white text-gray-500 border-[#e5e0d8] hover:border-[#B8924A]/60 hover:text-[#17140F]'
                }`}
              >
                {p.label} <span className="opacity-50">{p.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          <p className="text-[11px] text-gray-400 font-semibold mb-5">
            {filtered.length > 0 ? (
              <>Hiển thị <span className="text-[#17140F] font-bold">{rangeStart}–{rangeEnd}</span> trong {filtered.length} góp ý{filtered.length !== items.length ? ` (lọc từ ${items.length})` : ''}</>
            ) : (
              <>Hiển thị <span className="text-[#17140F] font-bold">0</span> / {items.length} góp ý</>
            )}
          </p>

          {loading && <p className="py-12 text-center text-gray-400 text-xs">Đang tải…</p>}
          {!loading && error && <p className="py-12 text-center text-red-500 text-xs">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="h-14 w-14 mx-auto rounded-full bg-[#F6F4EF] flex items-center justify-center text-gray-300 mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="text-sm font-serif font-bold text-[#17140F] mb-1">
                {items.length === 0 ? 'Chưa có góp ý nào' : 'Không tìm thấy góp ý phù hợp'}
              </p>
              <p className="text-xs text-gray-400">
                {items.length === 0 ? 'Phản hồi của khách hàng sẽ xuất hiện tại đây.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            {!loading && !error && paged.map((f) => (
              <article
                key={f.id}
                className="group relative bg-[#F6F4EF]/50 rounded-2xl border border-[#e5e0d8] p-6 transition hover:bg-white hover:border-[#B8924A]/60 hover:shadow-md"
              >
                {/* Header: author + rating */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-10 w-10 rounded-full bg-[#17140F] text-[#F6F4EF] text-xs font-bold flex items-center justify-center ring-1 ring-[#B8924A]/40 flex-shrink-0">
                      {initialsOf(f.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#17140F] text-sm truncate">{f.name}</p>
                      {f.contact && <p className="text-[11px] text-gray-400 truncate">{f.contact}</p>}
                    </div>
                  </div>
                  <Stars rating={f.rating} />
                </div>

                {/* Message as a quote */}
                <div className="relative pl-7">
                  <Quote className="absolute left-0 top-0 h-5 w-5 text-[#B8924A]/35 fill-[#B8924A]/15" />
                  <p className="font-serif italic text-[#17140F]/85 leading-relaxed text-sm">
                    {f.message}
                  </p>
                </div>

                {/* Footer: meta */}
                <div className="flex items-center justify-between gap-2 flex-wrap mt-5 pt-4 border-t border-[#e5e0d8]">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
                      {f.target === 'shop' ? <Store className="h-3.5 w-3.5 text-[#B8924A]" /> : <Globe className="h-3.5 w-3.5 text-[#B8924A]" />}
                      {TARGET_LABELS[f.target]}
                    </span>
                    {f.target === 'shop' && f.shopName && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="font-bold text-[#B8924A]">{f.shopName}</span>
                      </>
                    )}
                    {f.topic && (
                      <span className="bg-[#17140F]/[0.04] text-gray-600 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        {f.topic}
                      </span>
                    )}
                  </div>
                  <time className="text-[10px] text-gray-400 whitespace-nowrap">{formatDateTime(f.timestamp)}</time>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {!loading && !error && pageCount > 1 && (
            <div className="mt-7 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e0d8] bg-white text-gray-500 transition hover:border-[#B8924A] hover:text-[#17140F] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageItems(currentPage, pageCount).map((it, i) =>
                it === '…' ? (
                  <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={it}
                    onClick={() => setPage(it)}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-bold transition ${
                      it === currentPage
                        ? 'bg-[#17140F] text-white shadow-sm'
                        : 'border border-[#e5e0d8] bg-white text-gray-600 hover:border-[#B8924A] hover:text-[#17140F]'
                    }`}
                  >
                    {it}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e0d8] bg-white text-gray-500 transition hover:border-[#B8924A] hover:text-[#17140F] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
