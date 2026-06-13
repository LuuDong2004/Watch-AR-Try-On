package com.truewrist.backend.web;

import com.truewrist.backend.dto.SubscriptionDtos.AdminChangePlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.AdminExtendRequest;
import com.truewrist.backend.dto.SubscriptionDtos.AdminPlanOverview;
import com.truewrist.backend.dto.SubscriptionDtos.AdminSubscriberRow;
import com.truewrist.backend.dto.SubscriptionDtos.PlanRequest;
import com.truewrist.backend.dto.SubscriptionDtos.PlanResponse;
import com.truewrist.backend.dto.SubscriptionDtos.RejectRequestInput;
import com.truewrist.backend.dto.SubscriptionDtos.SubscriptionResponse;
import com.truewrist.backend.dto.SubscriptionDtos.UpgradeRequestInput;
import com.truewrist.backend.dto.SubscriptionDtos.UpgradeRequestResponse;
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
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /** A seller's own subscription overview. */
    @GetMapping
    @PreAuthorize("hasRole('SHOP')")
    public SubscriptionResponse get(@AuthenticationPrincipal AppUserPrincipal actor) {
        return subscriptionService.getFor(actor);
    }

    // --- Upgrade requests (manual approval, no payment gateway yet) ----------

    /** Plans a user can request to upgrade to (non-trial catalogue). Public so the
     *  pricing page renders for anonymous visitors too. */
    @GetMapping("/plans")
    @PreAuthorize("permitAll()")
    public List<PlanResponse> plans() {
        return subscriptionService.selectablePlans();
    }

    /** Submit a request to upgrade onto a paid plan (queued for admin approval). */
    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public UpgradeRequestResponse requestUpgrade(
            @Valid @RequestBody UpgradeRequestInput request,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return subscriptionService.requestUpgrade(actor, request.plan());
    }

    /** The signed-in user's own upgrade requests (to show pending status). */
    @GetMapping("/requests/mine")
    @PreAuthorize("isAuthenticated()")
    public List<UpgradeRequestResponse> myRequests(@AuthenticationPrincipal AppUserPrincipal actor) {
        return subscriptionService.myRequests(actor);
    }

    /** Admin: queue of requests awaiting a decision. */
    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UpgradeRequestResponse> adminRequests() {
        return subscriptionService.adminPendingRequests();
    }

    /** Admin: approve a request — grants the SHOP role and applies the plan. */
    @PostMapping("/admin/requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public UpgradeRequestResponse approveRequest(
            @PathVariable String id,
            @AuthenticationPrincipal AppUserPrincipal admin) {
        return subscriptionService.approveRequest(admin, id);
    }

    /** Admin: reject a request with an optional reason. */
    @PostMapping("/admin/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public UpgradeRequestResponse rejectRequest(
            @PathVariable String id,
            @RequestBody(required = false) RejectRequestInput body,
            @AuthenticationPrincipal AppUserPrincipal admin) {
        return subscriptionService.rejectRequest(admin, id, body == null ? null : body.note());
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
