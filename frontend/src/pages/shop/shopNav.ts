import { Watch, Store } from 'lucide-react';
import type { NavItem } from '../../components/layout/DashboardLayout';

export const SHOP_NAV: NavItem[] = [
  { to: '/shop', label: 'Sản phẩm', icon: Watch, end: true },
  { to: '/shop/info', label: 'Thông tin shop', icon: Store },
];
