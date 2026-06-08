package com.truewrist.backend.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A sellable subscription package. Previously a hard-coded enum; now an editable
 * catalogue row so admins can create/update/delete plans at runtime. The string
 * {@code code} is what {@link ShopSubscription#getPlanCode()} stores, so seeded
 * codes (TRIAL/ESSENTIAL/PREMIUM) keep existing subscriptions valid.
 */
@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @Column(length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 1024)
    private String description;

    @Column(nullable = false)
    private long price;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    /** Max shops the plan allows; -1 means unlimited. */
    @Column(name = "max_shops", nullable = false)
    private int maxShops;

    /** Max products the plan allows; -1 means unlimited. */
    @Column(name = "max_products", nullable = false)
    private int maxProducts;

    @Column(nullable = false)
    private boolean recommended;

    /** The free, auto-assigned default plan new sellers start on. */
    @Column(nullable = false)
    private boolean trial;

    /** Ordering + upgrade/downgrade rank (higher = more premium). */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "subscription_plan_features",
            joinColumns = @JoinColumn(name = "plan_code"))
    @OrderColumn(name = "idx")
    @Column(name = "feature", length = 512)
    @Builder.Default
    private List<String> features = new ArrayList<>();
}
