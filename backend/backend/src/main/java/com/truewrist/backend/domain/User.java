package com.truewrist.backend.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
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

    /**
     * The "primary" role, kept in sync with {@link #roles} by precedence
     * (ADMIN &gt; SHOP &gt; CUSTOMER). Retained for backward compatibility and for
     * driving the frontend shell. Prefer {@link #getRoles()} for authorisation.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    /**
     * Full set of roles granted to the account (multi-role). A user can be e.g.
     * both CUSTOMER and SHOP. Stored in the {@code user_roles} join table.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", length = 16)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<Role> roles = new LinkedHashSet<>();

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

    /** Contact phone number; used to pre-fill enquiry/appointment forms. */
    @Column(name = "phone", length = 32)
    private String phone;

    /**
     * Email-verified flag. Self-registrations start false until the user clicks the
     * verification link; Google / admin-created / seeded accounts are verified.
     * {@code ColumnDefault("true")} so the column backfills existing rows on upgrade.
     */
    @Column(name = "email_verified", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private boolean emailVerified = true;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    /**
     * The roles actually in effect — falls back to the legacy {@link #role} for
     * accounts created before the {@code user_roles} table was backfilled.
     */
    public Set<Role> effectiveRoles() {
        if (roles == null || roles.isEmpty()) {
            return role == null ? EnumSet.of(Role.CUSTOMER) : EnumSet.of(role);
        }
        return roles;
    }

    /**
     * Replace the account's roles, keeping the legacy {@link #role} column in sync
     * with the highest-precedence role. Ignores null/empty input.
     */
    public void assignRoles(Set<Role> next) {
        if (next == null || next.isEmpty()) {
            return;
        }
        Set<Role> cleaned = new LinkedHashSet<>(next);
        if (roles == null) {
            roles = new LinkedHashSet<>();
        }
        roles.clear();
        roles.addAll(cleaned);
        role = Role.primary(cleaned);
    }
}
