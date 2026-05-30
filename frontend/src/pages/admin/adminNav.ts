import type { NavItem } from '../../components/layout/DashboardLayout';

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: '📊', end: true },
  { to: '/admin/watches', label: 'Đồng hồ', icon: '⌚' },
  { to: '/admin/shops', label: 'Cửa hàng', icon: '🏬' },
  { to: '/admin/users', label: 'Tài khoản', icon: '👤' },
];
