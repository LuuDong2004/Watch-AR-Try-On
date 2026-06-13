package com.truewrist.backend.domain;

/** Lifecycle of a seller plan-upgrade request awaiting manual admin approval. */
public enum UpgradeRequestStatus {
    PENDING,
    APPROVED,
    REJECTED;
}
