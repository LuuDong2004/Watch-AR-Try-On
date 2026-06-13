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

/** A single-use, time-limited token emailed to verify a new account's email. */
@Entity
@Table(name = "email_verification_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken {

    /** The opaque random token (also the link's ?token= value). */
    @Id
    @Column(length = 128)
    private String token;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "expires_at", nullable = false)
    private long expiresAt;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
