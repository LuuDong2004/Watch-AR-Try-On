package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;
import java.util.Arrays;
import java.util.List;

public final class SubscriptionDtos {

    private SubscriptionDtos() {}

    public record PlanResponse(
            SubscriptionPlan code,
            String name,
            String description,
            long price,
            int durationDays,
            int maxShops,
            int maxProducts,
            boolean recommended,
            List<String> features) {

        public static PlanResponse from(SubscriptionPlan plan) {
            return new PlanResponse(
                    plan,
                    plan.getDisplayName(),
                    plan.getDescription(),
                    plan.getPrice(),
                    plan.getDurationDays(),
                    plan.getMaxShops(),
                    plan.getMaxProducts(),
                    plan.isRecommended(),
                    plan.getFeatures());
        }
    }

    public record SubscriptionResponse(
            String id,
            SubscriptionPlan plan,
            SubscriptionStatus status,
            long registeredAt,
            long expiresAt,
            long daysRemaining,
            boolean autoRenew,
            PlanResponse currentPlan,
            List<PlanResponse> plans) {

        public static SubscriptionResponse from(ShopSubscription subscription, long now) {
            SubscriptionStatus status = subscription.getExpiresAt() > now
                    ? SubscriptionStatus.ACTIVE
                    : SubscriptionStatus.EXPIRED;
            long remainingMillis = Math.max(0, subscription.getExpiresAt() - now);
            long daysRemaining = (remainingMillis + 86_399_999L) / 86_400_000L;
            return new SubscriptionResponse(
                    subscription.getId(),
                    subscription.getPlan(),
                    status,
                    subscription.getRegisteredAt(),
                    subscription.getExpiresAt(),
                    daysRemaining,
                    subscription.isAutoRenew(),
                    PlanResponse.from(subscription.getPlan()),
                    Arrays.stream(SubscriptionPlan.values())
                            .filter(plan -> plan != SubscriptionPlan.TRIAL)
                            .map(PlanResponse::from)
                            .toList());
        }
    }

    public record UpgradeRequest(@NotNull SubscriptionPlan plan) {}
}
