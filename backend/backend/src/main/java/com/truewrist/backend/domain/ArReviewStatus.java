package com.truewrist.backend.domain;

/**
 * Moderation state of a watch's 3D/AR model. Only {@link #APPROVED} watches
 * expose the "Thử AR" try-on on the storefront. New/edited AR models start as
 * {@link #PENDING} until an admin reviews them in the Kiểm Duyệt 3D screen.
 */
public enum ArReviewStatus {
    PENDING,
    APPROVED,
    REJECTED;
}
