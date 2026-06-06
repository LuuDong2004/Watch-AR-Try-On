package com.truewrist.backend.repository;

import com.truewrist.backend.domain.ShopSubscription;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopSubscriptionRepository extends JpaRepository<ShopSubscription, String> {
    Optional<ShopSubscription> findByUserId(String userId);
}
