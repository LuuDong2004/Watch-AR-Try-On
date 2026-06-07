/**
 * Lets the shop owner frame an uploaded photo before committing it. The image
 * is shown inside a fixed-aspect window that supports pan and zoom; on confirm
 * it crops to that window with a canvas and returns a JPEG Blob.
 */
import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, Check, Move } from 'lucide-react';

interface ImageAdjustModalProps {
  file: File;
  aspect?: number;
  outputWidth?: number;
  title?: string;
  helpText?: string;
  confirmText?: string;
  busyText?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function ImageAdjustModal({
  file,
  aspect = 16 / 9,
  outputWidth = 1280,
  title = 'Căn chỉnh ảnh',
  helpText = 'Kéo để di chuyển, dùng thanh trượt để phóng to',
  confirmText = 'Chốt và dùng ảnh này',
  busyText = 'Đang tải lên...',
  busy = false,
  onCancel,
  onConfirm,
}: ImageAdjustModalProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [src, setSrc] = useState<string>('');
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (el) setFrame({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [src]);

  const baseScale = nat && frame.w ? Math.max(frame.w / nat.w, frame.h / nat.h) : 1;
  const scale = baseScale * zoom;
  const dispW = nat ? nat.w * scale : 0;
  const dispH = nat ? nat.h * scale : 0;

  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(frame.w - dispW, x)),
    y: Math.min(0, Math.max(frame.h - dispH, y)),
  });

  const inited = useRef(false);
  useEffect(() => {
    if (!nat || !frame.w) return;
    if (!inited.current) {
      inited.current = true;
      setOffset({ x: (frame.w - dispW) / 2, y: (frame.h - dispH) / 2 });
    } else {
      setOffset((o) => clamp(o.x, o.y));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, nat, frame.w, frame.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.px);
    const ny = drag.current.oy + (e.clientY - drag.current.py);
    setOffset(clamp(nx, ny));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const handleConfirm = () => {
    if (!nat || !imgRef.current || !frame.w) return;
    const outW = outputWidth;
    const outH = Math.round(outW / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (0 - offset.x) / scale;
    const sy = (0 - offset.y) / scale;
    const sw = frame.w / scale;
    const sh = frame.h / scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[#17140F]">{title}</h3>
          <button onClick={onCancel} aria-label="Đóng" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-gray-500">
          <Move className="h-3.5 w-3.5 text-[#B8924A]" /> {helpText}
        </p>

        <div
          ref={frameRef}
          className="relative w-full overflow-hidden rounded-2xl border border-[#e5e0d8] bg-[#F6F4EF] touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {src && nat && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: dispW,
                height: dispH,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: 'none',
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/60" />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-[#B8924A]" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#B8924A]"
          />
          <span className="w-10 text-right text-[11px] tabular-nums text-gray-500">{zoom.toFixed(1)}x</span>
        </div>

        <div className="mt-5 flex gap-2 text-xs font-bold">
          <button
            onClick={handleConfirm}
            disabled={busy || !nat}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#17140F] py-3 text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {busy ? busyText : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-[#e5e0d8] py-3 font-semibold text-gray-500 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
