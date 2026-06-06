package com.truewrist.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds the {@code app.*} block in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, OAuth2 oauth2, Seed seed, Storage storage) {

    public record Jwt(String secret, long expirationMs) {}

    public record Cors(String allowedOrigins) {
        public String[] origins() {
            return allowedOrigins == null || allowedOrigins.isBlank()
                    ? new String[0]
                    : allowedOrigins.split("\\s*,\\s*");
        }
    }

    public record OAuth2(String successRedirect, String failureRedirect) {}

    public record Seed(boolean enabled) {}

    /** MinIO / S3-compatible object storage settings. */
    public record Storage(
            String endpoint,
            String accessKey,
            String secretKey,
            String bucket,
            String publicUrl,
            boolean enabled) {

        /** Base URL used to build public object links; falls back to the endpoint. */
        public String resolvedPublicUrl() {
            String base = (publicUrl == null || publicUrl.isBlank()) ? endpoint : publicUrl;
            return base != null && base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        }
    }
}
