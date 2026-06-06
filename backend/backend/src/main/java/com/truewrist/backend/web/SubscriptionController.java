package com.truewrist.backend.web;

import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.dto.SubscriptionDtos.UpgradeRequest;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
@PreAuthorize("hasRole('SHOP')")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public SubscriptionResponse get(@AuthenticationPrincipal AppUserPrincipal actor) {
        return subscriptionService.getFor(actor);
    }

    @PostMapping("/upgrade")
    public SubscriptionResponse upgrade(
            @Valid @RequestBody UpgradeRequest request,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return subscriptionService.upgrade(actor, request.plan());
    }
}
