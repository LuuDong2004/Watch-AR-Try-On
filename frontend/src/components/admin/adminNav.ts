import { LayoutDashboard, Store, ShieldCheck, Users, MessageSquare, Mail, CreditCard, Wallet, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  /** When set, shows a count badge looked up by this key (see AdminSidebar). */
  badge?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', name: 'Tổng quan hệ thống', icon: LayoutDashboard },
  { id: 'shops', name: 'Quản lý cửa hàng', icon: Store },
  { id: 'audit', name: 'Kiểm duyệt 3D', icon: ShieldCheck, badge: true },
  { id: 'transactions', name: 'Giao dịch & Doanh thu', icon: Wallet, badge: true },
  { id: 'inbox', name: 'Hộp thư', icon: Mail, badge: true },
  { id: 'users', name: 'Người dùng', icon: Users },
  { id: 'feedback', name: 'Góp ý người dùng', icon: MessageSquare },
  { id: 'plans', name: 'Quản lý gói', icon: CreditCard },
  // Tạm ẩn "Cấu hình hệ thống" — component & route (App.jsx case 'settings') vẫn giữ để khôi phục sau.
  // { id: 'settings', name: 'Cấu hình hệ thống', icon: Settings },
];
