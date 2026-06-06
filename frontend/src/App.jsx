import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import QRTryOnModal from './components/ar/QRTryOnModal.jsx';
import { detectMobile } from './utils/device.js';

// Real auth (JWT backend) + login overlay
import { useSession, uiRoleFor } from './auth/session';
import { useLoginPrompt } from './auth/loginPrompt';
import LoginScreen from './components/auth/LoginScreen';
import ToastHost from './components/ToastHost';
import { setToken, watchApi, favoriteApi, leadApi } from './api';

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
import AdminLeads from './components/admin/AdminLeads';
import AdminPlans from './components/admin/AdminPlans';
import AdminSettings from './components/admin/AdminSettings';

// Lazy loaded MediaPipe AR try-on overlay
const ARWristTryOn = lazy(() => import('./components/ar/ARWristTryOn'));

export default function App() {
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
  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem('tw_page') || 'home';
    return savedPage === 'add-product' ? 'products' : savedPage;
  });
  const [selectedWatchId, setSelectedWatchId] = useState(() => sessionStorage.getItem('tw_watch') || 'chrono');
  const [selectedShopId, setSelectedShopId] = useState(() => sessionStorage.getItem('tw_shop') || null);
  const [mode, setMode] = useState('none');
  // Shop/admin users can preview the customer storefront ("view as user").
  const [storefront, setStorefront] = useState(() => sessionStorage.getItem('tw_storefront') === '1');

  useEffect(() => { sessionStorage.setItem('tw_page', page); }, [page]);
  useEffect(() => { sessionStorage.setItem('tw_storefront', storefront ? '1' : '0'); }, [storefront]);
  useEffect(() => { sessionStorage.setItem('tw_watch', selectedWatchId || ''); }, [selectedWatchId]);
  useEffect(() => {
    if (selectedShopId) sessionStorage.setItem('tw_shop', selectedShopId);
    else sessionStorage.removeItem('tw_shop');
  }, [selectedShopId]);

  // Badge counters (fetched from the backend).
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);

  // Boot: capture an OAuth callback token, restore the session, handle AR deep link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isCallback = window.location.pathname.includes('oauth-callback');
    if (token && (isCallback || params.has('token'))) {
      setToken(token);
    }
    initSession();

    if (params.get('ar') === '1') setMode('ar');

    if (token || params.has('ar') || isCallback) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('ar');
      const cleanPath = isCallback ? '/' : url.pathname;
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
      setPage(role === 'user' ? 'home' : 'dashboard');
      setSelectedShopId(null);
      setStorefront(false);
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
            onNavigate={(p) => setPage(p)}
            onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }}
            onOpenAR={handleTryOn}
          />
        );
      case 'catalog':
        return (
          <UserCatalog
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
      case 'leads':
        return <AdminLeads />;
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
            onChangePage={(p) => { setSelectedShopId(null); setPage(p); }}
            favoritesCount={favoritesCount}
            user={user}
            onLogin={() => showLogin('login')}
            onLogout={handleLogout}
            onGoDashboard={exitStorefront}
          />
          <main className="flex-1">{renderUserPages()}</main>
          <UserFooter onChangePage={(p) => { setSelectedShopId(null); setPage(p); }} />
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
          <main className="flex-1 h-screen overflow-y-auto flex">{renderShopPages()}</main>
        </div>
      )}

      {role === 'admin' && !storefront && (
        <div className="flex min-h-screen">
          <AdminSidebar
            currentPage={page}
            onChangePage={(p) => setPage(p)}
            pendingAuditsCount={0}
            user={user}
            onLogout={handleLogout}
          />
          <main className="flex-1 h-screen overflow-y-auto flex">{renderAdminPages()}</main>
        </div>
      )}

      {/* Global toast notifications (top-right) */}
      <ToastHost />

      {/* Login / register overlay */}
      {loginOpen && <LoginScreen onClose={hideLogin} />}

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
