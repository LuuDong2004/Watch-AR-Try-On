import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import LoginPage from './pages/auth/LoginPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import ShopProductsPage from './pages/shop/ShopProductsPage';
import ShopInfoPage from './pages/shop/ShopInfoPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminWatchesPage from './pages/admin/AdminWatchesPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import { RequireRole } from './auth/RequireRole';
import { useAuth } from './auth/useAuth';
import { useData } from './data/store';

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const loadCatalog = useData((s) => s.loadCatalog);

  // Rehydrate the session and load the public catalogue once, on app start.
  useEffect(() => {
    bootstrap();
    loadCatalog().catch(() => {
      /* surfaced per-page; backend may be offline */
    });
  }, [bootstrap, loadCatalog]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public storefront */}
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Auth flow (backend OAuth redirects here) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/oauth-callback" element={<OAuthCallbackPage />} />

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
