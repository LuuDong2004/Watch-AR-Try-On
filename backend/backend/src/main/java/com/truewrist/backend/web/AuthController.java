package com.truewrist.backend.web;

import com.truewrist.backend.dto.AuthDtos.AuthResponse;
import com.truewrist.backend.dto.AuthDtos.ForgotPasswordRequest;
import com.truewrist.backend.dto.AuthDtos.LoginRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterResponse;
import com.truewrist.backend.dto.AuthDtos.ResendVerificationRequest;
import com.truewrist.backend.dto.AuthDtos.ResetPasswordRequest;
import com.truewrist.backend.dto.AuthDtos.VerifyEmailRequest;
import com.truewrist.backend.dto.UserDtos.ProfileUpdateRequest;
import com.truewrist.backend.dto.UserDtos.UserResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/register")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    /** Verify a new account's email from the link, returning a session token. */
    @PostMapping("/verify-email")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return authService.verifyEmail(req.token());
    }

    /** Resend the verification email. Always 200 (never reveals if the email exists). */
    @PostMapping("/resend-verification")
    public void resendVerification(@Valid @RequestBody ResendVerificationRequest req) {
        authService.resendVerification(req.email());
    }

    /** Request a password-reset email. Always 200 (never reveals if the email exists). */
    @PostMapping("/forgot-password")
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
    }

    /** Complete a password reset using the token from the emailed link. */
    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
    }

    /** Current session — frontend calls this with the bearer token to rehydrate. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        if (principal == null) {
            throw ApiException.unauthorized("Chưa đăng nhập.");
        }
        return UserResponse.from(principal.getUser());
    }

    /** The signed-in user edits their own profile (name, email, avatar, password). */
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserResponse updateProfile(
            @Valid @RequestBody ProfileUpdateRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        if (principal == null) {
            throw ApiException.unauthorized("Chưa đăng nhập.");
        }
        return authService.updateProfile(principal.getId(), req);
    }
}
