package com.truewrist.backend.payment;

import com.truewrist.backend.config.AppProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Thin helper for the SePay payment gateway. SePay has no create-payment API call:
 * we simply render a VietQR (via {@code qr.sepay.vn/img}) pointing at our bank
 * account with a unique transfer content, and SePay POSTs a webhook the moment a
 * matching transfer lands. This class therefore only (1) builds the QR image URL
 * and (2) verifies the authenticity of incoming webhooks.
 *
 * <p>Webhook verification prefers HMAC-SHA256: SePay sends
 * {@code X-SePay-Signature: sha256=<hex>} and {@code X-SePay-Timestamp: <unix>},
 * where the signature is HMAC-SHA256 of {@code "{timestamp}.{rawBody}"} keyed with
 * the webhook secret. When no secret is configured it falls back to the API key
 * ({@code Authorization: Apikey <key>}). Either way verification fails closed.</p>
 */
@Component
public class SePayClient {

    private static final Logger log = LoggerFactory.getLogger(SePayClient.class);

    /** Reject webhooks whose timestamp drifts more than this (replay protection). */
    private static final long REPLAY_TOLERANCE_SECONDS = 300;

    private final AppProperties.SePay cfg;

    public SePayClient(AppProperties props) {
        this.cfg = props.sepay();
    }

    /** True when enough is configured to render a real SePay VietQR. */
    public boolean isConfigured() {
        return cfg != null && cfg.isConfigured();
    }

    /**
     * Build a scannable SePay VietQR image URL for the buyer to transfer to.
     * Returns null when SePay isn't configured.
     */
    public String buildQrImageUrl(long amount, String description) {
        if (!isConfigured()) {
            return null;
        }
        StringBuilder url = new StringBuilder(cfg.resolvedQrBaseUrl())
                .append("?acc=").append(enc(cfg.accountNumber()))
                .append("&bank=").append(enc(cfg.bank()))
                .append("&amount=").append(amount)
                .append("&des=").append(enc(description));
        if (cfg.qrTemplate() != null && !cfg.qrTemplate().isBlank()) {
            url.append("&template=").append(enc(cfg.qrTemplate()));
        }
        return url.toString();
    }

    /**
     * Verify an incoming SePay webhook. Uses HMAC-SHA256 (signature + timestamp over
     * the raw body) when a webhook secret is configured, otherwise the API key.
     * Fails closed when no method is configured. Never throws.
     *
     * @param nowEpochSeconds current time (seconds) for the replay-window check
     */
    public boolean verifyWebhook(
            String rawBody, String signature, String timestamp,
            String authorization, long nowEpochSeconds) {
        try {
            boolean hasSecret = cfg != null && notBlank(cfg.webhookSecret());
            boolean hasApiKey = cfg != null && notBlank(cfg.webhookApiKey());
            if (!hasSecret && !hasApiKey) {
                log.warn("SePay webhook auth not configured — rejecting webhook (fail-closed).");
                return false;
            }
            if (hasSecret) {
                return verifyHmac(rawBody, signature, timestamp, nowEpochSeconds);
            }
            return verifyApiKey(authorization);
        } catch (Exception e) {
            log.warn("SePay webhook verification error: {}", e.getMessage());
            return false;
        }
    }

    // --- verification helpers ------------------------------------------------

    private boolean verifyHmac(String rawBody, String signature, String timestamp, long now) {
        if (signature == null || timestamp == null) {
            return false;
        }
        long ts;
        try {
            ts = Long.parseLong(timestamp.trim());
        } catch (NumberFormatException e) {
            return false;
        }
        if (Math.abs(now - ts) > REPLAY_TOLERANCE_SECONDS) {
            log.warn("SePay webhook timestamp outside ±{}s tolerance — rejected.", REPLAY_TOLERANCE_SECONDS);
            return false;
        }
        String expected = "sha256=" + hmacSha256(ts + "." + rawBody, cfg.webhookSecret());
        return constantTimeEquals(expected, signature.trim());
    }

    private boolean verifyApiKey(String authorization) {
        if (authorization == null) {
            return false;
        }
        return constantTimeEquals("Apikey " + cfg.webhookApiKey(), authorization.trim());
    }

    private static String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot compute HMAC-SHA256", e);
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }
}
