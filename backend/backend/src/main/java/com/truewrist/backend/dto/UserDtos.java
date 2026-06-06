package com.truewrist.backend.dto;

import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request/response payloads for user management (admin). */
public final class UserDtos {

    private UserDtos() {}

    /** Safe view of a user — never exposes the password hash. */
    public record UserResponse(
            String id,
            String name,
            String email,
            Role role,
            String shopId,
            UserStatus status,
            String provider,
            long createdAt) {

        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getName(), u.getEmail(), u.getRole(),
                    u.getShopId(), u.getStatus(),
                    u.getProvider() == null ? null : u.getProvider().name(),
                    u.getCreatedAt());
        }
    }

    public record UserCreateRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotNull Role role,
            String shopId,
            UserStatus status) {}

    /** All fields optional — only non-null fields are applied. */
    public record UserUpdateRequest(
            String name,
            @Email String email,
            @Size(min = 6) String password,
            Role role,
            String shopId,
            UserStatus status) {}
}
