package com.truewrist.backend.domain;

/** Lifecycle of a {@link PaymentTransaction} paying for a subscription plan. */
public enum PaymentStatus {
    /** Created, QR shown, awaiting the buyer's transfer. */
    PENDING,
    /** Money received — plan applied and SHOP role granted. */
    PAID,
    /** Buyer cancelled the payment link before paying. */
    CANCELLED,
    /** Expired before any transfer arrived. */
    EXPIRED,
    /** Provider reported a failed/declined payment. */
    FAILED,
    /** Admin refunded a previously PAID transaction. */
    REFUNDED
}
