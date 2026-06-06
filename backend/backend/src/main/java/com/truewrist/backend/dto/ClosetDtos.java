package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ClosetItem;
import jakarta.validation.constraints.NotBlank;

/** Request/response payloads for the AR try-on closet. */
public final class ClosetDtos {

    private ClosetDtos() {}

    public record ClosetItemResponse(
            String id,
            String watchId,
            String watchName,
            String watchBrand,
            long price,
            String imageUrl,
            String date,
            long createdAt) {

        public static ClosetItemResponse from(ClosetItem c) {
            return new ClosetItemResponse(
                    c.getId(), c.getWatchId(), c.getWatchName(), c.getWatchBrand(),
                    c.getPrice(), c.getImageUrl(), c.getDate(), c.getCreatedAt());
        }
    }

    /** The client sends the watch id + the captured AR snapshot; the rest is resolved. */
    public record ClosetCreateRequest(
            @NotBlank String watchId,
            String imageUrl,
            String date) {}
}
