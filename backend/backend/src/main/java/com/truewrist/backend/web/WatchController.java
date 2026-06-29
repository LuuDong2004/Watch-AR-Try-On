package com.truewrist.backend.web;

import com.truewrist.backend.dto.WatchDtos.ArReviewRequest;
import com.truewrist.backend.dto.WatchDtos.WatchRequest;
import com.truewrist.backend.dto.WatchDtos.WatchResponse;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.WatchService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watches")
public class WatchController {

    private final WatchService watchService;

    public WatchController(WatchService watchService) {
        this.watchService = watchService;
    }

    /** Public storefront listing; optional {@code ?shopId=} filter. */
    @GetMapping
    public List<WatchResponse> list(@RequestParam(required = false) String shopId) {
        return watchService.findAll(shopId).stream().map(WatchResponse::from).toList();
    }

    @GetMapping("/{id}")
    public WatchResponse get(@PathVariable String id) {
        return WatchResponse.from(watchService.findById(id));
    }

    /** Record one AR wrist try-on for this watch. Public — anonymous visitors can
     *  try AR too — so it bumps the counter and returns the updated watch. */
    @PostMapping("/{id}/try-on")
    public WatchResponse recordTryOn(@PathVariable String id) {
        return WatchResponse.from(watchService.recordTryOn(id));
    }

    /** Admin moderation queue: all AR-enabled watches (pending first). */
    @GetMapping("/ar-moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public List<WatchResponse> arModeration() {
        return watchService.findArModels().stream().map(WatchResponse::from).toList();
    }

    /** Admin approves/rejects a watch's AR/3D model. */
    @PostMapping("/{id}/ar-review")
    @PreAuthorize("hasRole('ADMIN')")
    public WatchResponse reviewAr(
            @PathVariable String id,
            @Valid @RequestBody ArReviewRequest req) {
        return WatchResponse.from(watchService.reviewAr(id, req.status(), req.note()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public WatchResponse create(
            @Valid @RequestBody WatchRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return WatchResponse.from(watchService.create(req, actor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public WatchResponse update(
            @PathVariable String id,
            @Valid @RequestBody WatchRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return WatchResponse.from(watchService.update(id, req, actor));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public void delete(
            @PathVariable String id,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        watchService.delete(id, actor);
    }
}
