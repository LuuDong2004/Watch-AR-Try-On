import React, { useState, useEffect } from 'react';
import { getDbCloset, removeFromCloset, ClosetItem } from '../../utils/mockData';

interface UserClosetProps {
  onBackToCatalog: () => void;
  onOpenContact: () => void;
}

export default function UserCloset({ onBackToCatalog, onOpenContact }: UserClosetProps) {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);

  useEffect(() => {
    setClosetItems(getDbCloset());
  }, []);

  const formatVND = (n: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(n);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa ảnh đeo thử AR này khỏi tủ đồ ảo của bạn?')) {
      removeFromCloset(id);
      setClosetItems(getDbCloset());
    }
  };

  const handleDownload = (item: ClosetItem) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `${item.watchId}-ar-tryon.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">⌚ Tủ đồ ảo của bạn</h1>
            <p className="text-xs text-gray-500 mt-1">Lưu trữ toàn bộ ảnh đeo thử AR các mẫu đồng hồ cao cấp</p>
          </div>
          <button
            onClick={onBackToCatalog}
            className="text-xs font-semibold uppercase tracking-wider text-[#B8924A] hover:underline"
          >
            ← Tiếp tục xem Catalog
          </button>
        </div>

        {/* Closet Grid */}
        {closetItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {closetItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#e5e0d8] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Photo Viewer */}
                <div className="relative aspect-[4/5] bg-gray-900 border-b border-[#e5e0d8] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.watchName}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  {/* Date overlay */}
                  <span className="absolute top-3 left-3 bg-black/60 text-[#F6F4EF] text-[10px] px-2.5 py-1 rounded-full font-medium shadow-sm">
                    📷 Chụp ngày {item.date}
                  </span>

                  {/* Actions Overlays */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-90 group-hover:opacity-100 transition duration-200">
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(item)}
                      className="h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition active:scale-95 shadow"
                      title="Tải về thiết bị"
                    >
                      💾
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600 transition active:scale-95 shadow"
                      title="Xóa khỏi tủ đồ"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-0.5">
                      {item.watchBrand}
                    </span>
                    <h3 className="font-serif text-[#16162A] font-bold text-base line-clamp-1 mb-1">
                      {item.watchName}
                    </h3>
                    <p className="text-xs font-semibold text-[#B8924A]">Giá mẫu: {formatVND(item.price)}</p>
                  </div>

                  {/* Lead store action */}
                  <button
                    onClick={onOpenContact}
                    className="w-full bg-[#16162A] text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition border border-[#B8924A]/30 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>🏬 Liên Hệ Shop Mua Mẫu Này</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-[#e5e0d8] p-16 text-center shadow-sm max-w-xl mx-auto mt-8">
            <span className="text-6xl mb-4 block animate-bounce">⌚</span>
            <h3 className="font-serif text-xl font-bold mb-2">Tủ đồ ảo hiện tại đang trống</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Bạn chưa có tấm hình đeo thử AR nào. Hãy bấm vào nút "Thử đeo AR" ở bất kỳ sản phẩm nào và nhấn chụp hình để lưu bức ảnh đeo thử đồng hồ của riêng bạn tại đây!
            </p>
            <button
              onClick={onBackToCatalog}
              className="bg-[#B8924A] hover:bg-[#a6803f] text-white px-8 py-3.5 rounded-full font-semibold text-xs transition shadow-md active:scale-95"
            >
              Bắt đầu khám phá & Thử AR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
