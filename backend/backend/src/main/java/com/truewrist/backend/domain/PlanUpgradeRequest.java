package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A request from a user to move onto a paid selling plan. Stands in for a payment
 * gateway: the user submits it, an admin approves it, and approval grants the SHOP
 * role and applies the chosen plan ("lên quyền").
 */
@Entity
@Table(name = "plan_upgrade_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanUpgradeRequest {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** Requested {@link SubscriptionPlan} code. */
    @Column(name = "plan", nullable = false, length = 64)
    private String planCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UpgradeRequestStatus status;

    /** Optional admin note (e.g. the reason when rejected). */
    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    /** When an admin approved/rejected it; null while PENDING. */
    @Column(name = "decided_at")
    private Long decidedAt;

    /** Admin user id who decided; null while PENDING. */
    @Column(name = "decided_by", length = 64)
    private String decidedBy;
}
