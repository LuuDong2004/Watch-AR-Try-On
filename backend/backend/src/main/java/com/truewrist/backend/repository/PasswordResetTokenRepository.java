package com.truewrist.backend.repository;

import com.truewrist.backend.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    /** Invalidate any outstanding tokens for a user before issuing a new one. */
    void deleteByUserId(String userId);
}
