package com.truewrist.backend.dto;

import com.truewrist.backend.domain.Feedback;
import com.truewrist.backend.domain.FeedbackTarget;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Request/response payloads for feedback. */
public final class FeedbackDtos {

    private FeedbackDtos() {}

    public record FeedbackResponse(
            String id,
            FeedbackTarget target,
            String shopId,
            String shopName,
            int rating,
            String topic,
            String message,
            String name,
            String contact,
            String timestamp,
            long createdAt) {

        public static FeedbackResponse from(Feedback f) {
            return new FeedbackResponse(
                    f.getId(), f.getTarget(), f.getShopId(), f.getShopName(), f.getRating(),
                    f.getTopic(), f.getMessage(), f.getName(), f.getContact(),
                    f.getTimestamp(), f.getCreatedAt());
        }
    }

    public record FeedbackCreateRequest(
            @NotNull FeedbackTarget target,
            String shopId,
            String shopName,
            @Min(1) @Max(5) int rating,
            String topic,
            @NotBlank String message,
            @NotBlank String name,
            String contact) {}
}
