package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Watch boutique / seller. Mirrors the frontend {@code Shop} type (storefront fields included). */
@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @Column(length = 64)
    private String id;

    /** User id of the seller who owns this shop (null for legacy/admin shops). */
    @Column(name = "owner_id", length = 64)
    private String ownerId;

    @Column(nullable = false)
    private String name;

    private String phone;

    private String email;

    private String address;

    @Column(length = 2000)
    private String description;

    /** Accent color for the shop's avatar/badge, e.g. {@code #C9A84C}. */
    @Column(length = 16)
    private String color;

    /** Storefront contact channels. */
    @Column(length = 500)
    private String zalo;

    @Column(length = 500)
    private String messenger;

    /** Opening hours label, e.g. "09:00 - 21:30 · cả tuần". */
    @Column(length = 200)
    private String hours;

    /** Manager / representative display name. */
    @Column(length = 200)
    private String manager;

    /** Hero / cover image URL. */
    @Column(length = 1000)
    private String image;

    /** Google Maps link (share/place URL) used to show directions to the shop. */
    @Column(name = "map_url", length = 1000)
    private String mapUrl;

    /** Specialties / commitments shown on the shop page. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "services", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> services = new ArrayList<>();

    @Column(name = "rating")
    @Builder.Default
    private double rating = 0;

    @Column(name = "review_count")
    @Builder.Default
    private int reviewCount = 0;

    /** Founding year label, e.g. "2019". */
    @Column(length = 16)
    private String since;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 16, nullable = false)
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
