import { useEffect, useState } from 'react'

export default function QRTryOnModal({ tryOnUrl, watchName, onClose, onTryHere }) {
  const [copied, setCopied] = useState(false)

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
    tryOnUrl
  )}`

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tryOnUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">AR Try-On</p>
            <h3 className="font-display text-xl font-semibold leading-tight">
              Thử trên điện thoại
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          AR Try-On chạy mượt nhất trên cam sau điện thoại. Mở camera hoặc app quét QR
          và hướng vào mã bên dưới.
        </p>

        <div className="flex justify-center mb-5">
          <div className="p-3 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
            <img
              src={qrSrc}
              alt="QR code để mở AR Try-On trên điện thoại"
              width={240}
              height={240}
              className="block"
            />
          </div>
        </div>

        {watchName && (
          <p className="text-center text-sm text-gray-500 mb-4">
            Sẽ mở: <span className="font-medium text-gray-700">{watchName}</span>
          </p>
        )}

        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 mb-5 border border-gray-100">
          <span className="text-xs text-gray-500 truncate flex-1">{tryOnUrl}</span>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 font-medium whitespace-nowrap"
          >
            {copied ? '✓ Đã chép' : '📋 Chép link'}
          </button>
        </div>

        <button
          onClick={onTryHere}
          className="w-full py-3 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-medium"
        >
          Hoặc thử trên trình duyệt này (webcam)
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
          Điện thoại và máy tính cần cùng truy cập Internet. Trình duyệt sẽ hỏi quyền camera.
        </p>
      </div>
    </div>
  )
}
