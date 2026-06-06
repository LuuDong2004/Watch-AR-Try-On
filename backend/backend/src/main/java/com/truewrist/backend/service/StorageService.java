package com.truewrist.backend.service;

import com.truewrist.backend.config.AppProperties;
import com.truewrist.backend.exception.ApiException;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores images in MinIO and returns permanent public URLs. Handles both
 * multipart uploads (watch/shop photos) and base64 data-URL uploads (AR
 * try-on snapshots captured in the browser).
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");
    private static final long MAX_BYTES = 15L * 1024 * 1024; // 15 MB

    private final MinioClient client;
    private final AppProperties.Storage cfg;

    public StorageService(MinioClient client, AppProperties props) {
        this.client = client;
        this.cfg = props.storage();
    }

    /** Uploads a multipart image into {@code folder/yyyy/MM/dd/} and returns its public URL. */
    public String store(MultipartFile file, String folder) {
        requireEnabled();
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("File rỗng.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Ảnh vượt quá 15MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw ApiException.badRequest("Chỉ chấp nhận ảnh PNG/JPEG/WebP/GIF.");
        }
        String object = objectKey(folder, extensionFor(contentType));
        try (InputStream in = file.getInputStream()) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .stream(in, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("MinIO upload failed: {}", e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Lưu ảnh thất bại: " + e.getMessage());
        }
        return publicUrl(object);
    }

    /**
     * Decodes a {@code data:image/...;base64,...} URL and stores it. Used for AR
     * try-on captures. Returns the public URL.
     */
    public String storeDataUrl(String dataUrl, String folder) {
        requireEnabled();
        if (dataUrl == null || !dataUrl.startsWith("data:")) {
            throw ApiException.badRequest("Dữ liệu ảnh không hợp lệ.");
        }
        int comma = dataUrl.indexOf(',');
        int semi = dataUrl.indexOf(';');
        if (comma < 0 || semi < 0 || semi > comma) {
            throw ApiException.badRequest("Định dạng data URL không hợp lệ.");
        }
        String contentType = dataUrl.substring(5, semi).toLowerCase();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Chỉ chấp nhận ảnh PNG/JPEG/WebP/GIF.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(dataUrl.substring(comma + 1));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Base64 ảnh không hợp lệ.");
        }
        if (bytes.length > MAX_BYTES) {
            throw ApiException.badRequest("Ảnh vượt quá 15MB.");
        }
        String object = objectKey(folder, extensionFor(contentType));
        try {
            client.putObject(PutObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("MinIO data-url upload failed: {}", e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Lưu ảnh thất bại: " + e.getMessage());
        }
        return publicUrl(object);
    }

    /**
     * Best-effort delete of a previously uploaded object given its public URL.
     * Ignores URLs that don't point at our bucket (e.g. external Unsplash links).
     */
    public void deleteByUrl(String url) {
        if (!isStoredUrl(url)) {
            return;
        }
        String prefix = publicBucketPrefix();
        String object = url.substring(prefix.length());
        int queryIndex = object.indexOf('?');
        if (queryIndex >= 0) {
            object = object.substring(0, queryIndex);
        }
        int hashIndex = object.indexOf('#');
        if (hashIndex >= 0) {
            object = object.substring(0, hashIndex);
        }
        try {
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(cfg.bucket())
                    .object(object)
                    .build());
        } catch (Exception e) {
            log.warn("MinIO delete failed for {}: {}", object, e.getMessage());
        }
    }

    /** Returns whether a URL points to an object managed by this app's MinIO bucket. */
    public boolean isStoredUrl(String url) {
        return cfg.enabled() && url != null && url.startsWith(publicBucketPrefix());
    }

    private void requireEnabled() {
        if (!cfg.enabled()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Lưu trữ ảnh chưa được bật (app.storage.enabled=false).");
        }
    }

    private static String objectKey(String folder, String ext) {
        LocalDate today = LocalDate.now();
        return "%s/%04d/%02d/%02d/%s%s".formatted(
                normalizeFolder(folder),
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth(),
                UUID.randomUUID().toString().replace("-", ""),
                ext);
    }

    private static String normalizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "misc";
        }
        String safeFolder = folder
                .replace('\\', '/')
                .replaceAll("[^a-zA-Z0-9/_-]", "")
                .replaceAll("/+", "/")
                .replaceAll("^/|/$", "");
        return safeFolder.isBlank() ? "misc" : safeFolder;
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }

    private String publicUrl(String object) {
        return publicBucketPrefix() + object;
    }

    private String publicBucketPrefix() {
        return cfg.resolvedPublicUrl() + "/" + cfg.bucket() + "/";
    }
}
