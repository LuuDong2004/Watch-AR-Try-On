package com.truewrist.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response payloads for the auth endpoints. */
public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String password) {}

    /** Returned on successful login/register; token is the bearer JWT. */
    public record AuthResponse(String token, UserDtos.UserResponse user) {}

    /** Request a password-reset email for the given account. */
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    /** Complete a password reset using the token from the emailed link. */
    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String newPassword) {}
}
