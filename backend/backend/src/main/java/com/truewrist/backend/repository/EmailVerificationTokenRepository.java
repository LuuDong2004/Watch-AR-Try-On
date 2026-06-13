package com.truewrist.backend.repository;

import com.truewrist.backend.domain.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {

    /** Invalidate any outstanding verification tokens for a user before issuing a new one. */
    void deleteByUserId(String userId);
}
