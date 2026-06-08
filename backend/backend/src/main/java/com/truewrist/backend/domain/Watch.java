package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Watch product. Mirrors the frontend {@code Watch} type (storefront fields included). */
@Entity
@Table(name = "watches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Watch {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private long price;

    @Column(name = "original_price")
    private Long originalPrice;

    @Column(length = 4000)
    private String description;

    /** Stored as Postgres {@code jsonb}; preserves insertion order via LinkedHashMap. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, String> specs = new LinkedHashMap<>();

    /** Primary thumbnail/hero image URL shown in the storefront. */
    @Column(name = "image", length = 1000)
    private String image;

    /** Additional gallery image URLs. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gallery", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> gallery = new ArrayList<>();

    /** GLB shown in the 3D product viewer (may be empty). */
    @Column(name = "model_url")
    private String modelUrl;

    /** Whether the "Thử AR" button is offered for this product. */
    @Column(name = "has_ar", nullable = false)
    @Builder.Default
    private boolean hasAR = false;

    /** Which entry in the frontend AR catalogue the "Thử AR" button loads. */
    @Column(name = "ar_watch_id", nullable = false, length = 32)
    private String arWatchId;

    private String variant;

    /** Gradient thumbnail palette (fallback when there is no product photo). */
    @Column(length = 16)
    private String metal;

    @Column(length = 16)
    private String dial;

    @Column(length = 16)
    private String accent;

    /** Average rating 0..5 shown in the storefront. */
    @Column(name = "rating")
    @Builder.Default
    private double rating = 0;

    @Column(name = "review_count")
    @Builder.Default
    private int reviewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 16, nullable = false)
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    /** AR/3D moderation state. Only APPROVED watches expose "Thử AR" publicly.
     *  Nullable column so legacy rows upgrade cleanly (treated as PENDING). */
    @Enumerated(EnumType.STRING)
    @Column(name = "ar_review_status", length = 16)
    @Builder.Default
    private ArReviewStatus arReviewStatus = ArReviewStatus.PENDING;

    /** Optional reviewer feedback shown to the seller when AR is rejected. */
    @Column(name = "ar_review_note", length = 500)
    private String arReviewNote;

    @Column(name = "shop_id", nullable = false, length = 64)
    private String shopId;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
