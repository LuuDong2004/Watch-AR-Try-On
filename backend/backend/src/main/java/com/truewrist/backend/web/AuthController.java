package com.truewrist.backend.web;

import com.truewrist.backend.dto.AuthDtos.AuthResponse;
import com.truewrist.backend.dto.AuthDtos.LoginRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterRequest;
import com.truewrist.backend.dto.UserDtos.UserResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    /** Current session — frontend calls this with the bearer token to rehydrate. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        if (principal == null) {
            throw ApiException.unauthorized("Chưa đăng nhập.");
        }
        return UserResponse.from(principal.getUser());
    }
}
