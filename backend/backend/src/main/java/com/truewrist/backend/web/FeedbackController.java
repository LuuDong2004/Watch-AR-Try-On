package com.truewrist.backend.web;

import com.truewrist.backend.domain.FeedbackTarget;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.dto.FeedbackDtos.FeedbackCreateRequest;
import com.truewrist.backend.dto.FeedbackDtos.FeedbackResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.FeedbackService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /** Public submission from the storefront feedback form. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse create(
            @Valid @RequestBody FeedbackCreateRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        // Shop accounts may only review the website, never another shop.
        if (actor != null
                && req.target() == FeedbackTarget.SHOP
                && actor.getUser().effectiveRoles().contains(Role.SHOP)) {
            throw ApiException.forbidden("Tài khoản cửa hàng chỉ có thể góp ý về website.");
        }
        String userId = actor != null ? actor.getId() : null;
        return FeedbackResponse.from(feedbackService.create(req, userId));
    }

    /** Admin review of all feedback. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<FeedbackResponse> list() {
        return feedbackService.findAll().stream().map(FeedbackResponse::from).toList();
    }
}
