package com.truewrist.backend.domain;

/** Who a customer's conversation is addressed to. */
public enum ConversationTarget {
    /** The TrueWrist platform admins (support / account issues). */
    ADMIN,
    /** A specific seller's shop. */
    SHOP
}
