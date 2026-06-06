import React, { useState, useEffect } from 'react';
import { LogOut, Store, Calendar, Heart, Camera, LogIn } from 'lucide-react';
import { leadApi, favoriteApi, watchApi, closetApi, ApiError } from '../../api';
import type { Lead, Watch, ClosetItem } from '../../api';
import { useSession } from '../../auth/session';
import { useLoginPrompt } from '../../auth/loginPrompt';

interface UserAccountProps {
  onSelectWatch: (id: string) => void;
  onBackToCatalog: () => void;
}

export default function UserAccount({ onSelectWatch, onBackToCatalog }: UserAccountProps) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const showLogin = useLoginPrompt((s) => s.show);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [favorites, setFavorites] = useState<Watch[]>([]);
  const [captures, setCaptures] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'favs' | 'captures'>('leads');

  useEffect(() => {
    if (!user) { setLeads([]); setFavorites([]); setCaptures([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([leadApi.mine(), favoriteApi.list(), watchApi.list(), closetApi.list()])
      .then(([myLeads, favIds, watches, closet]) => {
        if (cancelled) return;
        setLeads(myLeads);
        setFavorites(watches.filter((w) => favIds.includes(w.id)));
        setCaptures(closet);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) showLogin('login');
        setLeads([]); setFavorites([]); setCaptures([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(n);
  };

  // Status mapping
  const getStatusBadge = (status: Lead['status']) => {
    const map = {
      new: { text: 'Đã gửi yêu cầu', bg: 'bg-blue-50 text-blue-600 border-blue-200' },
      responded: { text: 'Shop đã phản hồi', bg: 'bg-[#B8924A]/10 text-[#B8924A] border-[#B8924A]/20' },
      booked: { text: 'Đã xếp lịch hẹn', bg: 'bg-green-50 text-green-600 border-green-200' },
      closed: { text: 'Lịch sử hoàn tất', bg: 'bg-gray-100 text-gray-500 border-gray-200' }
    };
    const info = map[status] || { text: 'Chờ duyệt', bg: 'bg-gray-50 text-gray-400' };

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bg}`}>
        {info.text}
      </span>
    );
  };

  // Anonymous visitors must sign in to see their account.
  if (!user) {
    return (
      <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#e5e0d8] w-full max-w-md p-8 shadow-xl text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-[#B8924A]/10 flex items-center justify-center text-[#B8924A] mb-4">
            <LogIn className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold text-base mb-1">Đăng nhập để dùng tính năng này</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            Đăng nhập để xem lịch sử liên hệ, ảnh thử AR và những mẫu đồng hồ bạn đã yêu thích.
          </p>
          <button
            onClick={() => showLogin('login')}
            className="bg-[#17140F] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition inline-flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" /> Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const initials = (user.name || user.email || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#17140F] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* User Account Info Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Profile summary card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
            <div className="flex flex-col items-center text-center border-b border-[#e5e0d8] pb-6 mb-6">
              <div className="h-20 w-20 rounded-full bg-[#17140F] text-[#F6F4EF] text-3xl font-bold flex items-center justify-center border-2 border-[#B8924A] mb-4">
                {initials}
              </div>
              <h2 className="font-serif text-lg font-bold">{user.name}</h2>
              <p className="text-xs text-[#B8924A] font-medium mb-1">Thành viên TrueWrist</p>
              <p className="text-[11px] text-gray-400">{user.email}</p>
            </div>

            <div className="space-y-3.5 text-xs text-[#17140F]/90">
              <div className="flex justify-between items-center bg-[#F6F4EF] p-2.5 rounded-xl border border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Lịch sử liên hệ</span>
                <span className="font-bold text-[#B8924A]">{leads.length} yêu cầu</span>
              </div>
              <div className="flex justify-between items-center bg-[#F6F4EF] p-2.5 rounded-xl border border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Ảnh thử AR</span>
                <span className="font-bold text-[#B8924A]">{captures.length} ảnh</span>
              </div>
              <div className="flex justify-between items-center bg-[#F6F4EF] p-2.5 rounded-xl border border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Đồng hồ yêu thích</span>
                <span className="font-bold text-[#B8924A]">{favorites.length} sản phẩm</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="w-full mt-6 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> <span>Đăng xuất</span>
            </button>
          </div>

          {/* Right Panel: Content tabs (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-[#e5e0d8] shadow-sm">
            {/* Nav tabs */}
            <div className="flex border-b border-[#e5e0d8] mb-6 text-sm">
              <button
                onClick={() => setActiveSubTab('leads')}
                className={`py-3 px-6 font-semibold transition border-b-2 -mb-[2px] ${
                  activeSubTab === 'leads' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                Lịch sử liên hệ ({leads.length})
              </button>
              <button
                onClick={() => setActiveSubTab('captures')}
                className={`py-3 px-6 font-semibold transition border-b-2 -mb-[2px] ${
                  activeSubTab === 'captures' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                Ảnh thử AR ({captures.length})
              </button>
              <button
                onClick={() => setActiveSubTab('favs')}
                className={`py-3 px-6 font-semibold transition border-b-2 -mb-[2px] ${
                  activeSubTab === 'favs' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                Mẫu đã yêu thích ({favorites.length})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-sm text-[#8A8170]">Đang tải…</div>
            ) : (
            <>
            {/* Tab: Leads History */}
            {activeSubTab === 'leads' && (
              <div className="space-y-4">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-[#F6F4EF] p-4 rounded-2xl border border-[#e5e0d8] text-xs hover:border-[#B8924A] transition"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="bg-[#17140F] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mr-2">
                            {lead.type === 'appointment' ? 'LỊCH HẸN' : 'TƯ VẤN'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {lead.timestamp ? new Date(lead.timestamp).toLocaleString('vi-VN') : ''}
                          </span>
                        </div>
                        {getStatusBadge(lead.status)}
                      </div>

                      <p className="font-bold text-[#17140F] text-sm mb-1">{lead.watchName}</p>
                      <p className="text-[11px] text-gray-500 mb-3 flex items-center gap-1">
                        <span className="inline-flex items-center gap-1"><Store className="h-4 w-4" /> Shop phản hồi:</span>
                        <span className="font-semibold text-gray-700">{lead.shopName}</span>
                      </p>

                      {lead.type === 'appointment' && (
                        <div className="bg-white p-3 rounded-xl border border-gray-100 flex gap-4 mb-3 text-[11px]">
                          <div>
                            <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wide">Ngày hẹn</span>
                            <span className="font-semibold text-gray-700">{lead.date}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wide">Khung giờ</span>
                            <span className="font-semibold text-gray-700">{lead.time}</span>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-xl border border-gray-100 text-[11px]">
                        <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wide mb-0.5">Lời nhắn của bạn</span>
                        <p className="text-gray-600 italic">"{lead.message}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-10 w-10 mx-auto text-gray-400" />
                    <h4 className="font-serif font-bold text-sm mt-3 mb-1">Chưa gửi liên hệ nào</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                      Quý khách chưa thực hiện bất kỳ cuộc gọi, cuộc hẹn hoặc nhắn Zalo/Messenger đăng ký trên hệ thống.
                    </p>
                    <button
                      onClick={onBackToCatalog}
                      className="bg-[#B8924A] text-white px-5 py-2 rounded-full font-semibold text-xs"
                    >
                      Bắt đầu xem sản phẩm
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: AR captures */}
            {activeSubTab === 'captures' && (
              <div className="space-y-4">
                {captures.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {captures.map((cap) => (
                      <div
                        key={cap.id}
                        onClick={() => onSelectWatch(cap.watchId)}
                        className="bg-[#F6F4EF] rounded-2xl border border-[#e5e0d8] overflow-hidden hover:border-[#B8924A] transition cursor-pointer"
                      >
                        <div className="h-32 overflow-hidden bg-white">
                          <img src={cap.imageUrl} alt={cap.watchName} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 text-xs">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">{cap.watchBrand}</p>
                          <h4 className="font-serif text-[#17140F] font-bold text-sm truncate">{cap.watchName}</h4>
                          <span className="text-[10px] text-gray-400">{cap.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-10 w-10 mx-auto text-gray-400" />
                    <h4 className="font-serif font-bold text-sm mt-3 mb-1">Chưa có ảnh thử AR</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                      Thử đeo AR một mẫu đồng hồ và lưu lại ảnh để xem tại đây bất cứ lúc nào.
                    </p>
                    <button
                      onClick={onBackToCatalog}
                      className="bg-[#B8924A] text-white px-5 py-2 rounded-full font-semibold text-xs"
                    >
                      Thử đeo AR ngay
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Favorites list */}
            {activeSubTab === 'favs' && (
              <div className="space-y-4">
                {favorites.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        onClick={() => onSelectWatch(fav.id)}
                        className="bg-[#F6F4EF] p-4 rounded-2xl border border-[#e5e0d8] flex items-center gap-4 hover:border-[#B8924A] hover:scale-102 transition cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-[#e5e0d8] shadow-sm flex-shrink-0 bg-white">
                          <img src={fav.image} alt={fav.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mb-0.5">
                            {fav.brand}
                          </p>
                          <h4 className="font-serif text-[#17140F] font-bold text-sm truncate mb-0.5">
                            {fav.name}
                          </h4>
                          <span className="text-[#17140F] font-semibold">{formatVND(fav.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-10 w-10 mx-auto fill-current text-gray-400" />
                    <h4 className="font-serif font-bold text-sm mt-3 mb-1">Chưa lưu đồng hồ yêu thích</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                      Nhấp vào biểu tượng trái tim ở bất kỳ trang chi tiết sản phẩm nào để lưu các mẫu ưng ý vào danh mục yêu thích của bạn tại đây.
                    </p>
                    <button
                      onClick={onBackToCatalog}
                      className="bg-[#B8924A] text-white px-5 py-2 rounded-full font-semibold text-xs"
                    >
                      Bắt đầu khám phá
                    </button>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
