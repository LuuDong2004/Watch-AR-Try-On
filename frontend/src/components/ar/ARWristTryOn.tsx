/**
 * ARWristTryOn — fullscreen MediaPipe wrist try-on overlay.
 *
 * Wraps the ported 11Exe AR engine (MediaPipe Hand Landmarker + Three.js wrist
 * anchor + occlusion) into a closable overlay so the 10Exe product page can
 * launch it from the "Thử AR (3D)" button. Unlike the standalone 11Exe page,
 * there is no intro screen: mounting goes straight to requesting the camera, and
 * a ✕ button returns to the product page.
 */
import { useEffect } from 'react';
import { CameraView } from '../CameraView';
import { WatchSelector } from '../WatchSelector';
import { CaptureButton } from '../CaptureButton';
import { LoadingScreen } from '../LoadingScreen';
import { useARStore } from '../../store/useARStore';
import '../../ar/ar-tryon.css';

interface ARWristTryOnProps {
  watchName?: string;
  /** Optional watch id to preselect from src/config/watches.ts. */
  watchId?: string;
  onClose?: () => void;
}

/* ----------------------------------------------------------- Close button */

function CloseButton({ onClose }: { onClose?: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Đóng"
      className="glass pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-lg text-white/90 transition active:scale-95"
    >
      ✕
    </button>
  );
}

/* --------------------------------------------------------------- Top controls */

function TopControls({ watchName, onClose }: { watchName?: string; onClose?: () => void }) {
  const toggleCamera = useARStore((s) => s.toggleCamera);
  const toggleDebug = useARStore((s) => s.toggleDebug);
  const debug = useARStore((s) => s.debug);
  const fps = useARStore((s) => s.fps);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
      <div className="pointer-events-auto flex items-center gap-2">
        <CloseButton onClose={onClose} />
        <div className="leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-white/50">AR Try-On · MediaPipe</p>
          {watchName && <p className="text-sm font-semibold text-white/90">{watchName}</p>}
        </div>
        {debug && (
          <span className="glass ml-1 rounded-full px-3 py-1 text-xs font-medium tabular-nums text-white/80">
            {fps} fps
          </span>
        )}
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button
          onClick={toggleCamera}
          aria-label="Flip camera"
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 7h3l2-2h8l2 2h3v12H3z" />
            <circle cx="12" cy="13" r="3.2" />
            <path d="M9 13a3 3 0 0 1 4-2.8M15 13a3 3 0 0 1-4 2.8" />
          </svg>
        </button>
        <button
          onClick={toggleDebug}
          aria-label="Toggle debug overlay"
          className={`glass flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 ${
            debug ? 'text-gold' : 'text-white/60'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- Debug rotate controls */

function RotateControls() {
  const debug = useARStore((s) => s.debug);
  const rotAdjust = useARStore((s) => s.rotAdjust);
  const scaleAdjust = useARStore((s) => s.scaleAdjust);
  const flipDial = useARStore((s) => s.flipDial);
  const rotateAxis = useARStore((s) => s.rotateAxis);
  const nudgeScale = useARStore((s) => s.nudgeScale);
  const toggleFlip = useARStore((s) => s.toggleFlip);
  const resetAdjust = useARStore((s) => s.resetAdjust);
  if (!debug) return null;

  const deg = rotAdjust.map((r) => Math.round((r * 180) / Math.PI));
  return (
    <div className="pointer-events-auto absolute left-3 top-20 z-30 flex flex-col gap-1.5 animate-fade-in">
      <p className="text-[10px] uppercase tracking-widest text-white/40">Rotate +90°</p>
      {(['X', 'Y', 'Z'] as const).map((label, i) => (
        <button
          key={label}
          onClick={() => rotateAxis(i as 0 | 1 | 2)}
          className="glass flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white/90 active:scale-95"
        >
          {label}
        </button>
      ))}
      <span className="glass rounded-md px-1.5 py-1 text-center text-[9px] tabular-nums text-gold">
        {deg[0]},{deg[1]},{deg[2]}
      </span>

      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Size</p>
      <button
        onClick={() => nudgeScale(1)}
        className="glass flex h-9 w-9 items-center justify-center rounded-lg text-lg font-semibold text-white/90 active:scale-95"
      >
        +
      </button>
      <button
        onClick={() => nudgeScale(-1)}
        className="glass flex h-9 w-9 items-center justify-center rounded-lg text-lg font-semibold text-white/90 active:scale-95"
      >
        −
      </button>
      <span className="glass rounded-md px-1.5 py-1 text-center text-[9px] tabular-nums text-gold">
        ×{scaleAdjust.toFixed(2)}
      </span>

      <button
        onClick={toggleFlip}
        className={`glass mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-semibold active:scale-95 ${
          flipDial ? 'text-gold' : 'text-white/80'
        }`}
      >
        FLIP
      </button>

      <button
        onClick={resetAdjust}
        className="glass mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-semibold text-white/70 active:scale-95"
      >
        RST
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ Denied screen */

function DeniedScreen({ onClose }: { onClose?: () => void }) {
  const setStatus = useARStore((s) => s.setStatus);
  const setError = useARStore((s) => s.setError);
  const error = useARStore((s) => s.error);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black px-6 animate-fade-in">
      <div className="glass w-full max-w-sm rounded-3xl p-7 text-center">
        <h2 className="text-xl font-semibold">Không truy cập được camera</h2>
        <p className="mt-3 text-sm text-white/60">{error ?? 'Cần quyền truy cập camera.'}</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              setError(null);
              setStatus('requesting');
            }}
            className="flex-1 rounded-2xl bg-white py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition active:scale-[0.98]"
          >
            Thử lại
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/20 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80 transition active:scale-[0.98]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Overlay */

export default function ARWristTryOn({ watchName, watchId, onClose }: ARWristTryOnProps) {
  const status = useARStore((s) => s.status);
  const setStatus = useARStore((s) => s.setStatus);
  const selectWatch = useARStore((s) => s.selectWatch);

  // Skip the intro: go straight to requesting the camera when the overlay opens.
  useEffect(() => {
    if (watchId) selectWatch(watchId);
    setStatus('requesting');
    // On close/unmount, reset the flow so re-opening requests the camera again.
    return () => setStatus('intro');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow ESC to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-black text-white">
      {(status === 'requesting' || status === 'ready') && (
        <>
          <CameraView />
          <TopControls watchName={watchName} onClose={onClose} />
          <RotateControls />
          <CaptureButton />
          <WatchSelector />
        </>
      )}

      {status === 'requesting' && <LoadingScreen label="Đang khởi động camera" />}
      {status === 'denied' && <DeniedScreen onClose={onClose} />}
    </div>
  );
}
