package com.truewrist.backend.dto;

import com.truewrist.backend.domain.Notification;
import com.truewrist.backend.domain.NotificationType;

public final class NotificationDtos {

    private NotificationDtos() {}

    public record NotificationResponse(
            String id,
            NotificationType type,
            String title,
            String body,
            String refId,
            boolean read,
            long createdAt) {

        public static NotificationResponse from(Notification n) {
            return new NotificationResponse(
                    n.getId(),
                    n.getType(),
                    n.getTitle(),
                    n.getBody(),
                    n.getRefId(),
                    n.isRead(),
                    n.getCreatedAt());
        }
    }

    public record UnreadCountResponse(long count) {}
}
