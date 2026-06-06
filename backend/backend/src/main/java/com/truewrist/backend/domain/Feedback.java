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

/** Customer feedback about a shop or the website. Mirrors the frontend {@code Feedback}. */
@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @Column(length = 64)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeedbackTarget target;

    @Column(name = "shop_id", length = 64)
    private String shopId;

    @Column(name = "shop_name")
    private String shopName;

    /** Rating 1..5. */
    @Column(nullable = false)
    private int rating;

    private String topic;

    @Column(length = 2000)
    private String message;

    private String name;

    private String contact;

    /** The signed-in user who left it, if any. */
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(nullable = false, length = 40)
    private String timestamp;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
