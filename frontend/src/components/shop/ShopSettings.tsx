import React, { useState, useEffect } from 'react';
import { getMyShops, saveDbShowroom, Showroom } from '../../utils/mockData';

export default function ShopSettings() {
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [editingRoom, setEditingRoom] = useState<Showroom | null>(null);

  useEffect(() => {
    setShowrooms(getMyShops()); // only the owner's own stores
  }, []);

  const handleEditClick = (room: Showroom) => {
    setEditingRoom({ ...room });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    saveDbShowroom(editingRoom);
    setShowrooms(getMyShops());
    setEditingRoom(null);
    alert('Đã cập nhật thông tin cửa hàng thành công!');
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Cài Đặt Cửa Hàng</h1>
        <p className="text-xs text-gray-500 mt-1">Cập nhật thông tin, hotline và link chat cho các cửa hàng bạn quản lý</p>
      </header>

      <section className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: my stores list (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4">
            🏬 Cửa hàng của tôi ({showrooms.length})
          </h3>

          {showrooms.map((room) => (
            <div key={room.id} className="bg-white p-5 rounded-2xl border border-[#e5e0d8] shadow-sm text-xs">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-display text-sm font-bold text-[#16162A]">{room.name}</h4>
                <button
                  onClick={() => handleEditClick(room)}
                  className="bg-[#16162A] text-white py-1 px-3 rounded-lg font-bold"
                >
                  Sửa Thông Tin
                </button>
              </div>
              <p className="text-gray-500 mb-3">{room.address}</p>
              <div className="grid grid-cols-2 gap-4 text-gray-700 bg-[#F6F4EF] p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="font-bold text-gray-400 block text-[8px] uppercase tracking-wide">Điện thoại</span>
                  <span>{room.phone}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block text-[8px] uppercase tracking-wide">Zalo Link</span>
                  <span className="truncate block max-w-[150px]">{room.zalo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Edit Form (5 cols) */}
        {editingRoom && (
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm text-xs">
            <form onSubmit={handleSave}>
              <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4">
                ✏️ Hiệu chỉnh thông tin showroom
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Tên showroom</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">Địa chỉ chi nhánh</label>
                  <textarea
                    required
                    value={editingRoom.address}
                    onChange={(e) => setEditingRoom({ ...editingRoom, address: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">Hotline điện thoại</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.phone}
                    onChange={(e) => setEditingRoom({ ...editingRoom, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">Link Zalo Chat</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.zalo}
                    onChange={(e) => setEditingRoom({ ...editingRoom, zalo: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">Link Messenger Chat</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.messenger}
                    onChange={(e) => setEditingRoom({ ...editingRoom, messenger: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.hours}
                    onChange={(e) => setEditingRoom({ ...editingRoom, hours: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2 font-bold">
                <button
                  type="submit"
                  className="flex-1 bg-[#16162A] text-white py-2.5 rounded-lg hover:bg-black transition text-center"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 border border-[#e5e0d8] text-gray-500 py-2.5 rounded-lg hover:bg-gray-50 transition text-center font-semibold"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
