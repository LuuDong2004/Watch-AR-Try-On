import React, { useState } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 'user-1', name: 'Nguyễn Minh Anh', email: 'minhanh.nguyen@gmail.com', role: 'Khách hàng', tryons: 12, status: 'active', date: '30/05/2026' },
    { id: 'user-2', name: 'Trần Đức Hòa', email: 'tranduchoa@gmail.com', role: 'Khách hàng', tryons: 4, status: 'active', date: '29/05/2026' },
    { id: 'user-3', name: 'Aventus Boutique', email: 'manager@aventus.luxury', role: 'Showroom', tryons: 89, status: 'active', date: '25/05/2026' }
  ]);

  const handleToggleBlock = (id: string, name: string) => {
    alert(`Đã tạm khóa tài khoản của ${name} thành công!`);
  };

  return (
    <div className="bg-[#F6F4EF] min-h-screen text-[#16162A] font-sans p-6 md:p-8 w-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#16162A]">Quản Lý Tài Khoản</h1>
        <p className="text-xs text-gray-500 mt-1">Giám sát tài khoản khách hàng, đại lý và phân quyền hệ thống</p>
      </header>

      {/* Users table */}
      <section className="bg-white rounded-3xl p-6 border border-[#e5e0d8] shadow-sm text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="py-3 px-4">Tên người dùng</th>
                <th className="py-3 px-4">Địa chỉ Email</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4 text-center">Lượt thử AR</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-[#16162A] flex items-center gap-2">
                    <span>👤</span>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-[#16162A]/5 text-[#16162A] px-2 py-0.5 rounded font-semibold text-[9px] uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-bold text-gray-700">{u.tryons}</td>
                  <td className="py-3.5 text-center">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                      Hoạt động
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-gray-400">{u.date}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleToggleBlock(u.id, u.name)}
                      className="border border-red-200 text-red-600 hover:bg-red-50 py-1 px-3 rounded-lg font-bold"
                    >
                      Khóa nick
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
