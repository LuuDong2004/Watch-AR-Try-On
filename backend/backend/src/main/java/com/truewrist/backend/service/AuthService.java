package com.truewrist.backend.service;

import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.EmailVerificationToken;
import com.truewrist.backend.domain.PasswordResetToken;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.dto.AuthDtos.AuthResponse;
import com.truewrist.backend.dto.AuthDtos.LoginRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterRequest;
import com.truewrist.backend.dto.AuthDtos.RegisterResponse;
import com.truewrist.backend.dto.UserDtos.ProfileUpdateRequest;
import com.truewrist.backend.dto.UserDtos.UserResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.EmailVerificationTokenRepository;
import com.truewrist.backend.repository.PasswordResetTokenRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.security.JwtService;
import com.truewrist.backend.util.Ids;
import java.time.Duration;
import java.util.UUID;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final long VERIFY_TTL_MS = 24 * 60 * 60 * 1000L; // 24h

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;
    private final AppProperties props;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordResetTokenRepository resetTokenRepository,
            EmailVerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            MailService mailService,
            AppProperties props) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.props = props;
    }

    /** Email + password login. Throws on bad credentials / locked / unverified. */
    public AuthResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = ((AppUserPrincipal) auth.getPrincipal()).getUser();
        if (!user.isEmailVerified()) {
            throw ApiException.forbidden(
                    "Tài khoản chưa xác minh email. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.");
        }
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    /**
     * Self-service customer registration. Creates an UNVERIFIED account and emails a
     * verification link — the account is only usable after the link is clicked. No
     * JWT is issued here.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest req) {
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
                .emailVerified(false)
                .createdAt(System.currentTimeMillis())
                .build();
        user.assignRoles(java.util.Set.of(Role.CUSTOMER));
        userRepository.save(user);

        issueVerification(user);

        return new RegisterResponse(user.getEmail(),
                "Đăng ký thành công! Vui lòng kiểm tra email để xác minh và kích hoạt tài khoản.");
    }

    /** Verify an email via the token from the link, then auto-sign-in. */
    @Transactional
    public AuthResponse verifyEmail(String token) {
        EmailVerificationToken evt = verificationTokenRepository.findById(token)
                .orElseThrow(() -> ApiException.badRequest("Liên kết xác minh không hợp lệ."));
        long now = System.currentTimeMillis();
        if (evt.isUsed() || evt.getExpiresAt() < now) {
            throw ApiException.badRequest("Liên kết xác minh đã hết hạn hoặc đã được sử dụng.");
        }
        User user = userRepository.findById(evt.getUserId())
                .orElseThrow(() -> ApiException.badRequest("Tài khoản không tồn tại."));

        user.setEmailVerified(true);
        userRepository.save(user);
        evt.setUsed(true);
        verificationTokenRepository.save(evt);

        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    /**
     * Resend the verification link. Always resolves (never reveals if the email
     * exists); a no-op when the account is missing or already verified.
     */
    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmailIgnoreCase(email.trim())
                .filter(u -> !u.isEmailVerified())
                .ifPresent(this::issueVerification);
    }

    /** Create a fresh verification token and email the activation link. */
    private void issueVerification(User user) {
        long now = System.currentTimeMillis();
        verificationTokenRepository.deleteByUserId(user.getId());
        String token = (UUID.randomUUID() + "" + UUID.randomUUID()).replace("-", "");
        verificationTokenRepository.save(EmailVerificationToken.builder()
                .token(token)
                .userId(user.getId())
                .expiresAt(now + VERIFY_TTL_MS)
                .used(false)
                .createdAt(now)
                .build());
        String verifyUrl = props.frontend().resolvedBaseUrl() + "/verify-email?token=" + token;
        try {
            mailService.sendEmailVerification(user.getEmail(), user.getName(), verifyUrl);
        } catch (Exception ex) {
            // Logged inside MailService; never fail registration on mail issues.
        }
    }

    /**
     * The signed-in user edits their own profile: name, email, avatar, and/or
     * password. Changing the password requires the current one (unless the
     * account has none yet, e.g. a Google sign-in adding a password).
     */
    @Transactional
    public UserResponse updateProfile(String userId, ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản."));

        if (req.name() != null && !req.name().isBlank()) {
            user.setName(req.name().trim());
        }

        // Email is the login identity and is intentionally not editable here.

        // avatar: null = unchanged, blank = remove, otherwise set the new URL.
        if (req.avatar() != null) {
            user.setAvatar(req.avatar().isBlank() ? null : req.avatar());
        }

        // phone: null = unchanged, blank = clear, otherwise set the trimmed value.
        if (req.phone() != null) {
            user.setPhone(req.phone().isBlank() ? null : req.phone().trim());
        }

        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            if (req.newPassword().length() < 6) {
                throw ApiException.badRequest("Mật khẩu mới phải có ít nhất 6 ký tự.");
            }
            if (user.getPasswordHash() != null) {
                if (req.currentPassword() == null
                        || !passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
                    throw ApiException.badRequest("Mật khẩu hiện tại không đúng.");
                }
            }
            user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        }

        userRepository.save(user);
        return UserResponse.from(user);
    }

    /**
     * Issue a single-use reset token and email the link. Always succeeds from the
     * caller's point of view — we never reveal whether the email is registered.
     */
    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            long now = System.currentTimeMillis();
            // Only one active reset link per account at a time.
            resetTokenRepository.deleteByUserId(user.getId());

            String token = (UUID.randomUUID().toString() + UUID.randomUUID().toString())
                    .replace("-", "");
            long ttlMinutes = props.passwordReset().ttlMinutesOrDefault();
            resetTokenRepository.save(PasswordResetToken.builder()
                    .token(token)
                    .userId(user.getId())
                    .expiresAt(now + Duration.ofMinutes(ttlMinutes).toMillis())
                    .used(false)
                    .createdAt(now)
                    .build());

            String resetUrl = props.frontend().resolvedBaseUrl()
                    + "/reset-password?token=" + token;
            mailService.sendPasswordReset(user.getEmail(), user.getName(), resetUrl);
        });
    }

    /** Complete a reset: validate the token, set the new password, burn the token. */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = resetTokenRepository.findById(token)
                .orElseThrow(() -> ApiException.badRequest(
                        "Liên kết đặt lại mật khẩu không hợp lệ."));
        long now = System.currentTimeMillis();
        if (prt.isUsed() || prt.getExpiresAt() < now) {
            throw ApiException.badRequest(
                    "Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw ApiException.badRequest("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }
        User user = userRepository.findById(prt.getUserId())
                .orElseThrow(() -> ApiException.badRequest("Tài khoản không tồn tại."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        resetTokenRepository.save(prt);
    }
}
