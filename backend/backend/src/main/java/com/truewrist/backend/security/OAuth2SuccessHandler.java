package com.truewrist.backend.security;

import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.util.Ids;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * After Google authenticates the user, find-or-create a local account, mint our
 * own JWT, and redirect the browser back to the frontend with {@code ?token=...}.
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AppProperties props;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtService jwtService, AppProperties props) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.props = props;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        if (email == null || email.isBlank()) {
            getRedirectStrategy().sendRedirect(request, response, props.oauth2().failureRedirect());
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            long now = System.currentTimeMillis();
            User created = User.builder()
                    .id(Ids.generate("u"))
                    .name(name != null && !name.isBlank() ? name : email)
                    .email(email)
                    .passwordHash(null)
                    .role(Role.CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .provider(AuthProvider.GOOGLE)
                    .createdAt(now)
                    .build();
            created.assignRoles(java.util.Set.of(Role.CUSTOMER));
            return created;
        });

        // A locked account must not get a token even via Google.
        if (user.getStatus() == UserStatus.LOCKED) {
            getRedirectStrategy().sendRedirect(request, response, props.oauth2().failureRedirect());
            return;
        }
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        String target = UriComponentsBuilder.fromUriString(props.oauth2().successRedirect())
                .queryParam("token", URLEncoder.encode(token, StandardCharsets.UTF_8))
                .build(true)
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, target);
    }
}
