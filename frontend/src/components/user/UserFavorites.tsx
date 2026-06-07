import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, ArrowRight, ArrowLeft, Trash2, LogIn } from 'lucide-react';
import { favoriteApi, shopApi, watchApi, ApiError } from '../../api';
import type { Watch } from '../../api';
import { useSession } from '../../auth/session';
import { useLoginPrompt } from '../../auth/loginPrompt';
import { publicWatches } from '../../utils/publicListings';

interface UserFavoritesProps {
  onSelectWatch: (id: string) => void;
  onOpenAR: (watchId: string) => void;
  onBackToCatalog: () => void;
  onChanged?: () => void; // notify parent so the header badge refreshes
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function UserFavorites({ onSelectWatch, onOpenAR, onBackToCatalog, onChanged }: UserFavoritesProps) {
  const user = useSession((s) => s.user);
  const showLogin = useLoginPrompt((s) => s.show);

  const [items, setItems] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [favIds, watches, shops] = await Promise.all([favoriteApi.list(), watchApi.list(), shopApi.list()]);
      setItems(publicWatches(watches, shops).filter((w) => favIds.includes(w.id)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) showLogin('login');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (id: string) => {
    try {
      await favoriteApi.toggle(id); // currently favorited -> removes it
      await load();
      onChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) showLogin('login');
    }
  };

  // Anonymous visitors must sign in to use favourites.
  if (!user) {
    return (
      <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#B8924A] transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Tiếp tục khám phá
          </button>
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#B8924A]/10 flex items-center justify-center text-[#B8924A] mb-4">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="font-display font-bold text-base mb-1">Đăng nhập để dùng tính năng này</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
              Đăng nhập để lưu lại và xem những mẫu đồng hồ bạn yêu thích trên mọi thiết bị.
            </p>
            <button
              onClick={() => showLogin('login')}
              className="bg-[#17140F] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition inline-flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" /> Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#B8924A] transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Tiếp tục khám phá
        </button>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#B8924A] font-bold mb-2">
            <Heart className="h-4 w-4 fill-current" /> Danh sách yêu thích
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">Đồng hồ bạn đã lưu</h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            {items.length > 0
              ? `Bạn đang lưu ${items.length} mẫu đồng hồ. Thử AR hoặc xem chi tiết để liên hệ shop sở hữu.`
              : 'Lưu lại những mẫu đồng hồ ưng ý để xem và so sánh dễ dàng hơn.'}
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 text-center shadow-sm max-w-lg mx-auto text-sm text-[#8A8170]">
            Đang tải…
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((w) => (
              <div
                key={w.id}
                className="group bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col"
              >
                <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => onSelectWatch(w.id)}>
                  <img src={w.image} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  {w.hasAR && (
                    <span className="absolute top-2 left-2 bg-[#B8924A] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AR
                    </span>
                  )}
                  {/* Remove from favorites */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(w.id); }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#B8924A] hover:bg-white hover:text-red-500 transition shadow"
                    title="Bỏ yêu thích"
                    aria-label="Bỏ yêu thích"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{w.brand}</p>
                  <h3
                    onClick={() => onSelectWatch(w.id)}
                    className="text-sm font-bold mt-0.5 mb-1 line-clamp-1 cursor-pointer group-hover:text-[#B8924A] transition"
                  >
                    {w.name}
                  </h3>
                  <span className="text-sm font-bold mb-3">{formatVND(w.price)}</span>
                  <div className="mt-auto space-y-2">
                    {w.hasAR ? (
                      <button onClick={() => onOpenAR(w.id)} className="w-full bg-[#17140F] text-white text-xs font-semibold py-2 rounded-full hover:bg-black transition border border-[#B8924A]/30 inline-flex items-center justify-center gap-1.5"><Sparkles className="h-4 w-4" /> Thử Đeo AR</button>
                    ) : (
                      <button onClick={() => onSelectWatch(w.id)} className="w-full bg-white text-[#17140F] text-xs font-semibold py-2 rounded-full hover:bg-[#F6F4EF] transition border border-[#17140F]/20 inline-flex items-center justify-center gap-1.5">Xem chi tiết <ArrowRight className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => handleRemove(w.id)} className="w-full border border-[#e5e0d8] text-gray-500 text-xs font-semibold py-2 rounded-full hover:border-red-200 hover:text-red-500 transition inline-flex items-center justify-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Bỏ lưu</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#B8924A]/10 flex items-center justify-center text-[#B8924A] mb-4">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="font-display font-bold text-base mb-1">Chưa có sản phẩm yêu thích</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
              Nhấn vào biểu tượng trái tim trên mỗi sản phẩm để lưu lại những mẫu đồng hồ bạn quan tâm.
            </p>
            <button
              onClick={onBackToCatalog}
              className="bg-[#17140F] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition inline-flex items-center gap-2"
            >
              Khám phá bộ sưu tập <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
