package com.truewrist.backend.service;

import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ShopSubscriptionRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.time.Duration;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionService {

    private final ShopSubscriptionRepository subscriptionRepository;

    public SubscriptionService(ShopSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional
    public SubscriptionResponse getFor(AppUserPrincipal actor) {
        long now = System.currentTimeMillis();
        ShopSubscription subscription = subscriptionRepository.findByUserId(actor.getId())
                .orElseGet(() -> createTrial(actor.getId(), now));
        return SubscriptionResponse.from(subscription, now);
    }

    @Transactional
    public SubscriptionResponse upgrade(AppUserPrincipal actor, SubscriptionPlan targetPlan) {
        if (targetPlan == SubscriptionPlan.TRIAL) {
            throw ApiException.badRequest("Không thể chuyển về gói dùng thử.");
        }

        long now = System.currentTimeMillis();
        ShopSubscription subscription = subscriptionRepository.findByUserId(actor.getId())
                .orElseGet(() -> createTrial(actor.getId(), now));
        boolean active = subscription.getExpiresAt() > now;

        if (active && targetPlan.ordinal() < subscription.getPlan().ordinal()) {
            throw ApiException.badRequest("Không thể hạ cấp khi gói hiện tại vẫn còn hiệu lực.");
        }

        long periodStart = now;
        long expiryBase = active && targetPlan == subscription.getPlan()
                ? subscription.getExpiresAt()
                : now;
        long expiresAt = expiryBase + Duration.ofDays(targetPlan.getDurationDays()).toMillis();

        subscription.setPlan(targetPlan);
        subscription.setRegisteredAt(periodStart);
        subscription.setExpiresAt(expiresAt);
        subscription.setUpdatedAt(now);
        subscription.setAutoRenew(false);
        return SubscriptionResponse.from(subscriptionRepository.save(subscription), now);
    }

    private ShopSubscription createTrial(String userId, long now) {
        ShopSubscription subscription = ShopSubscription.builder()
                .id(Ids.generate("sub"))
                .userId(userId)
                .plan(SubscriptionPlan.TRIAL)
                .registeredAt(now)
                .expiresAt(now + Duration.ofDays(SubscriptionPlan.TRIAL.getDurationDays()).toMillis())
                .updatedAt(now)
                .autoRenew(false)
                .build();
        return subscriptionRepository.save(subscription);
    }
}
