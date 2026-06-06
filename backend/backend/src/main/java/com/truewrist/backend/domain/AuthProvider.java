package com.truewrist.backend.domain;

/** How the account authenticates. LOCAL = email+password, GOOGLE = OAuth2. */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
