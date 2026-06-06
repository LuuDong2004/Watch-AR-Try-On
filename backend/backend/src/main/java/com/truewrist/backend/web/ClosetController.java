package com.truewrist.backend.web;

import com.truewrist.backend.dto.ClosetDtos.ClosetCreateRequest;
import com.truewrist.backend.dto.ClosetDtos.ClosetItemResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.ClosetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/closet")
public class ClosetController {

    private final ClosetService closetService;

    public ClosetController(ClosetService closetService) {
        this.closetService = closetService;
    }

    @GetMapping
    public List<ClosetItemResponse> list(@AuthenticationPrincipal AppUserPrincipal actor) {
        return closetService.findByUser(requireUser(actor).getId()).stream()
                .map(ClosetItemResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClosetItemResponse add(
            @Valid @RequestBody ClosetCreateRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return ClosetItemResponse.from(closetService.create(requireUser(actor).getId(), req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @AuthenticationPrincipal AppUserPrincipal actor) {
        closetService.delete(requireUser(actor).getId(), id);
    }

    private AppUserPrincipal requireUser(AppUserPrincipal actor) {
        if (actor == null) {
            throw ApiException.unauthorized("Vui lòng đăng nhập.");
        }
        return actor;
    }
}
