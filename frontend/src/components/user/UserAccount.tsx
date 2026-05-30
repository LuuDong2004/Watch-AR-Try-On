import React, { useState, useEffect } from 'react';
import { Globe, LogOut, Store, Calendar, Heart } from 'lucide-react';
import { getDbLeads, getDbFavorites, getDbWatches, Lead } from '../../utils/mockData';

interface UserAccountProps {
  onSelectWatch: (id: string) => void;
  onBackToCatalog: () => void;
}

export default function UserAccount({ onSelectWatch, onBackToCatalog }: UserAccountProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default logged in for ease of MVP demonstration
  const [leads, setLeads] = useState<Lead[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'favs'>('leads');
  
  // Auth Form Mock
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Load customer leads
    const allLeads = getDbLeads();
    // Filter leads corresponding to this customer (Nguyễn Minh Anh - our mock logged-in user)
    // In our seed, Nguyễn Minh Anh has phone 0912 345 678.
    const myLeads = allLeads.filter((l) => l.phone === '0912 345 678' || l.name === 'Nguyễn Minh Anh');
    setLeads(myLeads);

    // Load favorites
    const favIds = getDbFavorites();
    const watches = getDbWatches();
    const myFavs = watches.filter((w) => favIds.includes(w.id));
    setFavorites(myFavs);
  }, [isLoggedIn]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

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

  if (!isLoggedIn) {
    return (
      <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#e5e0d8] w-full max-w-md p-6 md:p-8 shadow-xl text-xs text-left">
          <div className="flex border-b border-[#e5e0d8] mb-6 text-sm">
            <button
              onClick={() => setAuthTab('login')}
              className={`flex-1 py-3 font-semibold transition border-b-2 -mb-[2px] ${
                authTab === 'login' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setAuthTab('signup')}
              className={`flex-1 py-3 font-semibold transition border-b-2 -mb-[2px] ${
                authTab === 'signup' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-500 font-bold mb-1">Địa chỉ Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>

            {authTab === 'signup' && (
              <div>
                <label className="block text-gray-500 font-bold mb-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#16162A] text-white py-3 rounded-xl font-bold hover:bg-black transition shadow border border-[#B8924A]/30 flex items-center justify-center text-xs"
            >
              {authTab === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản Mới'}
            </button>

            {/* Google Mock */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400">hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoggedIn(true)}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs text-gray-700 shadow-sm"
            >
              <Globe className="h-4 w-4" /> Tiếp tục với tài khoản Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* User Account Info Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Profile summary card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm">
            <div className="flex flex-col items-center text-center border-b border-[#e5e0d8] pb-6 mb-6">
              <div className="h-20 w-20 rounded-full bg-[#16162A] text-[#F6F4EF] text-3xl font-bold flex items-center justify-center border-2 border-[#B8924A] mb-4">
                MA
              </div>
              <h2 className="font-serif text-lg font-bold">Nguyễn Minh Anh</h2>
              <p className="text-xs text-[#B8924A] font-medium mb-1">Thành viên cao cấp (VIP)</p>
              <p className="text-[11px] text-gray-400">minhanh.nguyen@gmail.com · 0912 345 678</p>
            </div>

            <div className="space-y-3.5 text-xs text-[#16162A]/90">
              <div className="flex justify-between items-center bg-[#F6F4EF] p-2.5 rounded-xl border border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Lịch sử đặt hẹn</span>
                <span className="font-bold text-[#B8924A]">{leads.length} lịch hẹn</span>
              </div>
              <div className="flex justify-between items-center bg-[#F6F4EF] p-2.5 rounded-xl border border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Đồng hồ yêu thích</span>
                <span className="font-bold text-[#B8924A]">{favorites.length} sản phẩm</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => setIsLoggedIn(false)}
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
                onClick={() => setActiveSubTab('favs')}
                className={`py-3 px-6 font-semibold transition border-b-2 -mb-[2px] ${
                  activeSubTab === 'favs' ? 'border-[#B8924A] text-[#B8924A]' : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                Mẫu đã yêu thích ({favorites.length})
              </button>
            </div>

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
                          <span className="bg-[#16162A] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mr-2">
                            {lead.type === 'appointment' ? 'LỊCH HẸN' : 'TƯ VẤN'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(lead.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {getStatusBadge(lead.status)}
                      </div>

                      <p className="font-bold text-[#16162A] text-sm mb-1">{lead.watchName}</p>
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
                          <h4 className="font-serif text-[#16162A] font-bold text-sm truncate mb-0.5">
                            {fav.name}
                          </h4>
                          <span className="text-[#16162A] font-semibold">{formatVND(fav.price)}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
