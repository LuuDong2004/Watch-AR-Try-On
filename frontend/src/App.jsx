import { Component, lazy, Suspense, useEffect, useState } from 'react'
import Watch3DViewer from './components/watch/Watch3DViewer.jsx'
import QRTryOnModal from './components/ar/QRTryOnModal.jsx'
import { detectMobile } from './utils/device.js'

const ARTryOn    = lazy(() => import('./components/ar/ARTryOn.jsx'))
const ARTryOnPNG = lazy(() => import('./components/ar/ARTryOnPNG.jsx'))

const SAMPLE_WATCHES = [
  {
    id: 'chronograph-mudmaster',
    name: 'Chronograph Surgical White 42mm',
    brand: 'Aventus',
    price: 48_900_000,
    originalPrice: 56_000_000,
    description:
      'Phiên bản giới hạn Surgical White — vỏ và dây ceramic trắng tinh khôi, mặt số ba kim đếm giờ phụ, sapphire phủ AR coating. Máy chronograph Thụy Sĩ Sellita SW500, hoàn thiện tay thủ công đẳng cấp haute horlogerie.',
    specs: {
      'Đường kính mặt': '42 mm',
      'Độ dày vỏ': '13.2 mm',
      'Chất liệu vỏ': 'Ceramic trắng',
      'Chất liệu dây': 'Ceramic + thép 316L',
      'Chất liệu kính': 'Sapphire phủ AR',
      'Bộ máy': 'Sellita SW500 Automatic',
      'Chống nước': '200 m',
      'Bảo hành': '5 năm chính hãng'
    },
    modelUrl: '/models/watch.glb',
    // DeepAR wrist effect (Thử AR 3D / mode 'ar')
    effectUrl: '/effects/chronograph-white.deepar',
    // PNG variant assets — drop transparent PNGs at these paths to enable the PNG try-on.
    // See public/images/test/README.md for guidance.
    faceImageUrl:  '/images/test/watch-face.png',
    strapImageUrl: '/images/test/watch-strap.png',
    variant: 'Surgical White',
    arConfig: {
      arScale: 1.5,
      arPositionX: 0,
      arPositionY: 0,
      // No pre-rotation — wrist-frame quaternion handles orientation entirely.
      arRotationX: 0,
      arRotationY: 0,
      arRotationOffset: 0,
      variant: 'Surgical White'
    }
  }
]

function formatVND(n) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(n)
}

