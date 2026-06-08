package com.truewrist.backend.repository;

import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShopSubscriptionRepository extends JpaRepository<ShopSubscription, String> {
    Optional<ShopSubscription> findByUserId(String userId);

    /** Active (non-expired) subscriber counts grouped by plan, for the admin overview. */
    @Query("select s.plan as plan, count(s) as total from ShopSubscription s "
            + "where s.expiresAt > :now group by s.plan")
    List<PlanSubscriberCount> countActiveByPlan(@Param("now") long now);

    interface PlanSubscriberCount {
        SubscriptionPlan getPlan();

        long getTotal();
    }
}
