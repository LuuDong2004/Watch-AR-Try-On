import React, { useState, useEffect } from 'react';
import { getDbWatches, saveDbWatch, getMyShops, resolveScopeShopIds } from '../../utils/mockData';

interface ShopAddProductProps {
  editWatchId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  shopScope: string;
}

export default function ShopAddProduct({ editWatchId, onSuccess, onCancel, shopScope }: ShopAddProductProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [myShops] = useState(() => getMyShops()); // stores this owner may post to
  const [form, setForm] = useState({
    id: '',
    name: '',
    brand: '',
    shopId: resolveScopeShopIds(shopScope)[0] || '',
    price: 15000000,
    originalPrice: 18000000,
    description: '',
    model: '/models/chronograph_watch.glb',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900',
    gallery: [] as string[],
    hasAR: false,
    metal: '#d2d6db',
    dial: '#15171c',
    accent: '#B8924A',
    specs: {
      'Đường kính mặt': '41 mm',
      'Độ dày vỏ': '12 mm',
      'Chất liệu vỏ': 'Thép không gỉ 316L',
      'Chất liệu dây': 'Dây da cao cấp',
      'Chất liệu kính': 'Sapphire chống xước',
      'Bộ máy': 'Automatic (Thụy Sĩ)',
      'Chống nước': '100 m',
      'Bảo hành': '2 năm chính hãng'
    },
    // AR Calibration values
    arScale: 1.0,
    arPositionY: 0,
    arPositionX: 0,
    arRotationOffset: 0
  });

  useEffect(() => {
    if (editWatchId) {
      setIsEditMode(true);
      const list = getDbWatches();
      const found = list.find((w) => w.id === editWatchId);
      if (found) {
        setForm({
          id: found.id,
          name: found.name,
          brand: found.brand,
          price: found.price || 15000000,
          originalPrice: found.originalPrice || 18000000,
          description: found.description || '',
          shopId: found.shopId || resolveScopeShopIds(shopScope)[0] || '',
          model: found.model || '',
          image: found.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900',
          gallery: found.gallery || [],
          hasAR: found.hasAR ?? !!found.model,
          metal: found.metal || '#cfd3d8',
          dial: found.dial || '#0b2a4a',
          accent: found.accent || '#B8924A',
          specs: {
            'Đường kính mặt': found.specs?.['Đường kính mặt'] || '41 mm',
            'Độ dày vỏ': found.specs?.['Độ dày vỏ'] || '12 mm',
            'Chất liệu vỏ': found.specs?.['Chất liệu vỏ'] || 'Thép không gỉ 316L',
            'Chất liệu dây': found.specs?.['Chất liệu dây'] || 'Dây da cao cấp',
            'Chất liệu kính': found.specs?.['Chất liệu kính'] || 'Sapphire chống xước',
            'Bộ máy': found.specs?.['Bộ máy'] || 'Automatic (Thụy Sĩ)',
            'Chống nước': found.specs?.['Chống nước'] || '100 m',
            'Bảo hành': found.specs?.['Bảo hành'] || '2 năm chính hãng'
          },
          arScale: found.arConfig?.arScale || 1.0,
          arPositionY: found.arConfig?.arPositionY || 0,
          arPositionX: found.arConfig?.arPositionX || 0,
          arRotationOffset: found.arConfig?.arRotationOffset || 0
        });
      }
    } else {
      setIsEditMode(false);
      // Create random ID for new watch
      setForm((prev) => ({
        ...prev,
        id: `watch-${Date.now()}`
      }));
    }
  }, [editWatchId]);

  const handleSpecChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.brand) {
      alert('Vui lòng nhập Tên và Hãng sản xuất');
      return;
    }

    saveDbWatch({
      id: form.id,
      name: form.name,
      brand: form.brand,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      description: form.description,
      shopId: form.shopId,
      model: form.hasAR ? form.model : '',
      image: form.image,
      gallery: form.gallery && form.gallery.length ? form.gallery : [form.image],
      hasAR: form.hasAR,
      style: 'steel-sport',
      metal: form.metal,
      dial: form.dial,
      accent: form.accent,
      specs: form.specs,
      rating: 4.8,
      reviewCount: 1,
      status: 'active',
      arConfig: {
        arScale: Number(form.arScale),
        arPositionY: Number(form.arPositionY),
        arPositionX: Number(form.arPositionX),
        arRotationOffset: Number(form.arRotationOffset)
      }
    });

    alert(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Đăng bán sản phẩm mới thành công!');
    onSuccess();
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      {/* Page Header */}
      <header className="mb-8 border-b border-[#e5e0d8] pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">
            {isEditMode ? '🔧 Cập Nhật Sản Phẩm' : '✨ Đăng Mẫu Đồng Hồ Mới'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Chọn loại sản phẩm (Thường / AR), nhập thông số và đăng bán
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-black font-semibold border border-[#e5e0d8] bg-white px-4 py-2 rounded-xl transition"
        >
          Huỷ bỏ
        </button>
      </header>

      {/* Main Form container split into: Left inputs, Right AR Calibrator */}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start pb-16">
        {/* Left Column: Inputs details (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm space-y-6">
          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#16162A]">
            📝 Thông tin sản phẩm cơ bản
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-gray-500 font-bold mb-1">Tên đồng hồ *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Rolex Submariner Gold 41mm"
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Hãng sản xuất / Thương hiệu *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Ví dụ: Rolex"
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>

            {/* Product photo URL */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Ảnh sản phẩm (URL) *</label>
              <div className="flex gap-3 items-center">
                <div className="h-12 w-12 rounded-lg overflow-hidden border border-[#e5e0d8] bg-[#F6F4EF] flex-shrink-0">
                  {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://...jpg"
                  className="flex-1 rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition bg-gray-50 text-gray-600 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Store selector — only the owner's own stores */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Đăng vào cửa hàng *</label>
              <select
                value={form.shopId}
                onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition bg-white"
              >
                {myShops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.address}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Bạn chỉ đăng được vào {myShops.length} cửa hàng do mình quản lý.</p>
            </div>

            {/* Product type: Thường (2D) vs AR (under development) */}
            <div>
              <label className="block text-gray-500 font-bold mb-2">Loại sản phẩm *</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Normal */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hasAR: false })}
                  className={`text-left rounded-xl border-2 p-3.5 transition ${
                    !form.hasAR ? 'border-[#B8924A] bg-[#B8924A]/5 ring-2 ring-[#B8924A]/20' : 'border-[#e5e0d8] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">🖼️</span>
                    {!form.hasAR && <span className="text-[#B8924A] text-sm font-bold">✓</span>}
                  </div>
                  <p className="font-bold text-[#16162A]">Đồng hồ thường</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Hiển thị bằng ảnh 2D. Đăng bán ngay lập tức.</p>
                </button>

                {/* AR (under development) */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hasAR: true })}
                  className={`relative text-left rounded-xl border-2 p-3.5 transition ${
                    form.hasAR ? 'border-[#B8924A] bg-[#B8924A]/5 ring-2 ring-[#B8924A]/20' : 'border-[#e5e0d8] hover:border-gray-300'
                  }`}
                >
                  <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                    Đang phát triển
                  </span>
                  <div className="flex items-center mb-1">
                    <span className="text-lg">✨</span>
                  </div>
                  <p className="font-bold text-[#16162A]">Đồng hồ AR 3D</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Cho phép khách thử đeo AR trên cổ tay.</p>
                </button>
              </div>
            </div>

            {/* AR development notice + model field */}
            {form.hasAR && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 text-amber-800">
                  <span className="text-base leading-none mt-0.5">🚧</span>
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold">Tính năng AR đang trong giai đoạn phát triển.</p>
                    <p className="text-amber-700 mt-0.5">
                      Hiện chỉ hỗ trợ một số mẫu 3D do hệ thống cung cấp. Bạn vẫn có thể đính kèm file model để sẵn sàng khi AR mở rộng cho cửa hàng.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Đường dẫn file 3D (.glb)</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="/models/chronograph_watch.glb"
                    className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition bg-gray-50 text-gray-600 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Price */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Giá trưng bày (VND) *</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Giá niêm yết cũ (Nếu có)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
              />
            </div>

            {/* Colors picker (represented for thumbnail fallback rendering) */}
            <div>
              <label className="block text-gray-500 font-bold mb-1">Màu kim loại (Case vỏ)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.metal}
                  onChange={(e) => setForm({ ...form, metal: e.target.value })}
                  className="rounded border border-[#e5e0d8] h-9 w-14 cursor-pointer"
                />
                <span className="font-mono text-gray-500">{form.metal}</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Màu mặt số (Dial color)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.dial}
                  onChange={(e) => setForm({ ...form, dial: e.target.value })}
                  className="rounded border border-[#e5e0d8] h-9 w-14 cursor-pointer"
                />
                <span className="font-mono text-gray-500">{form.dial}</span>
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-gray-500 font-bold mb-1">Mô tả sản phẩm</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Mô tả chất liệu máy Thụy Sĩ, đá đính kèm..."
                className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition resize-none"
              />
            </div>
          </div>

          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#16162A] pt-4">
            ⚙️ Thông số kỹ thuật (Specs)
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(form.specs).map(([key, val]) => (
              <div key={key}>
                <label className="block text-gray-500 font-bold mb-1">{key}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleSpecChange(key, e.target.value)}
                  className="w-full rounded-xl border border-[#e5e0d8] px-3.5 py-2.5 focus:outline-none focus:border-[#B8924A] focus:ring-2 focus:ring-[#B8924A]/20 transition"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-2 justify-end border-t border-[#e5e0d8]">
            <button
              type="submit"
              className="bg-[#16162A] text-white py-3 px-8 rounded-full font-bold text-xs hover:bg-black transition shadow border border-[#B8924A]/30 active:scale-95"
            >
              {isEditMode ? 'Lưu Thay Đổi & Xuất Bản' : 'Đăng Bán & Duyệt Sản Phẩm'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-[#e5e0d8] text-gray-500 py-3 px-8 rounded-full text-xs font-semibold hover:bg-gray-50 transition"
            >
              Huỷ
            </button>
          </div>
        </div>

        {/* Right Column: preview (normal) or AR calibration simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between h-fit sticky top-28">
          {!form.hasAR ? (
            /* NORMAL PRODUCT — live card preview + tips */
            <div>
              <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#16162A] mb-4">
                🖼️ Xem trước thẻ sản phẩm
              </h3>
              <div className="rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm bg-[#F6F4EF] mb-5">
                <div className="h-48 bg-gradient-to-br from-[#f3efe7] to-[#e9e3d8] overflow-hidden">
                  {form.image && <img src={form.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{form.brand || 'Thương hiệu'}</p>
                  <h4 className="font-display font-bold text-[#16162A] mt-0.5 mb-1">{form.name || 'Tên sản phẩm'}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[#16162A]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(form.price) || 0)}
                    </span>
                    {Number(form.originalPrice) > Number(form.price) && (
                      <span className="text-xs text-gray-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(form.originalPrice))}
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-3 bg-white text-[#16162A] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#16162A]/15 uppercase tracking-widest">Ảnh 2D</span>
                </div>
              </div>
              <div className="bg-[#F6F4EF] p-3.5 rounded-xl border border-[#e5e0d8] text-[10px] text-gray-500 leading-relaxed">
                💡 Mẹo: dùng ảnh nền sáng, chụp chính diện mặt số để thẻ sản phẩm nổi bật. Có thể nâng cấp lên loại AR khi tính năng mở rộng cho cửa hàng.
              </div>
            </div>
          ) : (
          <>
          <div>
            <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 text-[#16162A] mb-3">
              📐 Bộ căn chỉnh AR trên cổ tay (Live Preview)
            </h3>
            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
              Kéo các thanh trượt bên dưới để cân chỉnh kích thước và hướng đeo đồng hồ 3D khớp khít nhất với khung cổ tay.
            </p>

            {/* VISUAL WRIST CALIBRATION DISPLAY */}
            <div className="relative bg-[#F6F4EF] rounded-2xl h-56 border border-[#e5e0d8] overflow-hidden flex items-center justify-center mb-6">
              {/* Simulated arm / wrist path background */}
              <div className="absolute inset-0 bg-[#e5e0d8]/30 flex items-center justify-center">
                {/* Arm representation */}
                <div className="w-24 h-full bg-[#ecdac7] border-x border-[#dfc8b3] rotate-[30deg] shadow-inner relative flex items-center justify-center">
                  <div className="w-full h-10 border-y border-[#dfc8b3]/45 absolute top-1/2 -translate-y-5" />
                </div>
              </div>

              {/* Dynamic watch preview superimposed (real product photo) */}
              <div
                className="h-16 w-16 rounded-full border-2 shadow-2xl relative transition-all duration-100 ease-out overflow-hidden bg-[#16162A]"
                style={{
                  borderColor: form.metal,
                  transform: `scale(${form.arScale}) translate(${form.arPositionX * 40}px, ${-form.arPositionY * 40}px) rotate(${form.arRotationOffset}deg)`,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                }}
              >
                {form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 35%, ${form.metal}, ${form.dial} 80%)` }} />
                )}
              </div>

              {/* Overlay guidelines grid */}
              <div className="absolute inset-0 border border-dashed border-gray-200/50 pointer-events-none flex items-center justify-center">
                <div className="w-[1px] h-full border-l border-dashed border-[#B8924A]/20" />
                <div className="h-[1px] w-full border-t border-dashed border-[#B8924A]/20" />
              </div>

              <span className="absolute bottom-2 left-3 text-[9px] uppercase tracking-wider text-[#B8924A] font-bold">
                Mô phỏng 3D Calibration
              </span>
            </div>

            {/* Sliders workspace */}
            <div className="space-y-4 text-xs">
              {/* Scale */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Tỉ lệ kích thước (Scale)</label>
                  <span className="font-mono text-[#B8924A] font-bold">×{Number(form.arScale).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={form.arScale}
                  onChange={(e) => setForm({ ...form, arScale: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Position Y */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Dịch dọc trục cổ tay (Y Position)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{Number(form.arPositionY).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={form.arPositionY}
                  onChange={(e) => setForm({ ...form, arPositionY: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Position X */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Dịch ngang cổ tay (X Position)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{Number(form.arPositionX).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={form.arPositionX}
                  onChange={(e) => setForm({ ...form, arPositionX: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-500">Bù góc xoay (Rotation Offset)</label>
                  <span className="font-mono text-[#B8924A] font-bold">{form.arRotationOffset}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={form.arRotationOffset}
                  onChange={(e) => setForm({ ...form, arRotationOffset: Number(e.target.value) })}
                  className="w-full accent-[#B8924A]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#F6F4EF] p-3.5 rounded-xl border border-[#e5e0d8] text-[10px] text-gray-500 leading-normal">
            💡 **Tip:** Đặt tỉ lệ chuẩn để mặt kính đồng hồ phủ rộng khoảng 75%-80% độ rộng của cổ tay, tạo hiệu ứng đeo thử tự nhiên nhất khi khách hàng bật camera.
          </div>
          </>
          )}
        </div>
      </form>
    </div>
  );
}
