package com.truewrist.backend.repository;

import com.truewrist.backend.domain.PaymentStatus;
import com.truewrist.backend.domain.PaymentTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {

    Optional<PaymentTransaction> findByOrderCode(long orderCode);

    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();

    /** Total confirmed revenue (sum of PAID amounts) since the given epoch millis. */
    @Query("select coalesce(sum(t.amount), 0) from PaymentTransaction t "
            + "where t.status = :status and t.paidAt >= :since")
    long sumPaidSince(@Param("status") PaymentStatus status, @Param("since") long since);

    long countByStatus(PaymentStatus status);
}
