package com.truewrist.backend.web;

import com.truewrist.backend.dto.CommentDtos.CommentResponse;
import com.truewrist.backend.dto.CommentDtos.CreateCommentRequest;
import com.truewrist.backend.dto.CommentDtos.UpdateCommentRequest;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.CommentService;
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

/** Threaded product comments (display + AR platform — no ratings). */
@RestController
@RequestMapping("/api/watches/{watchId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /** Public list of comments for a watch (top-level newest-first, with replies). */
    @GetMapping
    public List<CommentResponse> list(@PathVariable String watchId) {
        return commentService.list(watchId);
    }

    /** Post a comment (or a reply when the body carries a parentId). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CommentResponse create(
            @PathVariable String watchId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return commentService.create(actor, watchId, request);
    }

    /** Edit a comment — author or admin only. */
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public CommentResponse update(
            @PathVariable String watchId,
            @PathVariable String commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return commentService.update(actor, commentId, request);
    }

    /** Delete a comment — author, the watch's shop owner, or an admin. */
    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void delete(
            @PathVariable String watchId,
            @PathVariable String commentId,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        commentService.delete(actor, commentId);
    }
}
