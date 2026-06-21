package com.truewrist.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.domain.PaymentStatus;
import com.truewrist.backend.domain.PaymentTransaction;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.dto.PaymentDtos.AdminTransactionRow;
import com.truewrist.backend.dto.PaymentDtos.CheckoutResponse;
import com.truewrist.backend.dto.PaymentDtos.MonthlyRevenue;
import com.truewrist.backend.dto.PaymentDtos.PlanRevenue;
import com.truewrist.backend.dto.PaymentDtos.RevenueStats;
import com.truewrist.backend.dto.PaymentDtos.StatusResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.payment.PayOsClient;
import com.truewrist.backend.repository.PaymentTransactionRepository;
import com.truewrist.backend.repository.SubscriptionPlanRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long THIRTY_DAYS = 30L * 86_400_000L;

    private final PaymentTransactionRepository transactionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final PayOsClient payOs;
    private final AppProperties props;
    private final ObjectMapper mapper = new ObjectMapper();

    public PaymentService(
            PaymentTransactionRepository transactionRepository,
            SubscriptionPlanRepository planRepository,
            UserRepository userRepository,
            SubscriptionService subscriptionService,
            NotificationService notificationService,
            PayOsClient payOs,
            AppProperties props) {
        this.transactionRepository = transactionRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
        this.payOs = payOs;
        this.props = props;
    }

    // --- Buyer-facing --------------------------------------------------------

    /**
     * Start a payment for the given plan. Validates the user may buy it, creates a
     * PENDING transaction, and either asks PayOS for a QR link or (when PayOS isn't
     * configured) builds a static VietQR for manual confirmation.
     */
    @Transactional
    public CheckoutResponse createCheckout(AppUserPrincipal actor, String planCode) {
        SubscriptionPlan plan = subscriptionService.validatePurchasablePlan(actor.getId(), planCode);
        if (plan.getPrice() <= 0) {
            throw ApiException.badRequest("Gói này miễn phí, không cần thanh toán.");
        }

        long now = System.currentTimeMillis();
        long orderCode = nextOrderCode();
        String description = ("TW" + orderCode);
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(Ids.generate("pay"))
                .orderCode(orderCode)
                .userId(actor.getId())
                .planCode(plan.getCode())
                .amount(plan.getPrice())
                .status(PaymentStatus.PENDING)
                .description(description)
                .createdAt(now)
                .updatedAt(now)
                .build();

        boolean devMode = !payOs.isConfigured();
        if (devMode) {
            // Fallback: static VietQR image + manual confirm (local dev / no PayOS).
            tx.setQrCode(null);
            tx.setCheckoutUrl(null);
            transactionRepository.save(tx);
            AppProperties.FallbackBank bank = props.payos() == null ? null : props.payos().fallbackBank();
            return new CheckoutResponse(
                    orderCode, plan.getCode(), plan.getName(), plan.getPrice(), description,
                    PaymentStatus.PENDING, null, null,
                    fallbackQrImageUrl(bank, plan.getPrice(), description),
                    bank == null ? null : "VietQR",
                    bank == null ? null : bank.accountNumber(),
                    bank == null ? null : bank.accountName(),
                    true);
        }

        PayOsClient.CreatedLink link = payOs.createPaymentLink(
                orderCode, plan.getPrice(), description, returnUrl(orderCode), cancelUrl(orderCode));
        tx.setCheckoutUrl(link.checkoutUrl());
        tx.setQrCode(link.qrCode());
        tx.setPaymentLinkId(link.paymentLinkId());
        transactionRepository.save(tx);

        return new CheckoutResponse(
                orderCode, plan.getCode(), plan.getName(), plan.getPrice(), description,
                PaymentStatus.PENDING, link.checkoutUrl(), link.qrCode(), null,
                null, link.accountNumber(), null, false);
    }

    /** Poll the status of one of the caller's transactions (drives the QR modal). */
    @Transactional(readOnly = true)
    public StatusResponse getStatus(AppUserPrincipal actor, long orderCode) {
        PaymentTransaction tx = transactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy giao dịch."));
        if (!tx.getUserId().equals(actor.getId())) {
            throw ApiException.forbidden("Giao dịch không thuộc về bạn.");
        }
        return new StatusResponse(orderCode, tx.getStatus());
    }

    // --- Webhook (PayOS → us) ------------------------------------------------

    /**
     * Handle a PayOS webhook. Always succeeds (returns normally) so PayOS gets a
     * 2xx ack even for its registration test ping or an unknown order; only a
     * valid, signed, successful payment for a PENDING transaction is applied.
     */
    @Transactional
    public void handleWebhook(String rawBody) {
        JsonNode webhook;
        try {
            webhook = mapper.readTree(rawBody);
        } catch (Exception e) {
            log.warn("Unparseable PayOS webhook body.");
            return;
        }
        if (!payOs.verifyWebhookSignature(webhook)) {
            log.warn("PayOS webhook with invalid signature — ignored.");
            return;
        }
        JsonNode data = webhook.path("data");
        long orderCode = data.path("orderCode").asLong(0);
        if (orderCode <= 0) {
            return; // registration test ping
        }
        PaymentTransaction tx = transactionRepository.findByOrderCode(orderCode).orElse(null);
        if (tx == null) {
            log.info("Webhook for unknown orderCode {} — ignored.", orderCode);
            return;
        }
        boolean success = "00".equals(data.path("code").asText());
        if (!success) {
            if (tx.getStatus() == PaymentStatus.PENDING) {
                markStatus(tx, PaymentStatus.FAILED);
            }
            return;
        }
        applyPaid(tx, data.path("reference").asText(null), data.path("counterAccountName").asText(null));
    }

    // --- Dev / manual --------------------------------------------------------

    /** Manually confirm a fallback (no-PayOS) transaction has been paid. */
    @Transactional
    public StatusResponse devConfirm(AppUserPrincipal actor, long orderCode) {
        if (payOs.isConfigured()) {
            throw ApiException.badRequest("Xác nhận thủ công chỉ dùng khi chưa cấu hình PayOS.");
        }
        PaymentTransaction tx = transactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy giao dịch."));
        if (!tx.getUserId().equals(actor.getId())) {
            throw ApiException.forbidden("Giao dịch không thuộc về bạn.");
        }
        applyPaid(tx, "DEV-CONFIRM", null);
        return new StatusResponse(orderCode, tx.getStatus());
    }

    // --- Admin ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AdminTransactionRow> adminTransactions() {
        Map<String, SubscriptionPlan> plans = planByCode();
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(t -> {
                    User u = userRepository.findById(t.getUserId()).orElse(null);
                    return AdminTransactionRow.of(
                            t,
                            u == null ? null : u.getName(),
                            u == null ? null : u.getEmail(),
                            plans.get(t.getPlanCode()));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RevenueStats revenueStats() {
        Map<String, SubscriptionPlan> plans = planByCode();
        List<PaymentTransaction> paid = transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> t.getStatus() == PaymentStatus.PAID && t.getPaidAt() != null)
                .toList();

        long now = System.currentTimeMillis();
        long startOfMonth = YearMonth.now(ZONE).atDay(1).atStartOfDay(ZONE).toInstant().toEpochMilli();
        long total = paid.stream().mapToLong(PaymentTransaction::getAmount).sum();
        long thisMonth = paid.stream().filter(t -> t.getPaidAt() >= startOfMonth)
                .mapToLong(PaymentTransaction::getAmount).sum();
        long last30 = paid.stream().filter(t -> t.getPaidAt() >= now - THIRTY_DAYS)
                .mapToLong(PaymentTransaction::getAmount).sum();

        // Monthly buckets for the last 6 calendar months (oldest → newest).
        Map<String, long[]> buckets = new LinkedHashMap<>(); // month -> {revenue, count}
        YearMonth cursor = YearMonth.now(ZONE).minusMonths(5);
        for (int i = 0; i < 6; i++) {
            buckets.put(cursor.toString(), new long[] {0, 0});
            cursor = cursor.plusMonths(1);
        }
        for (PaymentTransaction t : paid) {
            String month = Instant.ofEpochMilli(t.getPaidAt()).atZone(ZONE).toLocalDate()
                    .withDayOfMonth(1).toString().substring(0, 7);
            long[] cell = buckets.get(month);
            if (cell != null) {
                cell[0] += t.getAmount();
                cell[1] += 1;
            }
        }
        List<MonthlyRevenue> monthly = buckets.entrySet().stream()
                .map(e -> new MonthlyRevenue(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        Map<String, long[]> byPlanAcc = new LinkedHashMap<>();
        for (PaymentTransaction t : paid) {
            long[] cell = byPlanAcc.computeIfAbsent(t.getPlanCode(), k -> new long[] {0, 0});
            cell[0] += t.getAmount();
            cell[1] += 1;
        }
        List<PlanRevenue> byPlan = byPlanAcc.entrySet().stream()
                .map(e -> {
                    SubscriptionPlan p = plans.get(e.getKey());
                    return new PlanRevenue(
                            e.getKey(),
                            p == null ? e.getKey() : p.getName(),
                            e.getValue()[0],
                            e.getValue()[1]);
                })
                .sorted((a, b) -> Long.compare(b.revenue(), a.revenue()))
                .toList();

        return new RevenueStats(
                total, thisMonth, last30,
                paid.size(),
                transactionRepository.countByStatus(PaymentStatus.PENDING),
                monthly, byPlan);
    }

    /** Admin manually confirms a transaction (e.g. a verified bank transfer). */
    @Transactional
    public AdminTransactionRow adminMarkPaid(String id) {
        PaymentTransaction tx = requireTx(id);
        if (tx.getStatus() == PaymentStatus.PAID) {
            throw ApiException.badRequest("Giao dịch đã ở trạng thái đã thanh toán.");
        }
        applyPaid(tx, "ADMIN-MARK-PAID", null);
        return toRow(tx);
    }

    @Transactional
    public AdminTransactionRow adminCancel(String id, String note) {
        PaymentTransaction tx = requireTx(id);
        if (tx.getStatus() == PaymentStatus.PAID) {
            throw ApiException.badRequest("Không thể hủy giao dịch đã thanh toán. Hãy dùng hoàn tiền.");
        }
        tx.setNote(trimToNull(note));
        markStatus(tx, PaymentStatus.CANCELLED);
        return toRow(tx);
    }

    @Transactional
    public AdminTransactionRow adminRefund(String id, String note) {
        PaymentTransaction tx = requireTx(id);
        if (tx.getStatus() != PaymentStatus.PAID) {
            throw ApiException.badRequest("Chỉ hoàn tiền được giao dịch đã thanh toán.");
        }
        tx.setNote(trimToNull(note));
        markStatus(tx, PaymentStatus.REFUNDED);
        return toRow(tx);
    }

    // --- Helpers -------------------------------------------------------------

    /** Mark a transaction PAID (idempotent) and activate the plan + SHOP role. */
    private void applyPaid(PaymentTransaction tx, String providerRef, String payerName) {
        if (tx.getStatus() == PaymentStatus.PAID) {
            return; // already applied — webhook may fire more than once
        }
        long now = System.currentTimeMillis();
        tx.setStatus(PaymentStatus.PAID);
        tx.setPaidAt(now);
        tx.setUpdatedAt(now);
        if (providerRef != null) {
            tx.setProviderRef(providerRef);
        }
        if (payerName != null) {
            tx.setPayerName(payerName);
        }
        transactionRepository.save(tx);
        subscriptionService.activatePaidPlan(tx.getUserId(), tx.getPlanCode());

        String planName = planRepository.findById(tx.getPlanCode())
                .map(SubscriptionPlan::getName).orElse(tx.getPlanCode());
        notificationService.notify(
                tx.getUserId(),
                com.truewrist.backend.domain.NotificationType.PAYMENT,
                "Thanh toán thành công",
                "Gói \"" + planName + "\" đã được kích hoạt. Quyền bán hàng đã được cấp cho tài khoản của bạn.",
                tx.getId());

        log.info("Payment {} PAID → activated plan {} for user {}",
                tx.getOrderCode(), tx.getPlanCode(), tx.getUserId());
    }

    private void markStatus(PaymentTransaction tx, PaymentStatus status) {
        tx.setStatus(status);
        tx.setUpdatedAt(System.currentTimeMillis());
        transactionRepository.save(tx);
    }

    private PaymentTransaction requireTx(String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy giao dịch."));
    }

    private AdminTransactionRow toRow(PaymentTransaction tx) {
        User u = userRepository.findById(tx.getUserId()).orElse(null);
        return AdminTransactionRow.of(
                tx,
                u == null ? null : u.getName(),
                u == null ? null : u.getEmail(),
                planRepository.findById(tx.getPlanCode()).orElse(null));
    }

    private Map<String, SubscriptionPlan> planByCode() {
        return planRepository.findAll().stream()
                .collect(Collectors.toMap(SubscriptionPlan::getCode, p -> p, (a, b) -> a));
    }

    /** Generate a unique positive order code that stays a JS-safe integer. */
    private long nextOrderCode() {
        for (int attempt = 0; attempt < 8; attempt++) {
            long candidate = (System.currentTimeMillis() / 1000L) * 1000L
                    + ThreadLocalRandom.current().nextInt(1000);
            if (transactionRepository.findByOrderCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw ApiException.badRequest("Không tạo được mã giao dịch. Vui lòng thử lại.");
    }

    private String returnUrl(long orderCode) {
        return appendOrder(configuredOr(
                props.payos() == null ? null : props.payos().returnUrl(),
                props.frontend().resolvedBaseUrl() + "/payment/return"), orderCode);
    }

    private String cancelUrl(long orderCode) {
        return appendOrder(configuredOr(
                props.payos() == null ? null : props.payos().cancelUrl(),
                props.frontend().resolvedBaseUrl() + "/payment/cancel"), orderCode);
    }

    private static String configuredOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String appendOrder(String url, long orderCode) {
        return url + (url.contains("?") ? "&" : "?") + "orderCode=" + orderCode;
    }

    /** Build a scannable VietQR image URL for the fallback (no-PayOS) flow. */
    private static String fallbackQrImageUrl(AppProperties.FallbackBank bank, long amount, String addInfo) {
        if (bank == null || bank.bin() == null || bank.bin().isBlank()
                || bank.accountNumber() == null || bank.accountNumber().isBlank()) {
            return null;
        }
        String info = URLEncoder.encode(addInfo, StandardCharsets.UTF_8);
        String name = bank.accountName() == null ? ""
                : URLEncoder.encode(bank.accountName(), StandardCharsets.UTF_8);
        return "https://img.vietqr.io/image/" + bank.bin() + "-" + bank.accountNumber()
                + "-compact2.png?amount=" + amount + "&addInfo=" + info + "&accountName=" + name;
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
