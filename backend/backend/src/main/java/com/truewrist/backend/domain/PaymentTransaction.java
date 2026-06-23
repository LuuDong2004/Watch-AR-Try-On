package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One attempt to pay for a subscription plan through the SePay VietQR gateway.
 * Created PENDING when the buyer opens the QR; flipped to PAID by the SePay webhook
 * (matched by the transfer content), which then applies the plan and grants the
 * SHOP role. Also the source of truth for the admin transaction list and revenue
 * reporting.
 */
@Entity
@Table(
        name = "payment_transactions",
        uniqueConstraints = @UniqueConstraint(columnNames = "order_code"),
        indexes = {
                @Index(name = "idx_payment_user", columnList = "user_id"),
                @Index(name = "idx_payment_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @Column(length = 64)
    private String id;

    /** Order code — a unique positive number we generate and embed in the transfer
     *  content (e.g. {@code TW<orderCode>}) so the webhook can match the payment. */
    @Column(name = "order_code", nullable = false)
    private long orderCode;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** Code of the {@link SubscriptionPlan} being purchased. */
    @Column(name = "plan", nullable = false, length = 64)
    private String planCode;

    /** Amount in VND (whole dong). */
    @Column(nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PaymentStatus status;

    /** Transfer content shown to the payer (the SePay QR {@code des}). */
    @Column(length = 64)
    private String description;

    /** Unused (kept for back-compat with the old hosted-checkout gateway). */
    @Column(name = "checkout_url", length = 512)
    private String checkoutUrl;

    /** SePay VietQR image URL rendered to the buyer. */
    @Column(name = "qr_code", length = 2048)
    private String qrCode;

    /** Unused (kept for back-compat with the old hosted-checkout gateway). */
    @Column(name = "payment_link_id", length = 128)
    private String paymentLinkId;

    /** Bank transaction reference reported by the webhook once paid. */
    @Column(name = "provider_ref", length = 128)
    private String providerRef;

    /** Name on the counter (paying) bank account, if the webhook supplied it. */
    @Column(name = "payer_name", length = 128)
    private String payerName;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    /** When the money was confirmed received; null until PAID. */
    @Column(name = "paid_at")
    private Long paidAt;

    /** Optional admin note (e.g. refund reason). */
    @Column(length = 500)
    private String note;
}
