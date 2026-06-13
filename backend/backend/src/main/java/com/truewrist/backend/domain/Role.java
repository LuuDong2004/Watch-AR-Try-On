package com.truewrist.backend.domain;

import java.util.Collection;

/** Mirrors the frontend's {@code Role} union: 'admin' | 'shop' | 'customer'. */
public enum Role {
    ADMIN,
    SHOP,
    CUSTOMER;

    /** Spring Security authority name, e.g. {@code ROLE_ADMIN}. */
    public String authority() {
        return "ROLE_" + name();
    }

    /**
     * The single "primary" role for a multi-role account, by precedence
     * ADMIN &gt; SHOP &gt; CUSTOMER. Used for the legacy {@code role} column and the
     * frontend shell selection. Defaults to CUSTOMER when empty.
     */
    public static Role primary(Collection<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return CUSTOMER;
        }
        if (roles.contains(ADMIN)) {
            return ADMIN;
        }
        if (roles.contains(SHOP)) {
            return SHOP;
        }
        return CUSTOMER;
    }
}
