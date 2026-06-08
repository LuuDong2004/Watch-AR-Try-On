package com.truewrist.backend.web;

import com.truewrist.backend.dto.SubscriptionDtos.AdminChangePlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.AdminExtendRequest;
import com.truewrist.backend.dto.SubscriptionDtos.AdminPlanOverview;
import com.truewrist.backend.dto.SubscriptionDtos.AdminSubscriberRow;
import com.truewrist.backend.dto.SubscriptionDtos.PlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.dto.SubscriptionDtos.UpgradeRequest;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    // --- Admin: plan catalogue ----------------------------------------------

    /** Admin overview: real plan catalogue with active-subscriber counts. */
    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminPlanOverview> adminOverview() {
        return subscriptionService.adminOverview();
    }

    @PostMapping("/admin/plans")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminPlanOverview createPlan(@Valid @RequestBody PlanRequest request) {
        return subscriptionService.createPlan(request);
    }

    @PutMapping("/admin/plans/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminPlanOverview updatePlan(
            @PathVariable String code,
            @Valid @RequestBody PlanRequest request) {
        return subscriptionService.updatePlan(code, request);
    }

    @DeleteMapping("/admin/plans/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePlan(@PathVariable String code) {
        subscriptionService.deletePlan(code);
    }

    // --- Admin: paid subscribers --------------------------------------------

    /** Sellers currently on a paid plan, with user + shop info. */
    @GetMapping("/admin/subscribers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminSubscriberRow> adminSubscribers() {
        return subscriptionService.adminSubscribers();
    }

    @PostMapping("/admin/subscribers/{userId}/change-plan")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void changeSubscriberPlan(
            @PathVariable String userId,
            @Valid @RequestBody AdminChangePlanRequest request) {
        subscriptionService.changeSubscriberPlan(userId, request.plan());
    }

    @PostMapping("/admin/subscribers/{userId}/extend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void extendSubscriber(
            @PathVariable String userId,
            @Valid @RequestBody AdminExtendRequest request) {
        subscriptionService.extendSubscriber(userId, request.days());
    }

    @PostMapping("/admin/subscribers/{userId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void cancelSubscriber(@PathVariable String userId) {
        subscriptionService.cancelSubscriber(userId);
    }
}
