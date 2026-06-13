package com.truewrist.backend.dto;

import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Request/response payloads for user management (admin). */
public final class UserDtos {

    private UserDtos() {}

    /** Safe view of a user — never exposes the password hash. */
    public record UserResponse(
            String id,
            String name,
            String email,
            Role role,
            List<Role> roles,
            String shopId,
            UserStatus status,
            String provider,
            String avatar,
            String phone,
            boolean emailVerified,
            long createdAt) {

        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getName(), u.getEmail(), u.getRole(),
                    List.copyOf(u.effectiveRoles()),
                    u.getShopId(), u.getStatus(),
                    u.getProvider() == null ? null : u.getProvider().name(),
                    u.getAvatar(),
                    u.getPhone(),
                    u.isEmailVerified(),
                    u.getCreatedAt());
        }
    }

    /** {@code roles} takes precedence; {@code role} is a single-role fallback. */
    public record UserCreateRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            Role role,
            List<Role> roles,
            String shopId,
            String phone,
            UserStatus status) {}

    /** All fields optional — only non-null fields are applied. */
    public record UserUpdateRequest(
            String name,
            @Email String email,
            @Size(min = 6) String password,
            Role role,
            List<Role> roles,
            String shopId,
            String phone,
            UserStatus status) {}

    /**
     * Self-service profile update (the signed-in user edits their own account).
     * All fields optional; password length is validated in the service so that a
     * blank {@code newPassword} simply means "don't change the password".
     */
    public record ProfileUpdateRequest(
            String name,
            String avatar,
            String phone,
            String currentPassword,
            String newPassword) {}
}
