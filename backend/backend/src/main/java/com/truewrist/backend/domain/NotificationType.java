package com.truewrist.backend.domain;

/** Category of a user-facing {@link Notification} (drives the bell icon/colour). */
public enum NotificationType {
    /** A reply arrived in one of the user's conversations. */
    MESSAGE,
    /** A payment / subscription-plan event (paid, activated, expiring). */
    PAYMENT
}
