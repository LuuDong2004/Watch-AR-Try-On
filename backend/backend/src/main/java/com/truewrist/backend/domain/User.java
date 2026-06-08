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
 * Storefront account. Mirrors the frontend {@code User} type, except the plain
 * {@code password} field is replaced by a BCrypt {@code passwordHash} (null for
 * Google-only accounts).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt hash; null when the user only signs in with Google. */
    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    /** Set when {@code role == SHOP}: the shop this owner manages. */
    @Column(name = "shop_id", length = 64)
    private String shopId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AuthProvider provider;

    /** Profile picture URL (uploaded to object storage); null = use initials. */
    @Column(name = "avatar", length = 1000)
    private String avatar;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
