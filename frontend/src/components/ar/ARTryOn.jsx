import { useEffect, useRef, useState } from 'react'
import * as deepar from 'deepar'

const LICENSE_KEY = import.meta.env.VITE_DEEPAR_LICENSE_KEY
const DEFAULT_EFFECT =
  import.meta.env.VITE_DEEPAR_EFFECT_URL || '/effects/chronograph-white.deepar'

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} quá lâu (timeout ${ms / 1000}s)`)), ms)
    ),
  ])
}

// A missing .deepar file is served as index.html by the SPA catch-all rewrite
// (both on Vercel and in Vite dev). Feeding that HTML to DeepAR.switchEffect
// crashes the WASM ("RuntimeError: unreachable"). So verify the URL points to a
// real binary effect — not an HTML fallback — before loading it.
// Use HEAD so we DON'T download the whole (10+ MB) effect just to validate it —
// a full no-store arrayBuffer() on a slow/dropped connection is what made the
// loader hang "đang khởi động mãi".
async function effectFileExists(url) {
  try {
    const res = await withTimeout(
      fetch(url, { method: 'HEAD', cache: 'no-store' }),
      8000,
      'Kiểm tra hiệu ứng'
    )
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('text/html')) return false
    const len = Number(res.headers.get('content-length') || '0')
    // A real effect is far larger than the HTML shell; if the server hides
    // content-length, fall back to trusting a non-HTML response.
    return len === 0 || len > 1024
  } catch {
    return false
  }
}

// Built-in DeepAR sample effects (copied to /deepar/effects by copy-deepar.mjs).
// Use ?effect=blur etc. to verify DeepAR renders at all on a device, isolating
// whether a problem is the device/SDK vs. our chronograph wrist effect.
const SAMPLE_EFFECTS = {
  blur: '/deepar/effects/background_blur.deepar',
  aviators: '/deepar/effects/aviators',
  lion: '/deepar/effects/lion',
}

export default function ARTryOn({
  watchName = 'Đồng hồ',
  effectUrl = DEFAULT_EFFECT,
  onClose,
  onScreenshot,
}) {
  // Optional ?effect= override for diagnostics.
  const effectOverride =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('effect')
      : null
  const activeEffect = SAMPLE_EFFECTS[effectOverride] || effectUrl

  const containerRef = useRef(null)
  const deepARRef = useRef(null)
  const facingRef = useRef('environment')
  const [status, setStatus] = useState({
    loading: true,
    step: 'Đang khởi động DeepAR...',
    error: null,
    effectMissing: false,
    effectLoading: false,
  })

  // ── Khởi tạo DeepAR ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setStatus({ loading: true, step: 'Đang khởi động...', error: null, effectMissing: false })

        if (!LICENSE_KEY) {
          throw new Error(
            'Thiếu VITE_DEEPAR_LICENSE_KEY. Hãy đặt license key (khóa theo domain) ' +
            'trong biến môi trường khi build, hoặc dùng chế độ "Thử AR (PNG)" không cần license.'
          )
        }

        // Initialize WITHOUT an effect — the camera/tracking still start.
        // The wrist effect is loaded separately only if its file is real.
        // Race against a timeout: a bad/domain-mismatched license or failed
        // WASM load can leave initialize() pending forever → spinner kẹt mãi.
        const deepAR = await Promise.race([
          deepar.initialize({
            licenseKey: LICENSE_KEY,
            previewElement: containerRef.current,

            // Self-host the SDK assets (ML models + WASM) from our own origin.
            // The default rootPath is the JsDelivr CDN, which is slow/blocked in
            // some regions and makes switchEffect() hang downloading the wrist
            // model. public/deepar is populated by scripts/copy-deepar.mjs.
            rootPath: '/deepar',

            // Cam sau mặc định (trên mobile)
            additionalOptions: {
              cameraConfig: {
                facingMode: 'environment',
              },
            },
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(
                'DeepAR khởi động quá lâu (timeout 12s). Thường do license key sai/không khớp domain. ' +
                'Hãy thử chế độ "Thử AR (PNG)".'
              )),
              12000
            )
          ),
        ])

        if (cancelled) {
          deepAR.shutdown()
          return
        }
        deepARRef.current = deepAR
        console.info('[DeepAR] init OK — camera live, loading effect…')

        // Camera is already live → drop the full-screen spinner immediately so
        // it can never look "treo đang khởi động mãi". The wrist effect now
        // loads in the background with its own indicator + timeout.
        setStatus({ loading: false, step: '', error: null, effectMissing: false, effectLoading: true })

        const hasEffect = await effectFileExists(activeEffect)
        if (cancelled) return

        if (!hasEffect) {
          console.warn('[DeepAR] Effect file missing or not a valid .deepar:', activeEffect)
          setStatus((s) => ({ ...s, effectLoading: false, effectMissing: true }))
          return
        }

        try {
          console.info('[DeepAR] effect file OK — switchEffect…', activeEffect)
          await withTimeout(
            deepAR.switchEffect(activeEffect, {
              onProgress: (p) => console.info('[DeepAR] effect download', Math.round((p?.loaded ?? 0) / (p?.total ?? 1) * 100) + '%'),
            }),
            45000,
            'Tải hiệu ứng đồng hồ'
          )
          if (cancelled) return
          console.info('[DeepAR] effect loaded ✓')
          setStatus((s) => ({ ...s, effectLoading: false, effectMissing: false }))
        } catch (effErr) {
          if (cancelled) return
          console.error('[DeepAR] switchEffect failed:', effErr)
          setStatus((s) => ({ ...s, effectLoading: false, effectMissing: true }))
        }
      } catch (err) {
        console.error('[DeepAR]', err)
        if (!cancelled) {
          setStatus({ loading: false, step: '', error: err.message, effectMissing: false, effectLoading: false })
        }
      }
    }

    init()

    return () => {
      cancelled = true
      deepARRef.current?.shutdown()
      deepARRef.current = null
    }
    // Re-init only when the license/preview element lifecycle changes.
    // Effect swaps are handled by the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Đổi effect khi prop thay đổi ─────────────────────────
  // The INITIAL effect is loaded by the init effect above. Skip the first run
  // here so we don't fire switchEffect twice (which races + reloads 14.5MB).
  const firstEffectRun = useRef(true)
  useEffect(() => {
    if (!deepARRef.current || status.loading) return
    if (firstEffectRun.current) {
      firstEffectRun.current = false
      return
    }
    let cancelled = false
    ;(async () => {
      setStatus((s) => ({ ...s, effectLoading: true }))
      const ok = await effectFileExists(activeEffect)
      if (cancelled || !deepARRef.current) return
      if (!ok) {
        setStatus((s) => ({ ...s, effectLoading: false, effectMissing: true }))
        return
      }
      try {
        await withTimeout(deepARRef.current.switchEffect(activeEffect), 30000, 'Tải hiệu ứng đồng hồ')
        if (cancelled) return
        setStatus((s) => ({ ...s, effectLoading: false, effectMissing: false }))
      } catch (e) {
        if (cancelled) return
        console.error('[DeepAR] switchEffect failed:', e)
        setStatus((s) => ({ ...s, effectLoading: false, effectMissing: true }))
      }
    })()
    return () => { cancelled = true }
  }, [activeEffect, status.loading])

  // ── Chụp ảnh ─────────────────────────────────────────────
  const handleCapture = async () => {
    if (!deepARRef.current) return
    try {
      const imageUrl = await deepARRef.current.takeScreenshot()
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `dong-ho-ar-${Date.now()}.png`
      link.click()
      onScreenshot?.(imageUrl)
    } catch (err) {
      console.error('Screenshot error:', err)
    }
  }

  // ── Đổi cam ──────────────────────────────────────────────
  // DeepAR has no switchCamera(); restart the camera with the other facingMode.
  const handleSwitchCamera = async () => {
    const dr = deepARRef.current
    if (!dr) return
    const next = facingRef.current === 'environment' ? 'user' : 'environment'
    facingRef.current = next
    try {
      await dr.startCamera({
        mirror: next === 'user',
        mediaStreamConstraints: {
          video: { facingMode: { ideal: next } },
          audio: false,
        },
      })
    } catch (e) {
      console.error('[DeepAR] switch camera failed:', e)
    }
  }

  // ── Quay video ───────────────────────────────────────────
  const handleRecord = async () => {
    const dr = deepARRef.current
    if (!dr) return
    try {
      await dr.startVideoRecording()
      setTimeout(async () => {
        const video = await dr.finishVideoRecording()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(video)
        link.download = `dong-ho-ar-${Date.now()}.mp4`
        link.click()
      }, 5000) // quay 5 giây
    } catch (err) {
      console.error('Record error:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* DeepAR render container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-10 p-4
                   bg-gradient-to-b from-black/70 to-transparent
                   flex items-start justify-between"
      >
        <div>
          <p className="text-white/50 text-xs tracking-wide">AR Try-On · DeepAR</p>
          <h2 className="text-white font-bold text-lg mt-0.5">{watchName}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 text-white
                     flex items-center justify-center hover:bg-white/30"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Loading */}
      {status.loading && (
        <div
          className="absolute inset-0 z-20 bg-black/85
                     flex flex-col items-center justify-center gap-4"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/25" />
            <div
              className="absolute inset-0 rounded-full
                         border-4 border-yellow-400 border-t-transparent animate-spin"
            />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              ⌚
            </span>
          </div>
          <p className="text-white text-sm">{status.step}</p>
        </div>
      )}

      {/* Đang tải hiệu ứng — camera đã hiện, đồng hồ đang được nạp ở nền */}
      {!status.loading && !status.error && status.effectLoading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 text-white/90 px-4 py-2 rounded-full text-xs backdrop-blur">
            <span className="w-3 h-3 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
            Đang tải hiệu ứng đồng hồ…
          </div>
        </div>
      )}

      {/* Error */}
      {status.error && (
        <div className="absolute inset-0 z-20 bg-black/85 flex items-center justify-center p-6">
          <div className="bg-red-950/90 rounded-2xl p-6 text-center max-w-xs">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-2">Lỗi khởi động AR</p>
            <p className="text-red-300 text-sm mb-5">{status.error}</p>
            <button
              onClick={onClose}
              className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Hướng dẫn */}
      {!status.loading && !status.error && !status.effectMissing && !status.effectLoading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/50 text-white/80 px-4 py-2 rounded-full text-xs backdrop-blur">
            ✋ Đưa cổ tay vào khung hình
          </div>
        </div>
      )}

      {/* Effect chưa được tạo — camera vẫn chạy, chỉ là chưa có đồng hồ để render */}
      {!status.loading && !status.error && status.effectMissing && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 px-4 w-full max-w-sm">
          <div className="bg-amber-500/90 text-black px-4 py-3 rounded-2xl text-xs text-center backdrop-blur">
            <p className="font-semibold mb-1">⚠️ Chưa có hiệu ứng DeepAR</p>
            <p className="leading-relaxed">
              Camera đã chạy nhưng chưa có file{' '}
              <code className="bg-black/15 px-1 rounded">chronograph-white.deepar</code>.
              Tạo file trong DeepAR Studio (PHẦN 1) rồi đặt vào{' '}
              <code className="bg-black/15 px-1 rounded">public/effects/</code>.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!status.loading && !status.error && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-8
                     bg-gradient-to-t from-black/70 to-transparent"
        >
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSwitchCamera}
              className="flex items-center gap-1.5 bg-white/20 text-white
                         text-sm px-4 py-2.5 rounded-full backdrop-blur
                         hover:bg-white/30 active:scale-95 transition"
            >
              🔄 Đổi cam
            </button>

            <button
              onClick={handleCapture}
              className="flex items-center gap-1.5 bg-yellow-400 text-black
                         text-sm px-7 py-3 rounded-full font-semibold
                         hover:bg-yellow-300 active:scale-95 transition shadow-lg"
            >
              📸 Chụp
            </button>

            <button
              onClick={handleRecord}
              className="flex items-center gap-1.5 bg-white/20 text-white
                         text-sm px-4 py-2.5 rounded-full backdrop-blur
                         hover:bg-white/30 active:scale-95 transition"
            >
              🎥 Quay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
