import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ClipboardList, BookOpen } from 'lucide-react';
import { watchApi, shopApi, favoriteApi, ApiError } from '../../api';
import type { Watch, Shop } from '../../api';
import { useSession } from '../../auth/session';
import { useLoginPrompt } from '../../auth/loginPrompt';

import ProductGallery from './detail/ProductGallery';
import ProductSummary from './detail/ProductSummary';
import SpecGrid from './detail/SpecGrid';
import ProductStory from './detail/ProductStory';
import SimilarWatches from './detail/SimilarWatches';
import CustomerReviews from './detail/CustomerReviews';
import DetailModal from './detail/DetailModal';
import ProductContactModal from './detail/ProductContactModal';
import { isPublicShop, isPublicWatch, publicWatches } from '../../utils/publicListings';

interface UserDetailProps {
  watchId: string;
  onOpenAR: (watchId: string) => void;
  onBack: () => void;
  onSelectWatch: (id: string) => void;
  onSelectShop?: (shopId: string) => void;
}

/**
 * Luxury watch product detail page (Chrono24 / Rolex-class experience).
 *
 * Orchestrates a presentational component tree:
 *   ProductGallery · ProductSummary · SpecGrid · ProductStory
 *   · SimilarWatches · CustomerReviews
 *
 * "Liên hệ người bán" links straight to the seller's shop page (no inline form).
 * State (watch, shop, favorites, popups) lives here; children are pure.
 */
export default function UserDetail({ watchId, onOpenAR, onBack, onSelectWatch, onSelectShop }: UserDetailProps) {
  const user = useSession((s) => s.user);
  const showLogin = useLoginPrompt((s) => s.show);

  const [watch, setWatch] = useState<Watch | null>(null);
  const [allWatches, setAllWatches] = useState<Watch[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [info, setInfo] = useState<null | 'specs' | 'story'>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWatch(null);
    Promise.all([watchApi.get(watchId), watchApi.list(), shopApi.list()])
      .then(([found, list, shops]) => {
        if (cancelled) return;
        const foundShop = found ? shops.find((s) => s.id === found.shopId && isPublicShop(s)) || null : null;
        const visibleWatch = found && foundShop && isPublicWatch(found) ? found : null;
        setAllWatches(publicWatches(list, shops));
        setWatch(visibleWatch);
        setShop(visibleWatch ? foundShop : null);
      })
      .catch(() => {
        if (cancelled) return;
        setWatch(null);
        setShop(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [watchId]);

  // Resolve favorite state for signed-in users only.
  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsFavorited(false); return; }
    favoriteApi
      .list()
      .then((ids) => { if (!cancelled) setIsFavorited(ids.includes(watchId)); })
      .catch(() => { if (!cancelled) setIsFavorited(false); });
    return () => { cancelled = true; };
  }, [watchId, user]);

  // Similar watches: same brand first, then fill with other models.
  const similar = useMemo(() => {
    if (!watch) return [];
    const others = allWatches.filter((w) => w.id !== watch.id);
    const sameBrand = others.filter((w) => w.brand === watch.brand);
    const rest = others.filter((w) => w.brand !== watch.brand);
    return [...sameBrand, ...rest].slice(0, 8);
  }, [allWatches, watch]);

  if (loading || !watch) {
    return <div className="py-20 text-center font-display text-lg text-navy">Đang tải chi tiết đồng hồ...</div>;
  }

  const handleFavorite = async () => {
    if (!user) { showLogin('login'); return; }
    try {
      const fav = await favoriteApi.toggle(watch.id);
      setIsFavorited(fav);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) showLogin('login');
    }
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <div className="mx-auto max-w-6xl px-4">
        {/* Breadcrumb / back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-6 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 transition hover:text-champagne"
        >
          <ArrowLeft className="h-4 w-4" /> Bộ sưu tập / <span className="text-navy">{watch.brand}</span>
        </button>

        {/* SECTION 1 — Hero product (gallery 60% · summary 40%) */}
        <section className="grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
          <ProductGallery watch={watch} />
          <div className="lg:sticky lg:top-24">
            <ProductSummary
              watch={watch}
              shop={shop}
              isFavorited={isFavorited}
              onToggleFavorite={handleFavorite}
              onOpenAR={() => onOpenAR(watch.id)}
              onOpenContact={() => setContactOpen(true)}
              onOpenShop={onSelectShop}
            />
          </div>
        </section>

        {/* Secondary info — opened as popups to keep the page compact */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setInfo('specs')}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[#e9e3d8] bg-white px-5 py-4 text-left shadow-luxe-sm transition hover:-translate-y-0.5 hover:shadow-luxe"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne"><ClipboardList className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-sm font-bold text-navy">Thông số kỹ thuật</span>
                <span className="block text-xs text-gray-500">Chi tiết chế tác & cấu hình</span>
              </span>
            </span>
            <span className="text-champagne transition group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
          </button>

          <button
            onClick={() => setInfo('story')}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[#e9e3d8] bg-white px-5 py-4 text-left shadow-luxe-sm transition hover:-translate-y-0.5 hover:shadow-luxe"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne"><BookOpen className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-sm font-bold text-navy">Câu chuyện sản phẩm</span>
                <span className="block text-xs text-gray-500">Di sản & nghệ thuật chế tác</span>
              </span>
            </span>
            <span className="text-champagne transition group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
          </button>
        </div>

        {/* Similar watches carousel */}
        <section className="pt-16">
          <SimilarWatches watches={similar} onSelect={onSelectWatch} />
        </section>

        {/* Customer reviews */}
        <section className="pb-20 pt-16">
          <header className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">Đánh giá</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-navy md:text-3xl">Khách hàng nói gì</h2>
          </header>
          <CustomerReviews watch={watch} />
        </section>
      </div>

      {/* Specs popup */}
      <DetailModal
        open={info === 'specs'}
        onClose={() => setInfo(null)}
        eyebrow="Thông số kỹ thuật"
        title="Chi tiết chế tác"
      >
        <SpecGrid specs={watch.specs || {}} />
      </DetailModal>

      {/* Story popup */}
      <DetailModal
        open={info === 'story'}
        onClose={() => setInfo(null)}
        eyebrow="Câu chuyện sản phẩm"
        title={watch.name}
      >
        <ProductStory watch={watch} />
      </DetailModal>

      <ProductContactModal
        open={contactOpen}
        watch={watch}
        shop={shop}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
