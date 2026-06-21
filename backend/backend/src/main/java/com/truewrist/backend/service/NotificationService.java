package com.truewrist.backend.service;

import com.truewrist.backend.domain.Notification;
import com.truewrist.backend.domain.NotificationType;
import com.truewrist.backend.dto.NotificationDtos.NotificationResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.NotificationRepository;
import com.truewrist.backend.util.Ids;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates and serves the per-user bell notifications. */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** Push a notification to one user. Safe to call from other services. */
    @Transactional
    public void notify(String userId, NotificationType type, String title, String body, String refId) {
        Notification n = Notification.builder()
                .id(Ids.generate("ntf"))
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .refId(refId)
                .read(false)
                .createdAt(System.currentTimeMillis())
                .build();
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(String userId, String id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy thông báo."));
        if (!n.getUserId().equals(userId)) {
            throw ApiException.forbidden("Thông báo không thuộc về bạn.");
        }
        if (!n.isRead()) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    @Transactional
    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
