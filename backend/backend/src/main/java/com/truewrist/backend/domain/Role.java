package com.truewrist.backend.domain;

/** Mirrors the frontend's {@code Role} union: 'admin' | 'shop' | 'customer'. */
public enum Role {
    ADMIN,
    SHOP,
    CUSTOMER;

    /** Spring Security authority name, e.g. {@code ROLE_ADMIN}. */
    public String authority() {
        return "ROLE_" + name();
    }
}
