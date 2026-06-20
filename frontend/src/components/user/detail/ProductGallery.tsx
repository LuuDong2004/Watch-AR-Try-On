import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, MousePointer, X } from 'lucide-react';
import Watch3DViewer from '../../watch/Watch3DViewer';
import { canTryAr } from '../../../utils/publicListings';

interface ProductGalleryProps {
  watch: any;
}

/**
 * Product gallery with optional 3D stage. Photo hover zoom is intentionally
 * disabled; clicking a photo opens a lightbox that can browse every image.
 */
export default function ProductGallery({ watch }: ProductGalleryProps) {
  const gallery: string[] = Array.from(
    new Set((watch.gallery?.length ? watch.gallery : [watch.image]).filter(Boolean)),
  );
  const has3D = canTryAr(watch) && !!watch.model;

  const [active, setActive] = useState<'live3d' | number>(has3D ? 'live3d' : 0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setActive(has3D ? 'live3d' : 0);
    setLightbox(false);
  }, [watch.id, has3D]);

  const currentIndex = typeof active === 'number' ? active : 0;
  const currentPhoto = gallery[currentIndex] ?? watch.image;

  const showPhoto = (index: number) => {
    if (gallery.length === 0) return;
    setActive((index + gallery.length) % gallery.length);
  };

  const nudgePhoto = (delta: number) => {
    showPhoto(currentIndex + delta);
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') nudgePhoto(-1);
      if (e.key === 'ArrowRight') nudgePhoto(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, currentIndex, gallery.length]);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-5">
      <div className="flex flex-row gap-3 md:flex-col">
        {has3D && (
          <button
            type="button"
            onClick={() => setActive('live3d')}
            title="Xem mô hình 3D 360"
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy text-white transition ${
              active === 'live3d'
                ? 'ring-2 ring-champagne ring-offset-2 ring-offset-cream'
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            <span className="text-center text-[9px] font-bold leading-tight tracking-wider">
              360
              <br />
              3D
            </span>
          </button>
        )}

        {gallery.map((src, idx) => (
          <button
            type="button"
            key={src}
            onClick={() => showPhoto(idx)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl transition ${
              active === idx
                ? 'ring-2 ring-champagne ring-offset-2 ring-offset-cream'
                : 'opacity-60 hover:opacity-100'
            }`}
            aria-label={`Xem ảnh ${idx + 1}`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="relative flex-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#e9e3d8] bg-white shadow-luxe-sm">
          {active === 'live3d' && has3D ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f6f4ef] to-[#ece6da]">
              <Watch3DViewer modelUrl={watch.model} variant={watch.variant} height={520} />
              <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy/70 px-3.5 py-1.5 text-[10px] font-medium text-white">
                <MousePointer className="h-3.5 w-3.5" /> Nhấn và kéo để xoay 360
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="relative h-full w-full cursor-pointer text-left"
              onClick={() => currentPhoto && setLightbox(true)}
              aria-label="Mở ảnh sản phẩm"
            >
              <img
                src={currentPhoto}
                alt={watch.name}
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-navy shadow-luxe-sm backdrop-blur">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>

      {lightbox && currentPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nudgePhoto(-1);
                }}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-8"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nudgePhoto(1);
                }}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-8"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="flex max-h-[92vh] max-w-[94vw] flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhoto}
              alt={watch.name}
              className="max-h-[78vh] max-w-[94vw] rounded-2xl object-contain shadow-luxe-lg"
            />

            {gallery.length > 1 && (
              <div className="flex max-w-[94vw] items-center gap-2 overflow-x-auto rounded-full bg-white/10 p-2 backdrop-blur">
                {gallery.map((src, idx) => (
                  <button
                    type="button"
                    key={`${src}-${idx}`}
                    onClick={() => showPhoto(idx)}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded-full border transition ${
                      currentIndex === idx ? 'border-champagne opacity-100' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
