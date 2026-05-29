import { useEffect, useRef, useState } from 'react'
import * as deepar from 'deepar'

const LICENSE_KEY = import.meta.env.VITE_DEEPAR_LICENSE_KEY
const DEFAULT_EFFECT =
  import.meta.env.VITE_DEEPAR_EFFECT_URL || '/effects/chronograph-white.deepar'

export default function ARTryOn({
  watchName = 'Đồng hồ',
  effectUrl = DEFAULT_EFFECT,
  onClose,
  onScreenshot,
}) {
  const containerRef = useRef(null)
  const deepARRef = useRef(null)
  const [status, setStatus] = useState({
    loading: true,
    step: 'Đang khởi động DeepAR...',
    error: null,
  })

  // ── Khởi tạo DeepAR ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setStatus({ loading: true, step: 'Đang khởi động...', error: null })

        const deepAR = await deepar.initialize({
          licenseKey: LICENSE_KEY,
          previewElement: containerRef.current,
          effect: effectUrl,

          // Cam sau mặc định (trên mobile)
          additionalOptions: {
            cameraConfig: {
              facingMode: 'environment',
            },
          },
        })

        if (cancelled) {
          deepAR.shutdown()
          return
        }
        deepARRef.current = deepAR
        setStatus({ loading: false, step: '', error: null })
      } catch (err) {
        console.error('[DeepAR]', err)
        if (!cancelled) {
          setStatus({ loading: false, step: '', error: err.message })
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
  useEffect(() => {
    if (!deepARRef.current || status.loading) return
    deepARRef.current.switchEffect(effectUrl).catch(console.error)
  }, [effectUrl, status.loading])

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
  const handleSwitchCamera = async () => {
    await deepARRef.current?.switchCamera().catch(console.error)
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
      {!status.loading && !status.error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/50 text-white/80 px-4 py-2 rounded-full text-xs backdrop-blur">
            ✋ Đưa cổ tay vào khung hình
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
