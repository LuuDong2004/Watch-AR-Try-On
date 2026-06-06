package com.truewrist.backend.service;

import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.dto.AuthDtos.AuthResponse;
import com.truewrist.backend.dto.AuthDtos.LoginRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterRequest;
import com.truewrist.backend.dto.UserDtos.UserResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.security.JwtService;
import com.truewrist.backend.util.Ids;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Email + password login. Throws on bad credentials / locked account. */
    public AuthResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = ((AppUserPrincipal) auth.getPrincipal()).getUser();
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    /** Self-service customer registration. */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw ApiException.conflict("Email đã được sử dụng.");
        }
        User user = User.builder()
                .id(Ids.generate("u"))
                .name(req.name())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .createdAt(System.currentTimeMillis())
                .build();
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }
}