export default function App() {
  const watch = SAMPLE_WATCHES[0]
  const [modelOk, setModelOk] = useState(true)
  const [mode, setMode] = useState('none') // 'none' | 'qr' | 'ar' | 'ar-png'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ar = params.get('ar')
    if (ar === '1')   setMode('ar')
    if (ar === 'png') setMode('ar-png')
    if (ar) {
      const url = new URL(window.location.href)
      url.searchParams.delete('ar')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleTryOn = () => {
    setMode(detectMobile() ? 'ar' : 'qr')
  }

  const handleTryOnPNG = () => {
    setMode('ar-png')
  }

  const tryOnUrl = (() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    url.searchParams.set('ar', '1')
    return url.toString()
  })()

  return (
    <div className="min-h-full bg-[#FAFAFA] text-[#0D0D0D]">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕐</span>
            <span className="font-display text-xl font-semibold">Watch AR Studio</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a className="hover:text-black">Sản phẩm</a>
            <a className="hover:text-black">Thương hiệu</a>
            <a className="hover:text-black">AR Try-On</a>
            <a className="hover:text-black">Liên hệ</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            {modelOk ? (
              <Suspense
                fallback={
                  <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
                }
              >
                <ErrorBoundary onError={() => setModelOk(false)}>
                  <Watch3DViewer
                    modelUrl={watch.modelUrl}
                    variant={watch.variant}
                    height={380}
                  />
                </ErrorBoundary>
              </Suspense>
            ) : (
              <ModelMissingHint />
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              {watch.brand}
            </p>
            <h1 className="font-display text-3xl font-semibold mb-3">
              {watch.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-bold">{formatVND(watch.price)}</span>
              {watch.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatVND(watch.originalPrice)}
                </span>
              )}
              <span className="ml-1 bg-[#C9A84C]/15 text-[#8a7124] text-xs px-2 py-0.5 rounded-full font-medium">
                AR Try-On
              </span>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {watch.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleTryOn}
                className="flex-1 bg-[#1A1A2E] text-white px-6 py-3.5 rounded-full font-semibold hover:bg-black transition flex items-center justify-center gap-2 shadow-sm"
              >
                ✨ Thử AR (3D)
              </button>
              {watch.faceImageUrl && watch.strapImageUrl && (
                <button
                  onClick={handleTryOnPNG}
                  className="flex-1 bg-[#C9A84C] text-black px-6 py-3.5 rounded-full font-semibold hover:bg-[#b69636] transition flex items-center justify-center gap-2 shadow-sm"
                >
                  🖼️ Thử AR (PNG)
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 Bản 3D dùng GLB + variant. Bản PNG dùng 2 ảnh trong suốt + occluder cổ tay — chủ shop chỉ cần upload ảnh.
            </p>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-semibold mb-3 text-sm">Thông số kỹ thuật</h3>
              <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {Object.entries(watch.specs).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="text-gray-900 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold mb-2">
            Hướng dẫn dùng AR Try-On
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Cho phép trình duyệt truy cập camera, đưa cổ tay vào khung hình. Hệ thống sẽ
            tự động đeo đồng hồ 3D lên cổ tay bạn theo thời gian thực.
          </p>
          <ol className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              ['1', 'Cấp quyền camera', 'Trình duyệt sẽ hỏi quyền — chọn "Cho phép".'],
              ['2', 'Đưa cổ tay vào khung', 'Giữ cổ tay cách camera ~30–50 cm.'],
              ['3', 'Chụp & chia sẻ', 'Nhấn nút máy ảnh để lưu ảnh thử đồng hồ.']
            ].map(([n, t, d]) => (
              <li
                key={n}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white font-semibold flex items-center justify-center mb-2">
                  {n}
                </div>
                <p className="font-semibold mb-1">{t}</p>
                <p className="text-gray-500">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-xs text-gray-400">
        © 2026 Watch AR Studio · Demo MVP
      </footer>

      {mode === 'qr' && (
        <QRTryOnModal
          tryOnUrl={tryOnUrl}
          watchName={watch.name}
          onClose={() => setMode('none')}
          onTryHere={() => setMode('ar')}
        />
      )}

      {mode === 'ar' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/90 z-50" />}>
          <ARTryOn
            watchName={watch.name}
            effectUrl={watch.effectUrl}
            onClose={() => setMode('none')}
          />
        </Suspense>
      )}

      {mode === 'ar-png' && watch.faceImageUrl && watch.strapImageUrl && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/90 z-50" />}>
          <ARTryOnPNG
            faceImageUrl={watch.faceImageUrl}
            strapImageUrl={watch.strapImageUrl}
            watchName={watch.name}
            onClose={() => setMode('none')}
          />
        </Suspense>
      )}
    </div>
  )
}

function ModelMissingHint() {
  return (
    <div className="h-80 rounded-2xl border border-dashed border-gray-300 bg-white p-6 flex flex-col items-center justify-center text-center">
      <p className="text-4xl mb-2">📦</p>
      <p className="font-semibold mb-1">Chưa có model 3D đồng hồ</p>
      <p className="text-sm text-gray-500 max-w-xs">
        Đặt file <code className="bg-gray-100 px-1.5 py-0.5 rounded">watch.glb</code>{' '}
        vào thư mục <code className="bg-gray-100 px-1.5 py-0.5 rounded">frontend/public/models/</code> rồi tải lại trang.
      </p>
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err) {
    console.warn('3D viewer error:', err)
    this.props.onError?.(err)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
