package com.truewrist.backend.config;

import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.ShopSubscriptionRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.repository.WatchRepository;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the storefront demo dataset on first run (shops, watches with images/gallery/ratings,
 * users with BCrypt passwords, sample leads/feedback/favourites). Skipped when
 * {@code app.seed.enabled=false} or the DB already has users.
 *
 * Demo accounts: admin@watch.vn / admin123, aventus@watch.vn / shop123 (shop-1),
 * poly@watch.vn / shop123 (shop-2), khach@watch.vn / khach123 (customer).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AppProperties props;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final WatchRepository watchRepository;
    private final ShopSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            AppProperties props,
            UserRepository userRepository,
            ShopRepository shopRepository,
            WatchRepository watchRepository,
            ShopSubscriptionRepository subscriptionRepository,
            PasswordEncoder passwordEncoder) {
        this.props = props;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.watchRepository = watchRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Idempotent migration: link shops created before ownerId existed.
        backfillShopOwnership();
        ensureAventusMonthlySubscription();

        if (!props.seed().enabled()) {
            return;
        }
        if (userRepository.count() > 0) {
            log.info("Seed skipped: data already present.");
            return;
        }
        log.info("Seeding storefront demo data...");

        seedShops();
        seedUsers();
        seedWatches();
        ensureAventusMonthlySubscription();

        log.info("Seed complete: {} users, {} shops, {} watches.",
                userRepository.count(), shopRepository.count(), watchRepository.count());
    }

    /**
     * Backfill {@code Shop.ownerId} for shops created before the field existed,
     * so the seller's "my shops" list shows all of them. Runs every boot and is
     * a no-op once ownership is set.
     */
    private void backfillShopOwnership() {
        boolean[] changed = {false};
        // Each user's currently-active shop belongs to that user.
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
        // Recover the seeded shop's original owner if switching active orphaned it.
        shopRepository.findById("shop-1").ifPresent(s -> {
            if (s.getOwnerId() == null && userRepository.existsById("u-shop-aventus")) {
                s.setOwnerId("u-shop-aventus");
                shopRepository.save(s);
                changed[0] = true;
            }
        });
        if (changed[0]) {
            log.info("Backfilled shop ownerId for legacy shops.");
        }
    }

    /**
     * The seeded seller account represents the paid monthly package in demos.
     * Keep it on the 30-day Essential plan instead of letting /api/subscription
     * lazily create a trial subscription.
     */
    private void ensureAventusMonthlySubscription() {
        userRepository.findById("u-shop-aventus").ifPresent(user -> {
            long now = System.currentTimeMillis();
            long expiresAt = now + Duration.ofDays(SubscriptionPlan.ESSENTIAL.getDurationDays()).toMillis();
            ShopSubscription subscription = subscriptionRepository.findByUserId(user.getId())
                    .orElseGet(() -> ShopSubscription.builder()
                            .id("sub-aventus-monthly")
                            .userId(user.getId())
                            .build());

            subscription.setPlan(SubscriptionPlan.ESSENTIAL);
            subscription.setRegisteredAt(now);
            subscription.setExpiresAt(expiresAt);
            subscription.setUpdatedAt(now);
            subscription.setAutoRenew(false);
            subscriptionRepository.save(subscription);
        });
    }

    private void seedShops() {
        shopRepository.save(Shop.builder()
                .id("shop-1").ownerId("u-shop-aventus").name("Aventus Luxury Watches")
                .phone("0901 234 567").email("sales@aventus.luxury")
                .address("Quận 1, TP. Hồ Chí Minh")
                .description("Cửa hàng chuyên đồng hồ cơ Thụy Sĩ chính hãng. Hỗ trợ thử AR trực tuyến, giao toàn quốc và bảo hành 5 năm.")
                .color("#C9A84C")
                .zalo("https://zalo.me/0901234567").messenger("https://m.me/aventus.luxury")
                .hours("09:00 - 21:30 · cả tuần").manager("Henry Nguyễn")
                .image("https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1200")
                .mapUrl("https://www.google.com/maps/search/?api=1&query=Quận+1,+TP.+Hồ+Chí+Minh")
                .services(List.of(
                        "Đại lý uỷ quyền Rolex & Omega",
                        "Hỗ trợ thử AR & tư vấn online",
                        "Bảo hành chính hãng 5 năm",
                        "Thu mua, ký gửi có thẩm định"))
                .rating(4.9).reviewCount(326).since("2019")
                .status(ListingStatus.ACTIVE).createdAt(1714500100000L).build());
    }

    private void seedUsers() {
        userRepository.save(User.builder()
                .id("u-admin").name("Quản trị viên").email("admin@watch.vn")
                .passwordHash(passwordEncoder.encode("admin123")).role(Role.ADMIN)
                .status(UserStatus.ACTIVE).provider(AuthProvider.LOCAL)
                .createdAt(1714500000000L).build());
        userRepository.save(User.builder()
                .id("u-shop-aventus").name("Aventus Luxury Watches").email("aventus@watch.vn")
                .passwordHash(passwordEncoder.encode("shop123")).role(Role.SHOP).shopId("shop-1")
                .status(UserStatus.ACTIVE).provider(AuthProvider.LOCAL)
                .createdAt(1714500100000L).build());
        userRepository.save(User.builder()
                .id("u-customer").name("Khách Demo").email("khach@watch.vn")
                .passwordHash(passwordEncoder.encode("khach123")).role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE).provider(AuthProvider.LOCAL)
                .createdAt(1714500400000L).build());
    }

    private void seedWatches() {
        // Single sample AR watch — the only model wired for the AR try-on demo.
        watchRepository.save(Watch.builder()
                .id("chrono").name("Chronograph Surgical White 42mm").brand("Aventus")
                .price(48_900_000L).originalPrice(56_000_000L)
                .description("Phiên bản giới hạn Surgical White — vỏ và dây ceramic trắng tinh khôi, mặt số ba kim đếm giờ phụ, sapphire phủ AR coating. Máy chronograph Thụy Sĩ Sellita SW500, hoàn thiện tay thủ công đẳng cấp haute horlogerie.")
                .specs(specs(
                        "Đường kính mặt", "42 mm",
                        "Độ dày vỏ", "13.2 mm",
                        "Chất liệu vỏ", "Ceramic trắng cao cấp",
                        "Chất liệu dây", "Ceramic kết hợp Thép 316L",
                        "Chất liệu kính", "Sapphire phủ chống chói AR",
                        "Bộ máy", "Sellita SW500 Automatic (Thụy Sĩ)",
                        "Chống nước", "200 m (20 ATM)",
                        "Bảo hành", "5 năm chính hãng"))
                .image("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900")
                .gallery(List.of(
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900",
                        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=900",
                        "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=900"))
                .modelUrl("/models/chronograph_watch.glb").hasAR(true).arWatchId("chrono")
                .metal("#f3f4f6").dial("#ffffff").accent("#B8924A")
                .rating(4.9).reviewCount(18).status(ListingStatus.ACTIVE)
                .shopId("shop-1").createdAt(1714500500000L).build());
    }

    /** Builds an ordered spec map from alternating key/value varargs. */
    private static Map<String, String> specs(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            m.put(kv[i], kv[i + 1]);
        }
        return m;
    }
}
