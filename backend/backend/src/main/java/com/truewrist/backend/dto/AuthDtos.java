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

    /** Returned on successful login (and after email verification); token is the JWT. */
    public record AuthResponse(String token, UserDtos.UserResponse user) {}

    /** Returned after registration — no token yet; the user must verify their email. */
    public record RegisterResponse(String email, String message) {}

    /** Verify a newly-registered email via the token from the emailed link. */
    public record VerifyEmailRequest(@NotBlank String token) {}

    /** Resend the verification email to an unverified account. */
    public record ResendVerificationRequest(@NotBlank @Email String email) {}

    /** Request a password-reset email for the given account. */
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    /** Complete a password reset using the token from the emailed link. */
    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String newPassword) {}
}
