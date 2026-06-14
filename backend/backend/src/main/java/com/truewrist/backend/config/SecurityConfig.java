package com.truewrist.backend.config;

import com.truewrist.backend.security.CustomUserDetailsService;
import com.truewrist.backend.security.JwtAuthenticationFilter;
import com.truewrist.backend.security.OAuth2SuccessHandler;
import java.util.Arrays;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final AppProperties props;

    public SecurityConfig(
            CustomUserDetailsService userDetailsService,
            JwtAuthenticationFilter jwtAuthFilter,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            AppProperties props) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthFilter = jwtAuthFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.props = props;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                // Stateless API, but the OAuth2 redirect dance needs a transient session.
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        // Public auth + OAuth2 endpoints
                        .requestMatchers(
                                "/api/auth/login", "/api/auth/register",
                                "/api/auth/forgot-password", "/api/auth/reset-password",
                                "/api/auth/verify-email", "/api/auth/resend-verification").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // A seller's own shops require auth (must come before the public wildcard)
                        .requestMatchers(HttpMethod.GET, "/api/shops/mine").authenticated()
                        // Public storefront reads
                        .requestMatchers(HttpMethod.GET, "/api/watches/**", "/api/shops/**").permitAll()
                        // Public pricing catalogue (the "become a partner" page)
                        .requestMatchers(HttpMethod.GET, "/api/subscription/plans").permitAll()
                        // Public storefront submissions (contact form / feedback); user id
                        // is attached automatically when the visitor happens to be signed in.
                        .requestMatchers(HttpMethod.POST, "/api/leads", "/api/feedback").permitAll()
                        // AR try-on snapshot upload is public (anonymous visitors attach
                        // a capture to a lead before signing in).
                        .requestMatchers(HttpMethod.POST, "/api/uploads/data-url").permitAll()
                        // Image uploads require a login; the controller further restricts
                        // non-avatar folders (watch/shop photos) to sellers/admins.
                        .requestMatchers(HttpMethod.POST, "/api/uploads").authenticated()
                        .requestMatchers("/error").permitAll()
                        // Everything else needs a valid JWT
                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth
                        .successHandler(oAuth2SuccessHandler)
                        .failureUrl(props.oauth2().failureRedirect()))
                // API clients get a 401 instead of a redirect to the Google login page.
                .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        apiRequestMatcher()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** Matches REST API paths so unauthenticated calls get a 401, not an OAuth redirect. */
    private static RequestMatcher apiRequestMatcher() {
        return request -> request.getRequestURI().startsWith("/api/");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(props.cors().origins()));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
