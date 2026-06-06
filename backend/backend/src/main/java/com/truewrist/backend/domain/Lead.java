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

/** A customer enquiry / appointment addressed to a shop. Mirrors the frontend {@code Lead}. */
@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 32)
    private String phone;

    private String email;

    /** Denormalized watch info so leads render without a join. */
    @Column(name = "watch_id", length = 64)
    private String watchId;

    @Column(name = "watch_name")
    private String watchName;

    @Column(name = "watch_brand")
    private String watchBrand;

    @Column(name = "shop_id", nullable = false, length = 64)
    private String shopId;

    @Column(name = "shop_name")
    private String shopName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LeadType type;

    /** Appointment date (yyyy-MM-dd) — null for plain contact leads. */
    private String date;

    /** Appointment time (HH:mm) — null for plain contact leads. */
    private String time;

    @Column(length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    /** ISO-8601 timestamp string, set on creation. */
    @Column(nullable = false, length = 40)
    private String timestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private LeadChannel channel = LeadChannel.FORM;

    @Column(name = "has_tried_on", nullable = false)
    @Builder.Default
    private boolean hasTriedOn = false;

    /** Optional AR try-on photo (data URL); stored large. */
    @Column(name = "tried_on_image", columnDefinition = "text")
    private String triedOnImage;

    /** The signed-in customer who created this, if any (else null for anonymous). */
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
