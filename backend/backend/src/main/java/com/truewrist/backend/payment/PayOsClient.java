package com.truewrist.backend.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Thin client for the PayOS merchant API plus the HMAC-SHA256 signing/verification
 * it requires. Kept dependency-light (Spring {@link RestClient} + Jackson) so no
 * extra SDK is needed.
 *
 * <p>Signature rules (per PayOS docs): build {@code key=value&key2=value2...} with
 * the fields sorted alphabetically by key, then HMAC-SHA256 with the checksum key,
 * hex-encoded lowercase. For create-payment only a fixed subset of fields is
 * signed; webhook verification signs every field in the {@code data} object.</p>
 */
@Component
public class PayOsClient {

    private static final Logger log = LoggerFactory.getLogger(PayOsClient.class);

    private final AppProperties.PayOs cfg;
    private final ObjectMapper mapper = new ObjectMapper();
    private final RestClient http;

    public PayOsClient(AppProperties props) {
        this.cfg = props.payos();
        this.http = RestClient.builder()
                .baseUrl(cfg == null ? "https://api-merchant.payos.vn" : cfg.resolvedApiBaseUrl())
                .build();
    }

    public boolean isConfigured() {
        return cfg != null && cfg.isConfigured();
    }

    /** What PayOS returns for a freshly created payment link. */
    public record CreatedLink(
            String checkoutUrl,
            String qrCode,
            String paymentLinkId,
            String bin,
            String accountNumber) {}

    /**
     * Create a payment link. {@code description} must be ≤ 25 chars (PayOS limit).
     * Returns the checkout URL + raw EMV QR string to render on the client.
     */
    public CreatedLink createPaymentLink(
            long orderCode, long amount, String description, String returnUrl, String cancelUrl) {
        String signature = signCreate(amount, cancelUrl, description, orderCode, returnUrl);

        ObjectNode body = mapper.createObjectNode();
        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("cancelUrl", cancelUrl);
        body.put("returnUrl", returnUrl);
        body.put("signature", signature);

        JsonNode response;
        try {
            response = http.post()
                    .uri("/v2/payment-requests")
                    .header("x-client-id", cfg.clientId())
                    .header("x-api-key", cfg.apiKey())
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            log.error("PayOS create-payment call failed: {}", e.getMessage());
            throw ApiException.badGateway("Không kết nối được cổng thanh toán. Vui lòng thử lại.");
        }

        if (response == null || !"00".equals(response.path("code").asText())) {
            String desc = response == null ? "no response" : response.path("desc").asText();
            log.error("PayOS create-payment rejected: {}", desc);
            throw ApiException.badGateway("Cổng thanh toán từ chối tạo giao dịch: " + desc);
        }
        JsonNode data = response.path("data");
        return new CreatedLink(
                data.path("checkoutUrl").asText(null),
                data.path("qrCode").asText(null),
                data.path("paymentLinkId").asText(null),
                data.path("bin").asText(null),
                data.path("accountNumber").asText(null));
    }

    /**
     * Verify a webhook payload's signature against its {@code data} object.
     * Returns true when the signature matches; never throws.
     */
    public boolean verifyWebhookSignature(JsonNode webhook) {
        try {
            JsonNode data = webhook.path("data");
            String provided = webhook.path("signature").asText(null);
            if (data.isMissingNode() || provided == null) {
                return false;
            }
            String expected = hmacSha256(flattenSorted(data));
            return constantTimeEquals(expected, provided);
        } catch (Exception e) {
            log.warn("Webhook signature verification error: {}", e.getMessage());
            return false;
        }
    }

    // --- signing helpers -----------------------------------------------------

    private String signCreate(long amount, String cancelUrl, String description, long orderCode, String returnUrl) {
        String raw = "amount=" + amount
                + "&cancelUrl=" + cancelUrl
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + returnUrl;
        return hmacSha256(raw);
    }

    /** Build {@code key=value&...} from an object's fields, sorted alphabetically. */
    private String flattenSorted(JsonNode data) {
        List<String> keys = new ArrayList<>();
        for (Iterator<String> it = data.fieldNames(); it.hasNext(); ) {
            keys.add(it.next());
        }
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        for (String key : keys) {
            JsonNode v = data.get(key);
            String value = (v == null || v.isNull()) ? "" : v.asText();
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append(key).append('=').append(value);
        }
        return sb.toString();
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(cfg.checksumKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
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
