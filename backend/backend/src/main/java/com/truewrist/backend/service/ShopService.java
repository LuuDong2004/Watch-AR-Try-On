package com.truewrist.backend.service;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.dto.ShopDtos.ShopRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.util.Ids;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final WatchRepository watchRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    public ShopService(
            ShopRepository shopRepository,
            WatchRepository watchRepository,
            UserRepository userRepository,
            SubscriptionService subscriptionService) {
        this.shopRepository = shopRepository;
        this.watchRepository = watchRepository;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
    }

    public List<Shop> findAll() {
        List<Shop> shops = shopRepository.findAll();
        shops.sort(Comparator.comparingLong(Shop::getCreatedAt).reversed());
        return shops;
    }

    public Shop findById(String id) {
        return shopRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy cửa hàng."));
    }

    /** All shops a seller owns (by ownerId), plus their legacy active shop. */
    public List<Shop> findOwnedBy(String ownerId, String activeShopId) {
        java.util.LinkedHashMap<String, Shop> byId = new java.util.LinkedHashMap<>();
        for (Shop s : shopRepository.findByOwnerId(ownerId)) {
            byId.put(s.getId(), s);
        }
        if (activeShopId != null && !byId.containsKey(activeShopId)) {
            shopRepository.findById(activeShopId).ifPresent(s -> byId.put(s.getId(), s));
        }
        List<Shop> owned = new java.util.ArrayList<>(byId.values());
        owned.sort(Comparator.comparingLong(Shop::getCreatedAt).reversed());
        return owned;
    }

    /** Set the user's active shop (the one product screens default to). */
    @Transactional
    public void setActiveShop(String userId, String shopId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setShopId(shopId);
            userRepository.save(u);
        });
    }

    /** True when the user owns the shop (ownerId match, or it's their active shop). */
    public boolean isOwnedBy(String shopId, String userId, String activeShopId) {
        if (shopId.equals(activeShopId)) {
            return true;
        }
        return shopRepository.findById(shopId)
                .map(s -> userId.equals(s.getOwnerId()))
                .orElse(false);
    }

    @Transactional
    public Shop create(ShopRequest req) {
        return create(req, null);
    }

    /**
     * Create a shop. When {@code ownerUserId} is non-null (a shop owner doing
     * self-onboarding) the new shop is linked to that user's {@code shopId}.
     */
    @Transactional
    public Shop create(ShopRequest req, String ownerUserId) {
        // Enforce the seller's subscription shop quota. Admins (ownerUserId == null)
        // create unlinked shops and are exempt. -1 means unlimited.
        if (ownerUserId != null) {
            SubscriptionPlan plan = subscriptionService.activePlanForShopQuota(ownerUserId);
            int max = plan.getMaxShops();
            int current = shopRepository.findByOwnerId(ownerUserId).size();
            if (max != -1 && current >= max) {
                throw ApiException.forbidden(
                        "Gói \"" + plan.getName() + "\" chỉ cho phép tối đa " + max
                                + " cửa hàng (bạn đang có " + current
                                + "). Vui lòng nâng cấp gói để tạo thêm.");
            }
        }
        Shop shop = Shop.builder()
                .id(Ids.generate("s"))
                .ownerId(ownerUserId)
                .name(req.name())
                .phone(req.phone())
                .email(req.email())
                .address(req.address())
                .description(req.description())
                .color(req.color())
                .zalo(req.zalo())
                .messenger(req.messenger())
                .hours(req.hours())
                .manager(req.manager())
                .image(req.image())
                .mapUrl(req.mapUrl())
                .services(req.servicesOrEmpty())
                .since(req.since())
                .status(req.statusOrActive())
                .createdAt(System.currentTimeMillis())
                .build();
        Shop saved = shopRepository.save(shop);
        if (ownerUserId != null) {
            userRepository.findById(ownerUserId).ifPresent(owner -> {
                owner.setShopId(saved.getId());
                userRepository.save(owner);
            });
        }
        return saved;
    }

    @Transactional
    public Shop update(String id, ShopRequest req) {
        Shop shop = findById(id);
        shop.setName(req.name());
        shop.setPhone(req.phone());
        shop.setEmail(req.email());
        shop.setAddress(req.address());
        shop.setDescription(req.description());
        shop.setColor(req.color());
        shop.setZalo(req.zalo());
        shop.setMessenger(req.messenger());
        shop.setHours(req.hours());
        shop.setManager(req.manager());
        shop.setImage(req.image());
        shop.setMapUrl(req.mapUrl());
        shop.setServices(req.servicesOrEmpty());
        shop.setSince(req.since());
        ListingStatus status = req.statusOrActive();
        shop.setStatus(status);
        // Keep the lock reason only while the shop is locked; clear it on unlock.
        shop.setLockReason(status == ListingStatus.LOCKED ? req.lockReason() : null);
        return shopRepository.save(shop);
    }

    /** Cascade like the frontend: drop the shop's watches and unlink its owners. */
    @Transactional
    public void delete(String id) {
        Shop shop = findById(id);
        watchRepository.deleteByShopId(id);
        for (User owner : userRepository.findAll()) {
            if (id.equals(owner.getShopId())) {
                owner.setShopId(null);
                userRepository.save(owner);
            }
        }
        shopRepository.delete(shop);
    }
}
