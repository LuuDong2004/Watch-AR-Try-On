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
import BranchShops, { type BranchShopEntry } from './detail/BranchShops';
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
  const [allShops, setAllShops] = useState<Shop[]>([]);
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
        setAllShops(shops.filter(isPublicShop));
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

  // Similar watches: prioritise same brand + price closest to this model, showing
  // the seller's own branches first, then other shops. Up to 10 results.
  const similar = useMemo(() => {
    if (!watch) return [];
    const ownerId = shop?.ownerId ?? null;
    const ownerByShop = new Map(allShops.map((s) => [s.id, s.ownerId ?? null]));
    const isBranch = (w: Watch) => ownerId != null && ownerByShop.get(w.shopId) === ownerId;
    const sameBrand = (w: Watch) => w.brand === watch.brand;
    const priceGap = (w: Watch) => Math.abs((w.price ?? 0) - (watch.price ?? 0));
    // Tier: 0 = same brand + branch, 1 = same brand + other shop,
    //       2 = other brand + branch, 3 = other brand + other shop.
    const tier = (w: Watch) => (sameBrand(w) ? 0 : 2) + (isBranch(w) ? 0 : 1);

    return allWatches
      .filter((w) => w.id !== watch.id)
      .sort((a, b) => tier(a) - tier(b) || priceGap(a) - priceGap(b))
      .slice(0, 10);
  }, [allWatches, allShops, shop, watch]);

  // Other branches of the same seller account that also stock this brand.
  const branches = useMemo<BranchShopEntry[]>(() => {
    if (!watch || !shop?.ownerId) return [];
    return allShops
      .filter((s) => s.id !== shop.id && s.ownerId && s.ownerId === shop.ownerId)
      .map((s) => {
        const brandWatches = allWatches.filter(
          (w) => w.shopId === s.id && w.brand === watch.brand,
        );
        return { shop: s, matchCount: brandWatches.length, thumb: brandWatches[0]?.image };
      })
      .filter((b) => b.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);
  }, [allShops, allWatches, shop, watch]);

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
          <div className="flex flex-col gap-3">
            <ProductGallery watch={watch} />

            {/* Secondary info — sits under the gallery to fill the empty space; opens as popups.
                On md+ the gallery has a 64px thumbnail rail + 20px gap on the left, so offset
                these buttons by 84px to line them up flush with the big image. */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:ml-[84px]">
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
          </div>

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

        {/* Other branches of the same seller that stock this brand */}
        {onSelectShop && branches.length > 0 && (
          <section className="pt-14">
            <BranchShops brand={watch.brand} branches={branches} onSelect={onSelectShop} />
          </section>
        )}

        {/* Similar watches carousel */}
        <section className="pt-16">
          <SimilarWatches watches={similar} onSelect={onSelectWatch} />
        </section>

        {/* Customer comments */}
        <section className="pb-20 pt-16">
          <header className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">Bình luận</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-navy md:text-3xl">Khách hàng nói gì</h2>
          </header>
          <CustomerReviews watch={watch} shop={shop} />
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
