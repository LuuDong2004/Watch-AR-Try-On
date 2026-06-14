package com.truewrist.backend.web;

import com.truewrist.backend.domain.Role;
import com.truewrist.backend.dto.UploadDtos.DataUrlUploadRequest;
import com.truewrist.backend.dto.UploadDtos.UploadResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.StorageService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Image upload endpoints backed by MinIO.
 *
 * <ul>
 *   <li>{@code POST /api/uploads} — multipart image (watch/shop photos);
 *       requires an authenticated SHOP or ADMIN (enforced in SecurityConfig).</li>
 *   <li>{@code POST /api/uploads/data-url} — base64 AR try-on snapshot; public
 *       so anonymous visitors can attach a capture to a lead.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final StorageService storage;

    public UploadController(StorageService storage) {
        this.storage = storage;
    }

    /** Upload an image. {@code folder} groups objects (e.g. "watches", "shops", "avatars"). */
    @PostMapping
    public UploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "watches") String folder,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        // Any signed-in user may upload their own avatar; other folders (watch/shop
        // photos) stay restricted to sellers and admins.
        if (!"avatars".equals(folder)) {
            boolean privileged = actor != null
                    && (actor.getUser().effectiveRoles().contains(Role.SHOP)
                        || actor.getUser().effectiveRoles().contains(Role.ADMIN));
            if (!privileged) {
                throw ApiException.forbidden("Bạn không có quyền tải ảnh lên mục này.");
            }
        }
        return new UploadResponse(storage.store(file, folder));
    }

    /** Upload an AR try-on snapshot captured as a base64 data URL. */
    @PostMapping("/data-url")
    public UploadResponse uploadDataUrl(@Valid @RequestBody DataUrlUploadRequest req) {
        String folder = (req.folder() == null || req.folder().isBlank()) ? "ar" : req.folder();
        return new UploadResponse(storage.storeDataUrl(req.dataUrl(), folder));
    }
}
