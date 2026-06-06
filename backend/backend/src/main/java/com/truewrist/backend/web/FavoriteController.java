package com.truewrist.backend.web;

import com.truewrist.backend.dto.FavoriteDtos.ToggleResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.FavoriteService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    /** The current user's favourited watch ids. */
    @GetMapping
    public List<String> list(@AuthenticationPrincipal AppUserPrincipal actor) {
        return favoriteService.listWatchIds(requireUser(actor).getId());
    }

    @PostMapping("/{watchId}/toggle")
    public ToggleResponse toggle(
            @PathVariable String watchId,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return new ToggleResponse(favoriteService.toggle(requireUser(actor).getId(), watchId));
    }

    private AppUserPrincipal requireUser(AppUserPrincipal actor) {
        if (actor == null) {
            throw ApiException.unauthorized("Vui lòng đăng nhập.");
        }
        return actor;
    }
}
