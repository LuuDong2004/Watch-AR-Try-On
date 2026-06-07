import { AlertTriangle, Home, RefreshCw, SearchX, ServerCrash } from 'lucide-react';

const ERROR_COPY = {
  404: {
    eyebrow: '404',
    title: 'Không tìm thấy trang',
    message: 'Đường dẫn này không tồn tại hoặc đã được di chuyển.',
    icon: SearchX,
  },
  500: {
    eyebrow: '500',
    title: 'Có lỗi hệ thống',
    message: 'Máy chủ gặp lỗi khi xử lý yêu cầu. Bạn có thể thử lại sau ít phút.',
    icon: ServerCrash,
  },
  503: {
    eyebrow: '503',
    title: 'Dịch vụ tạm thời gián đoạn',
    message: 'Hệ thống đang bảo trì hoặc quá tải. Vui lòng thử lại sau.',
    icon: AlertTriangle,
  },
};

export default function AppErrorPage({ statusCode = 404, onGoHome, onRetry }) {
  const data = ERROR_COPY[statusCode] || ERROR_COPY[404];
  const Icon = data.icon;

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-6 py-10 text-[#17140F]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <div className="border-y border-[#e5e0d8] py-10 md:py-14">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17140F] text-[#B8924A] shadow-sm">
            <Icon className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#B8924A]">{data.eyebrow}</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold tracking-normal md:text-6xl">
            {data.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#6f6759] md:text-base">
            {data.message}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-2 rounded-full bg-[#17140F] px-5 py-3 text-xs font-bold text-white transition hover:bg-black active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Về trang chủ
            </button>
            {statusCode !== 404 && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8d1c5] bg-white px-5 py-3 text-xs font-bold text-[#17140F] transition hover:border-[#B8924A] active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" /> Thử lại
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
