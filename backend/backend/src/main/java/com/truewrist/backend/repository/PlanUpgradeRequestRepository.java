package com.truewrist.backend.repository;

import com.truewrist.backend.domain.PlanUpgradeRequest;
import com.truewrist.backend.domain.UpgradeRequestStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanUpgradeRequestRepository extends JpaRepository<PlanUpgradeRequest, String> {

    List<PlanUpgradeRequest> findByStatusOrderByCreatedAtAsc(UpgradeRequestStatus status);

    List<PlanUpgradeRequest> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<PlanUpgradeRequest> findFirstByUserIdAndStatus(String userId, UpgradeRequestStatus status);

    long countByStatus(UpgradeRequestStatus status);
}
