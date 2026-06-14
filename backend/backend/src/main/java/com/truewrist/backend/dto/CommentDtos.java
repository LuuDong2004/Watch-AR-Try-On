package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ProductComment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class CommentDtos {

    private CommentDtos() {}

    /** Create a top-level comment, or a reply when {@code parentId} is set. */
    public record CreateCommentRequest(
            @NotBlank @Size(max = 2000) String body,
            boolean triedAr,
            String parentId) {}

    /** Edit an existing comment's text (and "đã thử AR" flag). */
    public record UpdateCommentRequest(
            @NotBlank @Size(max = 2000) String body,
            boolean triedAr) {}

    /** A comment plus its replies, nested to any depth (Facebook-style threads). */
    public record CommentResponse(
            String id,
            String watchId,
            String userId,
            String authorName,
            /** Author's profile picture URL (null = render initials/shop icon). */
            String authorAvatar,
            /** True when the author owns the watch's shop (renders a "Shop" badge). */
            boolean isShop,
            boolean triedAr,
            String body,
            String parentId,
            long createdAt,
            List<CommentResponse> replies) {

        public static CommentResponse of(
                ProductComment c, boolean isShop, String authorAvatar, List<CommentResponse> replies) {
            return new CommentResponse(
                    c.getId(), c.getWatchId(), c.getUserId(), c.getAuthorName(),
                    authorAvatar, isShop, c.isTriedAr(), c.getBody(), c.getParentId(),
                    c.getCreatedAt(), replies);
        }
    }
}
