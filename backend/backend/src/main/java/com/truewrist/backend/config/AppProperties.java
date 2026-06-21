package com.truewrist.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds the {@code app.*} block in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Cors cors,
        OAuth2 oauth2,
        Seed seed,
        Storage storage,
        Mail mail,
        Frontend frontend,
        PasswordReset passwordReset,
        PayOs payos) {

    public record Jwt(String secret, long expirationMs) {}

    /**
     * PayOS QR payment gateway. When {@code enabled} is false (or credentials are
     * blank) the backend runs in a fallback mode: a static VietQR image is shown
     * and payment is confirmed manually (handy for local dev without PayOS).
     */
    public record PayOs(
            boolean enabled,
            String clientId,
            String apiKey,
            String checksumKey,
            String apiBaseUrl,
            String returnUrl,
            String cancelUrl,
            FallbackBank fallbackBank) {

        public String resolvedApiBaseUrl() {
            String base = (apiBaseUrl == null || apiBaseUrl.isBlank())
                    ? "https://api-merchant.payos.vn" : apiBaseUrl;
            return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        }

        /** True only when all three credentials are present. */
        public boolean isConfigured() {
            return enabled
                    && clientId != null && !clientId.isBlank()
                    && apiKey != null && !apiKey.isBlank()
                    && checksumKey != null && !checksumKey.isBlank();
        }
    }

    /** Bank account used to render a static VietQR in fallback (no-PayOS) mode. */
    public record FallbackBank(String bin, String accountNumber, String accountName) {}

    /** Outgoing email settings. When {@code enabled} is false, reset links are
     *  logged instead of emailed (handy for local dev without SMTP). */
    public record Mail(String from, boolean enabled) {}

    /** Where the SPA lives, used to build links in emails (e.g. reset password). */
    public record Frontend(String baseUrl) {
        public String resolvedBaseUrl() {
            String base = (baseUrl == null || baseUrl.isBlank()) ? "http://localhost:5555" : baseUrl;
            return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        }
    }

    public record PasswordReset(long tokenTtlMinutes) {
        public long ttlMinutesOrDefault() {
            return tokenTtlMinutes <= 0 ? 60 : tokenTtlMinutes;
        }
    }

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
