package com.truewrist.backend.repository;

import com.truewrist.backend.domain.ShopSubscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShopSubscriptionRepository extends JpaRepository<ShopSubscription, String> {
    Optional<ShopSubscription> findByUserId(String userId);

    /** All active (non-expired) subscriptions, for the admin subscriber list. */
    List<ShopSubscription> findByExpiresAtGreaterThan(long now);

    /** Active subscribers on a given plan — used to guard plan deletion. */
    long countByPlanCodeAndExpiresAtGreaterThan(String planCode, long now);

    /** Active (non-expired) subscriber counts grouped by plan code, for the admin overview. */
    @Query("select s.planCode as planCode, count(s) as total from ShopSubscription s "
            + "where s.expiresAt > :now group by s.planCode")
    List<PlanSubscriberCount> countActiveByPlan(@Param("now") long now);

    interface PlanSubscriberCount {
        String getPlanCode();

        long getTotal();
    }
}
