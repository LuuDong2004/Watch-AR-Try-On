package com.truewrist.backend.dto;

import com.truewrist.backend.domain.PlanUpgradeRequest;
import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.SubscriptionStatus;
import com.truewrist.backend.domain.UpgradeRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;

public final class SubscriptionDtos {

    private SubscriptionDtos() {}

    public record PlanResponse(
            String code,
            String name,
            String description,
            long price,
            int durationDays,
            int maxShops,
            int maxProducts,
            boolean recommended,
            int sortOrder,
            List<String> features) {

        public static PlanResponse from(SubscriptionPlan plan) {
            return new PlanResponse(
                    plan.getCode(),
                    plan.getName(),
                    plan.getDescription(),
                    plan.getPrice(),
                    plan.getDurationDays(),
                    plan.getMaxShops(),
                    plan.getMaxProducts(),
                    plan.isRecommended(),
                    plan.getSortOrder(),
                    List.copyOf(plan.getFeatures()));
        }
    }

    public record SubscriptionResponse(
            String id,
            String plan,
            SubscriptionStatus status,
            long registeredAt,
            long expiresAt,
            long daysRemaining,
            boolean autoRenew,
            PlanResponse currentPlan,
            List<PlanResponse> plans) {

        public static SubscriptionResponse of(
                ShopSubscription subscription,
                SubscriptionPlan currentPlan,
                List<SubscriptionPlan> upgradeOptions,
                long now) {
            SubscriptionStatus status = subscription.getExpiresAt() > now
                    ? SubscriptionStatus.ACTIVE
                    : SubscriptionStatus.EXPIRED;
            long remainingMillis = Math.max(0, subscription.getExpiresAt() - now);
            long daysRemaining = (remainingMillis + 86_399_999L) / 86_400_000L;
            return new SubscriptionResponse(
                    subscription.getId(),
                    subscription.getPlanCode(),
                    status,
                    subscription.getRegisteredAt(),
                    subscription.getExpiresAt(),
                    daysRemaining,
                    subscription.isAutoRenew(),
                    PlanResponse.from(currentPlan),
                    upgradeOptions.stream().map(PlanResponse::from).toList());
        }
    }

    /** Shop seller picks a plan code to upgrade/renew to. */
    public record UpgradeRequest(@NotBlank String plan) {}

    /** Plan definition plus its real active-subscriber count, for the admin overview. */
    public record AdminPlanOverview(
            String code,
            String name,
            String description,
            long price,
            int durationDays,
            int maxShops,
            int maxProducts,
            boolean recommended,
            boolean trial,
            int sortOrder,
            long subscribers,
            List<String> features) {

        public static AdminPlanOverview of(SubscriptionPlan plan, long subscribers) {
            return new AdminPlanOverview(
                    plan.getCode(),
                    plan.getName(),
                    plan.getDescription(),
                    plan.getPrice(),
                    plan.getDurationDays(),
                    plan.getMaxShops(),
                    plan.getMaxProducts(),
                    plan.isRecommended(),
                    plan.isTrial(),
                    plan.getSortOrder(),
                    subscribers,
                    List.copyOf(plan.getFeatures()));
        }
    }

    /** Admin create/update payload for a plan. {@code code} is ignored on update. */
    public record PlanRequest(
            @NotBlank String name,
            String description,
            long price,
            int durationDays,
            int maxShops,
            int maxProducts,
            boolean recommended,
            Integer sortOrder,
            List<String> features) {

        public List<String> featuresOrEmpty() {
            return features == null ? List.of() : features.stream()
                    .map(f -> f == null ? "" : f.trim())
                    .filter(f -> !f.isBlank())
                    .toList();
        }
    }

    /** One paid seller for the admin subscriber-management table. */
    public record AdminSubscriberRow(
            String userId,
            String userName,
            String userEmail,
            String shopId,
            String shopName,
            String planCode,
            String planName,
            long price,
            SubscriptionStatus status,
            long registeredAt,
            long expiresAt,
            long daysRemaining) {}

    /** Admin moves a seller onto a different plan. */
    public record AdminChangePlanRequest(@NotBlank String plan) {}

    /** Admin extends a seller's current period by N days. */
    public record AdminExtendRequest(@Positive int days) {}

    // --- Plan upgrade requests (manual approval flow) -----------------------

    /** A user submits a request to upgrade onto the given plan code. */
    public record UpgradeRequestInput(@NotBlank String plan) {}

    /** Admin rejects a request with an optional reason. */
    public record RejectRequestInput(String note) {}

    /**
     * A plan-upgrade request enriched with the requester and plan details, for
     * both the admin queue and the user's own "pending request" status.
     */
    public record UpgradeRequestResponse(
            String id,
            String userId,
            String userName,
            String userEmail,
            String planCode,
            String planName,
            long planPrice,
            int planDurationDays,
            UpgradeRequestStatus status,
            String note,
            long createdAt,
            Long decidedAt) {

        public static UpgradeRequestResponse of(
                PlanUpgradeRequest req,
                String userName,
                String userEmail,
                SubscriptionPlan plan) {
            return new UpgradeRequestResponse(
                    req.getId(),
                    req.getUserId(),
                    userName,
                    userEmail,
                    req.getPlanCode(),
                    plan == null ? req.getPlanCode() : plan.getName(),
                    plan == null ? 0 : plan.getPrice(),
                    plan == null ? 0 : plan.getDurationDays(),
                    req.getStatus(),
                    req.getNote(),
                    req.getCreatedAt(),
                    req.getDecidedAt());
        }
    }
}
