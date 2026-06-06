package com.truewrist.backend.dto;

/** Response payloads for favourites. */
public final class FavoriteDtos {

    private FavoriteDtos() {}

    /** Result of toggling a favourite: whether the watch is now favourited. */
    public record ToggleResponse(boolean favorited) {}
}
