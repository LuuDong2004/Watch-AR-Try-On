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

/**
 * A user comment on a watch. The platform is display + AR try-on only (no sales),
 * so there is no star rating — just threaded comments. A comment with a null
 * {@code parentId} is top-level; a non-null {@code parentId} is a reply (e.g. the
 * shop responding to a customer, Facebook-style).
 */
@Entity
@Table(name = "product_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductComment {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "watch_id", nullable = false, length = 64)
    private String watchId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** Snapshot of the author's display name at post time. */
    @Column(name = "author_name", nullable = false)
    private String authorName;

    /** Parent comment id for replies; null for top-level comments. */
    @Column(name = "parent_id", length = 64)
    private String parentId;

    @Column(nullable = false, length = 2000)
    private String body;

    /** True when the user marked "I tried the AR and it fits". */
    @Column(name = "tried_ar", nullable = false)
    @Builder.Default
    private boolean triedAr = false;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
