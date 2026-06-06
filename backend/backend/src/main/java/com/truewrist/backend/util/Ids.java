package com.truewrist.backend.util;

import java.util.UUID;

/** Short unique ids matching the frontend convention, e.g. {@code u-1a2b3c4d}. */
public final class Ids {

    private Ids() {}

    public static String generate(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
