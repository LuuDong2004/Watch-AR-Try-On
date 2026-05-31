import { lazy, Suspense, useEffect, useState } from 'react';
import QRTryOnModal from './components/ar/QRTryOnModal.jsx';
import { detectMobile } from './utils/device.js';

// Database & Role Switcher
import { initDatabase, getDbFavorites, getLeadsForShopIds, getMyShopIds, resolveScopeShopIds, getShopForWatch } from './utils/mockData';
import RoleSwitcher from './components/RoleSwitcher';

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
import ShopAddProduct from './components/shop/ShopAddProduct';
import ShopLeads from './components/shop/ShopLeads';
import ShopAnalytics from './components/shop/ShopAnalytics';
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
  // Global Routing State
  const [role, setRole] = useState('user');
  const [page, setPage] = useState('home'); // active page within current role

  // Selection states
  const [selectedWatchId, setSelectedWatchId] = useState('chrono');
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [editWatchId, setEditWatchId] = useState(null);
  const [mode, setMode] = useState('none'); // overlay camera state

  // Shop manager: which of the owner's stores is in focus ('all' = every owned store)
  const [shopScope, setShopScope] = useState('all');

  // DB Sync indicators for badge updates
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);

  // Initialize localStorage seed database on load
  useEffect(() => {
    initDatabase();
    
    // Check deep linking for AR
    const params = new URLSearchParams(window.location.search);
    const ar = params.get('ar');
    if (ar === '1') setMode('ar');
    if (ar) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ar');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Update dynamic badges on DB updates
  useEffect(() => {
    setFavoritesCount(getDbFavorites().length);
    // Only count new leads for the stores this owner manages, within the active scope.
    const scopedIds = resolveScopeShopIds(shopScope);
    setNewLeadsCount(getLeadsForShopIds(scopedIds).filter((l) => l.status === 'new').length);
  }, [dbUpdateTrigger, page, role, shopScope]);

  // Scroll back to top whenever the user navigates to a new page.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, role]);

  const triggerDbUpdate = () => {
    setDbUpdateTrigger((prev) => prev + 1);
  };

  const handleTryOn = (watchId) => {
    setSelectedWatchId(watchId);
    setMode(detectMobile() ? 'ar' : 'qr');
  };

  const tryOnUrl = (() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('ar', '1');
    return url.toString();
  })();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Set default page for the chosen role
    if (newRole === 'user') setPage('home');
    if (newRole === 'shop') setPage('dashboard');
    if (newRole === 'admin') setPage('dashboard');
    setSelectedWatchId('chrono');
    setEditWatchId(null);
  };

  // Rendering based on Role & Page
  const renderUserPages = () => {
    switch (page) {
      case 'home':
        return (
          <UserHome
            onNavigate={(p) => setPage(p)}
            onSelectWatch={(id) => {
              setSelectedWatchId(id);
              setPage('detail');
            }}
            onOpenAR={handleTryOn}
          />
        );
      case 'catalog':
        return (
          <UserCatalog
            onSelectWatch={(id) => {
              setSelectedWatchId(id);
              setPage('detail');
            }}
            onOpenAR={handleTryOn}
          />
        );
      case 'stores':
        return (
          <UserStores
            initialShopId={selectedShopId}
            onNavigate={(p) => setPage(p)}
            onSelectWatch={(id) => {
              setSelectedWatchId(id);
              setPage('detail');
            }}
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
            onSelectShop={(shopId) => {
              setSelectedShopId(shopId);
              setPage('stores');
            }}
          />
        );
      case 'pricing':
        return <UserPricing onBackToCatalog={() => setPage('catalog')} />;
      case 'feedback':
        return <UserFeedback onBackToCatalog={() => setPage('catalog')} />;
      case 'favorites':
        return (
          <UserFavorites
            onSelectWatch={(id) => {
              setSelectedWatchId(id);
              setPage('detail');
            }}
            onOpenAR={handleTryOn}
            onBackToCatalog={() => setPage('catalog')}
            onChanged={triggerDbUpdate}
          />
        );
      case 'account':
        return (
          <UserAccount
            onSelectWatch={(id) => {
              setSelectedWatchId(id);
              setPage('detail');
            }}
            onBackToCatalog={() => setPage('catalog')}
          />
        );
      default:
        return <UserCatalog onSelectWatch={(id) => { setSelectedWatchId(id); setPage('detail'); }} onOpenAR={handleTryOn} />;
    }
  };

  const renderShopPages = () => {
    switch (page) {
      case 'dashboard':
        return (
          <ShopDashboard
            shopScope={shopScope}
            onNavigateToLeads={() => setPage('leads')}
            onNavigateToProducts={() => setPage('products')}
          />
        );
      case 'products':
        return (
          <ShopProducts
            shopScope={shopScope}
            onEditProduct={(id) => {
              setEditWatchId(id);
              setPage('add-product');
            }}
            onNavigateToAddProduct={() => {
              setEditWatchId(null);
              setPage('add-product');
            }}
          />
        );
      case 'add-product':
        return (
          <ShopAddProduct
            editWatchId={editWatchId}
            shopScope={shopScope}
            onSuccess={() => {
              setEditWatchId(null);
              setPage('products');
              triggerDbUpdate();
            }}
            onCancel={() => {
              setEditWatchId(null);
              setPage('products');
            }}
          />
        );
      case 'leads':
        return <ShopLeads shopScope={shopScope} onStatusUpdated={triggerDbUpdate} />;
      case 'analytics':
        return <ShopAnalytics shopScope={shopScope} />;
      case 'settings':
        return <ShopSettings />;
      default:
        return <ShopDashboard onNavigateToLeads={() => setPage('leads')} onNavigateToProducts={() => setPage('products')} />;
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
        return <AdminDashboard onNavigateToShops={() => setPage('shops')} onNavigateToAudit={() => setPage('audit')} />;
    }
  };

  return (
    <div className="h-full bg-[#F6F4EF] text-[#17140F] select-none font-sans overflow-x-hidden">
      {/* 1. Client-Side User Flow */}
      {role === 'user' && (
        <div className="flex flex-col min-h-screen">
          <UserHeader
            currentPage={page}
            onChangePage={(p) => {
              setSelectedShopId(null);
              setPage(p);
            }}
            favoritesCount={favoritesCount}
          />
          <main className="flex-1">{renderUserPages()}</main>
          <UserFooter
            onChangePage={(p) => {
              setSelectedShopId(null);
              setPage(p);
            }}
          />
        </div>
      )}

      {/* 2. Shop/Seller Flow */}
      {role === 'shop' && (
        <div className="flex min-h-screen">
          <ShopSidebar
            currentPage={page}
            onChangePage={(p) => setPage(p)}
            newLeadsCount={newLeadsCount}
            shopScope={shopScope}
            onChangeScope={(s) => setShopScope(s)}
          />
          <main className="flex-1 h-screen overflow-y-auto flex">{renderShopPages()}</main>
        </div>
      )}

      {/* 3. System Administrator Flow */}
      {role === 'admin' && (
        <div className="flex min-h-screen">
          <AdminSidebar
            currentPage={page}
            onChangePage={(p) => setPage(p)}
            pendingAuditsCount={1}
          />
          <main className="flex-1 h-screen overflow-y-auto flex">{renderAdminPages()}</main>
        </div>
      )}

      {/* 4. Shared floating Role Switcher */}
      <RoleSwitcher currentRole={role} onChangeRole={handleRoleChange} />

      {/* 5. AR / QR Overlay triggers */}
      {mode === 'qr' && (
        <QRTryOnModal
          tryOnUrl={tryOnUrl}
          watchName={selectedWatchId} // wait, QRTryOnModal takes a watchName string.
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
            onOpenContact={() => {
              setMode('none');
              const shop = getShopForWatch(selectedWatchId);
              setSelectedShopId(shop?.id || null);
              setPage('stores');
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
