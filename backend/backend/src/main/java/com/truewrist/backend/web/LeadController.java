package com.truewrist.backend.web;

import com.truewrist.backend.dto.LeadDtos.LeadCreateRequest;
import com.truewrist.backend.dto.LeadDtos.LeadResponse;
import com.truewrist.backend.dto.LeadDtos.LeadStatusUpdateRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.LeadService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    /** Public storefront contact form. Attaches the user id if the visitor is signed in. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeadResponse create(
            @Valid @RequestBody LeadCreateRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        String userId = actor != null ? actor.getId() : null;
        return LeadResponse.from(leadService.create(req, userId));
    }

    /** Leads for the signed-in shop/admin to manage. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public List<LeadResponse> list(@AuthenticationPrincipal AppUserPrincipal actor) {
        return leadService.findForActor(actor).stream().map(LeadResponse::from).toList();
    }

    /** The signed-in customer's own enquiry history. */
    @GetMapping("/mine")
    public List<LeadResponse> mine(@AuthenticationPrincipal AppUserPrincipal actor) {
        if (actor == null) {
            throw ApiException.unauthorized("Vui lòng đăng nhập.");
        }
        return leadService.findByUser(actor.getId()).stream().map(LeadResponse::from).toList();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public LeadResponse updateStatus(
            @PathVariable String id,
            @Valid @RequestBody LeadStatusUpdateRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return LeadResponse.from(leadService.updateStatus(id, req.status(), actor));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public void delete(@PathVariable String id, @AuthenticationPrincipal AppUserPrincipal actor) {
        leadService.delete(id, actor);
    }
}
