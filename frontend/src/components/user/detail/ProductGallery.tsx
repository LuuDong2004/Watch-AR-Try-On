import React, { useEffect, useRef, useState } from 'react';
import { MousePointer, Maximize2, X } from 'lucide-react';
import Watch3DViewer from '../../watch/Watch3DViewer';

interface ProductGalleryProps {
  watch: any;
}

/**
 * Luxury product gallery.
 *  - Large main stage (cursor-follow zoom on hover, click for fullscreen).
 *  - Optional 360° 3D tile when the model supports AR.
 *  - Vertical thumbnail rail on desktop, horizontal on mobile.
 */
export default function ProductGallery({ watch }: ProductGalleryProps) {
  const gallery: string[] = watch.gallery?.length ? watch.gallery : [watch.image];
  const has3D = !!(watch.hasAR && watch.model);

  // 'live3d' = the rotating model; a number = that gallery photo.
  const [active, setActive] = useState<'live3d' | number>(has3D ? 'live3d' : 0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Reset when the watch changes.
  useEffect(() => {
    setActive(has3D ? 'live3d' : 0);
    setLightbox(false);
  }, [watch.id, has3D]);

  // Close the lightbox on Escape.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const currentPhoto = typeof active === 'number' ? gallery[active] ?? watch.image : watch.image;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      on: true,
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-5">
      {/* Thumbnail rail */}
      <div className="flex flex-row gap-3 md:flex-col">
        {has3D && (
          <button
            onClick={() => setActive('live3d')}
            title="Xem mô hình 3D 360°"
            className={`relative h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center bg-navy text-white transition ${
              active === 'live3d'
                ? 'ring-2 ring-champagne ring-offset-2 ring-offset-cream'
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            <span className="text-[9px] font-bold leading-tight text-center tracking-wider">
              360°
              <br />
              3D
            </span>
          </button>
        )}
        {gallery.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl transition ${
              active === idx
                ? 'ring-2 ring-champagne ring-offset-2 ring-offset-cream'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main stage */}
      <div className="relative flex-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-[#e9e3d8] bg-white shadow-luxe-sm">
          {active === 'live3d' && has3D ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f6f4ef] to-[#ece6da]">
              <Watch3DViewer modelUrl={watch.model} variant={watch.variant} height={520} />
              <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy/70 px-3.5 py-1.5 text-[10px] font-medium text-white">
                <MousePointer className="h-3.5 w-3.5" /> Nhấn & kéo để xoay 360°
              </span>
            </div>
          ) : (
            <div
              ref={stageRef}
              className="h-full w-full cursor-zoom-in"
              onMouseMove={handleMove}
              onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
              onClick={() => setLightbox(true)}
            >
              <img
                src={currentPhoto}
                alt={watch.name}
                className="h-full w-full object-cover transition-transform duration-200 ease-out"
                style={{
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  transform: zoom.on ? 'scale(1.9)' : 'scale(1)',
                }}
              />
              {/* Fullscreen affordance */}
              <span className="pointer-events-none absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-navy shadow-luxe-sm backdrop-blur">
                <Maximize2 className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 p-6 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={currentPhoto}
            alt={watch.name}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-luxe-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
