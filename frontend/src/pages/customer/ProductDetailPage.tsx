import { Component, ReactNode, Suspense, lazy, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../../data/store';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Badge, Button } from '../../components/ui';
import { formatVND, watchGradient } from '../../lib/format';
import Watch3DViewer from '../../components/watch/Watch3DViewer.jsx';

const ARWristTryOn = lazy(() => import('../../components/ar/ARWristTryOn'));

/* Error boundary so a missing/oversized GLB falls back to the gradient hero. */
class ViewerBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const watch = useData((s) => s.watches.find((w) => w.id === id));
  const shop = useData((s) => s.shops.find((sh) => sh.id === watch?.shopId));
  const [arOpen, setArOpen] = useState(false);

  if (!watch) {
    return (
      <CustomerLayout>
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="mb-3 text-5xl">🔍</p>
          <h1 className="font-display text-2xl font-semibold">Không tìm thấy sản phẩm</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-gold hover:underline">
            ← Về trang chủ
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const gradientHero = (
    <div
      className="flex h-[380px] items-center justify-center rounded-2xl border border-gray-100"
      style={{ background: watchGradient(watch.metal, watch.dial) }}
    >
      <span
        className="h-44 w-44 rounded-full border-4 shadow-2xl"
        style={{
          background: `radial-gradient(circle at 32% 28%, ${watch.metal}, ${watch.dial} 80%)`,
          borderColor: watch.accent,
        }}
      />
    </div>
  );

  return (
    <CustomerLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/" className="mb-6 inline-block text-sm text-gray-500 hover:text-black">
          ← Quay lại bộ sưu tập
        </Link>

        <section className="grid items-start gap-8 md:grid-cols-2">
          {/* Visual */}
          <div>
            {watch.modelUrl ? (
              <ViewerBoundary fallback={gradientHero}>
                <Suspense fallback={<div className="h-[380px] animate-pulse rounded-2xl bg-gray-100" />}>
                  <Watch3DViewer modelUrl={watch.modelUrl} variant={watch.variant} height={380} />
                </Suspense>
              </ViewerBoundary>
            ) : (
              gradientHero
            )}
            <p className="mt-2 text-center text-xs text-gray-400">
              Kéo để xoay mô hình 3D · Bấm “Thử AR” để đeo thử qua camera
            </p>
          </div>

          {/* Info */}
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-gray-400">{watch.brand}</p>
            <h1 className="mb-3 font-display text-3xl font-semibold">{watch.name}</h1>

            <div className="mb-5 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatVND(watch.price)}</span>
              {watch.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatVND(watch.originalPrice)}
                </span>
              )}
              <Badge tone="gold">AR Try-On</Badge>
            </div>

            <p className="mb-6 leading-relaxed text-gray-600">{watch.description}</p>

            <Button variant="primary" onClick={() => setArOpen(true)} className="px-7 py-3.5">
              ✨ Thử AR (3D)
            </Button>
            <p className="mt-2 text-xs text-gray-400">
              Cho phép truy cập camera, đưa cổ tay vào khung hình — đồng hồ sẽ tự đeo lên cổ tay theo thời gian thực.
            </p>

            {/* Specs */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="mb-3 text-sm font-semibold">Thông số kỹ thuật</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(watch.specs).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Shop contact */}
            {shop && (
              <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
                <p className="mb-3 text-xs uppercase tracking-widest text-gray-400">Cửa hàng</p>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: shop.color }}
                  >
                    {shop.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{shop.name}</p>
                    <p className="text-sm text-gray-500">{shop.description}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>📞 {shop.phone}</p>
                      <p>✉️ {shop.email}</p>
                      <p>📍 {shop.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {arOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/90" />}>
          <ARWristTryOn
            watchName={watch.name}
            watchId={watch.arWatchId}
            onClose={() => setArOpen(false)}
          />
        </Suspense>
      )}
    </CustomerLayout>
  );
}
