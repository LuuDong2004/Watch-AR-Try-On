package com.truewrist.backend.config;

import com.truewrist.backend.domain.ArReviewStatus;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.SubscriptionPlanRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.repository.WatchRepository;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Startup bootstrap. Seeds only the <em>required</em> subscription-plan catalogue
 * and runs idempotent data migrations (user_roles, shop ownership, AR review
 * status). No storefront demo data is seeded — production data (admin account,
 * shops, watches) is managed directly via the {@code db_export/} SQL scripts.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final WatchRepository watchRepository;
    private final SubscriptionPlanRepository planRepository;

    public DataSeeder(
            UserRepository userRepository,
            ShopRepository shopRepository,
            WatchRepository watchRepository,
            SubscriptionPlanRepository planRepository) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.watchRepository = watchRepository;
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) {
        // Required config: the plan catalogue must exist for trials/upgrades to work.
        ensureDefaultPlans();
        // Idempotent migrations for rows created before these fields existed.
        backfillUserRoles();
        backfillShopOwnership();
        backfillArReviewStatus();
    }

    /**
     * Backfill the {@code user_roles} table for accounts created before multi-role
     * existed: each user's single legacy {@code role} becomes their initial role
     * set. Runs every boot; a no-op once every account has at least one role row.
     */
    private void backfillUserRoles() {
        boolean[] changed = {false};
        for (User u : userRepository.findAll()) {
            if ((u.getRoles() == null || u.getRoles().isEmpty()) && u.getRole() != null) {
                u.assignRoles(java.util.Set.of(u.getRole()));
                userRepository.save(u);
                changed[0] = true;
            }
        }
        if (changed[0]) {
            log.info("Backfilled user_roles from legacy role column.");
        }
    }

    /**
     * Backfill {@code Shop.ownerId} for shops created before the field existed,
     * so the seller's "my shops" list shows all of them. Runs every boot and is
     * a no-op once ownership is set.
     */
    private void backfillShopOwnership() {
        boolean[] changed = {false};
        for (User u : userRepository.findAll()) {
            if (u.getShopId() == null) {
                continue;
            }
            shopRepository.findById(u.getShopId()).ifPresent(s -> {
                if (s.getOwnerId() == null) {
                    s.setOwnerId(u.getId());
                    shopRepository.save(s);
                    changed[0] = true;
                }
            });
        }
        if (changed[0]) {
            log.info("Backfilled shop ownerId for legacy shops.");
        }
    }

    /**
     * Seed the default plan catalogue (TRIAL / ESSENTIAL / PREMIUM) when empty.
     * Codes are stable so any pre-existing {@code shop_subscriptions.plan} values
     * keep resolving. Admins can edit/extend this catalogue at runtime afterwards.
     */
    private void ensureDefaultPlans() {
        if (planRepository.count() > 0) {
            return;
        }
        log.info("Seeding default subscription plans...");
        planRepository.save(SubscriptionPlan.builder()
                .code("TRIAL").name("Dùng thử")
                .description("Trải nghiệm các tính năng quản lý cửa hàng")
                .price(0).durationDays(14).maxShops(1).maxProducts(10)
                .recommended(false).trial(true).sortOrder(0)
                .features(new ArrayList<>(List.of(
                        "1 cửa hàng",
                        "Tối đa 10 sản phẩm",
                        "Quản lý liên hệ khách hàng",
                        "Trải nghiệm AR cơ bản")))
                .build());
        planRepository.save(SubscriptionPlan.builder()
                .code("ESSENTIAL").name("Gói Tháng")
                .description("Quyền bán hàng 1 tháng cho cửa hàng mới bắt đầu")
                .price(499_000).durationDays(30).maxShops(3).maxProducts(50)
                .recommended(false).trial(false).sortOrder(1)
                .features(new ArrayList<>(List.of(
                        "Tối đa 3 cửa hàng",
                        "Tối đa 50 sản phẩm",
                        "Quản lý liên hệ và lịch hẹn",
                        "Thống kê hoạt động cửa hàng",
                        "Hỗ trợ AR Try-on")))
                .build());
        planRepository.save(SubscriptionPlan.builder()
                .code("PREMIUM").name("Premium")
                .description("Dành cho chuỗi cửa hàng và đại lý")
                .price(4_199_000).durationDays(365).maxShops(50).maxProducts(-1)
                .recommended(true).trial(false).sortOrder(2)
                .features(new ArrayList<>(List.of(
                        "Tối đa 50 cửa hàng",
                        "Sản phẩm không giới hạn",
                        "Toàn bộ tính năng Essential",
                        "Ưu tiên hiển thị sản phẩm",
                        "Hỗ trợ kỹ thuật ưu tiên")))
                .build());
    }

    /**
     * Backfill {@code Watch.arReviewStatus} for watches created before the AR
     * moderation field existed. Null statuses default to PENDING.
     */
    private void backfillArReviewStatus() {
        boolean[] changed = {false};
        for (Watch w : watchRepository.findAll()) {
            if (w.getArReviewStatus() == null) {
                w.setArReviewStatus(ArReviewStatus.PENDING);
                watchRepository.save(w);
                changed[0] = true;
            }
        }
        if (changed[0]) {
            log.info("Backfilled AR review status for legacy watches.");
        }
    }
}
