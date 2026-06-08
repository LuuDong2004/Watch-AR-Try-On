import type { Shop, Watch } from '../api';

export const isPublicShop = (shop: Shop) => shop.status !== 'locked';

export const isPublicWatch = (watch: Watch) => watch.status !== 'locked';

/** AR try-on is offered publicly only when the model is flagged AR-capable AND
 *  an admin has approved its 3D model in the Kiểm Duyệt 3D screen. */
export const canTryAr = (watch: Watch) => !!watch.hasAR && watch.arReviewStatus === 'approved';

export function publicShopIds(shops: Shop[]) {
  return new Set(shops.filter(isPublicShop).map((shop) => shop.id));
}

export function publicWatches(watches: Watch[], shops: Shop[]) {
  const shopIds = publicShopIds(shops);
  return watches.filter((watch) => isPublicWatch(watch) && shopIds.has(watch.shopId));
}
