const USER_PATH_TO_PAGE = {
  home: 'home',
  catalog: 'catalog',
  stores: 'stores',
  pricing: 'pricing',
  feedback: 'feedback',
  favorites: 'favorites',
  account: 'account',
};

const SHOP_PAGES = new Set(['dashboard', 'products', 'leads', 'analytics', 'plans', 'settings']);
const ADMIN_PAGES = new Set(['dashboard', 'shops', 'audit', 'users', 'leads', 'plans', 'settings']);
const ERROR_CODES = new Set([404, 500, 503]);

export function parseAppRoute(pathname) {
  const path = normalizePath(pathname);
  const parts = path === '/' ? [] : path.slice(1).split('/');

  if (parts.length === 0 || parts[0] === 'oauth-callback' || parts[0] === 'reset-password') {
    return { area: 'user', page: 'home' };
  }

  const directErrorCode = Number(parts[0]);
  if (parts.length === 1 && ERROR_CODES.has(directErrorCode)) {
    return { errorStatus: directErrorCode };
  }

  if (parts[0] === 'error') {
    const errorCode = Number(parts[1]);
    return ERROR_CODES.has(errorCode) ? { errorStatus: errorCode } : { errorStatus: 404 };
  }

  if (parts[0] === 'watch' && parts[1]) {
    return { area: 'user', page: 'detail', watchId: decode(parts[1]) };
  }

  if (parts[0] === 'stores' && parts[1]) {
    return { area: 'user', page: 'stores', shopId: decode(parts[1]) };
  }

  if (USER_PATH_TO_PAGE[parts[0]] && parts.length === 1) {
    return { area: 'user', page: USER_PATH_TO_PAGE[parts[0]] };
  }

  if (parts[0] === 'shop' && parts.length === 2 && SHOP_PAGES.has(parts[1])) {
    return { area: 'shop', page: parts[1] };
  }

  if (parts[0] === 'admin' && parts.length === 2 && ADMIN_PAGES.has(parts[1])) {
    return { area: 'admin', page: parts[1] };
  }

  return { errorStatus: 404 };
}

export function routePathForState({ area, page, watchId, shopId }) {
  if (area === 'shop') {
    return `/shop/${SHOP_PAGES.has(page) ? page : 'dashboard'}`;
  }

  if (area === 'admin') {
    return `/admin/${ADMIN_PAGES.has(page) ? page : 'dashboard'}`;
  }

  if (page === 'detail') {
    return `/watch/${encode(watchId || 'chrono')}`;
  }

  if (page === 'stores' && shopId) {
    return `/stores/${encode(shopId)}`;
  }

  const pagePath = Object.entries(USER_PATH_TO_PAGE).find(([, value]) => value === page)?.[0];
  return pagePath && pagePath !== 'home' ? `/${pagePath}` : '/';
}

export function normalizePath(pathname) {
  const path = pathname || '/';
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encode(value) {
  return encodeURIComponent(value);
}
