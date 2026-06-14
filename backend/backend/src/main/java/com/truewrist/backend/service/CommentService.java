package com.truewrist.backend.service;

import com.truewrist.backend.domain.ProductComment;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.CommentDtos.CommentResponse;
import com.truewrist.backend.dto.CommentDtos.CreateCommentRequest;
import com.truewrist.backend.dto.CommentDtos.UpdateCommentRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ProductCommentRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final ProductCommentRepository commentRepository;
    private final WatchRepository watchRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public CommentService(
            ProductCommentRepository commentRepository,
            WatchRepository watchRepository,
            ShopRepository shopRepository,
            UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.watchRepository = watchRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
    }

    /** Threaded comments for a watch: top-level newest-first, replies oldest-first, nested to any depth. */
    @Transactional(readOnly = true)
    public List<CommentResponse> list(String watchId) {
        String ownerId = shopOwnerOf(watchId);
        List<ProductComment> all = commentRepository.findByWatchIdOrderByCreatedAtAsc(watchId);
        Map<String, List<ProductComment>> byParent = all.stream()
                .filter(c -> c.getParentId() != null)
                .collect(Collectors.groupingBy(ProductComment::getParentId));

        // Resolve each author's current avatar in one batch (values may be null).
        List<String> authorIds = all.stream().map(ProductComment::getUserId).distinct().toList();
        Map<String, String> avatarById = new HashMap<>();
        userRepository.findAllById(authorIds).forEach(u -> avatarById.put(u.getId(), u.getAvatar()));

        List<CommentResponse> roots = new ArrayList<>();
        for (ProductComment c : all) {
            if (c.getParentId() == null) {
                roots.add(toTree(c, byParent, ownerId, avatarById));
            }
        }
        roots.sort(Comparator.comparingLong(CommentResponse::createdAt).reversed());
        return roots;
    }

    /** Recursively builds a comment with all of its descendant replies (oldest-first). */
    private CommentResponse toTree(
            ProductComment c,
            Map<String, List<ProductComment>> byParent,
            String ownerId,
            Map<String, String> avatarById) {
        List<CommentResponse> replies = byParent.getOrDefault(c.getId(), List.of()).stream()
                .sorted(Comparator.comparingLong(ProductComment::getCreatedAt))
                .map(r -> toTree(r, byParent, ownerId, avatarById))
                .toList();
        return CommentResponse.of(c, isShop(c, ownerId), avatarById.get(c.getUserId()), replies);
    }

    public long count(String watchId) {
        return commentRepository.countByWatchId(watchId);
    }

    @Transactional
    public CommentResponse create(AppUserPrincipal actor, String watchId, CreateCommentRequest req) {
        Watch watch = watchRepository.findById(watchId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm."));

        String parentId = null;
        if (req.parentId() != null && !req.parentId().isBlank()) {
            ProductComment parent = commentRepository.findById(req.parentId())
                    .orElseThrow(() -> ApiException.badRequest("Bình luận gốc không tồn tại."));
            if (!parent.getWatchId().equals(watchId)) {
                throw ApiException.badRequest("Bình luận gốc không thuộc sản phẩm này.");
            }
            // Reply directly to the targeted comment — threads nest to any depth.
            parentId = parent.getId();
        }

        User user = userRepository.findById(actor.getId())
                .orElseThrow(() -> ApiException.unauthorized("Phiên đăng nhập không hợp lệ."));

        ProductComment comment = ProductComment.builder()
                .id(Ids.generate("cmt"))
                .watchId(watch.getId())
                .userId(user.getId())
                .authorName(user.getName())
                .parentId(parentId)
                .body(req.body().trim())
                .triedAr(req.triedAr())
                .createdAt(System.currentTimeMillis())
                .build();
        commentRepository.save(comment);
        return CommentResponse.of(comment, isShop(comment, shopOwnerOf(watchId)), user.getAvatar(), List.of());
    }

    /** Edit a comment's text — only the author (or an admin) may edit. */
    @Transactional
    public CommentResponse update(AppUserPrincipal actor, String commentId, UpdateCommentRequest req) {
        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy bình luận."));
        boolean isAdmin = actor.getUser().effectiveRoles().contains(Role.ADMIN);
        if (!comment.getUserId().equals(actor.getId()) && !isAdmin) {
            throw ApiException.forbidden("Bạn chỉ có thể sửa bình luận của mình.");
        }
        comment.setBody(req.body().trim());
        comment.setTriedAr(req.triedAr());
        commentRepository.save(comment);
        String avatar = userRepository.findById(comment.getUserId()).map(User::getAvatar).orElse(null);
        return CommentResponse.of(comment, isShop(comment, shopOwnerOf(comment.getWatchId())), avatar, List.of());
    }

    @Transactional
    public void delete(AppUserPrincipal actor, String commentId) {
        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy bình luận."));
        boolean isAdmin = actor.getUser().effectiveRoles().contains(Role.ADMIN);
        boolean isAuthor = comment.getUserId().equals(actor.getId());
        boolean isShopOwner = actor.getId().equals(shopOwnerOf(comment.getWatchId()));
        if (!isAdmin && !isAuthor && !isShopOwner) {
            throw ApiException.forbidden("Bạn không có quyền xóa bình luận này.");
        }
        // Remove the whole subtree (the comment and every nested reply) to avoid orphans.
        Map<String, List<ProductComment>> byParent =
                commentRepository.findByWatchIdOrderByCreatedAtAsc(comment.getWatchId()).stream()
                        .filter(c -> c.getParentId() != null)
                        .collect(Collectors.groupingBy(ProductComment::getParentId));
        List<ProductComment> subtree = new ArrayList<>();
        collectSubtree(comment, byParent, subtree);
        commentRepository.deleteAll(subtree);
    }

    private void collectSubtree(
            ProductComment c, Map<String, List<ProductComment>> byParent, List<ProductComment> acc) {
        acc.add(c);
        for (ProductComment child : byParent.getOrDefault(c.getId(), List.of())) {
            collectSubtree(child, byParent, acc);
        }
    }

    private boolean isShop(ProductComment c, String ownerId) {
        return ownerId != null && ownerId.equals(c.getUserId());
    }

    /** Owner (user id) of the shop selling the given watch, or null. */
    private String shopOwnerOf(String watchId) {
        return watchRepository.findById(watchId)
                .map(Watch::getShopId)
                .flatMap(shopRepository::findById)
                .map(s -> s.getOwnerId())
                .orElse(null);
    }
}
