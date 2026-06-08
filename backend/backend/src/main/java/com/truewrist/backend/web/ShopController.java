package com.truewrist.backend.web;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.dto.ShopDtos.ShopRequest;
import com.truewrist.backend.dto.ShopDtos.ShopResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.ShopService;
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
@RequestMapping("/api/shops")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping
    public List<ShopResponse> list() {
        return shopService.findAll().stream().map(ShopResponse::from).toList();
    }

    /** Shops the signed-in seller owns (for the management screen). */
    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public List<ShopResponse> mine(@AuthenticationPrincipal AppUserPrincipal actor) {
        return shopService.findOwnedBy(actor.getId(), actor.getShopId())
                .stream().map(ShopResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ShopResponse get(@PathVariable String id) {
        return ShopResponse.from(shopService.findById(id));
    }

    /** Admins create unlinked shops; a shop owner creates and is linked to it. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public ShopResponse create(
            @Valid @RequestBody ShopRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        boolean isAdmin = actor.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String ownerId = isAdmin ? null : actor.getId();
        return ShopResponse.from(shopService.create(req, ownerId));
    }

    /** Set the signed-in seller's active shop (must own it). */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public ShopResponse activate(@PathVariable String id, @AuthenticationPrincipal AppUserPrincipal actor) {
        if (!shopService.isOwnedBy(id, actor.getId(), actor.getShopId())) {
            throw ApiException.forbidden("Bạn chỉ có thể đặt cửa hàng của mình làm chính.");
        }
        if (shopService.findById(id).getStatus() == ListingStatus.LOCKED) {
            throw ApiException.forbidden(
                    "Cửa hàng đang bị khóa nên không thể đặt làm cửa hàng chính.");
        }
        shopService.setActiveShop(actor.getId(), id);
        return ShopResponse.from(shopService.findById(id));
    }

    /** Admins edit any shop; a shop owner may edit only their own. */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public ShopResponse update(
            @PathVariable String id,
            @Valid @RequestBody ShopRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        boolean isAdmin = actor.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            if (!shopService.isOwnedBy(id, actor.getId(), actor.getShopId())) {
                throw ApiException.forbidden("Bạn chỉ có thể chỉnh sửa cửa hàng của mình.");
            }
            if (shopService.findById(id).getStatus() == ListingStatus.LOCKED) {
                throw ApiException.forbidden(
                        "Cửa hàng đang bị khóa nên không thể chỉnh sửa. Vui lòng liên hệ quản trị viên.");
            }
        }
        return ShopResponse.from(shopService.update(id, req));
    }

    /** Admins delete any shop; a shop owner may delete only their own. Either
     *  way the shop's products are removed too (cascade in ShopService). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SHOP')")
    public void delete(@PathVariable String id, @AuthenticationPrincipal AppUserPrincipal actor) {
        boolean isAdmin = actor.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            if (!shopService.isOwnedBy(id, actor.getId(), actor.getShopId())) {
                throw ApiException.forbidden("Bạn chỉ có thể xóa cửa hàng của mình.");
            }
            if (shopService.findById(id).getStatus() == ListingStatus.LOCKED) {
                throw ApiException.forbidden(
                        "Cửa hàng đang bị khóa nên không thể xóa. Vui lòng liên hệ quản trị viên.");
            }
        }
        shopService.delete(id);
    }
}
