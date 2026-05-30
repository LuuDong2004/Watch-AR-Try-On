import { LayoutDashboard, Store, ShieldCheck, Users, Mail, Settings, CreditCard, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  badge?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', name: 'Tổng quan hệ thống', icon: LayoutDashboard },
  { id: 'shops', name: 'Quản lý cửa hàng', icon: Store },
  { id: 'audit', name: 'Kiểm duyệt 3D', icon: ShieldCheck, badge: true },
  { id: 'users', name: 'Người dùng', icon: Users },
  { id: 'leads', name: 'Leads toàn sàn', icon: Mail },
  { id: 'plans', name: 'Quản lý gói', icon: CreditCard },
  { id: 'settings', name: 'Cấu hình hệ thống', icon: Settings },
];
