package com.truewrist.backend.repository;

import com.truewrist.backend.domain.SubscriptionPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {

    /** Catalogue in display / upgrade-rank order. */
    List<SubscriptionPlan> findAllByOrderBySortOrderAsc();

    /** The free, auto-assigned default plan new sellers start on. */
    Optional<SubscriptionPlan> findFirstByTrialTrueOrderBySortOrderAsc();
}
