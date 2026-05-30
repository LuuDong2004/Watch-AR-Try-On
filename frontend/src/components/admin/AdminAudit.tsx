import React, { useState, useEffect } from 'react';
import { Package, ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';
import { getDbWatches } from '../../utils/mockData';

export default function AdminAudit() {
  const [watches, setWatches] = useState<any[]>([]);
  const [selectedWatch, setSelectedWatch] = useState<any>(null);

  // Simulated audit calibration checks
  const [scale, setScale] = useState(1.15);
  const [posY, setPosY] = useState(0);
  const [posX, setPosX] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const list = getDbWatches();
    setWatches(list);
    if (list.length > 0) {
      setSelectedWatch(list[0]);
    }
  }, []);

  const handleSelect = (w: any) => {
    setSelectedWatch(w);
    setScale(w.arConfig?.arScale || 1.0);
    setPosY(w.arConfig?.arPositionY || 0);
    setPosX(w.arConfig?.arPositionX || 0);
    setRotation(w.arConfig?.arRotationOffset || 0);
  };

  const handleApprove = () => {
    alert(`Đã PHÊ DUYỆT model 3D cho đồng hồ ${selectedWatch.name} chính thức hoạt động trên toàn hệ thống!`);
  };

  const handleReject = () => {
    const reason = prompt('Nhập lý do từ chối kiểm duyệt (Gửi phản hồi cho shop):');
    if (reason) {
      alert(`Đã TỪ CHỐI kiểm duyệt. Lý do: "${reason}". Phản hồi đã được chuyển đến shop.`);
    }
  };

  if (!selectedWatch) return <div className="p-8 text-center text-xs">Đang tải danh sách chờ duyệt...</div>;

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Kiểm Duyệt Model 3D & AR</h1>
        <p className="text-xs text-gray-500 mt-1">Cổng kiểm soát chất lượng: Thử ướm model trên cổ tay mẫu và phê duyệt xuất bản</p>
      </header>

      <section className="grid lg:grid-cols-12 gap-8 items-start pb-16">
        {/* Left Side: Pending audit list (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm text-xs">
          <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4" /> Mẫu chờ kiểm duyệt ({watches.length})
          </h3>

          <div className="space-y-3">
            {watches.map((w) => (
              <div
                key={w.id}
                onClick={() => handleSelect(w)}
                className={`p-3 bg-[#F6F4EF] rounded-xl border transition cursor-pointer flex justify-between items-center ${
                  selectedWatch.id === w.id ? 'border-[#B8924A] bg-[#B8924A]/5' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#e5e0d8] bg-white flex-shrink-0">
                    <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-[#16162A]">{w.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{w.brand}</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
                  CHỜ DUYỆT
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Virtual Simulator Inspect (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#e5e0d8] shadow-sm text-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold border-b border-[#e5e0d8] pb-2 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Workspace kiểm soát tỉ lệ đeo thử
            </h3>

            {/* Simulation Preview Area */}
            <div className="relative bg-[#F6F4EF] rounded-2xl h-60 border border-[#e5e0d8] overflow-hidden flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-[#e5e0d8]/30 flex items-center justify-center">
                {/* Arm representation */}
                <div className="w-24 h-full bg-[#ebdac7] border-x border-[#dfc8b3] rotate-[30deg] shadow-inner relative flex items-center justify-center">
                  <div className="w-full h-10 border-y border-[#dfc8b3]/45 absolute top-1/2 -translate-y-5" />
                </div>
              </div>

              {/* Dynamic watch preview (real product photo) */}
              <div
                className="h-16 w-16 rounded-full border-2 shadow-2xl relative transition-all duration-100 ease-out overflow-hidden bg-[#16162A]"
                style={{
                  borderColor: selectedWatch.metal,
                  transform: `scale(${scale}) translate(${posX * 40}px, ${-posY * 40}px) rotate(${rotation}deg)`,
                }}
              >
                {selectedWatch.image ? (
                  <img src={selectedWatch.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 35%, ${selectedWatch.metal}, ${selectedWatch.dial} 80%)` }} />
                )}
              </div>

              <span className="absolute bottom-2 left-3 text-[9px] uppercase tracking-wider text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> KHUNG ĐEO THỬ GIẢ LẬP
              </span>
            </div>

            {/* Spec audit info card */}
            <div className="bg-[#F6F4EF] p-4 rounded-xl border border-gray-100 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Đường dẫn model 3D:</span>
                <span className="font-mono text-gray-700">{selectedWatch.model || 'Chưa cung cấp file'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Độ phân giải vân (Mesh count):</span>
                <span className="text-gray-700">~24,500 vertices (Tối ưu thiết bị di động)</span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2.5 mb-6">
              <h4 className="font-bold text-[#16162A] border-b pb-1">Checklist chất lượng mẫu</h4>
              {[
                'Vân bề mặt (Texture PBR) hiển thị sắc nét, không bị nhòe.',
                'Độ rộng kim đeo và núm đồng hồ đúng tỉ lệ ngoài đời.',
                'Model 3D quay trục chính xác, điểm neo anchor cổ tay mượt mà.',
                'Thông số kỹ thuật đầy đủ nhãn - giá trị khớp đúng catalog.'
              ].map((item, idx) => (
                <label key={idx} className="flex items-start gap-2.5 cursor-pointer text-gray-600">
                  <input type="checkbox" defaultChecked className="accent-[#B8924A] rounded mt-0.5 h-3.5 w-3.5" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Audit Actions */}
          <div className="flex gap-3 font-bold border-t border-[#e5e0d8] pt-4">
            <button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Phê Duyệt & Xuất Bản
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="h-4 w-4" /> Từ Chối Phê Duyệt
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
