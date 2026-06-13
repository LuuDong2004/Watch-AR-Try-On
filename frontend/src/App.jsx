import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import QRTryOnModal from './components/ar/QRTryOnModal.jsx';
import { detectMobile } from './utils/device.js';

// Real auth (JWT backend) + login overlay
import { useSession, uiRoleFor } from './auth/session';
import { useLoginPrompt } from './auth/loginPrompt';
import LoginScreen from './components/auth/LoginScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import VerifyEmailScreen from './components/auth/VerifyEmailScreen';
import ToastHost from './components/ToastHost';
import AppErrorPage from './components/AppErrorPage.jsx';
import { setToken, watchApi, favoriteApi, leadApi, shopApi, subscriptionApi } from './api';
import { normalizePath, parseAppRoute, routePathForState } from './utils/router.js';

// User (Customer) Components
import UserHeader from './components/user/UserHeader';
import UserFooter from './components/user/UserFooter';
import UserHome from './components/user/UserHome';
import UserStores from './components/user/UserStores';
import UserFavorites from './components/user/UserFavorites';
import UserPricing from './components/user/UserPricing';
import UserFeedback from './components/user/UserFeedback';
import UserCatalog from './components/user/UserCatalog';
import UserDetail from './components/user/UserDetail';
import UserAccount from './components/user/UserAccount';

// Shop (Seller) Components
import ShopSidebar from './components/shop/ShopSidebar';
import ShopDashboard from './components/shop/ShopDashboard';
import ShopProducts from './components/shop/ShopProducts';
import ShopLeads from './components/shop/ShopLeads';
import ShopAnalytics from './components/shop/ShopAnalytics';
import ShopPlanManagement from './components/shop/ShopPlanManagement';
import ShopSettings from './components/shop/ShopSettings';

// Admin (System) Components
import AdminSidebar from './components/admin/AdminSidebar';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminShops from './components/admin/AdminShops';
import AdminAudit from './components/admin/AdminAudit';
import AdminUsers from './components/admin/AdminUsers';
import AdminFeedback from './components/admin/AdminFeedback';
import AdminPlans from './components/admin/AdminPlans';
import AdminSettings from './components/admin/AdminSettings';
import AdminUpgradeRequests from './components/admin/AdminUpgradeRequests';

// Lazy loaded MediaPipe AR try-on overlay
const ARWristTryOn = lazy(() => import('./components/ar/ARWristTryOn'));

