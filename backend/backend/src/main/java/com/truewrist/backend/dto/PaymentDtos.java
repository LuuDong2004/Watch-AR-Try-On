package com.truewrist.backend.dto;

import com.truewrist.backend.domain.PaymentStatus;
import com.truewrist.backend.domain.PaymentTransaction;
import com.truewrist.backend.domain.SubscriptionPlan;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class PaymentDtos {

    private PaymentDtos() {}

    /** Seller picks a plan code to pay for. */
    public record CheckoutRequest(@NotBlank String plan) {}

    /**
     * Everything the client needs to render the QR payment screen. {@code qrCode}
     * is a raw EMVCo string (rendered as an image client-side); {@code qrImageUrl}
     * is a ready-to-use image URL (used in fallback/no-PayOS mode). {@code devMode}
     * tells the client to show the manual "I have paid" confirm button.
     */
    public record CheckoutResponse(
            long orderCode,
            String planCode,
            String planName,
            long amount,
            String description,
            PaymentStatus status,
            String checkoutUrl,
            String qrCode,
            String qrImageUrl,
            String bankName,
            String accountNumber,
            String accountName,
            boolean devMode,
            /** Epoch millis the QR window lapses; drives the client countdown. */
            Long expiresAt) {}

    /** Lightweight status poll for the open QR modal. */
    public record StatusResponse(long orderCode, PaymentStatus status) {}

    /** One row in the admin transaction table. */
    public record AdminTransactionRow(
            String id,
            long orderCode,
            String userId,
            String userName,
            String userEmail,
            String planCode,
            String planName,
            long amount,
            PaymentStatus status,
            String providerRef,
            String payerName,
            long createdAt,
            Long paidAt,
            String note) {

        public static AdminTransactionRow of(
                PaymentTransaction t, String userName, String userEmail, SubscriptionPlan plan) {
            return new AdminTransactionRow(
                    t.getId(),
                    t.getOrderCode(),
                    t.getUserId(),
                    userName,
                    userEmail,
                    t.getPlanCode(),
                    plan == null ? t.getPlanCode() : plan.getName(),
                    t.getAmount(),
                    t.getStatus(),
                    t.getProviderRef(),
                    t.getPayerName(),
                    t.getCreatedAt(),
                    t.getPaidAt(),
                    t.getNote());
        }
    }

    /** Admin revenue dashboard: headline totals + a monthly breakdown. */
    public record RevenueStats(
            long totalRevenue,
            long revenueThisMonth,
            long revenueLast30Days,
            long paidCount,
            long pendingCount,
            List<MonthlyRevenue> monthly,
            List<PlanRevenue> byPlan) {}

    /** Revenue for one calendar month, e.g. {@code month = "2026-06"}. */
    public record MonthlyRevenue(String month, long revenue, long count) {}

    /** Confirmed revenue grouped by plan. */
    public record PlanRevenue(String planCode, String planName, long revenue, long count) {}

    /** Admin note when refunding/cancelling a transaction. */
    public record AdminNoteRequest(String note) {}
}
