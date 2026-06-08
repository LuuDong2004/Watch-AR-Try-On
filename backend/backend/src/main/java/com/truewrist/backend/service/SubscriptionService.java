package com.truewrist.backend.service;

import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.dto.SubscriptionDtos.AdminPlanOverview;
import com.truewrist.backend.dto.SubscriptionDtos.AdminSubscriberRow;
import com.truewrist.backend.dto.SubscriptionDtos.PlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.exception.ApiException;
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
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionService {

    private final ShopSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    public SubscriptionService(
            ShopSubscriptionRepository subscriptionRepository,
            SubscriptionPlanRepository planRepository,
            UserRepository userRepository,
            ShopRepository shopRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
    }

    // --- Seller-facing -------------------------------------------------------

    @Transactional
    public SubscriptionResponse getFor(AppUserPrincipal actor) {
        long now = System.currentTimeMillis();
        ShopSubscription subscription = subscriptionRepository.findByUserId(actor.getId())
                .orElseGet(() -> createTrial(actor.getId(), now));
        return buildResponse(subscription, now);
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
