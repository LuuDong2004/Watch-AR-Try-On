package com.truewrist.backend.service;

import com.truewrist.backend.domain.ArReviewStatus;
import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.WatchDtos.WatchRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.FavoriteRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchService {

    private final WatchRepository watchRepository;
    private final ShopRepository shopRepository;
    private final FavoriteRepository favoriteRepository;
    private final StorageService storageService;

    public WatchService(
            WatchRepository watchRepository,
            ShopRepository shopRepository,
            FavoriteRepository favoriteRepository,
            StorageService storageService) {
        this.watchRepository = watchRepository;
        this.shopRepository = shopRepository;
        this.favoriteRepository = favoriteRepository;
        this.storageService = storageService;
    }

    public List<Watch> findAll(String shopId) {
        List<Watch> watches = shopId == null ? watchRepository.findAll()
                : watchRepository.findByShopId(shopId);
        watches.sort(Comparator.comparingLong(Watch::getCreatedAt).reversed());
        return watches;
    }

    public Watch findById(String id) {
        return watchRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy đồng hồ."));
    }

    /** AR-enabled watches for the admin moderation queue (pending first). */
    public List<Watch> findArModels() {
        List<Watch> watches = new ArrayList<>(watchRepository.findAll().stream()
                .filter(Watch::isHasAR)
                .toList());
        watches.sort(Comparator
                .comparingInt((Watch w) -> effectiveStatus(w) == ArReviewStatus.PENDING ? 0 : 1)
                .thenComparing(Comparator.comparingLong(Watch::getCreatedAt).reversed()));
        return watches;
    }

    /** Admin approves/rejects a watch's AR model. */
    @Transactional
    public Watch reviewAr(String id, ArReviewStatus status, String note) {
        Watch watch = findById(id);
        if (!watch.isHasAR()) {
            throw ApiException.badRequest("Đồng hồ này chưa bật AR nên không cần kiểm duyệt.");
        }
        watch.setArReviewStatus(status);
        watch.setArReviewNote(status == ArReviewStatus.REJECTED ? note : null);
        return watchRepository.save(watch);
    }

    private static ArReviewStatus effectiveStatus(Watch w) {
        return w.getArReviewStatus() == null ? ArReviewStatus.PENDING : w.getArReviewStatus();
    }

    @Transactional
    public Watch create(WatchRequest req, AppUserPrincipal actor) {
        String shopId = resolveShopId(req.shopId(), actor);
        List<String> gallery = resolveGallery(req.image(), req.galleryOrEmpty());
        if (!shopRepository.existsById(shopId)) {
            throw ApiException.badRequest("Cửa hàng không tồn tại.");
        }
        Watch watch = Watch.builder()
                .id(Ids.generate("w"))
                .name(req.name())
                .brand(req.brand())
                .price(req.price())
                .originalPrice(req.originalPrice())
                .description(req.description())
                .specs(req.specsOrEmpty())
                .image(req.image())
                .gallery(gallery)
                .modelUrl(req.modelUrl())
                .hasAR(req.hasArOrDefault())
                .arWatchId(req.arWatchId())
                .variant(req.variant())
                .metal(req.metal())
                .dial(req.dial())
                .accent(req.accent())
                .rating(req.ratingOrZero())
                .reviewCount(req.reviewCountOrZero())
                .status(req.statusOrActive())
                .shopId(shopId)
                .createdAt(System.currentTimeMillis())
                .build();
        return watchRepository.save(watch);
    }

    @Transactional
    public Watch update(String id, WatchRequest req, AppUserPrincipal actor) {
        Watch watch = findById(id);
        assertCanManage(watch.getShopId(), actor);
        Set<String> oldAssets = assetUrls(watch);
        boolean oldHasAr = watch.isHasAR();
        String oldModelUrl = watch.getModelUrl();
        List<String> gallery = resolveGallery(req.image(), req.galleryOrEmpty());
        watch.setName(req.name());
        watch.setBrand(req.brand());
        watch.setPrice(req.price());
        watch.setOriginalPrice(req.originalPrice());
        watch.setDescription(req.description());
        watch.setSpecs(req.specsOrEmpty());
        watch.setImage(req.image());
        watch.setGallery(gallery);
        watch.setModelUrl(req.modelUrl());
        watch.setHasAR(req.hasArOrDefault());
        watch.setArWatchId(req.arWatchId());
        watch.setVariant(req.variant());
        watch.setMetal(req.metal());
        watch.setDial(req.dial());
        watch.setAccent(req.accent());
        watch.setRating(req.ratingOrZero());
        watch.setReviewCount(req.reviewCountOrZero());
        watch.setStatus(req.statusOrActive());
        // A new/changed AR model must be re-moderated before it goes public again.
        boolean newHasAr = req.hasArOrDefault();
        if (newHasAr && (!oldHasAr || !Objects.equals(oldModelUrl, req.modelUrl()))) {
            watch.setArReviewStatus(ArReviewStatus.PENDING);
            watch.setArReviewNote(null);
        }
        // shopId is not reassignable here; admins move stock by recreating it.
        Watch saved = watchRepository.save(watch);
        oldAssets.removeAll(assetUrls(saved));
        deleteUnreferencedAssetUrls(oldAssets, null);
        return saved;
    }

    private List<String> resolveGallery(String mainImage, List<String> gallery) {
        LinkedHashSet<String> images = new LinkedHashSet<>();
        if (mainImage != null && !mainImage.isBlank()) {
            images.add(mainImage);
        }
        gallery.stream()
                .filter(image -> image != null && !image.isBlank())
                .forEach(images::add);
        if (images.size() > 10) {
            throw ApiException.badRequest("Mỗi sản phẩm chỉ được có tối đa 10 ảnh.");
        }
        return new ArrayList<>(images);
    }

    @Transactional
    public void delete(String id, AppUserPrincipal actor) {
        Watch watch = findById(id);
        assertCanManage(watch.getShopId(), actor);
        Set<String> assets = assetUrls(watch);
        favoriteRepository.deleteByWatchId(id);
        watchRepository.delete(watch);
        deleteUnreferencedAssetUrls(assets, id);
    }

    private Set<String> assetUrls(Watch watch) {
        LinkedHashSet<String> urls = new LinkedHashSet<>();
        addAssetUrl(urls, watch.getImage());
        if (watch.getGallery() != null) {
            watch.getGallery().forEach(url -> addAssetUrl(urls, url));
        }
        addAssetUrl(urls, watch.getModelUrl());
        return urls;
    }

    private void addAssetUrl(Set<String> urls, String url) {
        if (url != null && !url.isBlank() && storageService.isStoredUrl(url)) {
            urls.add(url);
        }
    }

    private void deleteUnreferencedAssetUrls(Set<String> urls, String excludedWatchId) {
        if (urls.isEmpty()) {
            return;
        }

        Set<String> stillReferenced = new LinkedHashSet<>();
        for (Watch other : watchRepository.findAll()) {
            if (excludedWatchId != null && excludedWatchId.equals(other.getId())) {
                continue;
            }
            stillReferenced.addAll(assetUrls(other));
        }

        urls.stream()
                .filter(url -> !stillReferenced.contains(url))
                .forEach(storageService::deleteByUrl);
    }

    /** Admins target any shop; sellers target any shop they own. */
    private String resolveShopId(String requestedShopId, AppUserPrincipal actor) {
        if (isAdmin(actor)) {
            if (requestedShopId == null || requestedShopId.isBlank()) {
                throw ApiException.badRequest("Vui lòng chọn cửa hàng.");
            }
            return requestedShopId;
        }

        String shopId = requestedShopId == null || requestedShopId.isBlank()
                ? actor.getShopId()
                : requestedShopId;
        if (shopId == null) {
            throw ApiException.forbidden("Tài khoản chưa được gán cửa hàng.");
        }
        assertCanManage(shopId, actor);
        return shopId;
    }

    private void assertCanManage(String watchShopId, AppUserPrincipal actor) {
        if (isAdmin(actor)) {
            return;
        }

        Shop shop = shopRepository.findById(watchShopId).orElse(null);
        boolean ownsShop = shop != null
                && (watchShopId.equals(actor.getShopId()) || actor.getId().equals(shop.getOwnerId()));
        if (!ownsShop) {
            throw ApiException.forbidden("Bạn chỉ có thể quản lý đồng hồ của cửa hàng mình.");
        }
        // A locked shop is frozen: the owner cannot add/edit/remove its products.
        if (shop.getStatus() == ListingStatus.LOCKED) {
            throw ApiException.forbidden(
                    "Cửa hàng đang bị khóa nên không thể thao tác sản phẩm. Vui lòng liên hệ quản trị viên.");
        }
    }

    private boolean isAdmin(AppUserPrincipal actor) {
        return AuthorityUtils.authorityListToSet(actor.getAuthorities()).contains("ROLE_ADMIN");
    }
}
