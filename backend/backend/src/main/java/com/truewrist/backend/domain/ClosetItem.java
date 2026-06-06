package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A saved AR try-on snapshot in a user's virtual closet. Mirrors {@code ClosetItem}. */
@Entity
@Table(name = "closet_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClosetItem {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "watch_id", length = 64)
    private String watchId;

    @Column(name = "watch_name")
    private String watchName;

    @Column(name = "watch_brand")
    private String watchBrand;

    private long price;

    /** AR snapshot image (data URL); stored large. */
    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    /** Display date label (localized on the client when created). */
    @Column(length = 40)
    private String date;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
