package com.truewrist.backend.service;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.PlanUpgradeRequest;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.UpgradeRequestStatus;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.dto.SubscriptionDtos.AdminPlanOverview;
import com.truewrist.backend.dto.SubscriptionDtos.AdminSubscriberRow;
import com.truewrist.backend.dto.SubscriptionDtos.PlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.PlanResponse;
import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.dto.SubscriptionDtos.UpgradeRequestResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.PlanUpgradeRequestRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.ShopSubscriptionRepository;
import com.truewrist.backend.repository.ShopSubscriptionRepository.PlanSubscriberCount;
import com.truewrist.backend.repository.SubscriptionPlanRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private static final long DAY_MILLIS = 86_400_000L;
    /** Days after a paid plan expires before the seller's shops are auto-locked. */
    private static final long GRACE_DAYS_BEFORE_LOCK = 3;
    /** Days after expiry before the account is downgraded from SHOP to CUSTOMER. */
    private static final long DAYS_BEFORE_DOWNGRADE = 7;
    /** Marker lock reason so expiry-locks can be auto-reverted on renewal. */
    private static final String EXPIRY_LOCK_REASON =
            "Gói dịch vụ đã hết hạn. Cửa hàng tạm khóa cho đến khi gia hạn.";

    private final ShopSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final PlanUpgradeRequestRepository upgradeRequestRepository;

    public SubscriptionService(
            ShopSubscriptionRepository subscriptionRepository,
            SubscriptionPlanRepository planRepository,
            UserRepository userRepository,
            ShopRepository shopRepository,
            PlanUpgradeRequestRepository upgradeRequestRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.upgradeRequestRepository = upgradeRequestRepository;
    }

    // --- Seller-facing -------------------------------------------------------

    @Transactional
    public SubscriptionResponse getFor(AppUserPrincipal actor) {
        long now = System.currentTimeMillis();
        ShopSubscription subscription = subscriptionRepository.findByUserId(actor.getId())
                .orElseGet(() -> createTrial(actor.getId(), now));
        return buildResponse(subscription, now);
    }

    /**
     * The plan currently in effect for a user's shop quota. Throws if the paid
     * subscription has lapsed, so an expired seller must renew before adding more
     * shops. Falls back to the trial plan's limit when no subscription exists yet.
     */
    @Transactional(readOnly = true)
    public SubscriptionPlan activePlanForShopQuota(String userId) {
        ShopSubscription subscription = subscriptionRepository.findByUserId(userId).orElse(null);
        if (subscription == null) {
            return trialPlan();
        }
        if (subscription.getExpiresAt() <= System.currentTimeMillis()) {
            throw ApiException.forbidden(
                    "Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tạo thêm cửa hàng.");
        }
        return planRepository.findById(subscription.getPlanCode()).orElseGet(this::trialPlan);
    }

    @Transactional
    public SubscriptionResponse upgrade(AppUserPrincipal actor, String targetCode) {
        SubscriptionPlan target = planRepository.findById(targetCode)
                .orElseThrow(() -> ApiException.badRequest("Gói dịch vụ không tồn tại."));
        if (target.isTrial()) {
            throw ApiException.badRequest("Không thể chuyển về gói dùng thử.");
        }

        long now = System.currentTimeMillis();
        ShopSubscription subscription = subscriptionRepository.findByUserId(actor.getId())
                .orElseGet(() -> createTrial(actor.getId(), now));
        boolean active = subscription.getExpiresAt() > now;
        SubscriptionPlan current = planRepository.findById(subscription.getPlanCode()).orElse(null);

        if (active && current != null && target.getSortOrder() < current.getSortOrder()) {
            throw ApiException.badRequest("Không thể hạ cấp khi gói hiện tại vẫn còn hiệu lực.");
        }

        boolean renewal = active && target.getCode().equals(subscription.getPlanCode());
        long expiryBase = renewal ? subscription.getExpiresAt() : now;
        long expiresAt = expiryBase + Duration.ofDays(target.getDurationDays()).toMillis();

        subscription.setPlanCode(target.getCode());
        subscription.setRegisteredAt(now);
        subscription.setExpiresAt(expiresAt);
        subscription.setUpdatedAt(now);
        subscription.setAutoRenew(false);
        return buildResponse(subscriptionRepository.save(subscription), now);
    }

    // --- Plan upgrade requests (manual approval flow) -----------------------

    /** Non-trial plans a user can request, for the customer-facing pricing page. */
    @Transactional(readOnly = true)
    public List<PlanResponse> selectablePlans() {
        return planRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(plan -> !plan.isTrial())
                .map(PlanResponse::from)
                .toList();
    }

    /**
     * A user requests to move onto a paid plan. There is no payment gateway yet,
     * so this only queues the request; an admin approval applies it and grants the
     * SHOP role. Blocks a second request while one is still pending.
     */
    @Transactional
    public UpgradeRequestResponse requestUpgrade(AppUserPrincipal actor, String targetCode) {
        SubscriptionPlan target = planRepository.findById(targetCode)
                .orElseThrow(() -> ApiException.badRequest("Gói dịch vụ không tồn tại."));
        if (target.isTrial()) {
            throw ApiException.badRequest("Không thể yêu cầu gói dùng thử.");
        }
        upgradeRequestRepository.findFirstByUserIdAndStatus(actor.getId(), UpgradeRequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw ApiException.conflict("Bạn đang có một yêu cầu nâng cấp chờ duyệt.");
                });

        long now = System.currentTimeMillis();

        // While the current plan is still active, only allow upgrading to a HIGHER
        // tier — the same plan or any lower plan is blocked until it expires.
        subscriptionRepository.findByUserId(actor.getId()).ifPresent(sub -> {
            if (sub.getExpiresAt() <= now) {
                return; // expired → any plan may be requested
            }
            SubscriptionPlan current = planRepository.findById(sub.getPlanCode()).orElse(null);
            if (current != null && target.getSortOrder() <= current.getSortOrder()) {
                throw ApiException.badRequest(
                        "Gói \"" + current.getName() + "\" của bạn vẫn còn hiệu lực. "
                        + "Bạn chỉ có thể nâng lên gói cao hơn cho đến khi gói hiện tại hết hạn.");
            }
        });
        PlanUpgradeRequest request = PlanUpgradeRequest.builder()
                .id(Ids.generate("upreq"))
                .userId(actor.getId())
                .planCode(target.getCode())
                .status(UpgradeRequestStatus.PENDING)
                .createdAt(now)
                .build();
        upgradeRequestRepository.save(request);

        User user = userRepository.findById(actor.getId()).orElse(null);
        return UpgradeRequestResponse.of(
                request,
                user == null ? null : user.getName(),
                user == null ? null : user.getEmail(),
                target);
    }

    /** The signed-in user's own upgrade requests (latest first). */
    @Transactional(readOnly = true)
    public List<UpgradeRequestResponse> myRequests(AppUserPrincipal actor) {
        Map<String, SubscriptionPlan> byCode = planByCode();
        User user = userRepository.findById(actor.getId()).orElse(null);
        return upgradeRequestRepository.findByUserIdOrderByCreatedAtDesc(actor.getId()).stream()
                .map(req -> UpgradeRequestResponse.of(
                        req,
                        user == null ? null : user.getName(),
                        user == null ? null : user.getEmail(),
                        byCode.get(req.getPlanCode())))
                .toList();
    }

    /** Admin: the queue of requests awaiting a decision. */
    @Transactional(readOnly = true)
    public List<UpgradeRequestResponse> adminPendingRequests() {
        Map<String, SubscriptionPlan> byCode = planByCode();
        return upgradeRequestRepository.findByStatusOrderByCreatedAtAsc(UpgradeRequestStatus.PENDING).stream()
                .map(req -> {
                    User user = userRepository.findById(req.getUserId()).orElse(null);
                    return UpgradeRequestResponse.of(
                            req,
                            user == null ? null : user.getName(),
                            user == null ? null : user.getEmail(),
                            byCode.get(req.getPlanCode()));
                })
                .toList();
    }

    public long pendingRequestCount() {
        return upgradeRequestRepository.countByStatus(UpgradeRequestStatus.PENDING);
    }

    /**
     * Admin approves a request: apply the requested plan to the user's
     * subscription and grant the SHOP role ("lên quyền").
     */
    @Transactional
    public UpgradeRequestResponse approveRequest(AppUserPrincipal admin, String requestId) {
        PlanUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu nâng cấp."));
        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw ApiException.badRequest("Yêu cầu này đã được xử lý.");
        }
        SubscriptionPlan plan = planRepository.findById(request.getPlanCode())
                .orElseThrow(() -> ApiException.badRequest("Gói dịch vụ không còn tồn tại."));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng."));

        // Grant selling permission, apply the plan, and revive any expiry-locked shops.
        user.assignRoles(Set.of(Role.SHOP));
        userRepository.save(user);
        changeSubscriberPlan(user.getId(), plan.getCode());
        unlockExpiryLockedShops(user.getId());

        long now = System.currentTimeMillis();
        request.setStatus(UpgradeRequestStatus.APPROVED);
        request.setDecidedAt(now);
        request.setDecidedBy(admin.getId());
        upgradeRequestRepository.save(request);

        return UpgradeRequestResponse.of(request, user.getName(), user.getEmail(), plan);
    }

    /** Admin rejects a request with an optional reason. */
    @Transactional
    public UpgradeRequestResponse rejectRequest(AppUserPrincipal admin, String requestId, String note) {
        PlanUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu nâng cấp."));
        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw ApiException.badRequest("Yêu cầu này đã được xử lý.");
        }
        long now = System.currentTimeMillis();
        request.setStatus(UpgradeRequestStatus.REJECTED);
        request.setNote(note == null || note.isBlank() ? null : note.trim());
        request.setDecidedAt(now);
        request.setDecidedBy(admin.getId());
        upgradeRequestRepository.save(request);

        User user = userRepository.findById(request.getUserId()).orElse(null);
        SubscriptionPlan plan = planRepository.findById(request.getPlanCode()).orElse(null);
        return UpgradeRequestResponse.of(
                request,
                user == null ? null : user.getName(),
                user == null ? null : user.getEmail(),
                plan);
    }

    private Map<String, SubscriptionPlan> planByCode() {
        return planRepository.findAll().stream()
                .collect(Collectors.toMap(SubscriptionPlan::getCode, p -> p));
    }

    // --- Expiry lifecycle (grace -> lock -> downgrade) ----------------------

    /**
     * Enforce the paid-plan expiry lifecycle. Runs ~hourly (and shortly after
     * boot). For each seller on an expired PAID plan:
     * <ul>
     *   <li>days 0–{@value #GRACE_DAYS_BEFORE_LOCK}: grace — only a renewal notice (handled by the UI);</li>
     *   <li>≥ {@value #GRACE_DAYS_BEFORE_LOCK} days: lock the seller's shops;</li>
     *   <li>≥ {@value #DAYS_BEFORE_DOWNGRADE} days: downgrade the account to CUSTOMER.</li>
     * </ul>
     * Idempotent — safe to run repeatedly.
     */
    @Scheduled(initialDelay = 20_000, fixedDelay = 3_600_000)
    @Transactional
    public void enforceExpiredSubscriptions() {
        long now = System.currentTimeMillis();
        Map<String, SubscriptionPlan> byCode = planByCode();
        int locked = 0;
        int downgraded = 0;

        for (ShopSubscription sub : subscriptionRepository.findAll()) {
            SubscriptionPlan plan = byCode.get(sub.getPlanCode());
            // Only paid plans trigger lock/downgrade; free/trial plans are exempt.
            if (plan == null || plan.getPrice() <= 0 || sub.getExpiresAt() > now) {
                continue;
            }
            User user = userRepository.findById(sub.getUserId()).orElse(null);
            if (user == null || !user.effectiveRoles().contains(Role.SHOP)) {
                continue;
            }
            long daysExpired = (now - sub.getExpiresAt()) / DAY_MILLIS;

            if (daysExpired >= DAYS_BEFORE_DOWNGRADE) {
                Set<Role> remaining = new LinkedHashSet<>(user.effectiveRoles());
                remaining.remove(Role.SHOP);
                if (remaining.isEmpty()) {
                    remaining.add(Role.CUSTOMER);
                }
                user.assignRoles(remaining);
                userRepository.save(user);
                lockOwnerShops(user.getId()); // keep shops hidden while downgraded
                downgraded++;
            } else if (daysExpired >= GRACE_DAYS_BEFORE_LOCK) {
                locked += lockOwnerShops(user.getId());
            }
        }
        if (locked > 0 || downgraded > 0) {
            log.info("Expiry lifecycle: locked {} shop(s), downgraded {} account(s).", locked, downgraded);
        }
    }

    /** Lock all ACTIVE shops owned by the user with the expiry marker. Returns count locked. */
    private int lockOwnerShops(String userId) {
        int count = 0;
        for (Shop shop : shopRepository.findByOwnerId(userId)) {
            if (shop.getStatus() != ListingStatus.LOCKED) {
                shop.setStatus(ListingStatus.LOCKED);
                shop.setLockReason(EXPIRY_LOCK_REASON);
                shopRepository.save(shop);
                count++;
            }
        }
        return count;
    }

    /** Revert only expiry-driven locks (leave admin/manual locks untouched). */
    private void unlockExpiryLockedShops(String userId) {
        for (Shop shop : shopRepository.findByOwnerId(userId)) {
            if (shop.getStatus() == ListingStatus.LOCKED
                    && EXPIRY_LOCK_REASON.equals(shop.getLockReason())) {
                shop.setStatus(ListingStatus.ACTIVE);
                shop.setLockReason(null);
                shopRepository.save(shop);
            }
        }
    }

    // --- Admin: plan catalogue CRUD -----------------------------------------

    @Transactional(readOnly = true)
    public List<AdminPlanOverview> adminOverview() {
        long now = System.currentTimeMillis();
        Map<String, Long> counts = subscriptionRepository.countActiveByPlan(now).stream()
                .collect(Collectors.toMap(
                        PlanSubscriberCount::getPlanCode,
                        PlanSubscriberCount::getTotal,
                        Long::sum));
        return planRepository.findAllByOrderBySortOrderAsc().stream()
                .map(plan -> AdminPlanOverview.of(plan, counts.getOrDefault(plan.getCode(), 0L)))
                .toList();
    }

    @Transactional
    public AdminPlanOverview createPlan(PlanRequest req) {
        validatePlan(req);
        int sortOrder = req.sortOrder() != null ? req.sortOrder() : nextSortOrder();
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .code(Ids.generate("plan"))
                .name(req.name().trim())
                .description(req.description())
                .price(req.price())
                .durationDays(req.durationDays())
                .maxShops(req.maxShops())
                .maxProducts(req.maxProducts())
                .recommended(req.recommended())
                .trial(false)
                .sortOrder(sortOrder)
                .features(new ArrayList<>(req.featuresOrEmpty()))
                .build();
        return AdminPlanOverview.of(planRepository.save(plan), 0L);
    }

    @Transactional
    public AdminPlanOverview updatePlan(String code, PlanRequest req) {
        validatePlan(req);
        SubscriptionPlan plan = planRepository.findById(code)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy gói dịch vụ."));
        // The trial plan must stay free so new sellers are never charged.
        long price = plan.isTrial() ? 0 : req.price();
        plan.setName(req.name().trim());
        plan.setDescription(req.description());
        plan.setPrice(price);
        plan.setDurationDays(req.durationDays());
        plan.setMaxShops(req.maxShops());
        plan.setMaxProducts(req.maxProducts());
        plan.setRecommended(req.recommended());
        if (req.sortOrder() != null) {
            plan.setSortOrder(req.sortOrder());
        }
        plan.getFeatures().clear();
        plan.getFeatures().addAll(req.featuresOrEmpty());
        long now = System.currentTimeMillis();
        long subscribers = subscriptionRepository.countByPlanCodeAndExpiresAtGreaterThan(code, now);
        return AdminPlanOverview.of(planRepository.save(plan), subscribers);
    }

    @Transactional
    public void deletePlan(String code) {
        SubscriptionPlan plan = planRepository.findById(code)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy gói dịch vụ."));
        if (plan.isTrial()) {
            throw ApiException.badRequest("Không thể xóa gói dùng thử mặc định.");
        }
        long now = System.currentTimeMillis();
        long active = subscriptionRepository.countByPlanCodeAndExpiresAtGreaterThan(code, now);
        if (active > 0) {
            throw ApiException.badRequest(
                    "Đang có " + active + " cửa hàng sử dụng gói này. Hãy chuyển họ sang gói khác trước khi xóa.");
        }
        planRepository.delete(plan);
    }

    // --- Admin: paid subscriber management ----------------------------------

    @Transactional(readOnly = true)
    public List<AdminSubscriberRow> adminSubscribers() {
        long now = System.currentTimeMillis();
        Map<String, SubscriptionPlan> byCode = planRepository.findAll().stream()
                .collect(Collectors.toMap(SubscriptionPlan::getCode, p -> p));
        List<AdminSubscriberRow> rows = new ArrayList<>();
        for (ShopSubscription sub : subscriptionRepository.findByExpiresAtGreaterThan(now)) {
            SubscriptionPlan plan = byCode.get(sub.getPlanCode());
            if (plan == null || plan.getPrice() <= 0) {
                continue; // only paid, in-catalogue plans
            }
            User user = userRepository.findById(sub.getUserId()).orElse(null);
            if (user == null) {
                continue;
            }
            String shopId = user.getShopId();
            String shopName = shopId == null ? null
                    : shopRepository.findById(shopId).map(s -> s.getName()).orElse(null);
            rows.add(toRow(sub, plan, user, shopId, shopName, now));
        }
        rows.sort(Comparator.comparingLong(AdminSubscriberRow::expiresAt));
        return rows;
    }

    @Transactional
    public void changeSubscriberPlan(String userId, String planCode) {
        SubscriptionPlan plan = planRepository.findById(planCode)
                .orElseThrow(() -> ApiException.badRequest("Gói dịch vụ không tồn tại."));
        long now = System.currentTimeMillis();
        ShopSubscription sub = subscriptionRepository.findByUserId(userId)
                .orElseGet(() -> createTrial(userId, now));
        sub.setPlanCode(plan.getCode());
        sub.setRegisteredAt(now);
        sub.setExpiresAt(now + Duration.ofDays(plan.getDurationDays()).toMillis());
        sub.setUpdatedAt(now);
        subscriptionRepository.save(sub);
    }

    @Transactional
    public void extendSubscriber(String userId, int days) {
        if (days <= 0) {
            throw ApiException.badRequest("Số ngày gia hạn phải lớn hơn 0.");
        }
        long now = System.currentTimeMillis();
        ShopSubscription sub = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Cửa hàng chưa có gói đăng ký."));
        long base = Math.max(now, sub.getExpiresAt());
        sub.setExpiresAt(base + Duration.ofDays(days).toMillis());
        sub.setUpdatedAt(now);
        subscriptionRepository.save(sub);
    }

    @Transactional
    public void cancelSubscriber(String userId) {
        long now = System.currentTimeMillis();
        ShopSubscription sub = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Cửa hàng chưa có gói đăng ký."));
        // Expire immediately; the seller reverts to no active paid plan.
        sub.setExpiresAt(now - 1);
        sub.setUpdatedAt(now);
        subscriptionRepository.save(sub);
    }

    // --- Helpers -------------------------------------------------------------

    private SubscriptionResponse buildResponse(ShopSubscription subscription, long now) {
        SubscriptionPlan current = planRepository.findById(subscription.getPlanCode())
                .orElseGet(this::trialPlan);
        List<SubscriptionPlan> options = planRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(plan -> !plan.isTrial())
                .toList();
        return SubscriptionResponse.of(subscription, current, options, now);
    }

    private ShopSubscription createTrial(String userId, long now) {
        SubscriptionPlan trial = trialPlan();
        ShopSubscription subscription = ShopSubscription.builder()
                .id(Ids.generate("sub"))
                .userId(userId)
                .planCode(trial.getCode())
                .registeredAt(now)
                .expiresAt(now + Duration.ofDays(trial.getDurationDays()).toMillis())
                .updatedAt(now)
                .autoRenew(false)
                .build();
        return subscriptionRepository.save(subscription);
    }

    private SubscriptionPlan trialPlan() {
        return planRepository.findFirstByTrialTrueOrderBySortOrderAsc()
                .orElseThrow(() -> ApiException.badRequest("Chưa cấu hình gói dùng thử mặc định."));
    }

    private int nextSortOrder() {
        return planRepository.findAll().stream()
                .mapToInt(SubscriptionPlan::getSortOrder)
                .max()
                .orElse(-1) + 1;
    }

    private void validatePlan(PlanRequest req) {
        if (req.durationDays() <= 0) {
            throw ApiException.badRequest("Thời hạn gói phải lớn hơn 0 ngày.");
        }
        if (req.price() < 0) {
            throw ApiException.badRequest("Giá gói không hợp lệ.");
        }
        if (req.maxShops() < -1 || req.maxProducts() < -1) {
            throw ApiException.badRequest("Giới hạn không hợp lệ (-1 = không giới hạn).");
        }
    }

    private AdminSubscriberRow toRow(
            ShopSubscription sub,
            SubscriptionPlan plan,
            User user,
            String shopId,
            String shopName,
            long now) {
        long remainingMillis = Math.max(0, sub.getExpiresAt() - now);
        long daysRemaining = (remainingMillis + 86_399_999L) / 86_400_000L;
        com.truewrist.backend.domain.SubscriptionStatus status = sub.getExpiresAt() > now
                ? com.truewrist.backend.domain.SubscriptionStatus.ACTIVE
                : com.truewrist.backend.domain.SubscriptionStatus.EXPIRED;
        return new AdminSubscriberRow(
                user.getId(),
                user.getName(),
                user.getEmail(),
                shopId,
                shopName,
                plan.getCode(),
                plan.getName(),
                plan.getPrice(),
                status,
                sub.getRegisteredAt(),
                sub.getExpiresAt(),
                daysRemaining);
    }
}
