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
        SePay sepay) {

    public record Jwt(String secret, long expirationMs) {}

    /**
     * SePay payment gateway (https://sepay.vn). Unlike a hosted-checkout gateway,
     * SePay works by watching a real bank account: we render a VietQR (via
     * {@code qr.sepay.vn}) pointing at our account with a unique transfer content,
     * and SePay fires a webhook the moment a matching transfer lands. When the
     * account/bank are not configured the backend falls back to a manual-confirm
     * dev mode (handy for local dev without a SePay account).
     *
     * <p>Webhook authenticity is enforced by HMAC-SHA256 when {@code webhookSecret}
     * is set (SePay signs {@code {timestamp}.{rawBody}} → {@code X-SePay-Signature}),
     * otherwise by the API key ({@code Authorization: Apikey <webhookApiKey>}).</p>
     */
    public record SePay(
            boolean enabled,
            String accountNumber,
            String bank,
            String accountName,
            String qrBaseUrl,
            String qrTemplate,
            String codePrefix,
            String webhookSecret,
            String webhookApiKey) {

        public String resolvedQrBaseUrl() {
            String base = (qrBaseUrl == null || qrBaseUrl.isBlank())
                    ? "https://qr.sepay.vn/img" : qrBaseUrl;
            return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        }

        /** Transfer-content prefix prepended to the order code (e.g. {@code TW123…}). */
        public String resolvedCodePrefix() {
            return (codePrefix == null || codePrefix.isBlank()) ? "TW" : codePrefix.trim();
        }

        /** True when enough is configured to render a real SePay VietQR. */
        public boolean isConfigured() {
            return enabled
                    && accountNumber != null && !accountNumber.isBlank()
                    && bank != null && !bank.isBlank();
        }
    }

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
