import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import LoginPage from './pages/auth/LoginPage';
import ShopProductsPage from './pages/shop/ShopProductsPage';
import ShopInfoPage from './pages/shop/ShopInfoPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminWatchesPage from './pages/admin/AdminWatchesPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import { RequireRole } from './auth/RequireRole';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public storefront */}
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Shop owner */}
        <Route
          path="/shop"
          element={
            <RequireRole role="shop">
              <ShopProductsPage />
            </RequireRole>
          }
        />
        <Route
          path="/shop/info"
          element={
            <RequireRole role="shop">
              <ShopInfoPage />
            </RequireRole>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/watches"
          element={
            <RequireRole role="admin">
              <AdminWatchesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/shops"
          element={
            <RequireRole role="admin">
              <AdminShopsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole role="admin">
              <AdminUsersPage />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
