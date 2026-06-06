package com.truewrist.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Request/response shapes for the image upload endpoints. */
public final class UploadDtos {

    private UploadDtos() {}

    /** Response carrying the public URL of a stored image. */
    public record UploadResponse(String url) {}

    /** Base64 data-URL upload (AR try-on snapshots captured in the browser). */
    public record DataUrlUploadRequest(
            @NotBlank String dataUrl,
            String folder) {}
}
