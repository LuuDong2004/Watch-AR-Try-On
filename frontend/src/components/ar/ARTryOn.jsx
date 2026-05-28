import { useEffect, useRef, useState } from 'react'
import * as deepar from 'deepar'

const LICENSE_KEY = import.meta.env.VITE_DEEPAR_LICENSE_KEY
const DEFAULT_EFFECT_URL =
  import.meta.env.VITE_DEEPAR_EFFECT_URL || '/effects/chronograph-white.deepar'

export default function ARTryOn({
  effectUrl = DEFAULT_EFFECT_URL,
  watchName = 'Đồng hồ',
  onClose,
  onScreenshot
}) {
  const containerRef = useRef(null)
  const deepARRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('Khởi động DeepAR...')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        if (!LICENSE_KEY) {
          throw new Error(
            'Thiếu VITE_DEEPAR_LICENSE_KEY trong env. Xem SETUP_DEEPAR.md.'
          )
        }

        setStep('Đang khởi động camera + AR engine...')
        const deepAR = await deepar.initialize({
          licenseKey: LICENSE_KEY,
          previewElement: containerRef.current,
          additionalOptions: {
            cameraConfig: { facingMode: 'environment' }
          }
        })

        if (cancelled) {
          deepAR.shutdown()
          return
        }
        deepARRef.current = deepAR

        setStep('Đang tải effect đồng hồ...')
        // switchEffect throws if the file is missing or invalid
        await deepAR.switchEffect(effectUrl)

        if (!cancelled) {
          setLoading(false)
          setStep('')
        }
      } catch (err) {
        console.error('[DeepAR] init failed:', err)
        if (!cancelled) {
          setErrorMsg(formatError(err, effectUrl))
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      try {
        deepARRef.current?.shutdown?.()
      } catch {}
      deepARRef.current = null
    }
  }, [effectUrl])

  const handleScreenshot = async () => {
    if (!deepARRef.current) return
    try {
      const imageUrl = await deepARRef.current.takeScreenshot()
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `thu-dong-ho-ar-${Date.now()}.png`
      link.click()
      onScreenshot?.(imageUrl)
    } catch (err) {
      console.error('[DeepAR] screenshot failed:', err)
    }
  }

  const handleSwitchCamera = async () => {
    if (!deepARRef.current) return
    try {
      await deepARRef.current.switchCamera()
    } catch (err) {
      console.error('[DeepAR] switch camera failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-start justify-between">
        <div className="min-w-0 pr-3">
          <p className="text-white/60 text-xs tracking-wide">AR Try-On · DeepAR</p>
          <h2 className="text-white font-display font-semibold text-base sm:text-lg leading-tight truncate">
            {watchName}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng AR"
          className="w-10 h-10 flex-shrink-0 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/25" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">⌚</span>
          </div>
          <p className="text-white text-sm text-center px-6">{step}</p>
          <p className="text-white/40 text-xs">Lần đầu tải có thể mất 5–10 giây</p>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="absolute inset-0 z-20 bg-black/85 flex items-center justify-center p-6">
          <div className="bg-red-950/90 rounded-2xl p-6 max-w-sm text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-2">Không khởi động được AR</p>
            <p className="text-red-300 text-sm mb-5 whitespace-pre-line">{errorMsg}</p>
            <button
              onClick={onClose}
              className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-4">
            <div className="bg-black/55 text-white/85 px-4 py-2 rounded-full text-xs backdrop-blur whitespace-nowrap">
              ✋ Đưa cổ tay vào khung hình
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-t from-black/70 to-transparent">
            <button
              onClick={handleSwitchCamera}
              className="bg-white/15 text-white text-xs sm:text-sm px-3 sm:px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/25"
            >
              🔄 Đổi cam
            </button>
            <button
              onClick={handleScreenshot}
              className="bg-yellow-400 text-black text-sm px-5 sm:px-7 py-3 rounded-full font-semibold hover:bg-yellow-300 shadow-lg active:scale-95 transition"
            >
              📸 Chụp
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function formatError(err, effectUrl) {
  const raw = err?.message || String(err)
  if (/license/i.test(raw)) {
    return 'License DeepAR không hợp lệ hoặc không khớp domain.\n' + raw
  }
  if (/effect|404|fetch/i.test(raw)) {
    return `Không tải được file effect:\n${effectUrl}\n\nHãy tạo file .deepar theo SETUP_DEEPAR.md rồi đặt vào public/effects/.`
  }
  if (/camera|permission/i.test(raw)) {
    return 'Bạn cần cấp quyền truy cập camera trong cài đặt trình duyệt.'
  }
  return raw
}
