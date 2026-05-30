import React, { useState } from 'react';

export default function AdminSettings() {
  const [platformName, setPlatformName] = useState('Aventus AR Watch Studio');
  const [currency, setCurrency] = useState('VND');
  const [maxUploadSize, setMaxUploadSize] = useState(50); // MB

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đã lưu cấu hình hệ thống thành công!');
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Cấu Hình Hệ Thống</h1>
        <p className="text-xs text-gray-500 mt-1">Quản lý tham số hiển thị, dung lượng file upload và thiết lập chung</p>
      </header>

      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm max-w-xl text-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-gray-500 font-bold mb-1">Tên sàn giao dịch AR</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
            />
          </div>

          <div>
            <label className="block text-gray-500 font-bold mb-1">Đơn vị tiền tệ hiển thị</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-[#e5e0d8] bg-white p-2.5 focus:outline-none"
            >
              <option value="VND">VND (Việt Nam Đồng)</option>
              <option value="USD">USD (Đô la Mỹ)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 font-bold mb-1">Dung lượng model 3D tối đa (MB)</label>
            <input
              type="number"
              value={maxUploadSize}
              onChange={(e) => setMaxUploadSize(Number(e.target.value))}
              className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">Khuyến nghị: Dưới 25MB để khách hàng tải AR trên di động mượt nhất.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#16162A] text-white py-3 rounded-xl font-bold hover:bg-black transition shadow border border-[#B8924A]/30 text-xs"
          >
            Lưu Cấu Hình Hệ Thống
          </button>
        </form>
      </section>
    </div>
  );
}
