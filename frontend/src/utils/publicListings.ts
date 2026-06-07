import type { Shop, Watch } from '../api';

export const isPublicShop = (shop: Shop) => shop.status !== 'archived';

export const isPublicWatch = (watch: Watch) => watch.status !== 'archived';

export function publicShopIds(shops: Shop[]) {
  return new Set(shops.filter(isPublicShop).map((shop) => shop.id));
}

export function publicWatches(watches: Watch[], shops: Shop[]) {
  const shopIds = publicShopIds(shops);
  return watches.filter((watch) => isPublicWatch(watch) && shopIds.has(watch.shopId));
}
