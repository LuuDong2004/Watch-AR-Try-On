package com.truewrist.backend.web;

import com.truewrist.backend.dto.UploadDtos.DataUrlUploadRequest;
import com.truewrist.backend.dto.UploadDtos.UploadResponse;
import com.truewrist.backend.service.StorageService;
import jakarta.validation.Valid;
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

    /** Upload a watch/shop image. {@code folder} groups objects (e.g. "watches", "shops"). */
    @PostMapping
    public UploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "watches") String folder) {
        return new UploadResponse(storage.store(file, folder));
    }

    /** Upload an AR try-on snapshot captured as a base64 data URL. */
    @PostMapping("/data-url")
    public UploadResponse uploadDataUrl(@Valid @RequestBody DataUrlUploadRequest req) {
        String folder = (req.folder() == null || req.folder().isBlank()) ? "ar" : req.folder();
        return new UploadResponse(storage.storeDataUrl(req.dataUrl(), folder));
    }
}
