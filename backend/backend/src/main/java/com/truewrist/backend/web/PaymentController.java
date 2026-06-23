package com.truewrist.backend.web;

import com.truewrist.backend.dto.PaymentDtos.AdminNoteRequest;
import com.truewrist.backend.dto.PaymentDtos.AdminTransactionRow;
import com.truewrist.backend.dto.PaymentDtos.CheckoutRequest;
import com.truewrist.backend.dto.PaymentDtos.CheckoutResponse;
import com.truewrist.backend.dto.PaymentDtos.RevenueStats;
import com.truewrist.backend.dto.PaymentDtos.StatusResponse;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.PaymentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // --- Buyer-facing --------------------------------------------------------

    /** Start a QR payment for a plan; returns the QR + checkout details. */
    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    public CheckoutResponse checkout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return paymentService.createCheckout(actor, request.plan());
    }

    /** Poll the status of one of the caller's transactions. */
    @GetMapping("/status/{orderCode}")
    @PreAuthorize("isAuthenticated()")
    public StatusResponse status(
            @PathVariable long orderCode,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return paymentService.getStatus(actor, orderCode);
    }

    /** Manual confirm for fallback (no-PayOS) mode — local dev only. */
    @PostMapping("/dev/confirm/{orderCode}")
    @PreAuthorize("isAuthenticated()")
    public StatusResponse devConfirm(
            @PathVariable long orderCode,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return paymentService.devConfirm(actor, orderCode);
    }

    // --- SePay webhook (public; verified by HMAC-SHA256 / API key) -----------

    @PostMapping("/webhook")
    public Map<String, Object> webhook(
            @RequestBody(required = false) String rawBody,
            @RequestHeader(value = "X-SePay-Signature", required = false) String signature,
            @RequestHeader(value = "X-SePay-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (rawBody != null && !rawBody.isBlank()) {
            paymentService.handleWebhook(rawBody, signature, timestamp, authorization);
        }
        // Always ack with 2xx so SePay accepts the endpoint (and stops retrying).
        return Map.of("success", true);
    }

    // --- Admin ---------------------------------------------------------------

    @GetMapping("/admin/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminTransactionRow> adminTransactions() {
        return paymentService.adminTransactions();
    }

    @GetMapping("/admin/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public RevenueStats adminRevenue() {
        return paymentService.revenueStats();
    }

    @PostMapping("/admin/transactions/{id}/mark-paid")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminTransactionRow adminMarkPaid(@PathVariable String id) {
        return paymentService.adminMarkPaid(id);
    }

    @PostMapping("/admin/transactions/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminTransactionRow adminCancel(
            @PathVariable String id,
            @RequestBody(required = false) AdminNoteRequest body) {
        return paymentService.adminCancel(id, body == null ? null : body.note());
    }

    @PostMapping("/admin/transactions/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminTransactionRow adminRefund(
            @PathVariable String id,
            @RequestBody(required = false) AdminNoteRequest body) {
        return paymentService.adminRefund(id, body == null ? null : body.note());
    }
}
