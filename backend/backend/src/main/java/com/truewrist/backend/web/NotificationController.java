package com.truewrist.backend.web;

import com.truewrist.backend.dto.NotificationDtos.NotificationResponse;
import com.truewrist.backend.dto.NotificationDtos.UnreadCountResponse;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.NotificationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal AppUserPrincipal actor) {
        return notificationService.list(actor.getId());
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal AppUserPrincipal actor) {
        return new UnreadCountResponse(notificationService.unreadCount(actor.getId()));
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable String id, @AuthenticationPrincipal AppUserPrincipal actor) {
        notificationService.markRead(actor.getId(), id);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal AppUserPrincipal actor) {
        notificationService.markAllRead(actor.getId());
    }
}
