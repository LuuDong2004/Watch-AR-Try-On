package com.truewrist.backend.security;

import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/** Mints and verifies HS256 access tokens. */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(AppProperties props) {
        this.key = Keys.hmacShaKeyFor(props.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = props.jwt().expirationMs();
    }

    /** Build a signed token whose subject is the user id, with role/email/name claims. */
    public String generateToken(User user) {
        long now = System.currentTimeMillis();
        var builder = Jwts.builder()
                .subject(user.getId())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key);
        if (user.getShopId() != null) {
            builder.claim("shopId", user.getShopId());
        }
        return builder.compact();
    }

    /** Parse and verify a token, returning its claims. Throws on invalid/expired tokens. */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parse(token).getSubject();
    }
}
