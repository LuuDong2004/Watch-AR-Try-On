package com.truewrist.backend.service;

import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.WatchDtos.WatchRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.FavoriteRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchService {

    private final WatchRepository watchRepository;
    private final ShopRepository shopRepository;
    private final FavoriteRepository favoriteRepository;

    public WatchService(
            WatchRepository watchRepository,
            ShopRepository shopRepository,
            FavoriteRepository favoriteRepository) {
        this.watchRepository = watchRepository;
        this.shopRepository = shopRepository;
        this.favoriteRepository = favoriteRepository;
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

    @Transactional
    public Watch create(WatchRequest req, AppUserPrincipal actor) {
        String shopId = resolveShopId(req.shopId(), actor);
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
                .gallery(req.galleryOrEmpty())
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
        watch.setName(req.name());
        watch.setBrand(req.brand());
        watch.setPrice(req.price());
        watch.setOriginalPrice(req.originalPrice());
        watch.setDescription(req.description());
        watch.setSpecs(req.specsOrEmpty());
        watch.setImage(req.image());
        watch.setGallery(req.galleryOrEmpty());
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
        // shopId is not reassignable here; admins move stock by recreating it.
        return watchRepository.save(watch);
    }

    @Transactional
    public void delete(String id, AppUserPrincipal actor) {
        Watch watch = findById(id);
        assertCanManage(watch.getShopId(), actor);
        favoriteRepository.deleteByWatchId(id);
        watchRepository.delete(watch);
    }

    /** A shop owner always operates on their own shop; an admin must pass a shopId. */
    private String resolveShopId(String requestedShopId, AppUserPrincipal actor) {
        if (isAdmin(actor)) {
            if (requestedShopId == null || requestedShopId.isBlank()) {
                throw ApiException.badRequest("Vui lòng chọn cửa hàng.");
            }
            return requestedShopId;
        }
        if (actor.getShopId() == null) {
            throw ApiException.forbidden("Tài khoản chưa được gán cửa hàng.");
        }
        return actor.getShopId();
    }

    private void assertCanManage(String watchShopId, AppUserPrincipal actor) {
        if (isAdmin(actor)) {
            return;
        }
        if (!watchShopId.equals(actor.getShopId())) {
            throw ApiException.forbidden("Bạn chỉ có thể quản lý đồng hồ của cửa hàng mình.");
        }
    }

    private boolean isAdmin(AppUserPrincipal actor) {
        return AuthorityUtils.authorityListToSet(actor.getAuthorities()).contains("ROLE_ADMIN");
    }
}