export default function App() {
  const initialRoute = useRef(parseAppRoute(window.location.pathname)).current;
  // Auth session — role is derived from the signed-in user (no RoleSwitcher).
  const user = useSession((s) => s.user);
  const status = useSession((s) => s.status);
  const initSession = useSession((s) => s.init);
  const logout = useSession((s) => s.logout);
  const loginOpen = useLoginPrompt((s) => s.open);
  const showLogin = useLoginPrompt((s) => s.show);
  const hideLogin = useLoginPrompt((s) => s.hide);

  const role = uiRoleFor(user?.role); // 'user' (storefront/customer) | 'shop' | 'admin'

  // Persist the active tab + selections so a page reload restores where the
  // user was (instead of snapping back to the role's default landing page).
  const [routeError, setRouteError] = useState(initialRoute.errorStatus || null);
  const [page, setPage] = useState(() => {
    if (initialRoute.page) return initialRoute.page;
    const savedPage = sessionStorage.getItem('tw_page') || 'home';
    return savedPage === 'add-product' ? 'products' : savedPage;
  });
  const [selectedWatchId, setSelectedWatchId] = useState(() => initialRoute.watchId || sessionStorage.getItem('tw_watch') || 'chrono');
  const [selectedShopId, setSelectedShopId] = useState(() => initialRoute.shopId || sessionStorage.getItem('tw_shop') || null);
  const [mode, setMode] = useState('none');
  const [resetToken, setResetToken] = useState(null);
  const [verifyToken, setVerifyToken] = useState(null);
  // Brand to pre-filter the catalog by (set when a brand chip is clicked on home).
  const [catalogBrand, setCatalogBrand] = useState(null);
  // Shop/admin users can preview the customer storefront ("view as user").
  const [storefront, setStorefront] = useState(() => initialRoute.area === 'user' || sessionStorage.getItem('tw_storefront') === '1');

  useEffect(() => { sessionStorage.setItem('tw_page', page); }, [page]);
  useEffect(() => { sessionStorage.setItem('tw_storefront', storefront ? '1' : '0'); }, [storefront]);
  useEffect(() => { sessionStorage.setItem('tw_watch', selectedWatchId || ''); }, [selectedWatchId]);
  useEffect(() => {
    if (selectedShopId) sessionStorage.setItem('tw_shop', selectedShopId);
    else sessionStorage.removeItem('tw_shop');
  }, [selectedShopId]);

  useEffect(() => {
    const applyRoute = () => {
      const route = parseAppRoute(window.location.pathname);
      setRouteError(route.errorStatus || null);
      if (route.errorStatus) return;

      if (route.page) setPage(route.page);
      if (route.watchId) setSelectedWatchId(route.watchId);
      setSelectedShopId(route.shopId || null);
      setStorefront(route.area === 'user');
    };

    window.addEventListener('popstate', applyRoute);
    return () => window.removeEventListener('popstate', applyRoute);
  }, []);

  useEffect(() => {
    if (routeError || status === 'loading') return;
    const area = role === 'user' || storefront ? 'user' : role;
    const nextPath = routePathForState({ area, page, watchId: selectedWatchId, shopId: selectedShopId });
    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, [page, role, routeError, selectedShopId, selectedWatchId, status, storefront]);

  // Badge counters (fetched from the backend).
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [lockedShops, setLockedShops] = useState([]);
  const [pendingUpgradesCount, setPendingUpgradesCount] = useState(0);
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);

  // Boot: capture an OAuth callback token, restore the session, handle AR deep link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isCallback = window.location.pathname.includes('oauth-callback');
    const isReset = window.location.pathname.includes('reset-password');
    const isVerify = window.location.pathname.includes('verify-email');
    if (isReset && token) {
      // Password-reset link — open the reset overlay (this is NOT an auth token).
      setResetToken(token);
    } else if (isVerify && token) {
      // Email-verification link — open the verify overlay (it stores its own token).
      setVerifyToken(token);
    } else if (token && (isCallback || params.has('token'))) {
      setToken(token);
    }
    initSession();

    if (params.get('ar') === '1') setMode('ar');

    if (token || params.has('ar') || isCallback || isReset || isVerify) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('ar');
      const cleanPath = (isCallback || isReset || isVerify) ? '/' : url.pathname;
      window.history.replaceState({}, '', cleanPath + url.search);
    }
  }, [initSession]);

  // Reset to the role's default page only on an explicit auth change (login or
  // logout) — NOT on the initial session restore after a reload, so the saved
  // tab survives a refresh.
  const prevStatus = useRef(status);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    const loggedIn = was === 'anon' && status === 'authed';
    const loggedOut = was === 'authed' && status === 'anon';
    if (loggedIn) {
      if (role === 'user') {
        // Stay on the page the user was browsing when they signed in (don't snap home).
        setStorefront(false);
      } else {
        // Sellers/admins switch into their dashboard shell.
        setPage('dashboard');
        setSelectedShopId(null);
        setStorefront(false);
      }
    } else if (loggedOut) {
      setPage('home');
      setSelectedShopId(null);
      setStorefront(false);
    }
  }, [status, role]);

  // Refresh badge counters on data changes / navigation.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        if (user && role === 'user') {
          const favs = await favoriteApi.list();
          if (!cancelled) setFavoritesCount(favs.length);
        } else if (!cancelled) setFavoritesCount(0);

        if (user && (role === 'shop' || role === 'admin')) {
          const leads = await leadApi.list();
          if (!cancelled) setNewLeadsCount(leads.filter((l) => l.status === 'new').length);
        } else if (!cancelled) setNewLeadsCount(0);

        if (user && role === 'shop') {
          const shops = await shopApi.mine();
          if (!cancelled) setLockedShops(shops.filter((s) => s.status === 'locked'));
        } else if (!cancelled) setLockedShops([]);

        if (user && role === 'admin') {
          const reqs = await subscriptionApi.adminRequests();
          if (!cancelled) setPendingUpgradesCount(reqs.length);
        } else if (!cancelled) setPendingUpgradesCount(0);
      } catch {
        /* ignore badge fetch errors */
      }
    }
    refresh();
    return () => { cancelled = true; };
  }, [dbUpdateTrigger, page, role, user]);

  // Scroll to top on navigation.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, role]);

  const triggerDbUpdate = () => setDbUpdateTrigger((p) => p + 1);

  const handleTryOn = (watchId) => {
    setSelectedWatchId(watchId);
    setMode(detectMobile() ? 'ar' : 'qr');
  };

  const handleLogout = () => {
    logout();
    setMode('none');
  };

  const handleGoHomeFromError = () => {
    setRouteError(null);
    setSelectedShopId(null);
    setStorefront(role !== 'user');
    setPage('home');
    window.history.pushState({}, '', '/');
  };

  const handleRetryFromError = () => {
    window.location.reload();
  };

  // Shop/admin: preview the customer storefront, and return to the dashboard.
  const goStorefront = () => { setStorefront(true); setSelectedShopId(null); setPage('home'); };
  const exitStorefront = () => { setStorefront(false); setPage('dashboard'); };

  const tryOnUrl = (() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('ar', '1');
    return url.toString();
  })();

  // ---- Page renderers --------------------------------------------------------
  const renderUserPages = () => {
    switch (page) {
      case 'home':
        return (
          <UserHome
            onNavigate={(p) => { if (p === 'catalog') setCatalogBrand(null); setPage(p); }}
            onSelectBrand={(b) => { setCatalogBrand(b); setPage('catalog'); }}
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
          />
        );
      case 'catalog':
        return (
          <UserCatalog
            initialBrand={catalogBrand}
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
          />
        );
      case 'stores':
        return (
          <UserStores
            initialShopId={selectedShopId}
            onNavigate={(p) => setPage(p)}
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
          />
        );
      case 'detail':
        return (
          <UserDetail
            watchId={selectedWatchId}
            onOpenAR={handleTryOn}
            onBack={() => setPage('catalog')}
            onSelectWatch={(id) => setSelectedWatchId(id)}
            onSelectShop={(shopId) => { setSelectedShopId(shopId); setPage('stores'); }}
          />
        );
      case 'pricing':
        return <UserPricing onBackToCatalog={() => setPage('catalog')} />;
      case 'feedback':
        return <UserFeedback onBackToCatalog={() => setPage('catalog')} />;
      case 'favorites':
        return (
          <UserFavorites
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
            onBackToCatalog={() => setPage('catalog')}
            onChanged={triggerDbUpdate}
          />
        );
      case 'account':
        return (
          <UserAccount
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onBackToCatalog={() => setPage('catalog')}
          />
        );
      default:
        return (
          <UserCatalog
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
          />
        );
    }
  };

  const renderShopPages = () => {
    switch (page) {
      case 'dashboard':
        return (
          <ShopDashboard
            onNavigateToLeads={() => setPage('leads')}
            onNavigateToProducts={() => setPage('products')}
          />
        );
      case 'products':
        return <ShopProducts />;
      case 'leads':
        return <ShopLeads onStatusUpdated={triggerDbUpdate} />;
      case 'analytics':
        return <ShopAnalytics />;
      case 'plans':
        return <ShopPlanManagement />;
      case 'settings':
        return <ShopSettings />;
      default:
        return (
          <ShopDashboard
            onNavigateToLeads={() => setPage('leads')}
            onNavigateToProducts={() => setPage('products')}
          />
        );
    }
  };

  const renderAdminPages = () => {
    switch (page) {
      case 'dashboard':
        return (
          <AdminDashboard
            onNavigateToShops={() => setPage('shops')}
            onNavigateToAudit={() => setPage('audit')}
          />
        );
      case 'shops':
        return <AdminShops />;
      case 'audit':
        return <AdminAudit />;
      case 'users':
        return <AdminUsers />;
      case 'requests':
        return <AdminUpgradeRequests />;
      case 'feedback':
        return <AdminFeedback />;
      case 'plans':
        return <AdminPlans />;
      case 'settings':
        return <AdminSettings />;
      default:
        return (
          <AdminDashboard
            onNavigateToShops={() => setPage('shops')}
            onNavigateToAudit={() => setPage('audit')}
          />
        );
    }
  };

  // ---- Render ----------------------------------------------------------------
  if (routeError) {
    return (
      <>
        <AppErrorPage
          statusCode={routeError}
          onGoHome={handleGoHomeFromError}
          onRetry={handleRetryFromError}
        />
        <ToastHost />
      </>
    );
  }

  if (status === 'loading') {
    return (
      <div className="h-full min-h-screen bg-[#F6F4EF] flex items-center justify-center text-sm text-[#8A8170]">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="h-full bg-[#F6F4EF] text-[#17140F] select-none font-sans overflow-x-hidden">
      {(role === 'user' || storefront) && (
        <div className="flex flex-col min-h-screen">
          <UserHeader
            currentPage={page}
            onChangePage={(p) => { setSelectedShopId(null); setCatalogBrand(null); setPage(p); }}
            favoritesCount={favoritesCount}
            user={user}
            onLogin={() => showLogin('login')}
            onLogout={handleLogout}
            onGoDashboard={exitStorefront}
          />
          <main className="flex-1">{renderUserPages()}</main>
          <UserFooter onChangePage={(p) => { setSelectedShopId(null); setCatalogBrand(null); setPage(p); }} />
        </div>
      )}

      {role === 'shop' && !storefront && (
        <div className="flex min-h-screen">
          <ShopSidebar
            currentPage={page}
            onChangePage={(p) => setPage(p)}
            newLeadsCount={newLeadsCount}
            user={user}
            onLogout={handleLogout}
            onGoHome={goStorefront}
          />
          <main className="flex-1 h-screen overflow-y-auto flex flex-col">
            {lockedShops.length > 0 && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-3">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">
                    <span className="font-bold">
                      {lockedShops.length === 1
                        ? `Cửa hàng "${lockedShops[0].name}" đã bị khóa bởi quản trị viên.`
                        : `${lockedShops.length} cửa hàng của bạn đã bị khóa bởi quản trị viên.`}
                    </span>{' '}
                    {lockedShops.length === 1 && lockedShops[0].lockReason && (
                      <span>Lý do: <span className="font-semibold">{lockedShops[0].lockReason}</span>. </span>
                    )}
                    Cửa hàng và sản phẩm sẽ không hiển thị với khách hàng cho đến khi được mở khóa. Vui lòng liên hệ hỗ trợ nếu cần.
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-1 min-h-0">{renderShopPages()}</div>
          </main>
        </div>
      )}

      {role === 'admin' && !storefront && (
        <div className="flex min-h-screen">
          <AdminSidebar
            currentPage={page}
            onChangePage={(p) => setPage(p)}
            pendingAuditsCount={0}
            pendingUpgradesCount={pendingUpgradesCount}
            user={user}
            onLogout={handleLogout}
            onGoHome={goStorefront}
          />
          <main className="flex-1 h-screen overflow-y-auto flex">{renderAdminPages()}</main>
        </div>
      )}

      {/* Global toast notifications (top-right) */}
      <ToastHost />

      {/* Login / register overlay */}
      {loginOpen && <LoginScreen onClose={hideLogin} />}

      {/* Password reset overlay (from the emailed link) */}
      {resetToken && (
        <ResetPasswordScreen
          token={resetToken}
          onClose={() => setResetToken(null)}
          onLoginClick={() => { setResetToken(null); showLogin('login'); }}
        />
      )}

      {/* Email verification overlay (from the emailed link) */}
      {verifyToken && (
        <VerifyEmailScreen
          token={verifyToken}
          onClose={() => setVerifyToken(null)}
          onLoginClick={() => { setVerifyToken(null); showLogin('login'); }}
        />
      )}

      {/* AR / QR overlays */}
      {mode === 'qr' && (
        <QRTryOnModal
          tryOnUrl={tryOnUrl}
          watchName={selectedWatchId}
          onClose={() => setMode('none')}
          onTryHere={() => setMode('ar')}
        />
      )}

      {mode === 'ar' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center text-xs text-white">Đang khởi động camera...</div>}>
          <ARWristTryOn
            watchName={selectedWatchId}
            watchId={selectedWatchId}
            onClose={() => setMode('none')}
            onOpenContact={async () => {
              setMode('none');
              try {
                const w = await watchApi.get(selectedWatchId);
                setSelectedShopId(w?.shopId || null);
              } catch {
                setSelectedShopId(null);
              }
              if (role === 'user') setPage('stores');
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
