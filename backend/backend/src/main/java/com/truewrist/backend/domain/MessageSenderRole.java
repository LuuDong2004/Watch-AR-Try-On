package com.truewrist.backend.domain;

/** Which side of a conversation a message came from (drives left/right bubbles). */
public enum MessageSenderRole {
    /** The customer who started the conversation. */
    CUSTOMER,
    /** A seller replying on behalf of their shop. */
    SHOP,
    /** A platform admin replying. */
    ADMIN
}
